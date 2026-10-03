import {
  loadNaveIndex,
  loadNaveShard,
  loadSearchMeta,
} from "./client";
import { parseRef } from "./refs";
import { tokenize } from "./search";
import { searchExpansion } from "./search-expansion";
import type {
  Canons,
  NaveIndex,
  NaveTopicFile,
  ParsedRef,
} from "./types";

const MAX_TOPICS = 4;
const MAX_PASSAGES_PER_TOPIC = 8;
const MAX_RELATED_PASSAGES = 12;

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
  "who",
  "why",
]);

/**
 * Conservative everyday-language bridges into Nave's 1897 topic labels.
 * These expand retrieval only; the result still shows the named topic and
 * opens the hosted text instead of generating an answer.
 */

export type RelatedTopicMatch = {
  id: string;
  section: string;
  refCount: number;
  score: number;
};

export type RelatedPassageHit = ParsedRef & {
  topicId: string;
  context: string;
  score: number;
};

export type RelatedSearchResult = {
  hits: RelatedPassageHit[];
  topics: RelatedTopicMatch[];
};

export type RelatedSearchDataSource = {
  canons: Canons;
  index: NaveIndex;
  stopwords: string[];
  loadShard: (section: string) => Promise<NaveTopicFile>;
};

function stem(token: string): string {
  let word = token.toLowerCase();
  const suffixes = [
    "lessness",
    "fulness",
    "ments",
    "ment",
    "ness",
    "ions",
    "tion",
    "ingly",
    "edly",
    "ing",
    "ers",
    "er",
    "ed",
    "es",
    "s",
  ];

  if (word.length > 5 && word.endsWith("ies")) {
    word = `${word.slice(0, -3)}y`;
  }
  for (let pass = 0; pass < 2; pass += 1) {
    for (const suffix of suffixes) {
      if (word.length > suffix.length + 3 && word.endsWith(suffix)) {
        word = word.slice(0, -suffix.length);
        break;
      }
    }
  }
  if (word.length > 3 && word.endsWith("e")) word = word.slice(0, -1);
  return word;
}

function rootsFor(tokens: string[]): string[] {
  const roots = new Set<string>();
  for (const token of tokens) {
    roots.add(stem(token));
  }
  return [...roots].filter((root) => root.length > 2);
}

function rootsMatch(left: string, right: string): boolean {
  // Word stems may match; prefixes alone turn peace into peacock and light into lightning.
  return left === right;
}

function overlapScore(queryRoots: string[], value: string): number {
  const valueRoots = rootsFor(tokenize(value));
  return queryRoots.reduce(
    (score, queryRoot) =>
      score +
      (valueRoots.some((valueRoot) => rootsMatch(queryRoot, valueRoot))
        ? 1
        : 0),
    0,
  );
}

function rankTopics(
  directRoots: string[],
  queryTokens: string[],
  aliasTopicIds: Set<string>,
  index: NaveIndex,
): RelatedTopicMatch[] {
  return index.topics
    .filter((topic) => topic.refCount > 0)
    .map((topic) => {
      const directOverlap = overlapScore(directRoots, topic.id);
      const titleTokens = tokenize(topic.id);
      const literalOverlap = queryTokens.filter(token => titleTokens.includes(token)).length;
      return {
        ...topic,
        score: literalOverlap * 40 + directOverlap * 20 + (aliasTopicIds.has(topic.id) ? 8 - [...aliasTopicIds].indexOf(topic.id) / 10 : 0),
      };
    })
    .filter((topic) => topic.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.refCount - left.refCount ||
        left.id.localeCompare(right.id),
    )
    .slice(0, MAX_TOPICS);
}

function meaningfulQueryTokens(
  query: string,
  stopwords: string[],
): string[] {
  const stop = new Set([...stopwords, ...QUESTION_SCAFFOLD]);
  return [...new Set(tokenize(query))].filter((token) => !stop.has(token));
}

export async function searchRelatedPassagesFrom(
  query: string,
  source: RelatedSearchDataSource,
): Promise<RelatedSearchResult> {
  const queryTokens = meaningfulQueryTokens(query, source.stopwords);
  const directRoots = rootsFor(queryTokens);
  const aliasTopicIds = new Set(searchExpansion(query).topics);
  if (directRoots.length === 0 && aliasTopicIds.size === 0) {
    return { hits: [], topics: [] };
  }

  const candidates = rankTopics(directRoots, queryTokens, aliasTopicIds, source.index);
  if (candidates.length === 0) return { hits: [], topics: [] };

  const shards = await Promise.all(
    [...new Set(candidates.map((topic) => topic.section))].map(
      async (section) => [section, await source.loadShard(section)] as const,
    ),
  );
  const topicsById = new Map(
    shards.flatMap(([, shard]) =>
      shard.topics.map((topic) => [topic.id, topic] as const),
    ),
  );

  const passagesByTopic = candidates.map((candidate) => {
    const topic = topicsById.get(candidate.id);
    if (!topic) return { candidate, hits: [] as RelatedPassageHit[] };

    const items = topic.items
      .map((item, position) => ({
        item,
        position,
        score: overlapScore(directRoots, item.label),
      }))
      .filter(({ item }) => item.refs.length > 0)
      .sort(
        (left, right) =>
          left.item.depth - right.item.depth ||
          right.score - left.score ||
          left.position - right.position,
      );

    const seen = new Set<string>();
    const hits: RelatedPassageHit[] = [];
    for (const { item, score } of items) {
      for (const rawRef of item.refs) {
        const ref = parseRef(rawRef);
        if (
          !ref ||
          !source.canons.books[ref.book]?.trans.includes("kjv")
        ) {
          continue;
        }
        const key = `${ref.book}:${ref.chapter}:${ref.verse}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({
          ...ref,
          topicId: candidate.id,
          context: item.label,
          score: candidate.score + score,
        });
        if (hits.length >= MAX_PASSAGES_PER_TOPIC) break;
      }
      if (hits.length >= MAX_PASSAGES_PER_TOPIC) break;
    }
    return { candidate, hits };
  });

  const hits: RelatedPassageHit[] = [];
  const seen = new Set<string>();
  for (let position = 0; hits.length < MAX_RELATED_PASSAGES; position += 1) {
    let foundAtPosition = false;
    for (const group of passagesByTopic) {
      const hit = group.hits[position];
      if (!hit) continue;
      foundAtPosition = true;
      const key = `${hit.book}:${hit.chapter}:${hit.verse}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(hit);
      if (hits.length >= MAX_RELATED_PASSAGES) break;
    }
    if (!foundAtPosition) break;
  }

  const matchedTopicIds = new Set(hits.map((hit) => hit.topicId));
  return {
    hits,
    topics: candidates.filter((topic) => matchedTopicIds.has(topic.id)),
  };
}

export async function searchRelatedPassages(
  query: string,
  canons: Canons,
): Promise<RelatedSearchResult> {
  const [index, meta] = await Promise.all([
    loadNaveIndex(),
    loadSearchMeta(),
  ]);
  return searchRelatedPassagesFrom(query, {
    canons,
    index,
    stopwords: meta.stopwords,
    loadShard: loadNaveShard,
  });
}
