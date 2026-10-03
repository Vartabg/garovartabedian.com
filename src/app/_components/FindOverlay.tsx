"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLibrarySearch } from "@/lib/early/use-library-search";
import { KIND_LABELS } from "@/lib/early/library";
import { wordingLabel } from "@/lib/scriptures/search-wording";
import { loadBook, loadCanons } from "@/lib/scriptures/client";
import type { RelatedSearchResult } from "@/lib/scriptures/related";
import type { SearchResult } from "@/lib/scriptures/search";
import { withFindContext } from "@/lib/scriptures/search-url";
import type { Canons, TranslationId } from "@/lib/scriptures/types";
import { FIND_CATALOG } from "@/lib/site/find-catalog";
import { continueFrom } from "@/lib/site/find-place";
import {
  assembleFindGroups,
  flattenGroups,
  findCommand,
  parseFindRef,
  type FindGroup,
  type FindItem,
} from "@/lib/site/find-query";
import { loadFindText, findSearchHref, parseTranslationPrefix } from "@/lib/site/find-text";
import FindPreview from "./FindPreview";
import { surfaceGroups, type FindScope } from "@/lib/site/find-surface";
import { executeAction } from "@/lib/site/find-actions";
import {
  getRecentFindItems,
  recordRecentFindItem,
} from "@/lib/site/find-recent";
import { setFindOpen, subscribeFind, toggleFind } from "@/lib/site/find-bridge";

const QUERY_MAX = 160;
const TEXT_DEBOUNCE_MS = 280;

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

function modifierLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

