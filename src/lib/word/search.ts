import type { WordLedgerEntry } from "./types";

/** Normalize search input without making accents or punctuation a barrier. */
export function normalizeWordQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function searchableText(entry: WordLedgerEntry): string {
  return normalizeWordQuery(
    [
      entry.abbr,
      entry.name,
      entry.owner,
      entry.category,
      entry.status,
      entry.summary,
      entry.permission,
    ].join(" "),
  );
}

/**
 * Search the ownership ledger by translation, abbreviation, owner, status,
 * or the plain-language policy. Empty searches preserve editorial order.
 */
export function searchWordEntries(
  entries: WordLedgerEntry[],
  query: string,
): WordLedgerEntry[] {
  const normalized = normalizeWordQuery(query);
  if (!normalized) return entries;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  return entries
    .map((entry, index) => {
      const text = searchableText(entry);
      const score = tokens.reduce((total, token) => {
        if (!text.includes(token)) return -Infinity;
        const exactAbbr = normalizeWordQuery(entry.abbr) === token;
        const exactName = normalizeWordQuery(entry.name) === token;
        const startsName = normalizeWordQuery(entry.name).startsWith(token);
        return total + (exactAbbr ? 12 : exactName ? 10 : startsName ? 6 : 2);
      }, 0);

      return { entry, index, score };
    })
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ entry }) => entry);
}

export function getWordEntry(
  entries: WordLedgerEntry[],
  id: string,
): WordLedgerEntry | undefined {
  return entries.find((entry) => entry.id === id);
}
