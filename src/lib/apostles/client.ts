/**
 * Pure helpers for the Apostles world. Every machine ref in the data uses
 * USFM book codes ("JHN 20:24-29"), and every book cited lives in the hosted
 * Protestant shelf, so links resolve into the reader without a canon lookup.
 */

const REF_PATTERN = /^([1-3]?[A-Z]{2,4})\s+(\d+):(\d+)(?:-(\d+))?$/;

export type ParsedRef = {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
};

export function parseRef(ref: string): ParsedRef | null {
  const m = ref.match(REF_PATTERN);
  if (!m) return null;
  return {
    book: m[1],
    chapter: Number(m[2]),
    verse: Number(m[3]),
    verseEnd: m[4] ? Number(m[4]) : undefined,
  };
}

/** Resolve a machine ref into the hosted reader, landing on the first verse. */
export function refHref(ref: string): string {
  const parsed = parseRef(ref);
  if (!parsed) return "/scriptures";
  return `/scriptures/protestant/${parsed.book}/${parsed.chapter}#v${parsed.verse}`;
}
