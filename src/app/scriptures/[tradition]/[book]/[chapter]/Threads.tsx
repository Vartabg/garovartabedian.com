"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { loadShelf } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import type { Canons, Tradition, XrefFile } from "@/lib/scriptures/types";
import ResponsiveSvgFrame from "../../../../_components/ResponsiveSvgFrame";

const W = 720;
const PLOT_L = 12;
const PLOT_R = 708;
const BASE_Y = 168;
const STRIP_H = 9;

/**
 * The Threads: every cross-reference this chapter carries, drawn as arcs
 * across the whole Bible laid out to scale. The text connecting itself —
 * visibly.
 */
function Threads({
  canons,
  tradition,
  bookId,
  chapter,
  xref,
}: {
  canons: Canons;
  tradition: Tradition;
  bookId: string;
  chapter: number;
  xref: XrefFile | null;
}) {
  const [verses, setVerses] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    loadShelf().then(setVerses, () => setVerses({}));
  }, []);

  const model = useMemo(() => {
    if (!verses || !xref) return null;

    // Lay the tradition's books along the strip, width ∝ verse count.
    const books = tradition.books;
    const total = books.reduce((s, b) => s + (verses[b] ?? 200), 0);
    const span = PLOT_R - PLOT_L;
    const pos: Record<string, { x: number; w: number }> = {};
    let acc = 0;
    for (const b of books) {
      const w = ((verses[b] ?? 200) / total) * span;
      pos[b] = { x: PLOT_L + acc, w };
      acc += w;
    }

    const originBook = pos[bookId];
    if (!originBook) return null;
    const chapters = canons.books[bookId]?.chapters ?? 1;
    const ox = originBook.x + ((chapter - 0.5) / chapters) * originBook.w;

    // Every ref this chapter carries → a target x on the strip.
    const arcs: { tx: number; book: string }[] = [];
    const perBook = new Map<string, number>();
    for (const [key, refs] of Object.entries(xref.refs)) {
      if (!key.startsWith(`${chapter}:`)) continue;
      for (const r of refs) {
        const p = parseRef(r);
        if (!p || !pos[p.book]) continue;
        const bChapters = canons.books[p.book]?.chapters ?? 1;
        const tx = pos[p.book].x + ((p.chapter - 0.5) / bChapters) * pos[p.book].w;
        arcs.push({ tx, book: p.book });
        perBook.set(p.book, (perBook.get(p.book) ?? 0) + 1);
      }
    }
    if (arcs.length === 0) return { pos, ox, arcs, top: [], books };

    const top = [...perBook.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([b, n]) => ({ book: b, n, x: pos[b].x + pos[b].w / 2 }));

    return { pos, ox, arcs, top, books };
  }, [verses, xref, tradition, bookId, chapter, canons]);

  if (!xref) return <p className="scr-meta">No cross-reference data for this book.</p>;
  if (!model) return <p className="scr-meta">Spinning the threads…</p>;

  const { pos, ox, arcs, top, books } = model;

  return (
    <div className="scr-threads">
      <ResponsiveSvgFrame label={`Cross-references from ${canons.books[bookId]?.name} ${chapter}`}>
        <svg
          viewBox={`0 0 ${W} 214`}
          role="img"
          aria-label={`Every cross-reference from ${canons.books[bookId]?.name} ${chapter}, drawn as arcs across the whole Bible laid end to end`}
        >
        {arcs.map((a, i) => {
          const lift = Math.min(150, Math.abs(a.tx - ox) * 0.32 + 18);
          return (
            <path
              key={i}
              d={`M ${ox} ${BASE_Y} Q ${(ox + a.tx) / 2} ${BASE_Y - lift} ${a.tx} ${BASE_Y}`}
              className="scr-thread"
              fill="none"
            />
          );
        })}

        {books.map((b, i) => (
          <rect
            key={b}
            x={pos[b].x}
            y={BASE_Y + 4}
            width={Math.max(pos[b].w - 0.6, 0.8)}
            height={STRIP_H}
            className={`scr-strip${i % 2 ? " alt" : ""}${b === bookId ? " origin" : ""}`}
          >
            <title>{canons.books[b]?.name ?? b}</title>
          </rect>
        ))}

        <circle cx={ox} cy={BASE_Y} r="4" className="scr-thread-origin" />
        <text x={ox} y={BASE_Y + 28} textAnchor="middle" className="scr-thread-label origin">
          {canons.books[bookId]?.name} {chapter}
        </text>

        {top
          .filter((t) => Math.abs(t.x - ox) > 34)
          .map((t) => (
            <text
              key={t.book}
              x={t.x}
              y={BASE_Y + 28}
              textAnchor="middle"
              className="scr-thread-label"
            >
              {canons.books[t.book]?.name ?? t.book}
            </text>
          ))}
        </svg>
      </ResponsiveSvgFrame>
      <p className="scr-meta">
        {arcs.length === 0
          ? "This chapter carries no cross-references."
          : `${arcs.length} threads leave this chapter${
              top.length ? ` — most of them for ${top.map((t) => canons.books[t.book]?.name ?? t.book).slice(0, 3).join(", ")}` : ""
            }. Tap a verse number below to follow its threads.`}
      </p>
    </div>
  );
}

// The parent reader re-renders on unrelated state (verse open, red-letter,
// translation selects); memo lets those skip re-rendering the hundreds of arc
// paths when Threads' own props haven't changed.
export default memo(Threads);
