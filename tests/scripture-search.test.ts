import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  searchVersesFrom,
  type SearchDataSource,
} from "../src/lib/scriptures/search";
import {
  searchRelatedPassagesFrom,
  type RelatedSearchDataSource,
} from "../src/lib/scriptures/related";
import { scriptureSearchHref } from "../src/lib/scriptures/search-url";
import type {
  Canons,
  NaveIndex,
  NaveTopicFile,
  SearchPosting,
  SearchShard,
} from "../src/lib/scriptures/types";

const canons: Canons = {
  bookOrder: ["GEN", "EXO"],
  books: {
    GEN: { name: "Genesis", chapters: 50, trans: ["web", "kjv"] },
    EXO: { name: "Exodus", chapters: 40, trans: ["web", "kjv"] },
  },
  translations: {
    web: { name: "World English Bible", year: "2020", license: "Public domain" },
    kjv: { name: "King James Version", year: "1769", license: "Public domain" },
    drb: { name: "Douay-Rheims", year: "1899", license: "Public domain" },
    brenton: { name: "Brenton Septuagint", year: "1851", license: "Public domain" },
    charles: { name: "R. H. Charles translations", year: "1913", license: "Public domain" },
  },
  traditions: [
    {
      id: "protestant",
      name: "Protestant",
      blurb: "66 books.",
      books: ["GEN", "EXO"],
      transPreference: ["web"],
    },
  ],
};

function source(shards: Record<string, SearchShard>): SearchDataSource {
  return {
    canons,
    meta: {
      trans: "web",
      stopwords: ["the", "and", "of", "to", "not"],
      shardScheme: "first2",
    },
    loadShard: async (name) => shards[name] ?? {},
  };
}

function relatedSource(
  index: NaveIndex,
  shards: Record<string, NaveTopicFile>,
): RelatedSearchDataSource {
  return {
    canons,
    index,
    stopwords: ["the", "and", "of", "to", "i", "me", "someone"],
    loadShard: async (section) => shards[section] ?? { topics: [] },
  };
}

