"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  DOORWAYS_VIEWS,
  readerHref,
  traditionBooks,
  translationFor,
  translationsFor,
  type DoorwaysData,
  type DoorwaysView,
} from "@/lib/scriptures/doorways";
import { DEFAULT_TRADITION } from "@/lib/scriptures/prefs";
import ContentsView from "./ContentsView";
import GoTo from "./GoTo";
import MapView from "./MapView";
import ShelfView from "./ShelfView";
import StripView from "./StripView";

export type PickerProps = {
  data: DoorwaysData;
  tradition: string;
  translation: string;
  book: string | null;
  /** The chapter being read, when the picker opens from the reader. */
  here: { bookId: string; chapter: number } | null;
  onChoose: (bookId: string | null) => void;
  hrefFor: (bookId: string, chapter: number, verse?: number | null) => string;
  prefetch: (href: string) => void;
  /** Open a chapter from script (Enter in the strip, a Go to reference). */
  go: (href: string) => void;
  /** Called as a chapter link is followed, so the reader's sheet can close. */
  onFollow: () => void;
};

/** Where the reader is when the picker opens from a chapter page. */
export type DoorwaysStart = {
  tradition: string;
  translation: string;
  book: string;
  chapter: number;
  /** Links to this book's chapters in this translation keep the reader's view (compare, original). */
  chapterHref: (chapter: number) => string;
};

const STORE_KEY = "scr:doorways:v1";
const VIEW_IDS = DOORWAYS_VIEWS.map((v) => v.id);
const isView = (value: unknown): value is DoorwaysView => VIEW_IDS.includes(value as DoorwaysView);

type Saved = { view?: unknown; tradition?: unknown; translation?: unknown };
function readSaved(): Saved {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    // Storage can be unavailable (private windows); the picker still works.
    return {};
  }
}

/**
 * The Scripture picker. The reader chooses everything: the way to browse, the
 * tradition, the translation, the book and the chapter. Nothing is chosen
 * for them, and their choices are remembered on this device.
 *
 * The Scripture page and the reader's Go to sheet are the same picker. From
 * the reader it opens at the chapter being read (`start`), in the view the
 * reader last used, and it leaves the address bar alone.
 */
