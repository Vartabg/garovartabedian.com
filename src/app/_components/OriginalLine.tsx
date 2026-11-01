"use client";

import { useCallback, useEffect, useState } from "react";
import { loadOriginalChapter } from "@/lib/scriptures/client";
import type { OriginalChapter, OriginalVerse } from "@/lib/scriptures/types";
import OriginalVerseLine from "@/app/scriptures/[tradition]/[book]/[chapter]/OriginalVerseLine";

/**
 * The original-language line behind one verse, on demand.
 *
 * A room shows a verse in English. This shows the line the translators were
 * reading — Hebrew, Aramaic, or Greek depending on the book — word by word,
 * with lemma and morphology on tap, using the same renderer the chapter reader
 * uses, pointed at a single verse.
 *
 * Where the critical edition prints nothing for a verse, that is stated rather
 * than hidden. SBLGNT has no Greek for John 7:53-8:11, so opening the original
 * on "Neither do I condemn you" says exactly that, which is a truer thing for
 * a reader to learn than an empty panel.
 */
/**
 * The toggle names the language rather than saying "original", because a
 * reader deciding whether to open it is deciding whether they read Hebrew or
 * Greek. The rendered line itself carries the precise language attribution,
 * including the Aramaic portions inside the Hebrew editions.
 */
const EDITION_LABEL: Record<string, string> = {
  oshb: "Hebrew",
  sblgnt: "Greek",
  lxx: "Greek (LXX)",
};

export default function OriginalLine({
  book,
  chapter,
  verse,
  endVerse,
  edition,
}: {
  book: string;
  chapter: number;
  verse: number;
  /** Last verse of a passage; the toggle then opens every line from verse to here. */
  endVerse?: number;
  /** The hosted edition for this book, so the toggle names the language. */
  edition?: string;
}) {
  const label = EDITION_LABEL[edition ?? ""] ?? "Original";
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<
    | { phase: "idle" | "loading" }
    | { phase: "error" }
    | { phase: "ready"; chapter: OriginalChapter | null; verses: OriginalVerse[] }
  >({ phase: "idle" });

  const load = useCallback(() => {
    setState({ phase: "loading" });
    loadOriginalChapter(book, chapter)
      .then((original) => {
        const last = endVerse ?? verse;
        setState({
          phase: "ready",
          chapter: original,
          verses: original?.verses.filter((item) => item.number >= verse && item.number <= last) ?? [],
        });
      })
      .catch(() => setState({ phase: "error" }));
  }, [book, chapter, verse, endVerse]);

  useEffect(() => {
    if (open && state.phase === "idle") load();
  }, [open, state.phase, load]);

  const readyChapter = state.phase === "ready" ? state.chapter : null;
  const readyVerses = state.phase === "ready" ? state.verses : [];

  return (
    // A block element, not a span: the verse renderer emits a <div>, and an
    // inline wrapper around block content is invalid HTML that React reports
    // as a hydration error. Call sites place this beside a paragraph, never
    // inside one.
    <div className="orig-line">
      <button
        type="button"
        className="orig-line-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? `Hide ${label}` : label}
      </button>

      {open && state.phase === "loading" && (
        <p className="scr-meta" role="status">
          Opening the text…
        </p>
      )}
      {open && state.phase === "error" && (
        <p className="scr-meta" role="alert">
          The original text couldn&rsquo;t load. Check the connection and try again.
        </p>
      )}
      {open && readyChapter &&
        readyVerses.map((item) => (
          <OriginalVerseLine key={item.number} chapter={readyChapter} verse={item} />
        ))}
      {open && state.phase === "ready" && state.verses.length === 0 && (
        <p className="scr-meta">
          {state.chapter
            ? `The hosted critical edition prints no text at this verse number. Verse divisions and the passages an edition includes differ between the English translation and the Greek, so there is no line to show here.`
            : `No original-language text is hosted for this book yet.`}
        </p>
      )}
    </div>
  );
}
