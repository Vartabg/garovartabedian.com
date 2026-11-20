"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLibrarySearch } from "@/lib/early/use-library-search";
import { KIND_LABELS } from "@/lib/early/library";
import { wordingLabel } from "@/lib/scriptures/search-wording";
import { loadBook, loadCanons } from "@/lib/scriptures/client";
import type { RelatedSearchResult } from "@/lib/scriptures/related";
import { searchVerses, type SearchResult } from "@/lib/scriptures/search";
import { searchExpansion } from "@/lib/scriptures/search-expansion";
import { withFindContext } from "@/lib/scriptures/search-url";
import type { Canons, TranslationId } from "@/lib/scriptures/types";
import { FIND_CATALOG } from "@/lib/site/find-catalog";
import { highlightFindText } from "@/lib/site/find-highlight";
import { continueFrom } from "@/lib/site/find-place";
import {
  assembleFindGroups,
  flattenGroups,
  findCommand,
  parseFindRef,
  type FindGroup,
  type FindItem,
} from "@/lib/site/find-query";
import {
  streamFindText,
  findSearchHref,
  parseTranslationPrefix,
} from "@/lib/site/find-text";
import FindPreview from "./FindPreview";
import { surfaceGroups, type FindScope } from "@/lib/site/find-surface";
import { executeAction } from "@/lib/site/find-actions";
import {
  getRecentFindItems,
  recordRecentFindItem,
} from "@/lib/site/find-recent";
import {
  isFindOpen,
  restoreFindFocus,
  setFindOpen,
  subscribeFindChange,
  toggleFind,
} from "@/lib/site/find-bridge";
import { usePlatformShortcutMod } from "@/lib/site/use-platform-mod";

const QUERY_MAX = 160;
const TEXT_DEBOUNCE_MS = 260;

type CloseMode = "restore" | "restore-no-scroll" | "navigate";

type TextStreamState = {
  key: string;
  exact: SearchResult | null;
  related: RelatedSearchResult | null;
  exactFailed: boolean;
  done: boolean;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return target.dataset.findInput !== "true";
  }
  return target.isContentEditable;
}

function initialTranslationFromUrl(): TranslationId {
  if (typeof window === "undefined") return "web";
  const params = new URLSearchParams(window.location.search);
  const edition = params.get("t") ?? params.get("trans") ?? "web";
  return ["web", "kjv", "drb", "brenton", "charles"].includes(edition)
    ? (edition as TranslationId)
    : "web";
}

function initialScopeFromUrl(): FindScope {
  if (typeof window === "undefined") return "all";
  const params = new URLSearchParams(window.location.search);
  const saved = params.get("scope") ?? params.get("findScope");
  return saved === "texts" || saved === "all" ? saved : "all";
}