export default function Doorways({
  data,
  start,
  onNavigate,
}: {
  data: DoorwaysData;
  start?: DoorwaysStart;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const fromReader = Boolean(start);
  // The reader's sheet renders only in the browser, so it can open straight
  // in the last view instead of switching after its first paint.
  const [view, setView] = useState<DoorwaysView>(() => {
    const saved = fromReader ? readSaved().view : null;
    return isView(saved) ? saved : "shelf";
  });
  const [tradition, setTradition] = useState<string>(start?.tradition ?? DEFAULT_TRADITION);
  const [translation, setTranslation] = useState(start?.translation ?? "web");
  const [book, setBook] = useState<string | null>(start?.book ?? null);
  const [restored, setRestored] = useState(fromReader);

  // On the Scripture page, restore the reader's own choices once the page is
  // interactive. The first paint is the same for everyone, so the
  // server-drawn shelf never flickers. From a chapter, the chapter itself
  // says the tradition and translation.
  useEffect(() => {
    if (fromReader) return;
    const saved = readSaved();
    const fromHash = window.location.hash.slice(1);
    const nextView = isView(fromHash) ? fromHash : isView(saved.view) ? saved.view : null;
    if (nextView) setView(nextView);
    if (typeof saved.tradition === "string" && data.traditions.some((t) => t.id === saved.tradition)) {
      setTradition(saved.tradition);
    }
    if (typeof saved.translation === "string" && data.translations[saved.translation]) {
      setTranslation(saved.translation);
    }
    setRestored(true);
  }, [data, fromReader]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ view, tradition, translation }));
    } catch {
      // Storage can be unavailable (private windows); the picker still works.
    }
  }, [restored, view, tradition, translation]);

  const available = useMemo(() => translationsFor(data, tradition), [data, tradition]);
  const active = available.includes(translation)
    ? translation
    : available.includes("web")
      ? "web"
      : available[0];
  const chosen = book && traditionBooks(data, tradition).includes(book) ? book : null;

  const hrefFor = useCallback(
    (bookId: string, chapter: number, verse?: number | null) => {
      const opensIn = translationFor(data, bookId, active);
      if (start && !verse && tradition === start.tradition && bookId === start.book && opensIn === start.translation) {
        return start.chapterHref(chapter);
      }
      return readerHref(tradition, bookId, chapter, opensIn, verse);
    },
    [data, tradition, active, start],
  );
  const prefetch = useCallback((href: string) => router.prefetch(href), [router]);
  const onFollow = useCallback(() => onNavigate?.(), [onNavigate]);
  const go = useCallback(
    (href: string) => {
      onNavigate?.();
      router.push(href);
    },
    [router, onNavigate],
  );
  const here = start && tradition === start.tradition ? { bookId: start.book, chapter: start.chapter } : null;

  const changeView = (next: DoorwaysView) => {
    setView(next);
    // The reader's address bar carries verse anchors, so only the page links views.
    if (!fromReader) window.history.replaceState(null, "", `#${next}`);
  };

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const i = VIEW_IDS.indexOf(view);
    const next = VIEW_IDS[(i + (event.key === "ArrowRight" ? 1 : VIEW_IDS.length - 1)) % VIEW_IDS.length];
    changeView(next);
    document.getElementById(`dw-tab-${next}`)?.focus();
  };

  const props: PickerProps = { data, tradition, translation: active, book: chosen, here, onChoose: setBook, hrefFor, prefetch, go, onFollow };
  const opensIn = chosen ? translationFor(data, chosen, active) : active;

  return (
    <section className="dw" aria-label="Choose a book and chapter">
      <div className="dw-controls">
        <GoTo data={data} tradition={tradition} translation={active} onChoose={setBook} hrefFor={hrefFor} prefetch={prefetch} go={go} />
        <div className="dw-choices">
          <div className="dw-traditions" role="group" aria-label="Tradition">
            {data.traditions.map((t) => (
              <button
                key={t.id}
                type="button"
                className="dw-chip"
                aria-pressed={t.id === tradition}
                onClick={() => setTradition(t.id)}
              >
                {t.name} <small>{t.books.length}</small>
              </button>
            ))}
          </div>
          <label className="dw-translation">
            <span>Translation</span>
            <select value={active} onChange={(event) => setTranslation(event.target.value)}>
              {available.map((id) => (
                <option key={id} value={id}>{data.translations[id]}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="dw-tabs" role="tablist" aria-label="Ways to browse" onKeyDown={onTabKey}>
        {DOORWAYS_VIEWS.map((v) => (
          <button
            key={v.id}
            id={`dw-tab-${v.id}`}
            type="button"
            role="tab"
            className="dw-tab"
            aria-selected={view === v.id}
            aria-controls={view === v.id ? `dw-panel-${v.id}` : undefined}
            tabIndex={view === v.id ? 0 : -1}
            onClick={() => changeView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {chosen && opensIn !== active ? (
        <p className="dw-note">
          {data.translations[active]} doesn&rsquo;t include {data.books[chosen].name}, so it opens in {data.translations[opensIn]}.
        </p>
      ) : null}

      <div className="dw-panel" role="tabpanel" id={`dw-panel-${view}`} aria-labelledby={`dw-tab-${view}`}>
        {view === "shelf" ? <ShelfView {...props} /> : null}
        {view === "contents" ? <ContentsView {...props} /> : null}
        {view === "map" ? <MapView {...props} /> : null}
        {view === "strip" ? <StripView key={`${tradition}-${active}-${chosen ?? ""}`} {...props} /> : null}
      </div>
    </section>
  );
}
