"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SECTIONS, chapterVerses, isBeyondProtestant, sectioned } from "@/lib/scriptures/doorways";
import type { PickerProps } from "./Doorways";

/** A printed Bible's contents page, with edge tabs that jump to each section. */
export default function ContentsView({ data, tradition, translation, book, here, onChoose, hrefFor, prefetch, onFollow }: PickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const groups = sectioned(data, tradition);

  // A book chosen elsewhere (the Go-to box, another view) is brought into sight.
  useEffect(() => {
    const list = listRef.current;
    const row = book ? list?.querySelector<HTMLElement>(`[data-book="${book}"]`) : null;
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop || row.offsetTop > list.scrollTop + list.clientHeight - 80) {
      list.scrollTop = row.offsetTop - 60;
    }
  }, [book]);

  const jump = (index: number) => {
    const list = listRef.current;
    const heading = list?.querySelector<HTMLElement>(`#dw-ct-${index}`);
    if (!list || !heading) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ top: heading.offsetTop - 4, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="dw-contents">
      <div className="dw-ct-list" ref={listRef}>
        {groups.map((g, index) => (
          <section key={g.section} aria-labelledby={`dw-ct-${index}`}>
            <h3 className="dw-ct-h" id={`dw-ct-${index}`}>{SECTIONS[g.section].name}</h3>
            {g.books.map((id) => {
              const verses = chapterVerses(data, id, translation);
              const name = data.books[id].name;
              const open = book === id;
              return (
                <div key={id}>
                  <button
                    type="button"
                    className={`dw-ct-row${isBeyondProtestant(data, id) ? " is-extra" : ""}`}
                    data-book={id}
                    aria-expanded={open}
                    onClick={() => onChoose(open ? null : id)}
                  >
                    <span className="dw-ct-name">{name}</span>
                    <span className="dw-ct-lead" aria-hidden="true" />
                    <span className="dw-ct-n">
                      {verses.length}
                      <span className="sr-fallback"> {verses.length === 1 ? "chapter" : "chapters"}</span>
                    </span>
                  </button>
                  {open ? (
                    <div className="dw-ct-chs" role="group" aria-label={`${name} chapters`}>
                      {verses.map((_, i) => {
                        const href = hrefFor(id, i + 1);
                        const isHere = here?.bookId === id && here.chapter === i + 1;
                        return (
                          <Link
                            key={i}
                            href={href}
                            prefetch={false}
                            className={`dw-num${isHere ? " is-here" : ""}`}
                            aria-current={isHere ? "page" : undefined}
                            aria-label={`${name} ${i + 1}`}
                            onMouseEnter={() => prefetch(href)}
                            onFocus={() => prefetch(href)}
                            onTouchStart={() => prefetch(href)}
                            onClick={onFollow}
                          >
                            {i + 1}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        ))}
      </div>
      <nav className="dw-thumbs" aria-label="Jump to a section">
        {groups.map((g, index) => (
          <button
            key={g.section}
            type="button"
            className={`dw-thumb dw-sec-${g.section}`}
            aria-label={`Jump to ${SECTIONS[g.section].name}`}
            onClick={() => jump(index)}
          >
            <span aria-hidden="true">{SECTIONS[g.section].tab}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
