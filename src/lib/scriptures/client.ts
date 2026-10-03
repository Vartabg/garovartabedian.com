import { loadStaticJson, StaticJsonError } from "@/lib/staticJsonClient";
import { isTemplateGuide } from "./guide-template";
import type {
  BookText,
  Canons,
  ChapterGuide,
  NaveIndex,
  NaveTopicFile,
  OriginalChapter,
  SearchMeta,
  SearchShard,
  TranslationId,
  XrefFile,
} from "./types";

/**
 * Lazy loaders for the static JSON under /scriptures/. Everything is fetched
 * on demand and cached for the session, so the rest of the site never pays
 * for the corpus.
 */

const fetchJson = <T>(path: string) => loadStaticJson<T>("/scriptures", path);

export const loadCanons = () => fetchJson<Canons>("canons.json");

export const loadBook = (trans: TranslationId, book: string) =>
  fetchJson<BookText>(`text/${trans}/${book}.json`);

/** Books without TSK coverage simply have no file. */
export const loadXref = (book: string) =>
  fetchJson<XrefFile>(`xref/${book}.json`).catch(() => null);

export const loadSearchMeta = (trans: TranslationId = "web") =>
  fetchJson<SearchMeta>(`search/${trans}/meta.json`);

/** Verse counts per book — built by scripts/scriptures/build-shelf.mjs. */
export const loadShelf = () => fetchJson<Record<string, number>>("shelf.json");

/** Absent shard = no words start that way. */
export const loadShard = (trans: TranslationId, shard: string) =>
  fetchJson<SearchShard>(`search/${trans}/${shard}.json`).catch(
    (error: unknown) => { if (error instanceof StaticJsonError && error.status === 404) return {} as SearchShard; throw error; },
  );

/** Nave's Topical Bible — built by scripts/scriptures/build-nave.py. */
export const loadNaveIndex = () => fetchJson<NaveIndex>("nave/index.json");
export const loadNaveShard = (section: string) => fetchJson<NaveTopicFile>(`nave/${section}.json`);

/** Chapter cheat sheet — AI-generated at build, static JSON per book/chapter. */
/**
 * The original-language chapter, or null where the critical edition has no
 * text for it. Absence is meaningful — SBLGNT prints no Greek for John
 * 7:53-8:11 — so callers are expected to say so rather than fail quietly.
 */
export const loadOriginalChapter = (book: string, chapter: number) =>
  fetchJson<OriginalChapter>(`original/${book}/${chapter}.json`).catch(() => null);

export const loadChapterGuide = (book: string, chapter: number) =>
  fetchJson<ChapterGuide>(`guides/${book}/${chapter}.json`)
    .then((guide) => (isTemplateGuide(guide) ? null : guide))
    .catch(() => null);

/** First translation in the tradition's preference that contains the book. */
export function pickTranslation(
  canons: Canons,
  preference: TranslationId[],
  book: string,
): TranslationId | null {
  const available = canons.books[book]?.trans ?? [];
  for (const t of preference) if (available.includes(t)) return t;
  return available[0] ?? null;
}

/** First tradition whose canon includes the book — for linking search hits. */
export function traditionFor(canons: Canons, book: string): string {
  for (const t of canons.traditions) if (t.books.includes(book)) return t.id;
  return canons.traditions[0]?.id ?? "protestant";
}
