"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  SECTIONS,
  bookVerses,
  chapterVerses,
  isBeyondProtestant,
  sectioned,
} from "@/lib/scriptures/doorways";
import ChapterBars from "./ChapterBars";
import type { PickerProps } from "./Doorways";

/**
 * Every book as a spine, as wide as the book is long. Widths come from CSS
 * container units, so the shelf is drawn correctly before any script runs,
 * and each spine is a real link to its book page.
 */
export default function ShelfView({ data, tradition, translation, book, here, onChoose, hrefFor, prefetch, onFollow }: PickerProps) {
  const trayRef = useRef<HTMLDivElement>(null);
  const groups = sectioned(data, tradition);
  const cases = [
    { label: "Old Testament", groups: groups.filter((g) => SECTIONS[g.section].testament === "OT") },
    { label: "New Testament", groups: groups.filter((g) => SECTIONS[g.section].testament === "NT") },
  ];

  useEffect(() => {
    if (book) trayRef.current?.scrollIntoView({ block: "nearest" });
  }, [book]);

  const verses = book ? chapterVerses(data, book, translation) : [];
  const name = book ? data.books[book].name : "";

  return (
    <div className="dw-shelf">
      {cases.map((c) =>
        c.groups.length ? (
          <div className="dw-case" key={c.label}>
            <h3 className="dw-case-h">{c.label}</h3>
            <div className="dw-shelf-row">
              {c.groups.map((g) => (
                <div className="dw-sgroup" key={g.section} role="group" aria-label={SECTIONS[g.section].name}>
                  <span className="dw-sg-label" aria-hidden="true">{SECTIONS[g.section].name}</span>
                  <div className="dw-spines">
                    {g.books.map((id) => {
                      const chapters = chapterVerses(data, id, translation).length;
                      const extra = isBeyondProtestant(data, id);
                      return (
                        <a
                          key={id}
                          href={`/scriptures/${tradition}/${id}`}
                          className={`dw-spine dw-sec-${extra ? "extra" : g.section}`}
                          aria-current={book === id ? "true" : undefined}
                          aria-label={`${data.books[id].name}, ${chapters} ${chapters === 1 ? "chapter" : "chapters"}`}
                          title={data.books[id].name}
                          style={{ "--v": bookVerses(data, id, translation) } as CSSProperties}
                          onClick={(event) => {
                            event.preventDefault();
                            onChoose(book === id ? null : id);
                          }}
                        >
                          <span aria-hidden="true">{data.books[id].name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null,
      )}

      <div className="dw-tray" ref={trayRef} aria-live="polite">
        {book ? (
          <>
            <p className="dw-tray-h">
              <strong>{name}</strong> · {verses.length} {verses.length === 1 ? "chapter" : "chapters"} · each bar is as tall as its chapter is long
            </p>
            <ChapterBars
              label={`${name} chapters`}
              here={here}
              prefetch={prefetch}
              onFollow={onFollow}
              chapters={verses.map((v, i) => ({ bookId: book, name, chapter: i + 1, verses: v, href: hrefFor(book, i + 1) }))}
            />
          </>
        ) : (
          <p className="dw-hint">Choose a book to see its chapters.</p>
        )}
      </div>
    </div>
  );
}
