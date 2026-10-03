/**
 * Exact-word and Nave-topic retrieval for Find.
 *
 * Each index is fetched independently so a failed concordance shard cannot
 * blank places, references, or topic hits.
 */

import { searchRelatedPassages, type RelatedSearchResult } from "@/lib/scriptures/related";
import { searchVerses, type SearchResult } from "@/lib/scriptures/search";
import type { Canons, TranslationId } from "@/lib/scriptures/types";
import { scriptureSearchHref } from "@/lib/scriptures/search-url";

export type FindTextResult = {
  exact: SearchResult | null;
  related: RelatedSearchResult | null;
  exactFailed: boolean;
  translation: TranslationId;
  searchedText: string;
};

const TRANSLATION_PREFIX = /^(web|kjv|drb|brenton|charles):\s*(.*)$/i;

export function parseTranslationPrefix(query: string, fallback: TranslationId = "web"): {
  translation: TranslationId;
  text: string;
} {
  const match = query.match(TRANSLATION_PREFIX);
  if (!match) return { translation: fallback, text: query };
  return {
    translation: match[1].toLowerCase() as TranslationId,
    text: match[2],
  };
}

export async function loadFindText(
  query: string,
  canons: Canons,
  preferredTranslation: TranslationId = "web",
): Promise<FindTextResult> {
  const { translation, text } = parseTranslationPrefix(query, preferredTranslation);
  const cleanQuery = text.trim();
  if (!cleanQuery) {
    return {
      exact: null,
      related: null,
      exactFailed: false,
      translation,
      searchedText: cleanQuery,
    };
  }

  const [exactSettled, relatedSettled] = await Promise.allSettled([
    searchVerses(cleanQuery, translation),
    searchRelatedPassages(cleanQuery, canons),
  ]);

  return {
    exact: exactSettled.status === "fulfilled" ? exactSettled.value : null,
    related: relatedSettled.status === "fulfilled" ? relatedSettled.value : null,
    exactFailed: exactSettled.status === "rejected",
    translation,
    searchedText: cleanQuery,
  };
}

/** Text submission is independent of asynchronous suggestions. */
export function findSearchHref(query: string, localEvidence = false, preferredTranslation: TranslationId = "web", scope?: string): string {
  const { translation, text } = parseTranslationPrefix(query, preferredTranslation);
  if (localEvidence) return `/scriptures/find?q=${encodeURIComponent(text.trim())}&trans=${translation}`;
  const href = scriptureSearchHref(text, translation, scope);
  return translation === "web" ? `${href}${href.includes("?") ? "&" : "?"}trans=web` : href;
}
