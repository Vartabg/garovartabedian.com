"use client";

import Link from "next/link";
import { hostedBookEdition } from "@/lib/scriptures/edition-counts";
import type { Canons, Tradition } from "@/lib/scriptures/types";

const TONES = 5;
const tone = (id: string) =>
  [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES;

/** Spine width from verse count — square-root scale so Psalms doesn't eat the wall. */
const spineWidth = (verses: number) => Math.round(14 + Math.sqrt(verses) * 1.7);

/**
 * The hosted collection as a bookshelf. Each spine follows the edition its
 * reader link opens, including that edition's numbered verse positions.
 */
export default function Shelf({
  tradition,
  canons,
}: {
  tradition: Tradition;
  canons: Canons;
}) {
  const protestant = new Set(
    canons.traditions.find((t) => t.id === "protestant")?.books ?? [],
  );
  const matIdx = tradition.books.indexOf("MAT");
  const shelves =
    matIdx > 0
      ? [
          { label: "The Old Testament", books: tradition.books.slice(0, matIdx) },
          { label: "The New Testament", books: tradition.books.slice(matIdx) },
        ]
      : [{ label: "The books", books: tradition.books }];

  return (
    <div className="scr-shelves">
      {shelves.map((shelf) => (
        <section key={shelf.label}>
          <h2 className="scr-shelf-label">
            {shelf.label} <span>{shelf.books.length} books</span>
          </h2>
          <div className="scr-shelf">
            {shelf.books.map((id) => {
              const meta = canons.books[id];
              const edition = hostedBookEdition(id, tradition.transPreference);
              const n = edition?.versePositions ?? 0;
              const beyond = !protestant.has(id);
              return (
                <Link
                  key={id}
                  href={`/scriptures/${tradition.id}/${id}`}
                  className={`scr-spine t${tone(id)}${beyond ? " beyond" : ""}`}
                  style={{ width: spineWidth(n) }}
                  title={`${meta?.name ?? id} — ${edition ? `${edition.chapters} chapter${edition.chapters === 1 ? "" : "s"} · ${edition.name} · ${n} numbered verse positions` : "hosted edition unavailable"}${beyond ? " · beyond the Protestant 66" : ""}`}
                  aria-label={`${meta?.name ?? id}, ${edition ? `${edition.chapters} chapter${edition.chapters === 1 ? "" : "s"} in ${edition.name}` : "hosted edition unavailable"} — choose chapter`}
                >
                  <span>{meta?.name ?? id}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <p className="scr-meta">
        Spine widths follow numbered verse positions in each book&rsquo;s hosted
        edition. Chapter counts and numbering can differ between editions;
        an omitted verse may retain an empty numbered position.
        {shelves.some((s) => s.books.some((b) => !protestant.has(b))) &&
          " Green spines are books beyond the Protestant 66 — switch traditions and watch the shelf grow."}
      </p>
    </div>
  );
}
