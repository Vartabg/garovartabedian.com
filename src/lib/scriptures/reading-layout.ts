/** Presentation groups, not reconstructed manuscript paragraphs. Every entry
 * is an unchanged verse index; public verse IDs and per-verse tools survive. */
export const VERSE_LINED_BOOKS = new Set(["JOB", "PSA", "PRO", "ECC", "SNG", "LAM", "WIS", "SIR", "ODE", "PSS"]);

export function chapterReadingGroups(verses: readonly string[], book: string): number[][] {
  if (VERSE_LINED_BOOKS.has(book)) return verses.map((_, index) => [index]);
  const groups: number[][] = [];
  let current: number[] = [], chars = 0;
  let remaining = verses.reduce((sum, verse) => sum + verse.length, 0);
  const flush = () => { if (current.length) groups.push(current); current = []; chars = 0; };
  verses.forEach((verse, index) => {
    remaining -= verse.length;
    // Keep supplied verse lineation and empty/missing verse slots distinct.
    if (!verse.trim() || /[\r\n]/.test(verse)) { flush(); groups.push([index]); return; }
    current.push(index); chars += verse.length;
    if (remaining >= 250 && ((chars >= 500 && /[.!?][”’"')\]]*\s*$/.test(verse)) || chars >= 1000)) flush();
  });
  flush();
  return groups;
}
