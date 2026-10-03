import { loadBook, loadCanons, loadSearchMeta, loadShard } from "./client";
import { NEGATION_WORDS, wordingEvidence, type WordingMatch } from "./search-wording";
import type {
  Canons,
  SearchMeta,
  SearchPosting,
  SearchShard,
  TranslationId,
  VerseHit,
  BookText,
} from "./types";

/**
 * The ask engine — pure concordance, no server, no per-query cost.
 * Tokenizes the question, pulls only the index shards those words live in,
 * verifies complete phrases against the selected edition before applying the
 * display cap, then ranks word overlap. It makes no semantic support judgment.
 */

export function tokenize(q: string): string[] {
  return q
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !/^\d+$/.test(t));
}

const shardOf = (token: string) => token.slice(0, 2);

/** KJV-era and plural fallbacks for tokens the index doesn't know. */
function variants(token: string): string[] {
  const v = [token + "s", token + "ed", token + "ing", token + "eth", token + "est"];
  if (token.endsWith("s")) v.unshift(token.slice(0, -1));
  if (token.endsWith("ing") || token.endsWith("eth")) v.push(token.slice(0, -3));
  if (token.endsWith("ed")) v.push(token.slice(0, -2), token.slice(0, -1));
  return v;
}

export type SearchResult = {
  hits: (VerseHit & { match?: WordingMatch; missingNegation?: string[] })[];
  /** Present only when a source could not be checked for phrase/negation evidence. */
  warnings?: string[];
  /** Total matching verses before the ranked display cap is applied. */
  totalHits: number;
  /** Corpus-wide counts, not counts from the displayed slice. */
  books: {
    book: string;
    count: number;
    firstChapter: number;
    firstVerse: number;
  }[];
  translation: TranslationId;
  /** Question words that were searched (post-stopword). */
  searched: string[];
  /** Stopwords dropped from the question. */
  dropped: string[];
  /** Query words for which the index had no exact or variant form. */
  missing: string[];
};

const MAX_HITS = 200;
const QUESTION_SCAFFOLD = new Set([
  "about",
  "bible",
  "can",
  "could",
  "does",
  "find",
  "how",
  "scripture",
  "scriptures",
  "say",
  "says",
  "show",
  "tell",
  "verse",
  "verses",
  "what",
  "when",
  "where",
  "why",
]);

export type SearchDataSource = {
  canons: Canons;
  meta: SearchMeta;
  loadShard: (shard: string) => Promise<SearchShard>;
  /** Public callers verify phrases in the actual selected-edition text. */
  loadBook?: (book: string) => Promise<BookText>;
};

