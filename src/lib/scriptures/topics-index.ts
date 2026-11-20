import type { NaveIndex } from "./types";

export type IndexTopic = NaveIndex["topics"][number];

/** How many topics the page opens on. */
export const LARGEST_SHOWN = 40;
/** A letter lists its topics with at least this many references first. */
export const LARGER_MIN_REFS = 20;
/** A search stops listing matches here and says so. */
export const MATCH_LIMIT = 400;

/** The topics with the most scripture references, largest first. */
export function largestTopics(topics: IndexTopic[], count = LARGEST_SHOWN): IndexTopic[] {
  return [...topics]
    .sort((a, b) => b.refCount - a.refCount || a.id.localeCompare(b.id))
    .slice(0, count);
}

/**
 * One letter: every topic under it, and the larger ones that lead its list. `larger`
 * is empty when the letter has none, or when all of them are larger; the page then
 * lists the whole letter with nothing folded.
 */
export function letterTopics(topics: IndexTopic[], letter: string): { all: IndexTopic[]; larger: IndexTopic[] } {
  const all = topics.filter((topic) => topic.section === letter);
  const larger = all.filter((topic) => topic.refCount >= LARGER_MIN_REFS);
  return { all, larger: larger.length < all.length ? larger : [] };
}

/** Topics whose name holds what was typed, any case. */
export function matchTopics(topics: IndexTopic[], query: string): IndexTopic[] {
  const needle = query.trim().toUpperCase();
  return needle ? topics.filter((topic) => topic.id.toUpperCase().includes(needle)) : [];
}