export default function FindOverlay({
  localEvidence = false,
}: {
  localEvidence?: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const dialogId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [translation, setTranslation] = useState<TranslationId>("web");
  const selectedTranslation = parseTranslationPrefix(query, translation).translation;
  const [scope, setScope] = useState<FindScope>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const selected = useRef<string | null>(null);
  const [canons, setCanons] = useState<Canons | null>(null);
  const [mod, setMod] = useState("Ctrl");
  const [textExact, setTextExact] = useState<SearchResult | null>(null);
  const [textRelated, setTextRelated] = useState<RelatedSearchResult | null>(
    null,
  );
  const [exactFailed, setExactFailed] = useState(false);
  const [textLoading, setTextLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<FindItem[]>([]);
  const [verseSnippets, setVerseSnippets] = useState<Record<string, string>>(
    {},
  );
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const searchGen = useRef(0);

  const writingSearch = useLibrarySearch(parseTranslationPrefix(query).text, open && scope !== "site" && findCommand(query) === null && !(canons && parseFindRef(query, canons, selectedTranslation)), 4);

  useEffect(() => subscribeFind(setOpen), []);

  useEffect(() => {
    void loadCanons()
      .then(setCanons)
      .catch(() => {
        /* Places and walks still work without canons. */
      });
  }, []);

  useEffect(() => {
    setMod(modifierLabel());
  }, []);

  useEffect(() => {
    if (open) {
      setRecentItems(getRecentFindItems());
      const params = new URLSearchParams(window.location.search);
      const edition = params.get("t") ?? params.get("trans") ?? "web";
      if (["web", "kjv", "drb", "brenton", "charles"].includes(edition)) setTranslation(edition as TranslationId);
      const savedScope = params.get("scope") ?? params.get("findScope");
      if (savedScope === "texts" || savedScope === "all") setScope(savedScope);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k"
      ) {
        return;
      }
      if (event.altKey) return;
      event.preventDefault();
      if (!open) {
        lastFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      }
      toggleFind();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (document.activeElement instanceof HTMLElement) {
      lastFocus.current = document.activeElement;
    }
    const previousOverflow = document.body.style.overflow;
    document.documentElement.dataset.findOpen = "true";
    document.body.style.overflow = "hidden";
    setMod(modifierLabel());
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.findOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setScope("all");
      setPreviewId(null);
      selected.current = null;
      setActive(0);
      setTextExact(null);
      setTextRelated(null);
      setExactFailed(false);
      setTextLoading(false);
      setCopiedNotice(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    const ref = canons && trimmed ? parseFindRef(trimmed, canons, selectedTranslation) : null;
    if (
      !trimmed ||
      ref ||
      !canons ||
      scope === "site" ||
      findCommand(trimmed) !== null
    ) {
      searchGen.current += 1;
      setTextExact(null);
      setTextRelated(null);
      setExactFailed(false);
      setTextLoading(false);
      return;
    }

    const gen = ++searchGen.current;
    setTextExact(null);
    setTextRelated(null);
    setExactFailed(false);
    setTextLoading(true);
    const timer = window.setTimeout(() => {
      void loadFindText(trimmed, canons, selectedTranslation).then((next) => {
        if (gen !== searchGen.current) return;
        setTextExact(next.exact);
        setTextRelated(next.related);
        setExactFailed(next.exactFailed);
        setTextLoading(false);
      });
    }, TEXT_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, query, canons, scope, selectedTranslation]);

  useEffect(() => {
    if (!open || !textExact || !textExact.hits.length) return;
    const trans = textExact.translation ?? "web";
    const topHits = textExact.hits.slice(0, 4);
    let cancelled = false;

    topHits.forEach((hit) => {
      const key = `${trans}:${hit.book}:${hit.chapter}:${hit.verse}`;
      if (verseSnippets[key]) return;
      void loadBook(trans, hit.book)
        .then((book) => {
          if (cancelled) return;
          const text = book.chapters[hit.chapter - 1]?.[hit.verse - 1];
          if (text) {
            const trimmed = text.length > 135 ? `${text.slice(0, 135)}…` : text;
            setVerseSnippets((prev) => ({ ...prev, [key]: trimmed }));
          }
        })
        .catch(() => {
          // Verse snippet failure never blocks the hit list.
        });
    });

    return () => {
      cancelled = true;
    };
  }, [open, textExact, verseSnippets]);

  const rawGroups: FindGroup[] = useMemo(() => {
    const trimmed = query.trim();
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
      const group: FindGroup = { id: "writing-passages", label: "Words in the writings", note: "Source paragraphs, edition commentary and catalog records are labelled separately.", items: writingSearch.result.hits.map(hit => ({
        id: `writing-${hit.id}`, href: hit.href, title: `${hit.title} — ${hit.label}`, kind: "text", snippet: hit.snippet,
        note: `${KIND_LABELS[hit.kind]} · ${wordingLabel(hit)} · ${hit.edition}`,
      })) };
      const beforeTopics = groups.findIndex(item => item.id === "related" || item.id === "ask");
      groups.splice(beforeTopics < 0 ? groups.length : beforeTopics, 0, group);
    }
    return groups;
  }, [
    query,
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
    () => surfaceGroups(rawGroups, scope, !!query.trim()).map(group => ({ ...group, items: group.items.map(item => ({ ...item, href: withFindContext(item.href, parseTranslationPrefix(query).text, selectedTranslation, scope) })) })),
    [rawGroups, scope, query, selectedTranslation],
  );
  const items = useMemo(() => flattenGroups(groups), [groups]);
  const previewItem = items.find(
    (item) => item.id === (previewId ?? selected.current),
  );
  const search = useCallback(() => {
    if (!query.trim()) return;
    setFindOpen(false);
    router.push(findSearchHref(query, localEvidence, selectedTranslation, scope));
  }, [query, router, localEvidence, selectedTranslation, scope]);

  useEffect(() => {
    setActive(0);
    selected.current = null;
    setPreviewId(null);
  }, [query, pathname, scope]);

  useEffect(() => {
    const chosen = selected.current
      ? items.findIndex((item) => item.id === selected.current)
      : -1;
    if (chosen >= 0) {
      if (active !== chosen) setActive(chosen);
    } else {
      selected.current = null;
      if (active >= items.length)
        setActive(items.length > 0 ? items.length - 1 : 0);
    }
  }, [active, items]);

  const close = useCallback(() => {
    setFindOpen(false);
    lastFocus.current?.focus();
  }, []);

  const go = useCallback(
    (item: FindItem | undefined) => {
      if (!item) return;
      if (item.kind === "action") {
        const handled = executeAction(item.id);
        if (!handled && item.href && item.href !== "#") {
          recordRecentFindItem(item);
          setFindOpen(false);
          router.push(item.href);
          lastFocus.current?.focus();
          return;
        }
        setFindOpen(false);
        lastFocus.current?.focus();
        return;
      }
      recordRecentFindItem(item);
      setFindOpen(false);
      router.push(item.href);
      lastFocus.current?.focus();
    },
    [router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab") {
        if (!dialogRef.current) return;
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.target instanceof HTMLSelectElement) return;
      if (
        event.key === "ArrowDown" &&
        !(event.target instanceof HTMLButtonElement)
      ) {
        event.preventDefault();
        if (items.length === 0) return;
        const next = selected.current ? (active + 1) % items.length : 0;
        selected.current = items[next].id;
        setActive(next);
        setPreviewId(items[next].id);
        return;
      }
      if (
        event.key === "ArrowUp" &&
        !(event.target instanceof HTMLButtonElement)
      ) {
        event.preventDefault();
        if (items.length === 0) return;
        const next = selected.current
          ? (active - 1 + items.length) % items.length
          : items.length - 1;
        selected.current = items[next].id;
        setActive(next);
        setPreviewId(items[next].id);
        return;
      }
      if (event.key === "Home" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        setActive(0);
        selected.current = items[0]?.id ?? null;
        setPreviewId(selected.current);
        return;
      }
      if (event.key === "End" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        if (items.length > 0) {
          setActive(items.length - 1);
          selected.current = items.at(-1)!.id;
          setPreviewId(selected.current);
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        const item = selected.current
          ? items.find((i) => i.id === selected.current)
          : {
              id: "search",
              kind: "ask" as const,
              title: query,
              note: "Search",
              href: findSearchHref(query, localEvidence, selectedTranslation, scope),
            };
        if (item && item.kind !== "action" && item.href !== "#") {
          recordRecentFindItem(item);
          window.open(item.href, "_blank", "noopener,noreferrer");
          setFindOpen(false);
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
            (item) => item.id === (selected.current ?? previewId),
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
        )
          return;
        event.preventDefault();
        go(items[active]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active, close, go, query, localEvidence, previewId, selectedTranslation, scope]);

  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current?.querySelector<HTMLElement>(
      `[data-find-index="${active}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!open) return null;

  const listId = `${dialogId}-list`;
  const activeId =
    selected.current && items[active] ? `${dialogId}-opt-${active}` : undefined;
  const trimmed = query.trim();

  const reference = canons && trimmed ? parseFindRef(trimmed, canons, selectedTranslation) : null;
  const commandOnly = findCommand(trimmed) !== null;
  const canSearch =
    trimmed && !reference && !commandOnly;
  function submit() {
    const chosen = selected.current
      ? items.find((item) => item.id === selected.current)
      : undefined;
    if (chosen) {
      go(chosen);
      return;
    }
    if (reference) {
      go({
        id: "ref-" + reference.href,
        title: reference.title,
        href: withFindContext(reference.href, parseTranslationPrefix(query).text, selectedTranslation, scope),
        note: "Open the source passage",
        kind: "ref",
      });
      return;
    }
    if (commandOnly || scope === "site") {
      go(items[0]);
      return;
    }
    search();
  }
  return (
    <div className="find-root">
      <button
        type="button"
        className="find-scrim"
        aria-label="Close find"
        onClick={close}
      />
      <div
        ref={dialogRef}
        className="find-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId + "-title"}
      >
        <header className="find-head">
          <div>
            <p className="find-kicker">Across the record</p>
            <h2 id={dialogId + "-title"}>
              Find<span aria-hidden="true">.</span>
            </h2>
          </div>
          <button
            type="button"
            className="find-close"
            aria-label="Close find"
            onClick={close}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <form
          className="find-bar"
          role="search"
          aria-label="Find in the record"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
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
            value={query}
            maxLength={QUERY_MAX}
            autoComplete="off"
            spellCheck={false}
            placeholder="A question, a passage, a person, a place…"
            aria-autocomplete="list"
            aria-controls={
              groups.map((group) => listId + "-" + group.id).join(" ") ||
              undefined
            }
            aria-activedescendant={activeId}
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
              {mod}K
            </kbd>
          )}
        </form>
        {scope !== "site" && canons && <label className="find-edition">
          Scripture edition
          <select aria-label="Find Scripture edition" value={selectedTranslation} onChange={event => {
            setQuery(parseTranslationPrefix(query).text);
            setTranslation(event.target.value as TranslationId);
          }}>
            {Object.entries(canons.translations).map(([id, edition]) => <option key={id} value={id}>{edition.name}</option>)}
          </select>
        </label>}
        {scope !== "site" && textExact?.totalHits === 0 && !textLoading && <p className="find-empty" role="status">
          No word matches in {canons?.translations[selectedTranslation]?.name}. Try a related topic below, or choose Search passages for meaning suggestions.
        </p>}

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
        <div className="find-content">
          <div className="find-discovery">
            {!trimmed && (
              <div className="find-start">
                <p>Start anywhere.</p>
                <div>
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
              </div>
            )}
            {canSearch && scope !== "site" && (
              <button
                type="button"
                className="find-search-action"
                onClick={search}
              >
                <span>
                  <strong>Search passages</strong>
                  <small>Explore “{trimmed}” in context</small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            )}
            {writingSearch.failed && scope !== "site" && <p className="find-status" role="status">Writings search couldn’t load. <button type="button" onClick={writingSearch.retry}>Retry writings</button></p>}
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
            {!groups.length && !textLoading && (
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
              {groups.map((group) => (
                <section
                  key={group.id}
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
                      const isActive = selected.current === item.id;
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
                          onMouseEnter={() => setPreviewId(item.id)}
                          onFocus={() => setPreviewId(item.id)}
                          onClick={(event) => {
                            if (item.kind === "action") {
                              event.preventDefault();
                              go(item);
                            } else {
                              recordRecentFindItem(item);
                              setFindOpen(false);
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
                              <span className="find-item-snippet">
                                {item.snippet}
                              </span>
                            )}
                            <span className="find-item-note">{item.note}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
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
            onSearch={search}
          />
        </div>
        {copiedNotice && (
          <div className="find-copied" role="status">
            {copiedNotice}
          </div>
        )}
        <footer className="find-footer">
          <span className="find-footer-hints" aria-hidden="true">
            ↑↓ choose · ↵ {scope === "site" ? "open" : "search / open"} · Esc
            close
          </span>
          <Link
            className="find-workspace-link"
            href={query.trim() ? findSearchHref(query, localEvidence, selectedTranslation, scope) : localEvidence ? "/scriptures/find" : "/scriptures/search"}
            onClick={() => setFindOpen(false)}
          >
            {localEvidence
              ? "Open full Find workspace"
              : "Open full text search"}
            <span aria-hidden="true"> ↗</span>
          </Link>
        </footer>
      </div>
    </div>
  );
}
