"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { loadShelf } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import type { Canons } from "@/lib/scriptures/types";

const W = 720;
const H = 56;
const STRIP_Y = 26;
const STRIP_H = 8;
const PAD = 12;
const GAP = 6; // the space between the testaments

/**
 * The canon strip: the whole Bible laid end to end, width ∝ verse count
 * (same scale the Threads use), with a gold tick at every chapter this
 * page's references touch — the page's fingerprint on the Book.
 */
function CanonStrip({
  canons,
  refs,
  noun = "references",
}: {
  canons: Canons;
  refs: string[];
  noun?: string;
}) {
  const [verses, setVerses] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    loadShelf().then(setVerses, () => setVerses({}));
  }, []);

  const model = useMemo(() => {
    if (!verses) return null;
    const prot = canons.traditions.find((t) => t.id === "protestant");
    if (!prot) return null;
    const books = prot.books;
    const ntStart = books.indexOf("MAT");

    const total = books.reduce((s, b) => s + (verses[b] ?? 200), 0);
    const span = W - PAD * 2 - GAP;
    const pos: Record<string, { x: number; w: number }> = {};
    let acc = PAD;
    books.forEach((b, i) => {
      if (i === ntStart) acc += GAP;
      const w = ((verses[b] ?? 200) / total) * span;
      pos[b] = { x: acc, w };
      acc += w;
    });

    // Refs ("GEN 3" or "GEN 3:15[-17]") → one tick per touched chapter,
    // graded darker the more often it's struck.
    const chap = new Map<string, { x: number; n: number; book: string }>();
    let parsed = 0;
    let outside = 0;
    for (const r of refs) {
      let book: string | null = null;
      let chapter = 0;
      const whole = /^([1-3]?[A-Z]{2,4})\s+(\d+)$/.exec(r);
      if (whole) {
        book = whole[1];
        chapter = Number(whole[2]);
      } else {
        const p = parseRef(r);
        if (p) {
          book = p.book;
          chapter = p.chapter;
        }
      }
      if (!book || chapter < 1) continue;
      parsed++;
      const bp = pos[book];
      if (!bp) {
        outside++;
        continue;
      }
      const chapters = canons.books[book]?.chapters ?? 1;
      const key = `${book} ${chapter}`;
      const hit = chap.get(key);
      if (hit) hit.n++;
      else
        chap.set(key, {
          x: bp.x + ((Math.min(chapter, chapters) - 0.5) / chapters) * bp.w,
          n: 1,
          book,
        });
    }

    const ticks = [...chap.values()];
    const perBook = new Map<string, number>();
    for (const t of ticks) perBook.set(t.book, (perBook.get(t.book) ?? 0) + t.n);
    const top = [...perBook.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([b]) => canons.books[b]?.name ?? b);

    return {
      books,
      pos,
      ticks,
      ntX: pos["MAT"]?.x ?? 0,
      parsed,
      outside,
      top,
      bookCount: perBook.size,
    };
  }, [verses, canons, refs]);

  if (!model || model.ticks.length === 0) return null;
  const { books, pos, ticks, ntX, parsed, outside, top, bookCount } = model;

  return (
    <div className="scr-canonstrip">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`The ${parsed} ${noun} of this page marked on the whole Bible laid to scale, Genesis to Revelation`}
      >
        {books.map((b, i) => (
          <rect
            key={b}
            x={pos[b].x}
            y={STRIP_Y}
            width={Math.max(pos[b].w - 0.6, 0.8)}
            height={STRIP_H}
            className={`scr-cs-book${i % 2 ? " alt" : ""}`}
          >
            <title>{canons.books[b]?.name ?? b}</title>
          </rect>
        ))}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x}
            x2={t.x}
            y1={STRIP_Y - 11}
            y2={STRIP_Y - 2}
            className="scr-cs-tick"
            style={{ opacity: Math.min(0.95, 0.4 + t.n * 0.14) }}
          />
        ))}
        <text x={PAD} y={STRIP_Y + STRIP_H + 14} className="scr-cs-label">
          Genesis
        </text>
        <text x={ntX} y={STRIP_Y + STRIP_H + 14} className="scr-cs-label">
          Matthew
        </text>
        <text x={W - PAD} y={STRIP_Y + STRIP_H + 14} textAnchor="end" className="scr-cs-label">
          Revelation
        </text>
      </svg>
      <p className="scr-meta">
        {parsed} {noun} across {bookCount} book{bookCount === 1 ? "" : "s"}
        {top.length > 1 ? ` — heaviest in ${top.join(", ")}` : ""}
        {outside > 0 ? ` · ${outside} beyond the 66 not drawn` : ""}.
      </p>
    </div>
  );
}

// Topic and search pages re-render on unrelated state; the strip's props
// rarely change, so memo spares the hundreds of tick nodes.
export default memo(CanonStrip);
