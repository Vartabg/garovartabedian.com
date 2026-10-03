import type { LibraryKind, LibrarySearchRow } from "./library";
import { NEGATION_WORDS, prepareWordingQuery, prepareWordingText, wordingEvidencePrepared, wordingTokens, type WordingMatch } from "../scriptures/search-wording";

// These affect word overlap only. Complete phrases always retain every word,
// number, repetition and negation, and are verified within one source block.
const scaffold = new Set("the and of to that in he shall unto for i his a they be is him them it with all thou which was my me you your yours we us who whom this these those but as at by on or so do did done are were am has have had will would there their then out up upon also an if from about bible can could does find how scripture scriptures say says show tell verse verses what when where why".split(" "));
export type LibrarySearchHit = Omit<LibrarySearchRow, "text"> & {
  snippet: string; matched: number; match: WordingMatch; missingNegation: string[];
};
export type LibrarySearchResult = {
  total: number; hits: LibrarySearchHit[]; page: number; pageSize: number;
  searched: string[]; dropped: string[];
};
const kindRank = (kind: LibraryKind) => kind === "catalog-note" || kind === "reference-only" ? 2 : kind === "commentary" ? 1 : 0;

/** An in-memory index of hosted source blocks. Never merges prose and notes,
 * crosses paragraph boundaries to invent phrases, or changes edition identity. */
export function buildLibrarySearchIndex(rows: LibrarySearchRow[]) {
  const postings = new Map<string, number[]>();
  const preparedRows = rows.map(row => ({ sourceText: row.text, wording: prepareWordingText(row.text) }));
  rows.forEach((row, index) => {
    for (const token of new Set(preparedRows[index].wording.tokens)) {
      const list = postings.get(token);
      if (list) list.push(index); else postings.set(token, [index]);
    }
  });
  return (query: string, kinds: string[] = [], records: string[] = [], page = 1, pageSize = 30): LibrarySearchResult => {
    const q = query.trim().slice(0, 160);
    const preparedQuery = prepareWordingQuery(q);
    const tokens = [...new Set(preparedQuery.tokens)];
    const searched = tokens.filter(word => !scaffold.has(word) || NEGATION_WORDS.has(word));
    const dropped = tokens.filter(word => !searched.includes(word));
    const content = searched.filter(word => !NEGATION_WORDS.has(word));
    const seeds = content.length ? content : tokens;
    const size = Math.max(1, Math.min(30, Number.isSafeInteger(pageSize) ? pageSize : 30));
    const empty = { total: 0, hits: [], page: 1, pageSize: size, searched, dropped };
    if (q.length < 2 || !seeds.length) return empty;
    const counts = new Map<number, number>();
    for (const token of seeds) for (const index of postings.get(token) ?? []) counts.set(index, (counts.get(index) ?? 0) + 1);
    const matches = [...counts].flatMap(([index, matched]) => {
      const row = rows[index];
      if ((kinds.length && !kinds.includes(row.kind)) || (records.length && !records.includes(row.recordId))) return [];
      let prepared = preparedRows[index];
      if (prepared.sourceText !== row.text) {
        prepared = preparedRows[index] = { sourceText: row.text, wording: prepareWordingText(row.text) };
      }
      const evidence = wordingEvidencePrepared(preparedQuery, prepared.wording, content);
      const exact = searched.filter(word => evidence.words.has(word)).length;
      return [{ row, matched, evidence, exact }];
    }).sort((a, b) =>
      Number(b.evidence.phrase) - Number(a.evidence.phrase) ||
      Number(b.evidence.phraseForm) - Number(a.evidence.phraseForm) ||
      b.matched - a.matched ||
      a.evidence.missingNegation.length - b.evidence.missingNegation.length ||
      b.exact - a.exact ||
      b.evidence.proximity - a.evidence.proximity ||
      kindRank(a.row.kind) - kindRank(b.row.kind) ||
      a.row.text.length - b.row.text.length || a.row.id.localeCompare(b.row.id));
    const currentPage = Math.max(1, Math.min(Number.isSafeInteger(page) ? page : 1, Math.ceil(matches.length / size) || 1));
    const hits = matches.slice((currentPage - 1) * size, currentPage * size).map(({ row: { text, ...row }, evidence, exact }): LibrarySearchHit => {
      // Locate a word in the original string: normalization may change Unicode
      // length, so normalized offsets must never be used to slice source text.
      const spans = [...text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu)];
      const terms = spans.map(span => wordingTokens(span[0])[0]);
      const phrase = preparedQuery.tokens;
      const phraseAt = evidence.phrase ? terms.findIndex((_, index) => phrase.every((word, offset) => terms[index + offset] === word)) : -1;
      const at = phraseAt >= 0 ? phraseAt : terms.findIndex(word => seeds.includes(word));
      const start = Math.max(0, (spans[at]?.index ?? 0) - 90);
      return { ...row, snippet: `${start ? "…" : ""}${text.slice(start, start + 350)}${text.length > start + 350 ? "…" : ""}`, matched: exact,
        match: evidence.phrase ? "phrase" : evidence.phraseForm ? "phrase-form" : exact === searched.length ? "all-words" : "some-words", missingNegation: evidence.missingNegation };
    });
    return { total: matches.length, hits, page: currentPage, pageSize: size, searched, dropped };
  };
}
