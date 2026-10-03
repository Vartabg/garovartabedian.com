import { loadBook, loadCanons } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import { loadStaticJson } from "@/lib/staticJsonClient";
import type { WordsBook, WordsData } from "./types";

/** Lazy loaders for /jesus/ words — only the red-letter data is fetched client-side. */

const fetchJson = <T>(path: string) => loadStaticJson<T>("/jesus", path);

export const loadWords = () => fetchJson<WordsData>("words.json");
export const loadWordsBook = (book: string) =>
  fetchJson<WordsBook>(`words/${encodeURIComponent(book)}.json`);

export type Passage = {
  ref: string;
  label: string;
  text: string;
  href: string;
};

/** Resolve a "MIC 5:2" / "MAT 2:5-6" ref to WEB text + a reader link. */
export async function getPassage(ref: string): Promise<Passage | null> {
  const parsed = parseRef(ref);
  if (!parsed) return null;
  const canons = await loadCanons();
  const meta = canons.books[parsed.book];
  if (!meta) return null;
  const trans = meta.trans.includes("web") ? ("web" as const) : meta.trans[0];
  if (!trans) return null;
  const book = await loadBook(trans, parsed.book);
  const verses = book.chapters[parsed.chapter - 1] ?? [];
  const end = parsed.endVerse ?? parsed.verse;
  const text = verses
    .slice(parsed.verse - 1, end)
    .filter(Boolean)
    .join(" ");
  const tradition =
    canons.traditions.find((t) => t.books.includes(parsed.book))?.id ?? "protestant";
  return {
    ref,
    label: `${meta.name} ${parsed.chapter}:${parsed.verse}${parsed.endVerse ? `–${parsed.endVerse}` : ""}`,
    text,
    href: `/scriptures/${tradition}/${parsed.book}/${parsed.chapter}#v${parsed.verse}`,
  };
}
