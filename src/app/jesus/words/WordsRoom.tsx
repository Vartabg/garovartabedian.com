"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { traditionFor } from "@/lib/scriptures/client";
import { loadWordsBook } from "@/lib/jesus/client";
import type { WordsBook } from "@/lib/jesus/types";
import type { Canons } from "@/lib/scriptures/types";
import GlossText from "@/app/_components/GlossText";
import { RedLetterMap } from "./RedLetterMap";
import WordStudyGuide from "./WordStudyGuide";
import { groupWordChapters } from "./word-utils";
import MeaningRail from "@/app/_components/MeaningRail";
import OriginalLine from "@/app/_components/OriginalLine";
import type { WordsEntry } from "@/lib/semantic-corpus";

type LoadBookData = (book: string) => Promise<WordsBook>;
type StudyTarget = { book: string; chapter: number; verse: number };
const EMPTY_WORDS: WordsBook = {};

export default function WordsRoom({
  initialBook,
  initialVerses,
  counts,
  canons,
  originalEditions,
  loadBookData = loadWordsBook,
}: {
  initialBook: string;
  initialVerses: WordsBook;
  counts: Record<string, number>;
  canons: Canons;
  /** Book id to hosted edition id, from the server manifest. */
  originalEditions: Record<string, string>;
  loadBookData?: LoadBookData;
}) {

  const [book, setBook] = useState(initialBook);
  const [versesByBook, setVersesByBook] = useState<Record<string, WordsBook>>({
    [initialBook]: initialVerses,
  });
  const [filter, setFilter] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<number | null>(
    groupWordChapters(initialVerses)[0]?.[0] ?? null,
  );
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");
  const [studyTarget, setStudyTarget] = useState<StudyTarget | null>(null);
  const requestId = useRef(0);
  const readerRef = useRef<HTMLDivElement>(null);

  const books = useMemo(() => {
    return canons.bookOrder.filter((candidate) => (counts[candidate] ?? 0) > 0);
  }, [counts, canons]);

  const activeVerses = useMemo(
    () => versesByBook[book] ?? EMPTY_WORDS,
    [versesByBook, book],
  );
  const allChapters = useMemo(() => groupWordChapters(activeVerses), [activeVerses]);
  const chapterIndex = allChapters.findIndex(([chapter]) => chapter === selectedChapter);
  const moveChapter = (direction: -1 | 1) => {
    const next = allChapters[chapterIndex + direction];
    if (!next) return;
    setStudyTarget(null);
    setSelectedChapter(next[0]);
    readerRef.current?.focus({ preventScroll: true });
    readerRef.current?.scrollIntoView?.({ block: "start" });
  };

  const chapters = useMemo(() => {
    const matches = groupWordChapters(activeVerses, filter);
    if (filter.trim()) return matches;
    return matches.filter(([chapter]) => chapter === selectedChapter);
  }, [activeVerses, filter, selectedChapter]);
  const speakingVerseCount = useMemo(
    () => Object.values(counts).reduce((sum, count) => sum + count, 0),
    [counts],
  );
  const visibleVerseCount = useMemo(
    () => chapters.reduce((sum, [, verses]) => sum + verses.length, 0),
    [chapters],
  );

  const fetchBook = async (nextBook: string, nextChapter?: number) => {
    const currentRequest = ++requestId.current;
    setStatus("loading");
    try {
      const verses = await loadBookData(nextBook);
      if (currentRequest !== requestId.current) return;
      setVersesByBook((current) => ({ ...current, [nextBook]: verses }));
      setSelectedChapter(nextChapter ?? groupWordChapters(verses)[0]?.[0] ?? null);
      setStatus("ready");
    } catch {
      if (currentRequest === requestId.current) setStatus("error");
    }
  };

  const selectBook = (nextBook: string, nextChapter?: number) => {
    if (nextBook === book) {
      if (nextChapter) setSelectedChapter(nextChapter);
      return;
    }
    setBook(nextBook);
    setFilter("");
    const cached = versesByBook[nextBook];
    if (cached) {
      requestId.current += 1;
      setSelectedChapter(nextChapter ?? groupWordChapters(cached)[0]?.[0] ?? null);
      setStatus("ready");
      return;
    }
    setSelectedChapter(null);
    void fetchBook(nextBook, nextChapter);
  };

  const tid = traditionFor(canons, book);
  useEffect(() => {
    if (!studyTarget || status !== "ready" || book !== studyTarget.book || selectedChapter !== studyTarget.chapter) return;
    const verse = document.getElementById(`word-${studyTarget.book}-${studyTarget.chapter}-${studyTarget.verse}`);
    verse?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    verse?.focus();
  }, [book, selectedChapter, status, studyTarget]);
  const glossSeen = new Map<string, string>();

  return (
    <>
      <p className="kicker">
        <Link href="/jesus">Jesus Christ</Link>
      </p>
      <h1>His words</h1>
      <p className="lede">
        Jesus&rsquo; words in the World English Bible. Open any verse to read
        it in context.
      </p>

      <div className="jsu-word-reader" ref={readerRef} tabIndex={-1} aria-label="Words reader">
        <div className="jsu-word-tools" role="group" aria-label="Choose a passage">
          <label className="jsu-book-select">
            <span>Book</span>
            <select
              value={book}
              onChange={(event) => {
                setStudyTarget(null);
                selectBook(event.target.value);
              }}
            >
              {books.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {canons.books[candidate]?.name ?? candidate}
                </option>
              ))}
            </select>
          </label>
          <label className="jsu-chapter-select">
            <span>Chapter</span>
            <select
              value={selectedChapter ?? ""}
              onChange={(event) => {
                setStudyTarget(null);
                setSelectedChapter(Number(event.target.value));
              }}
              disabled={status !== "ready" || Boolean(filter.trim())}
            >
              {allChapters.map(([chapter]) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="jsu-word-shortcuts">
          <details className="jsu-word-filter">
            <summary>Search this book</summary>
            <label className="jsu-word-search">
              <span>Search this book</span>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`Find a word or phrase in ${canons.books[book]?.name ?? book}…`}
                disabled={status !== "ready"}
              />
            </label>
          </details>
          <a href="#words-study-tools">Search &amp; study ↓</a>
          <Link href="/jesus/harmony">Compare Gospel accounts →</Link>
        </div>

        {status === "ready" && (
          <p className="scr-meta jsu-word-results" role="status" aria-live="polite">
            {filter.trim()
              ? `${visibleVerseCount.toLocaleString()} matching ${visibleVerseCount === 1 ? "verse" : "verses"} across ${chapters.length.toLocaleString()} ${chapters.length === 1 ? "chapter" : "chapters"}.`
              : selectedChapter
                ? `${visibleVerseCount.toLocaleString()} speaking ${visibleVerseCount === 1 ? "verse" : "verses"} in ${canons.books[book]?.name ?? book} ${selectedChapter}.`
                : null}
            {filter.trim() && (
              <button type="button" onClick={() => setFilter("")}>Clear search</button>
            )}
          </p>
        )}
        {status === "loading" && (
          <p className="scr-empty" role="status">
            Opening that book…
          </p>
        )}
        {status === "error" && (
          <div className="jsu-inline-error" role="alert">
            <p>That book couldn&rsquo;t load. Check the connection and try again.</p>
            <button type="button" className="scr-btn" onClick={() => void fetchBook(book)}>
              Try again
            </button>
          </div>
        )}
        {status === "ready" && chapters.length === 0 && (
          <p className="scr-meta">Nothing matches that filter here.</p>
        )}

        {status === "ready" && chapters.map(([c, verses]) => (
          <section key={c} className="jsu-word-page" aria-label={`${canons.books[book]?.name ?? book} ${c}`}>
            <header className="jsu-word-page-heading">
            <h2 className="jsu-chapter">
              <Link href={`/scriptures/${tid}/${book}/${c}`}>
                {canons.books[book]?.name ?? book} {c}
              </Link>
            </h2>
            <Link className="jsu-word-context" href={`/scriptures/${tid}/${book}/${c}`}>Read full chapter ↗</Link>
            </header>
            {verses.map(([v, text]) => (
              // The original-language line is a sibling of the verse, never a
              // child: it renders block content, and block content inside a <p>
              // is invalid HTML that the browser reparents.
              <div
                className={`scr-verse${studyTarget?.book === book && studyTarget.chapter === c && studyTarget.verse === v ? " is-study-target" : ""}`}
                id={`word-${book}-${c}-${v}`}
                key={v}
                tabIndex={studyTarget?.book === book && studyTarget.chapter === c && studyTarget.verse === v ? -1 : undefined}
              >
                <p className="scr-verse-text">
                  <Link
                    className="world-vnum"
                    href={`/scriptures/${tid}/${book}/${c}#v${v}`}
                    aria-label={`Read verse ${v} in context`}
                  >
                    {v}
                  </Link>
                  <span className="jsu-red">
                    <GlossText text={text} seen={glossSeen} />
                  </span>
                </p>
                {originalEditions[book] && (
                  <OriginalLine
                    book={book}
                    chapter={c}
                    verse={v}
                    edition={originalEditions[book]}
                  />
                )}
              </div>
            ))}
          </section>
        ))}
        {status === "ready" && !filter.trim() && chapterIndex >= 0 && (
          <nav className="jsu-word-pagination" aria-label="Speaking chapters">
            <button type="button" onClick={() => moveChapter(-1)} disabled={chapterIndex === 0}>
              <span aria-hidden="true">← </span>Previous chapter
            </button>
            <span>{chapterIndex + 1} of {allChapters.length}<small>chapters with his words</small></span>
            <button type="button" onClick={() => moveChapter(1)} disabled={chapterIndex === allChapters.length - 1}>
              Next chapter<span aria-hidden="true"> →</span>
            </button>
          </nav>
        )}
      </div>

      <aside className="jsu-word-secondary" id="words-study-tools" aria-label="Search and study">
        <details className="jsu-word-disclosure">
          <summary>
            <span>
              <strong>Ask his words</strong>
              <small>Find passages related to your question</small>
            </span>
          </summary>
          <MeaningRail<WordsEntry>
            corpus="words"
            label="Ask his words"
            placeholder="taking care of my family"
            note={`Search all ${speakingVerseCount.toLocaleString()} speaking verses for wording close in meaning to your question.`}
            renderHit={(hit) => (
              <Link
                href={`/scriptures/${traditionFor(canons, hit.entry.book)}/${hit.entry.book}/${hit.entry.chapter}#v${hit.entry.verse}`}
                prefetch={false}
              >
                {hit.entry.label}
              </Link>
            )}
          />
        </details>
        <WordStudyGuide
          canons={canons}
          onReadSaying={(anchor) => {
            setFilter("");
            setStudyTarget(anchor);
            selectBook(anchor.book, anchor.chapter);
          }}
        />
        <details className="jsu-word-disclosure jsu-word-distribution">
          <summary>
            <span>
              <strong>Where the red letters cluster</strong>
              <small>{speakingVerseCount.toLocaleString()} speaking verses across {books.length} books</small>
            </span>
          </summary>
          <RedLetterMap
            books={books}
            counts={counts}
            names={Object.fromEntries(books.map((b) => [b, canons.books[b]?.name ?? b]))}
            activeBook={book}
            onSelect={(nextBook) => {
              setFilter("");
              setStudyTarget(null);
              selectBook(nextBook);
              readerRef.current?.focus({ preventScroll: true });
              readerRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
            }}
          />
        </details>
      </aside>
    </>
  );
}
