"use client";

import type { EarlyText } from "@/lib/early/types";

const W = 720;
const BAR_Y = 34;
const BAR_H = 18;
const STRIPE_Y = 64;
const PAD = 8;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** A book-boundary heading like "The Book of the Watchers (chapters 1–36)". */
const BOOK_RE = /^(.*?)\s*\(chapters\s+(\d+)[–-](\d+)\)/;

const shortName = (full: string) =>
  full
    .replace(/^The Book of the\s+/, "")
    .replace(/^The Book of\s+/, "")
    .replace(/^The\s+/, "")
    .replace(/^Epistle of Enoch$/, "Epistle")
    .replace(/^Heavenly Luminaries$/, "Luminaries");

type SpineBook = {
  name: string;
  from: number;
  to: number;
  anchor: string;
};

function placeBooks(books: SpineBook[], total: number) {
  const span = W - PAD * 2;
  let x = PAD;
  const rowEnd = [0, 0];
  const placed = [];

  for (const book of books) {
    const width = ((book.to - book.from + 1) / total) * span;
    const center = x + width / 2;
    const halfLabel = book.name.length * 3.6;
    const row = center - halfLabel < rowEnd[0] + 6 ? 1 : 0;
    rowEnd[row] = center + halfLabel;
    placed.push({
      ...book,
      x,
      w: width,
      cx: center,
      row,
      witnessed: !/parable/i.test(book.name),
    });
    x += width;
  }

  return placed;
}

/**
 * A long text's named books on one spine — each segment sized to its span
 * of chapters, a jump into the text. For 1 Enoch, `qumran` adds the witness
 * stripe: the Dead Sea Scrolls carry Aramaic fragments of every book but the
 * Parables, the one with the Son of Man — part of why scholars date it apart.
 */
export default function BookSpine({
  sections,
  qumran = false,
}: {
  sections: EarlyText["sections"];
  qumran?: boolean;
}) {
  const books = sections
    .map((s) => {
      const m = s.heading ? BOOK_RE.exec(s.heading) : null;
      if (!m) return null;
      return {
        name: shortName(m[1]),
        from: Number(m[2]),
        to: Number(m[3]),
        anchor: slug(s.heading!),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  if (books.length < 2) return null;

  const total = books.reduce((s, b) => s + (b.to - b.from + 1), 0);
  const placed = placeBooks(books, total);

  const H = qumran ? 104 : 68;

  return (
    <nav className="ew-spine" aria-label="Jump to a book">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          qumran
            ? "The five books of 1 Enoch sized by their chapters, with a stripe showing that Aramaic Dead Sea Scrolls fragments survive for every book except the Parables"
            : "The books of this text, each segment sized to its span of chapters"
        }
      >
        {placed.map((b) => (
          <a key={b.anchor} href={`#${b.anchor}`} aria-label={`${b.name}, chapters ${b.from}–${b.to}`}>
            <g className="ew-spine-book">
              <rect x={b.x} y={BAR_Y} width={Math.max(b.w - 1, 1)} height={BAR_H} className="ew-spine-seg" />
              {b.row === 1 && (
                <line x1={b.cx} y1={BAR_Y - 6} x2={b.cx} y2={BAR_Y - 15} className="ew-spine-stem" />
              )}
              <text x={b.cx} y={BAR_Y - 6 - b.row * 13} textAnchor="middle" className="ew-spine-name">
                {b.name}
              </text>
              <text x={b.cx} y={BAR_Y + BAR_H + 13} textAnchor="middle" className="ew-spine-range">
                {b.from}–{b.to}
              </text>
              {qumran && (
                <line
                  x1={b.x + 1}
                  y1={STRIPE_Y}
                  x2={b.x + b.w - 2}
                  y2={STRIPE_Y}
                  className={`ew-spine-witness${b.witnessed ? "" : " none"}`}
                />
              )}
            </g>
          </a>
        ))}
        {qumran && (
          <text x={PAD} y={H - 6} className="ew-spine-key">
            Dead Sea Scrolls: solid = Aramaic fragment survives · faint = none found
          </text>
        )}
      </svg>
    </nav>
  );
}
