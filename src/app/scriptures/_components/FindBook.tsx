"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Canons } from "@/lib/scriptures/types";
import { DEFAULT_TRADITION } from "@/lib/scriptures/prefs";

type FindBookProps = {
  canons: Canons;
  /** Default tradition for links when not specified. */
  traditionId?: string;
};

/**
 * Typeahead-ish book finder — full names, large targets, OT/NT grouping when empty query.
 */
export default function FindBook({
  canons,
  traditionId = DEFAULT_TRADITION,
}: FindBookProps) {
  const [q, setQ] = useState("");
  const query = q.trim();
  const tradition =
    canons.traditions.find((t) => t.id === traditionId) ?? canons.traditions[0];

  const books = useMemo(() => {
    const list = (tradition?.books ?? []).map((id) => ({
      id,
      name: canons.books[id]?.name ?? id,
      chapters: canons.books[id]?.chapters ?? 1,
    }));
    const needle = query.toLowerCase();
    if (!needle) return list;
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(needle) ||
        b.id.toLowerCase().includes(needle),
    );
  }, [canons, tradition, query]);

  const matIdx = tradition?.books.indexOf("MAT") ?? -1;

  const sections =
    !query && matIdx > 0
      ? [
          {
            label: "Old Testament",
            items: books.filter(
              (b) => (tradition?.books.indexOf(b.id) ?? 0) < matIdx,
            ),
          },
          {
            label: "New Testament",
            items: books.filter(
              (b) => (tradition?.books.indexOf(b.id) ?? 0) >= matIdx,
            ),
          },
        ]
      : [{ label: query ? "Matches" : "Books", items: books }];

  const bookSections = (
    <div className="scr-find-results" id="scripture-book-results">
      {query && books.length > 0 ? (
        <p className="scr-find-results-status" aria-live="polite">
          {books.length} {books.length === 1 ? "match" : "matches"}
        </p>
      ) : null}
      {sections.map((sec) =>
        sec.items.length === 0 ? null : (
          <div key={sec.label} className="scr-find-section">
            <h3>{sec.label}</h3>
            <ul className="scr-book-list">
              {sec.items.map((b) => (
                <li key={b.id}>
                  <Link href={`/scriptures/${tradition.id}/${b.id}`}>
                    <span className="scr-book-list-name">{b.name}</span>
                    <span className="scr-book-list-meta">
                      {b.chapters} chapter{b.chapters === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
      {books.length === 0 ? (
        <p className="scr-empty" aria-live="polite">
          No books match “{q}”.
        </p>
      ) : null}
    </div>
  );

  return (
    <section id="books" className="scr-find" aria-labelledby="find-book-title">
      <header className="scr-home-section-head">
        <p className="kicker">Books</p>
        <h2 id="find-book-title">Choose a book.</h2>
        <p>Type a name for a fast match, or open the complete Bible shelf.</p>
      </header>
      <label className="scr-find-field">
        <span className="sr-fallback">Search books</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a book name — John, Psalms, Genesis…"
          autoComplete="off"
          enterKeyHint="search"
          aria-controls="scripture-book-results"
        />
      </label>

      {query ? (
        bookSections
      ) : (
        <details className="scr-book-browser">
          <summary>
            <span>
              <strong>Browse all {books.length} books</strong>
              <small>Old and New Testaments</small>
            </span>
            <span className="scr-book-browser-action">Full shelf</span>
          </summary>
          {bookSections}
        </details>
      )}
    </section>
  );
}
