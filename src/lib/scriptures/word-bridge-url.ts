/** Deliberate study links open a tool; ordinary verse fragments only scroll. */
export const WORD_BRIDGE_STUDY = "word-bridge";

export function wordBridgeHref(tradition: string, book: string, chapter: number, verse = 1) {
  if (!/^[a-z][a-z-]{1,40}$/.test(tradition) || !/^[A-Z0-9]{3}$/.test(book) ||
    !Number.isSafeInteger(chapter) || chapter < 1 || !Number.isSafeInteger(verse) || verse < 1) {
    throw new Error("Invalid Word Bridge passage");
  }
  return `/scriptures/${tradition}/${book}/${chapter}?t=web&study=${WORD_BRIDGE_STUDY}#v${verse}`;
}

export function wordBridgeTarget(search: string, hash: string, verseCount: number): number | null {
  if (new URLSearchParams(search).get("study") !== WORD_BRIDGE_STUDY) return null;
  const match = /^#v([1-9]\d*)$/.exec(hash || "#v1");
  const verse = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(verse) && verse <= verseCount ? verse : null;
}

/** Edition changes retain an explicitly requested tool, not arbitrary URL data. */
export function preserveWordBridge(href: string, current: URLSearchParams) {
  if (current.get("study") !== WORD_BRIDGE_STUDY) return href;
  const url = new URL(href, "https://local.invalid");
  url.searchParams.set("study", WORD_BRIDGE_STUDY);
  return url.pathname + url.search + url.hash;
}