describe("scripture search", () => {
  it("builds the submitted URL from the form value instead of render-time state", () => {
    assert.equal(
      scriptureSearchHref("  John 3:16  "),
      "/scriptures/search?q=John%203%3A16",
    );
    assert.equal(scriptureSearchHref("   "), "/scriptures/search");
    assert.equal(scriptureSearchHref(null), "/scriptures/search");
  });

  it("retains the selected translation when submitting or clearing a search", () => {
    assert.equal(
      scriptureSearchHref(" Mastêmâ ", "charles"),
      "/scriptures/search?q=Mast%C3%AAm%C3%A2&trans=charles",
    );
    assert.equal(scriptureSearchHref(null, "charles"), "/scriptures/search?trans=charles");
    assert.equal(scriptureSearchHref("   ", "kjv"), "/scriptures/search?trans=kjv");
    assert.equal(scriptureSearchHref("light", "web"), "/scriptures/search?q=light");
  });

  it("ranks verses matching more query words first", async () => {
    const result = await searchVersesFrom(
      "love neighbor",
      source({
        lo: { love: [[0, 1, 1], [0, 1, 2]] },
        ne: { neighbor: [[0, 1, 2], [1, 1, 1]] },
      }),
    );

    assert.deepEqual(result.hits.slice(0, 3), [
      { book: "GEN", chapter: 1, verse: 2, matched: 2 },
      { book: "GEN", chapter: 1, verse: 1, matched: 1 },
      { book: "EXO", chapter: 1, verse: 1, matched: 1 },
    ]);
    assert.equal(result.totalHits, 3);
  });

  it("reports full totals and book distribution before the 200-hit cap", async () => {
    const genesis = Array.from(
      { length: 150 },
      (_, index) => [0, 1, index + 1] as SearchPosting,
    );
    const exodus = Array.from(
      { length: 75 },
      (_, index) => [1, 1, index + 1] as SearchPosting,
    );
    const result = await searchVersesFrom(
      "light",
      source({ li: { light: [...genesis, ...exodus] } }),
    );

    assert.equal(result.totalHits, 225);
    assert.equal(result.hits.length, 200);
    assert.deepEqual(result.books, [
      {
        book: "GEN",
        count: 150,
        firstChapter: 1,
        firstVerse: 1,
      },
      {
        book: "EXO",
        count: 75,
        firstChapter: 1,
        firstVerse: 1,
      },
    ]);
  });

  it("drops question scaffolding so natural queries search the distinctive term", async () => {
    const result = await searchVersesFrom(
      "what does the Bible say about divorce",
      source({ di: { divorce: [[1, 2, 3]] } }),
    );

    assert.deepEqual(result.searched, ["divorce"]);
    assert.deepEqual(result.dropped, [
      "what",
      "does",
      "the",
      "bible",
      "say",
      "about",
    ]);
    assert.equal(result.hits[0]?.book, "EXO");
  });

  it("distinguishes common-word-only and missing-word queries", async () => {
    const common = await searchVersesFrom("the and", source({}));
    assert.equal(common.totalHits, 0);
    assert.deepEqual(common.searched, []);
    assert.deepEqual(common.dropped, ["the", "and"]);

    const missing = await searchVersesFrom("frobnicate", source({}));
    assert.deepEqual(missing.searched, ["frobnicate"]);
    assert.deepEqual(missing.missing, ["frobnicate"]);
  });

  it("keeps curated concept matches separate from exact word matches", async () => {
    const result = await searchRelatedPassagesFrom(
      "how can I forgive someone who hurt me",
      relatedSource(
        {
          topics: [
            { id: "FORGIVENESS", section: "F", refCount: 2 },
            { id: "SUFFERING", section: "S", refCount: 1 },
            { id: "FORGETFULNESS", section: "F", refCount: 1 },
          ],
        },
        {
          F: {
            topics: [
              {
                id: "FORGIVENESS",
                section: "F",
                items: [
                  {
                    label: "Of injuries",
                    refs: ["GEN 1:1", "GEN 1:2"],
                    depth: 0,
                  },
                ],
              },
              {
                id: "FORGETFULNESS",
                section: "F",
                items: [
                  {
                    label: "General scriptures concerning",
                    refs: ["EXO 1:1"],
                    depth: 0,
                  },
                ],
              },
            ],
          },
          S: {
            topics: [
              {
                id: "SUFFERING",
                section: "S",
                items: [
                  {
                    label: "Patience in",
                    refs: ["EXO 2:3"],
                    depth: 0,
                  },
                ],
              },
            ],
          },
        },
      ),
    );

    assert.deepEqual(
      result.topics.map((topic) => topic.id),
      ["FORGIVENESS"],
    );
    assert.deepEqual(
      result.hits.map((hit) => ({
        ref: `${hit.book} ${hit.chapter}:${hit.verse}`,
        topic: hit.topicId,
      })),
      [
        { ref: "GEN 1:1", topic: "FORGIVENESS" },
        { ref: "GEN 1:2", topic: "FORGIVENESS" },
      ],
    );
  });

  it("bridges conservative everyday terms into named topical entries", async () => {
    const result = await searchRelatedPassagesFrom(
      "what does Scripture say about worry",
      relatedSource(
        {
          topics: [{ id: "CARE", section: "C", refCount: 1 }],
        },
        {
          C: {
            topics: [
              {
                id: "CARE",
                section: "C",
                items: [
                  {
                    label: "Remedy for worldly care",
                    refs: ["GEN 1:1"],
                    depth: 0,
                  },
                ],
              },
            ],
          },
        },
      ),
    );

    assert.equal(result.topics[0]?.id, "CARE");
    assert.equal(result.hits[0]?.topicId, "CARE");
  });
  it("does not confuse a topic word with an unrelated longer prefix", async () => {
    const result = await searchRelatedPassagesFrom("peace", relatedSource({ topics: [
      { id: "PEACE", section: "P", refCount: 1 },
      { id: "PEACOCK", section: "P", refCount: 10 },
    ] }, { P: { topics: [
      { id: "PEACE", section: "P", items: [{ label: "Peace", refs: ["GEN 1:1"], depth: 0 }] },
      { id: "PEACOCK", section: "P", items: [{ label: "Bird", refs: ["GEN 1:2"], depth: 0 }] },
    ] } }));
    assert.deepEqual(result.topics.map(topic => topic.id), ["PEACE"]);
  });

});
