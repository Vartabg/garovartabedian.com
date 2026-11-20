import type { ReactNode } from "react";
import { foldFindText } from "./find-catalog";
import { parseTranslationPrefix } from "./find-text";

const HIGHLIGHT_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "what",
  "when",
  "where",
  "which",
  "into",
  "unto",
  "upon",
  "have",
  "your",
  "their",
  "about",
  "does",
  "say",
  "says",
]);

export function extractHighlightTerms(rawQuery: string): string[] {
  const clean = parseTranslationPrefix(rawQuery).text.trim();
  if (!clean || /^[>/?]/.test(clean)) return [];
  const rawTokens = foldFindText(clean)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
  const meaningful = rawTokens.filter(
    (token) => !(token.length <= 4 && HIGHLIGHT_STOPWORDS.has(token)),
  );
  const chosen = meaningful.length > 0 ? meaningful : rawTokens;
  return Array.from(new Set(chosen)).slice(0, 8);
}

/**
 * Highlights matched query words inside source snippets and previews using
 * word-level Unicode scanning so ligatures (e.g. Nicæa, Judæa, Cæsar) and
 * diacritics never shift character slice offsets or alter textContent.
 */
export function highlightFindText(text: string, rawQuery: string): ReactNode {
  if (!text) return text;
  const terms = extractHighlightTerms(rawQuery);
  if (terms.length === 0) return text;

  const out: ReactNode[] = [];
  let cursor = 0;
  let anyMatch = false;
  const wordPattern = /[\p{L}\p{N}\p{M}]+/gu;

  for (const match of text.matchAll(wordPattern)) {
    const start = match.index ?? 0;
    const word = match[0];
    const end = start + word.length;
    const folded = foldFindText(word).replace(/[^a-z0-9]+/g, "");
    const hit =
      folded.length >= 2 &&
      terms.some(
        (term) =>
          folded === term || (term.length >= 3 && folded.startsWith(term)),
      );
    if (!hit) continue;
    anyMatch = true;
    if (start > cursor) {
      out.push(text.slice(cursor, start));
    }
    out.push(
      <mark key={start} className="find-hl">
        {word}
      </mark>,
    );
    cursor = end;
  }

  if (!anyMatch) return text;
  if (cursor < text.length) {
    out.push(text.slice(cursor));
  }
  return out;
}