export async function searchVersesFrom(
  query: string,
  source: SearchDataSource,
): Promise<SearchResult> {
  const { canons, meta } = source;
  const stop = new Set([...meta.stopwords, ...QUESTION_SCAFFOLD]);
  const tokens = [...new Set(tokenize(query))];
  const searched = tokens.filter((t) => !stop.has(t) || NEGATION_WORDS.has(t));
  const dropped = tokens.filter((t) => stop.has(t) && !NEGATION_WORDS.has(t));
  // Negation often has no concordance posting. Keep it for source verification,
  // but don't let an occurrence of "not" alone swamp the content-word candidates.
  const contentWords = searched.filter(t => !NEGATION_WORDS.has(t));
  const indexed = contentWords.length ? contentWords : searched.filter(t => !stop.has(t));
  if (indexed.length === 0) {
    return {
      hits: [],
      totalHits: 0,
      books: [],
      translation: meta.trans,
      searched,
      dropped,
      missing: [],
    };
  }

  const shards = await Promise.all(
    [...new Set(indexed.map(shardOf))].map(
      async (s) => [s, await source.loadShard(s)] as const,
    ),
  );
  const byShard = new Map(shards);

  // verse key → count of distinct matched tokens
  const counts = new Map<string, number>();
  const missing: string[] = [];
  const rarity = new Map<string, number>();
  const forms = new Map<string, string>();
  const bump = (postings: SearchPosting[]) => {
    const weight = 1 / Math.log2(postings.length + 2);
    for (const [b, c, v] of postings) {
      const key = `${b}:${c}:${v}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      rarity.set(key, (rarity.get(key) ?? 0) + weight);
    }
  };

  for (const token of indexed) {
    let postings = byShard.get(shardOf(token))?.[token];
    if (!postings) {
      for (const alt of variants(token)) {
        const shard =
          byShard.get(shardOf(alt)) ?? (await source.loadShard(shardOf(alt)));
        if (shard[alt]) {
          postings = shard[alt];
          forms.set(token, alt);
          break;
        }
      }
    }
    if (postings) bump(postings);
    else missing.push(token);
  }

  const ranked: SearchResult["hits"] = [...counts.entries()]
    .map(([key, matched]) => {
      const [b, chapter, verse] = key.split(":").map(Number);
      return { book: canons.bookOrder[b], chapter, verse, matched };
    })
    .sort(
      (a, b) =>
        b.matched - a.matched ||
        (rarity.get(`${canons.bookOrder.indexOf(b.book)}:${b.chapter}:${b.verse}`) ?? 0) - (rarity.get(`${canons.bookOrder.indexOf(a.book)}:${a.chapter}:${a.verse}`) ?? 0) ||
        canons.bookOrder.indexOf(a.book) - canons.bookOrder.indexOf(b.book) ||
        a.chapter - b.chapter ||
        a.verse - b.verse,
    );

  const warnings: string[] = [];
  if (source.loadBook && ranked.length) {
    // Every possible complete phrase is checked BEFORE the 200-result cap.
    // Other displayed candidates also get honest word-form/negation labels.
    const available = indexed.length - missing.length;
    const candidates = ranked.filter((hit, i) => i < MAX_HITS || (tokens.length > 1 && missing.length === 0 && hit.matched === available));
    const needed = [...new Set(candidates.map(h => h.book))];
    const loaded = await Promise.allSettled(needed.map(book => source.loadBook!(book)));
    const texts = new Map<string, BookText>();
    loaded.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value.trans === meta.trans && result.value.book === needed[i]) texts.set(needed[i], result.value);
      else warnings.push(`Could not verify wording in ${needed[i]} (${meta.trans.toUpperCase()}).`);
    });
    const evidence = new Map<SearchResult["hits"][number], { phrase: number; negatives: number; proximity: number; words: number; length: number }>();
    for (const hit of candidates) {
      const text = texts.get(hit.book)?.chapters[hit.chapter - 1]?.[hit.verse - 1];
      if (typeof text !== "string") continue;
      const match = wordingEvidence(query, text, contentWords);
      const exactWords = searched.filter(word => match.words.has(word)).length;
      const usesForm = [...forms].some(([word, form]) => !match.words.has(word) && match.words.has(form));
      hit.match = match.phrase ? "phrase" : match.phraseForm ? "phrase-form" : usesForm ? "word-forms" : exactWords === searched.length ? "all-words" : "some-words";
      hit.missingNegation = match.missingNegation;
      evidence.set(hit, { phrase: match.phrase ? 2 : match.phraseForm ? 1 : 0, negatives: match.missingNegation.length, proximity: match.proximity, words: exactWords, length: text.length });
    }
    ranked.sort((a, b) => {
      const left = evidence.get(a), right = evidence.get(b);
      return (right?.phrase ?? 0) - (left?.phrase ?? 0) ||
        b.matched - a.matched ||
        (left?.negatives ?? searched.filter(word => NEGATION_WORDS.has(word)).length) - (right?.negatives ?? searched.filter(word => NEGATION_WORDS.has(word)).length) ||
        (right?.proximity ?? 0) - (left?.proximity ?? 0) ||
        (right?.words ?? 0) - (left?.words ?? 0) ||
        (left?.phrase && right?.phrase ? left.length - right.length : 0);
    });
  }

  const bookCounts = new Map<
    string,
    { count: number; firstChapter: number; firstVerse: number }
  >();
  for (const hit of ranked) {
    const current = bookCounts.get(hit.book);
    if (current) current.count++;
    else {
      bookCounts.set(hit.book, {
        count: 1,
        firstChapter: hit.chapter,
        firstVerse: hit.verse,
      });
    }
  }
  const books = [...bookCounts.entries()]
    .map(([book, values]) => ({ book, ...values }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        canons.bookOrder.indexOf(a.book) - canons.bookOrder.indexOf(b.book),
    );

  return {
    hits: ranked.slice(0, MAX_HITS),
    totalHits: ranked.length,
    books,
    translation: meta.trans,
    searched,
    dropped,
    missing,
    ...(warnings.length ? { warnings } : {}),
  };
}

export async function searchVerses(
  query: string,
  trans: TranslationId = "web",
): Promise<SearchResult> {
  const [meta, canons] = await Promise.all([
    loadSearchMeta(trans),
    loadCanons(),
  ]);
  return searchVersesFrom(query, {
    meta,
    canons,
    loadShard: (shard) => loadShard(trans, shard),
    loadBook: (book) => loadBook(trans, book),
  });
}

export { parseRef, parseScriptureQueryRef } from "./refs";
