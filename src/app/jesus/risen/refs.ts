import { parseRef } from "@/lib/scriptures/refs";
import { canons, traditionFor } from "@/lib/scriptures/server/canons";

export type RefLink = { label: string; href: string };

/** "MRK 15:25" → a reader label and a link into the hosted chapter. */
export function refLink(ref: string): RefLink | null {
  const parsed = parseRef(ref);
  const meta = parsed && canons.books[parsed.book];
  if (!parsed || !meta) return null;

  const range = parsed.endVerse ? `–${parsed.endVerse}` : "";
  return {
    label: `${meta.name} ${parsed.chapter}:${parsed.verse}${range}`,
    href: `/scriptures/${traditionFor(parsed.book)}/${parsed.book}/${parsed.chapter}#v${parsed.verse}`,
  };
}

/** Short column heading for the appearance grid — "Matthew", "1 Corinthians". */
export function bookName(book: string): string {
  return canons.books[book]?.name ?? book;
}
