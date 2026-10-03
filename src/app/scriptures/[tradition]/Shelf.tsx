"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadShelf } from "@/lib/scriptures/client";
import type { Canons, Tradition } from "@/lib/scriptures/types";

const TONES = 5;
const tone = (id: string) =>
  [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES;

/** Spine width from verse count — square-root scale so Psalms doesn't eat the wall. */
const spineWidth = (verses: number) => Math.round(14 + Math.sqrt(verses) * 1.7);

/**
 * The canon as a bookshelf: every spine drawn to scale, width = the book's
 * true length in verses. Switch traditions and the shelf itself grows.
 */
export default function Shelf({
  tradition,
  canons,
}: {
  tradition: Tradition;
  canons: Canons;
}) {
  const [verses, setVerses] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    loadShelf().then(setVerses, () => setVerses({}));
  }, []);

  if (!verses) return <p className="scr-empty">Shelving the books…</p>;

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
              const n = verses[id] ?? 200;
              const beyond = !protestant.has(id);
              return (
                <Link
                  key={id}
                  href={`/scriptures/${tradition.id}/${id}`}
                  className={`scr-spine t${tone(id)}${beyond ? " beyond" : ""}`}
                  style={{ width: spineWidth(n) }}
                  title={`${meta?.name ?? id} — ${n} verses${beyond ? " · beyond the Protestant 66" : ""}`}
                  aria-label={`${meta?.name ?? id}, ${n} verses — choose chapter`}
                >
                  <span>{meta?.name ?? id}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <p className="scr-meta">
        Every spine is to scale — its width is the book&rsquo;s real length in
        verses. Psalms is the giant; 2 John is thirteen verses wide.
        {shelves.some((s) => s.books.some((b) => !protestant.has(b))) &&
          " Green spines are books beyond the Protestant 66 — switch traditions and watch the shelf grow."}
      </p>
    </div>
  );
}
