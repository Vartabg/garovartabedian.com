"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

export type ChapterLink = {
  bookId: string;
  name: string;
  chapter: number;
  verses: number;
  href: string;
};

/**
 * Chapters as bars, each as tall as the chapter is long. Every bar is a real
 * link to the reader; hovering or focusing one loads it ahead of the tap.
 */
export default function ChapterBars({
  chapters,
  label,
  current,
  here,
  bookMarks = false,
  prefetch,
  onFollow,
}: {
  chapters: ChapterLink[];
  label: string;
  /** The strip's place, when scrubbing. */
  current?: { bookId: string; chapter: number } | null;
  /** The chapter being read. */
  here?: { bookId: string; chapter: number } | null;
  bookMarks?: boolean;
  prefetch: (href: string) => void;
  onFollow: () => void;
}) {
  const tallest = Math.max(1, ...chapters.map((c) => c.verses));
  let lastBook = "";

  return (
    <div className="dw-bars" role="group" aria-label={label}>
      {chapters.map((c) => {
        const mark = bookMarks && c.bookId !== lastBook ? c.name : null;
        lastBook = c.bookId;
        const isCurrent = current?.bookId === c.bookId && current.chapter === c.chapter;
        const isHere = here?.bookId === c.bookId && here.chapter === c.chapter;
        return (
          <span key={`${c.bookId}-${c.chapter}`} className="dw-bar-slot">
            {mark ? <span className="dw-bar-book" aria-hidden="true">{mark}</span> : null}
            <Link
              href={c.href}
              prefetch={false}
              className={`dw-bar${isCurrent ? " is-current" : ""}${isHere ? " is-here" : ""}`}
              aria-current={isHere ? "page" : undefined}
              aria-label={`${c.name} ${c.chapter}, ${c.verses} ${c.verses === 1 ? "verse" : "verses"}`}
              style={{ "--h": `${Math.max(6, Math.round((c.verses / tallest) * 56))}px` } as CSSProperties}
              onMouseEnter={() => prefetch(c.href)}
              onFocus={() => prefetch(c.href)}
              onTouchStart={() => prefetch(c.href)}
              onClick={onFollow}
            >
              <i aria-hidden="true" />
              <span aria-hidden="true">{c.chapter}</span>
            </Link>
          </span>
        );
      })}
    </div>
  );
}