function isOutsideDialogRect(
  event: { clientX: number; clientY: number },
  dialog: HTMLDialogElement,
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

export default function FindOverlay({
  localEvidence = false,
}: {
  localEvidence?: boolean;
}) {
  const open = useSyncExternalStore(
    subscribeFindChange,
    isFindOpen,
    () => false,
  );
  const [canons, setCanons] = useState<Canons | null>(null);
  const [canonsLoaded, setCanonsLoaded] = useState(false);

  useEffect(() => {
    void loadCanons()
      .then((loaded) => {
        setCanons(loaded);
        setCanonsLoaded(true);
      })
      .catch(() => {
        /* Places and walks still work without canons. */
        setCanonsLoaded(true);
      });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey) return;
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k"
      ) {
        return;
      }
      event.preventDefault();
      toggleFind();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  return (
    <FindOverlaySession
      canons={canons}
      canonsLoaded={canonsLoaded}
      localEvidence={localEvidence}
    />
  );
}

function FindOverlaySession({
  canons,
  canonsLoaded,
  localEvidence,
}: {
  canons: Canons | null;
  canonsLoaded: boolean;
  localEvidence: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const dialogId = useId();
  const mod = usePlatformShortcutMod();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeModeRef = useRef<CloseMode>("restore");
  const pressedBackdropRef = useRef(false);
  const searchGen = useRef(0);
  const submitGen = useRef(0);
  const requestedSnippetsRef = useRef(new Set<string>());

  const [query, setQuery] = useState("");
  const [translation, setTranslation] = useState<TranslationId>(
    initialTranslationFromUrl,
  );
  const [scope, setScope] = useState<FindScope>(initialScopeFromUrl);
  const [recentItems] = useState<FindItem[]>(() => getRecentFindItems());
  const [selection, setSelection] = useState<{
    key: string;
    selectedId: string | null;
    previewId: string | null;
  }>({ key: "", selectedId: null, previewId: null });
  const [textState, setTextState] = useState<TextStreamState | null>(null);
  const [verseSnippets, setVerseSnippets] = useState<Record<string, string>>(
    {},
  );
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const parsedPrefix = parseTranslationPrefix(query, translation);
  const selectedTranslation = parsedPrefix.translation;
  const cleanQueryText = parsedPrefix.text;
  const trimmed = query.trim();
  const contextKey = `${pathname}\0${scope}\0${query}`;

  const reference =
    canons && trimmed ? parseFindRef(trimmed, canons, selectedTranslation) : null;
  const commandOnly = findCommand(trimmed) !== null;
  const canSearch = Boolean(trimmed && !reference && !commandOnly);
  const shouldStreamText = Boolean(canSearch && scope !== "site");
  const requestKey = `${selectedTranslation}:${trimmed}`;

  const writingSearch = useLibrarySearch(
    cleanQueryText,
    scope !== "site" && !commandOnly && !reference,
    4,
  );

  const dismissDialog = useCallback((mode: CloseMode = "restore") => {
    closeModeRef.current = mode;
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    setFindOpen(false);
    if (mode === "restore") {
      restoreFindFocus();
    } else if (mode === "restore-no-scroll") {
      restoreFindFocus({ preventScroll: true });
    }
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    inputRef.current?.focus();
    return () => {
      const wasOpen = Boolean(dialog?.open);
      if (dialog?.open) {
        dialog.close();
      }
      if (wasOpen) {
        const mode = closeModeRef.current;
        closeModeRef.current = "restore";
        if (mode === "restore") {
          restoreFindFocus();
        } else if (mode === "restore-no-scroll") {
          restoreFindFocus({ preventScroll: true });
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldStreamText || !canons) {
      searchGen.current += 1;
      return;
    }

    const gen = ++searchGen.current;
    const key = requestKey;
    const timer = window.setTimeout(() => {
      streamFindText(trimmed, canons, selectedTranslation, {
        onExact: (exact, failed) => {
          if (gen !== searchGen.current) return;
          setTextState((prev) => ({
            key,
            exact,
            related: prev?.key === key ? prev.related : null,
            exactFailed: failed,
            done: prev?.key === key ? prev.done : false,
          }));
        },
        onRelated: (related) => {
          if (gen !== searchGen.current) return;
          setTextState((prev) => ({
            key,
            exact: prev?.key === key ? prev.exact : null,
            related,
            exactFailed: prev?.key === key ? prev.exactFailed : false,
            done: prev?.key === key ? prev.done : false,
          }));
        },
        onDone: () => {
          if (gen !== searchGen.current) return;
          setTextState((prev) => ({
            key,
            exact: prev?.key === key ? prev.exact : null,
            related: prev?.key === key ? prev.related : null,
            exactFailed: prev?.key === key ? prev.exactFailed : false,
            done: true,
          }));
        },
      });
    }, TEXT_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [shouldStreamText, canons, requestKey, trimmed, selectedTranslation]);

  const currentText =
    shouldStreamText && textState?.key === requestKey ? textState : null;
  const textExact = currentText?.exact ?? null;
  const textRelated = currentText?.related ?? null;
  const exactFailed = currentText?.exactFailed ?? false;
  const textLoading =
    shouldStreamText && (!canonsLoaded || (Boolean(canons) && !currentText?.done));

  useEffect(() => {
    let cancelled = false;
    const targets: Array<{ trans: TranslationId; book: string; chapter: number; verse: number }> = [];

    if (textExact?.hits.length) {
      const trans = textExact.translation ?? "web";
      for (const hit of textExact.hits.slice(0, 4)) {
        targets.push({ trans, book: hit.book, chapter: hit.chapter, verse: hit.verse });
      }
    }

    if (textRelated?.hits.length) {
      const exactSet = new Set(
        (textExact?.hits ?? []).map((h) => `${h.book}.${h.chapter}.${h.verse}`),
      );
      const visibleRelated = textRelated.hits
        .filter(
          (h) =>
            !(
              selectedTranslation === "kjv" &&
              exactSet.has(`${h.book}.${h.chapter}.${h.verse}`)
            ),
        )
        .slice(0, 4);
      for (const hit of visibleRelated) {
        targets.push({
          trans: "kjv",
          book: hit.book,
          chapter: hit.chapter,
          verse: hit.verse,
        });
      }
    }

    for (const target of targets) {
      const key = `${target.trans}:${target.book}:${target.chapter}:${target.verse}`;
      if (requestedSnippetsRef.current.has(key)) continue;
      requestedSnippetsRef.current.add(key);
      void loadBook(target.trans, target.book)
        .then((book) => {
          if (cancelled) return;
          const text = book.chapters[target.chapter - 1]?.[target.verse - 1];
          if (text) {
            const cut = text.length > 135 ? `${text.slice(0, 135)}…` : text;
            setVerseSnippets((prev) => ({ ...prev, [key]: cut }));
          }
        })
        .catch(() => {
          requestedSnippetsRef.current.delete(key);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [textExact, textRelated, selectedTranslation]);

  const rawGroups: FindGroup[] = useMemo(() => {
    const groups = trimmed
      ? assembleFindGroups({
          query: trimmed,
          catalog: FIND_CATALOG,
          canons,
          exact: textExact,
          related: textRelated,
          exactFailed,
          snippets: verseSnippets,
          translation: selectedTranslation,
        })
      : continueFrom(pathname, canons, recentItems);
    if (writingSearch.result?.hits.length) {
      const group: FindGroup = {
        id: "writing-passages",
        label: "Words in the writings",
        note: "Source paragraphs, edition commentary and catalog records are labelled separately.",
        items: writingSearch.result.hits.map((hit) => ({
          id: `writing-${hit.id}`,
          href: hit.href,
          title: `${hit.title} — ${hit.label}`,
          kind: "text",
          snippet: hit.snippet,
          note: `${KIND_LABELS[hit.kind]} · ${wordingLabel(hit)} · ${hit.edition}`,
        })),
      };
      const beforeTopics = groups.findIndex(
        (item) => item.id === "related" || item.id === "ask",
      );
      groups.splice(beforeTopics < 0 ? groups.length : beforeTopics, 0, group);
    }
    return groups;
  }, [
    trimmed,
    canons,
    pathname,
    textExact,
    textRelated,
    exactFailed,
    verseSnippets,
    recentItems,
    selectedTranslation,
    writingSearch.result,
  ]);

  const groups = useMemo(
    () =>
      surfaceGroups(rawGroups, scope, !!trimmed).map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          href: withFindContext(
            item.href,
            cleanQueryText,
            selectedTranslation,
            scope,
          ),
        })),
      })),
    [rawGroups, scope, trimmed, cleanQueryText, selectedTranslation],
  );
  const items = useMemo(() => flattenGroups(groups), [groups]);

  const selectedId =
    selection.key === contextKey &&
    selection.selectedId !== null &&
    items.some((item) => item.id === selection.selectedId)
      ? selection.selectedId
      : null;
  const activeIndex = selectedId
    ? Math.max(
        0,
        items.findIndex((item) => item.id === selectedId),
      )
    : 0;
  const activePreviewId =
    selection.key === contextKey ? selection.previewId : null;
  const previewItem =
    items.find((item) => item.id === (activePreviewId ?? selectedId)) ??
    items[0];

  const selectByIndex = useCallback(
    (index: number) => {
      const chosen = items[index];
      if (!chosen) return;
      setSelection({
        key: contextKey,
        selectedId: chosen.id,
        previewId: chosen.id,
      });
    },
    [items, contextKey],
  );

  const hoverPreview = useCallback(
    (id: string) => {
      setSelection((prev) => ({
        key: contextKey,
        selectedId: prev.key === contextKey ? prev.selectedId : null,
        previewId: id,
      }));
    },
    [contextKey],
  );

  const search = useCallback(() => {
    if (!trimmed) return;
    dismissDialog("navigate");
    router.push(findSearchHref(query, localEvidence, selectedTranslation, scope));
  }, [
    trimmed,
    dismissDialog,
    router,
    query,
    localEvidence,
    selectedTranslation,
    scope,
  ]);

  const openSameRoomParable = useCallback((href: string) => {
    if (window.location.pathname !== "/jesus/parables") return false;
    const destination = new URL(href, window.location.href);
    if (
      destination.pathname !== "/jesus/parables" ||
      !destination.hash.startsWith("#parable-")
    ) {
      return false;
    }
    window.dispatchEvent(
      new CustomEvent("parables:open", {
        detail: destination.hash.slice("#parable-".length),
      }),
    );
    return true;
  }, []);

  const go = useCallback(
    (item: FindItem | undefined) => {
      if (!item) return;
      if (item.kind === "action") {
        const handled = executeAction(item.id);
        if (!handled && item.href && item.href !== "#") {
          recordRecentFindItem(item);
          dismissDialog("navigate");
          router.push(item.href);
          return;
        }
        dismissDialog("restore");
        return;
      }
      recordRecentFindItem(item);
      const sameParableRoom = openSameRoomParable(item.href);
      dismissDialog(sameParableRoom ? "restore-no-scroll" : "navigate");
      router.push(item.href);
    },
    [router, openSameRoomParable, dismissDialog],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLSelectElement) return;
      if (
        event.key === "ArrowDown" &&
        !(event.target instanceof HTMLButtonElement)
      ) {
        event.preventDefault();
        if (items.length === 0) return;
        const next = selectedId ? (activeIndex + 1) % items.length : 0;
        selectByIndex(next);
        return;
      }
      if (
        event.key === "ArrowUp" &&
        !(event.target instanceof HTMLButtonElement)
      ) {
        event.preventDefault();
        if (items.length === 0) return;
        const next = selectedId
          ? (activeIndex - 1 + items.length) % items.length
          : items.length - 1;
        selectByIndex(next);
        return;
      }
      if (event.key === "Home" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        selectByIndex(0);
        return;
      }
      if (event.key === "End" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        if (items.length > 0) selectByIndex(items.length - 1);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        const item = selectedId
          ? items.find((i) => i.id === selectedId)
          : {
              id: "search",
              kind: "ask" as const,
              title: query,
              note: "Search",
              href: findSearchHref(
                query,
                localEvidence,
                selectedTranslation,
                scope,
              ),
            };
        if (item && item.kind !== "action" && item.href !== "#") {
          recordRecentFindItem(item);
          window.open(item.href, "_blank", "noopener,noreferrer");
          dismissDialog("restore");
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
        const isInput =
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement;
        const hasSelection =
          isInput && event.target.selectionStart !== event.target.selectionEnd;
        if (!hasSelection) {
          const item = items.find(
            (row) => row.id === (selectedId ?? activePreviewId),
          );
          if (item && item.kind !== "action" && item.href !== "#") {
            event.preventDefault();
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const citation = `[${item.title}](${origin}${item.href})`;
            void navigator.clipboard
              .writeText(citation)
              .then(() => {
                setCopiedNotice(`Copied link to ${item.title}`);
                window.setTimeout(() => setCopiedNotice(null), 2000);
              })
              .catch(() =>
                setCopiedNotice("The browser couldn’t copy the link."),
              );
          }
        }
      }
      if (event.key === "Enter") {
        if (
          event.target instanceof HTMLElement &&
          event.target.dataset.findInput === "true"
        ) {
          return;
        }
        if (
          isTypingTarget(event.target) ||
          event.target instanceof HTMLButtonElement ||
          event.target instanceof HTMLAnchorElement
        ) {
          return;
        }
        event.preventDefault();
        go(items[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    items,
    selectedId,
    activeIndex,
    activePreviewId,
    selectByIndex,
    go,
    dismissDialog,
    query,
    localEvidence,
    selectedTranslation,
    scope,
  ]);

  useEffect(() => {
    if (!selectedId) return;
    const node = dialogRef.current?.querySelector<HTMLElement>(
      `[data-find-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [selectedId, activeIndex]);

  const listId = `${dialogId}-list`;
  const showNoExactBridge =
    scope !== "site" &&
    canSearch &&
    textExact?.totalHits === 0 &&
    !textLoading;
  const expansionTerms = useMemo(
    () =>
      showNoExactBridge
        ? searchExpansion(cleanQueryText.trim()).terms.slice(0, 6)
        : [],
    [showNoExactBridge, cleanQueryText],
  );
  const hasPlacesGroup = groups.some((group) => group.id === "places");

  async function submit() {
    const gen = ++submitGen.current;
    const chosen = selectedId
      ? items.find((item) => item.id === selectedId)
      : undefined;
    if (chosen) {
      go(chosen);
      return;
    }
    if (reference) {
      go({
        id: "ref-" + reference.href,
        title: reference.title,
        href: withFindContext(
          reference.href,
          cleanQueryText,
          selectedTranslation,
          scope,
        ),
        note: "Open the source passage",
        kind: "ref",
      });
      return;
    }
    if (commandOnly || scope === "site") {
      go(items[0]);
      return;
    }
    const topItem = items[0];
    if (
      topItem &&
      (topItem.score ?? 0) >= 95 &&
      !["verse", "topic", "action", "ask"].includes(topItem.kind)
    ) {
      let zeroExactHits =
        textExact !== null ? textExact.totalHits === 0 : null;
      if (zeroExactHits === null && canons && cleanQueryText.trim()) {
        try {
          const quick = await searchVerses(
            cleanQueryText.trim(),
            selectedTranslation,
            1,
          );
          if (gen !== submitGen.current) return;
          zeroExactHits = quick.totalHits === 0;
        } catch {
          zeroExactHits = true;
        }
      }
      if (zeroExactHits) {
        go(topItem);
        return;
      }
    }
    search();
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (
      !dialog ||
      typeof HTMLDialogElement === "undefined" ||
      "closedBy" in HTMLDialogElement.prototype
    ) {
      return;
    }
    pressedBackdropRef.current =
      event.target === dialog && isOutsideDialogRect(event, dialog);
  };

  const handleDialogClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (
      !dialog ||
      typeof HTMLDialogElement === "undefined" ||
      "closedBy" in HTMLDialogElement.prototype
    ) {
      return;
    }
    const shouldClose =
      pressedBackdropRef.current &&
      event.target === dialog &&
      !(event.clientX === 0 && event.clientY === 0) &&
      isOutsideDialogRect(event, dialog);
    pressedBackdropRef.current = false;
    if (shouldClose) {
      dismissDialog("restore");
    }
  };

  const bridgeNoteNode = showNoExactBridge ? (
    <div className="find-bridge-note" role="status">
      <p>
        No word matches in{" "}
        {canons?.translations[selectedTranslation]?.name ??
          selectedTranslation.toUpperCase()}
        {expansionTerms.length > 0
          ? " — try words used in the text:"
          : ". Browse related topics below, or search passages for broader context."}
      </p>
      {expansionTerms.length > 0 && (
        <div className="find-bridge-chips">
          {expansionTerms.map((term) => (
            <button
              type="button"
              key={term}
              className="find-chip"
              onClick={() => {
                const prefix =
                  query.match(/^(web|kjv|drb|brenton|charles):\s*/i)?.[0] ?? "";
                setQuery(`${prefix}${term}`);
                inputRef.current?.focus();
              }}
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  return (
    <dialog
      ref={dialogRef}
      className="find-dialog"
      closedby="any"
      aria-labelledby={dialogId + "-title"}
      onClose={() => {
        if (isFindOpen()) {
          dismissDialog("restore");
        }
      }}
      onPointerDown={handlePointerDown}
      onClick={handleDialogClick}
    >
      <header className="find-top">
        <h2 id={dialogId + "-title"} className="find-brand">
          Find<span aria-hidden="true">.</span>
        </h2>
        <form
          className="find-bar"
          role="search"
          aria-label="Find in the record"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <span className="find-search-icon" aria-hidden="true">
            ⌕
          </span>
          <label className="find-label" htmlFor={dialogId + "-q"}>
            Find
          </label>
          <input
            ref={inputRef}
            id={dialogId + "-q"}
            data-find-input="true"
            className="find-input"
            type="search"
            autoFocus
            value={query}
            maxLength={QUERY_MAX}
            autoComplete="off"
            spellCheck={false}
            placeholder="Passage, writing, person, topic, or page…"
            aria-keyshortcuts="Meta+K Control+K"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="find-clear"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          ) : (
            <kbd className="find-shortcut" aria-hidden="true">
              {mod === "⌘" ? "⌘K" : "Ctrl K"}
            </kbd>
          )}
        </form>
        <button
          type="button"
          className="find-close"
          aria-label="Close find"
          onClick={() => dismissDialog("restore")}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="find-toolbar">
        <div className="find-scopes" role="group" aria-label="Search scope">
          {(
            [
              ["all", "Everything"],
              ["texts", "Passages & writings"],
              ["site", "Site pages"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="find-toolbar-end">
          {scope !== "site" && canons && (
            <select
              className="find-edition-select"
              aria-label="Find Scripture edition"
              value={selectedTranslation}
              onChange={(event) => {
                setQuery(parseTranslationPrefix(query).text);
                setTranslation(event.target.value as TranslationId);
              }}
            >
              {Object.entries(canons.translations).map(([id, edition]) => (
                <option key={id} value={id}>
                  {edition.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="find-commands"
            onClick={() => {
              setScope("all");
              setQuery("?");
              inputRef.current?.focus();
            }}
          >
            Commands
          </button>
        </div>
      </div>

      <div className="find-content">
        <div className="find-discovery">
          {!trimmed && (
            <div className="find-start">
              <span className="find-start-lead">Try:</span>
              {["loneliness", "John 3:16", "Didache", "Nicaea"].map(
                (example) => (
                  <button
                    type="button"
                    key={example}
                    onClick={() => {
                      setQuery(example);
                      inputRef.current?.focus();
                    }}
                  >
                    {example}
                    <span aria-hidden="true"> ↗</span>
                  </button>
                ),
              )}
            </div>
          )}
          {writingSearch.failed && scope !== "site" && (
            <p className="find-status" role="status">
              Writings search couldn’t load.{" "}
              <button
                type="button"
                className="find-inline-btn"
                onClick={writingSearch.retry}
              >
                Retry writings
              </button>
            </p>
          )}
          {(textLoading || writingSearch.loading) && scope !== "site" && (
            <p className="find-status" role="status">
              Looking through Scripture, writings and topic references…
            </p>
          )}
          {exactFailed && !textLoading && scope !== "site" && (
            <p className="find-status" role="status">
              Word search couldn’t load. Site pages and passage references
              remain available.
            </p>
          )}
          {!groups.length && !textLoading && !showNoExactBridge && (
            <div className="find-empty" role="status">
              <strong>
                {trimmed
                  ? "No quick matches here."
                  : "A few words will get you started."}
              </strong>
              <p>
                {scope === "site"
                  ? "Try another name, or switch to Everything to search passages."
                  : "Try a phrase or reference. Full text search can look beyond these quick matches."}
              </p>
            </div>
          )}
          <div id={listId} className="find-results">
            {!hasPlacesGroup && bridgeNoteNode}
            {groups.map((group) => (
              <Fragment key={group.id}>
                <section
                  className="find-group"
                  aria-labelledby={dialogId + "-" + group.id}
                >
                  <h3 id={dialogId + "-" + group.id}>
                    {group.label}
                    <span>{group.items.length}</span>
                  </h3>
                  {group.note && trimmed && (
                    <p className="find-group-note">{group.note}</p>
                  )}
                  <div
                    id={listId + "-" + group.id}
                    role="listbox"
                    aria-labelledby={dialogId + "-" + group.id}
                  >
                    {group.items.map((item) => {
                      const index = items.findIndex(
                        (row) => row.id === item.id,
                      );
                      const isActive = selectedId === item.id;
                      return (
                        <Link
                          key={item.id}
                          id={dialogId + "-opt-" + index}
                          href={item.href}
                          role="option"
                          aria-selected={isActive}
                          data-find-index={index}
                          className={
                            "find-item" + (isActive ? " is-active" : "")
                          }
                          onMouseEnter={() => hoverPreview(item.id)}
                          onFocus={() => hoverPreview(item.id)}
                          onClick={(event) => {
                            if (item.kind === "action") {
                              event.preventDefault();
                              go(item);
                            } else {
                              recordRecentFindItem(item);
                              const isPlainPrimaryClick =
                                !event.metaKey &&
                                !event.ctrlKey &&
                                !event.shiftKey &&
                                !event.altKey &&
                                event.button === 0;
                              const sameRoom =
                                isPlainPrimaryClick &&
                                openSameRoomParable(item.href);
                              dismissDialog(
                                sameRoom ? "restore-no-scroll" : "navigate",
                              );
                            }
                          }}
                        >
                          <span className="find-item-symbol" aria-hidden="true">
                            {item.kind === "verse" || item.kind === "ref"
                              ? "¶"
                              : item.kind === "action"
                                ? ">"
                                : "↗"}
                          </span>
                          <span className="find-item-body">
                            <strong>{item.title}</strong>
                            {item.snippet && (
                              <span className="find-item-snippet" dir="auto">
                                {highlightFindText(item.snippet, query)}
                              </span>
                            )}
                            <span className="find-item-note">{item.note}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
                {group.id === "places" && bridgeNoteNode}
              </Fragment>
            ))}
          </div>
        </div>
        <FindPreview
          key={previewItem?.id ?? "empty"}
          item={previewItem}
          canons={canons}
          query={canSearch ? trimmed : ""}
          localEvidence={localEvidence}
          onOpen={go}
        />
      </div>
      {copiedNotice && (
        <div className="find-copied" role="status">
          {copiedNotice}
        </div>
      )}
      <footer className="find-footer">
        <span className="find-footer-hints" aria-hidden="true">
          ↑↓ choose · ↵ {scope === "site" ? "open" : "open / search"} · Esc
          close
        </span>
        {scope !== "site" &&
          (canSearch ? (
            <button
              type="button"
              className="find-search-cta"
              onClick={search}
            >
              <span>
                Search passages{" "}
                <span className="find-search-cta-query">“{trimmed}”</span>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          ) : (
            <Link
              className="find-workspace-link"
              href={
                trimmed
                  ? findSearchHref(
                      query,
                      localEvidence,
                      selectedTranslation,
                      scope,
                    )
                  : localEvidence
                    ? "/scriptures/find"
                    : "/scriptures/search"
              }
              onClick={() => dismissDialog("navigate")}
            >
              {localEvidence
                ? "Open full Find workspace"
                : "Open full text search"}
              <span aria-hidden="true"> ↗</span>
            </Link>
          ))}
      </footer>
    </dialog>
  );
}
