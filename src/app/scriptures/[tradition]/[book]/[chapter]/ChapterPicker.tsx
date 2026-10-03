"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Canons, Tradition } from "@/lib/scriptures/types";
import ReaderSheet from "./ReaderSheet";

/**
 * Go anywhere, in one sheet: a numbered grid for this book's chapters and a
 * plain list of the tradition's books.
 *
 * This replaces four separate navigators that used to stack above the text —
 * a chapter `<select>`, a decorative dot "ribbon" (which rendered 150
 * unlabelled 3px targets for Psalms), a "Wander" random-jump button with a
 * session trail, and a neighbouring-books strip. One deliberate way to move,
 * with real 44px targets and readable labels.
 */
export default function ChapterPicker({
  canons,
  tradition,
  bookId,
  bookName,
  chapter,
  chapterCount,
  hrefFor,
  onClose,
}: {
  canons: Canons;
  tradition: Tradition;
  bookId: string;
  bookName: string;
  chapter: number;
  chapterCount: number;
  hrefFor: (chapter: number) => string;
  onClose: () => void;
}) {
  const currentRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <ReaderSheet title="Go to" onClose={onClose}>
      <h3 className="scr-pick-h">{bookName} &mdash; {chapterCount} chapters</h3>
      <ul className="scr-pick-grid">
        {Array.from({ length: chapterCount }, (_, i) => {
          const n = i + 1;
          const here = n === chapter;
          return (
            <li key={n}>
              <Link
                href={hrefFor(n)}
                className={`scr-pick-ch${here ? " is-here" : ""}`}
                aria-label={`${bookName} chapter ${n}`}
                aria-current={here ? "page" : undefined}
                ref={here ? currentRef : undefined}
                onClick={onClose}
              >
                {n}
              </Link>
            </li>
          );
        })}
      </ul>

      <h3 className="scr-pick-h">Books</h3>
      <ul className="scr-pick-books">
        {tradition.books.map((id) => (
          <li key={id}>
            <Link
              href={`/scriptures/${tradition.id}/${id}`}
              className={`scr-pick-book${id === bookId ? " is-here" : ""}`}
              aria-current={id === bookId ? "page" : undefined}
              onClick={onClose}
            >
              <span>{canons.books[id]?.name ?? id}</span>
              <small>{canons.books[id]?.chapters ?? "?"} ch</small>
            </Link>
          </li>
        ))}
      </ul>
    </ReaderSheet>
  );
}
