import test from "node:test";
import assert from "node:assert/strict";
import {
  HORIZONS,
  HORIZON_ORDER,
  TORAH_BOOKS,
  PROPHETS_BOOKS,
  WRITINGS_BOOKS,
  GOSPEL_BOOKS,
  EPISTLE_BOOKS,
  RESONANCE_SPARKS,
  computeOmniResonance,
  scriptureGroup,
  scriptureHitHref,
  type HorizonId,
} from "@/lib/semantic-resonance";
import { parseResonanceQuery, assembleFindGroups } from "@/lib/site/find-query";
import { FIND_CATALOG } from "@/lib/site/find-catalog";
import type { SemanticManifest } from "@/lib/scriptures/semantic";
import type { CorpusIndex, WordsEntry, EarlyEntry, AfterlifeEntry } from "@/lib/semantic-corpus";

test("Omni-Corpus Conceptual Resonance Matrix", async (t) => {
  await t.test("keeps nine distinct corpus groups with explicit content types", () => {
    assert.equal(HORIZON_ORDER.length, 9);
    const expectedOrder: HorizonId[] = [
      "torah",
      "prophets",
      "writings",
      "additional",
      "gospels",
      "words",
      "epistles",
      "early",
      "antiquity",
    ];
    assert.deepEqual(HORIZON_ORDER, expectedOrder);

    for (let i = 0; i < HORIZON_ORDER.length; i++) {
      const id = HORIZON_ORDER[i];
      const meta = HORIZONS[id];
      assert.ok(meta, `Metadata exists for ${id}`);
      assert.equal(meta.id, id);
      assert.ok(meta.name.length > 0);
      assert.ok(meta.kicker.length > 0);
      assert.ok(meta.description.length > 0);
      assert.equal(meta.order, i + 1);
    }

  });

  await t.test("partitions all 66 Protestant canon books cleanly into disjoint horizons", () => {
    const allBooks = [
      ...TORAH_BOOKS,
      ...PROPHETS_BOOKS,
      ...WRITINGS_BOOKS,
      ...GOSPEL_BOOKS,
      ...EPISTLE_BOOKS,
    ];

    assert.equal(TORAH_BOOKS.size, 5, "Torah has 5 books");
    assert.equal(PROPHETS_BOOKS.size, 21, "Prophets has 21 books");
    assert.equal(WRITINGS_BOOKS.size, 13, "Writings has 13 books");
    assert.equal(GOSPEL_BOOKS.size, 4, "Gospels has 4 books");
    assert.equal(EPISTLE_BOOKS.size, 23, "Epistles & Apocalypse has 23 books");
    assert.equal(allBooks.length, 66, "Total Protestant books is 66");

    const uniqueBooks = new Set(allBooks);
    assert.equal(uniqueBooks.size, 66, "Every book belongs to exactly one horizon");
  });

  await t.test("pure compute pass scales peak intensity to 100% and ranks all horizons", () => {
    const DIMS = 384;
    // Unit query vector with 1.0 at index 0
    const queryVec = new Float32Array(DIMS);
    queryVec[0] = 1.0;

    // Synthetic manifest with 5 chapters
    const manifest: SemanticManifest = {
      model: "test-model",
      dims: DIMS,
      quantization: "int8-unit-127",
      translation: "web",
      generatedAt: "2026-09-04T00:00:00Z",
      chapterIndex: [
        ["GEN", 1],
        ["ISA", 53],
        ["PSA", 23],
        ["MAT", 5],
        ["ROM", 8],
      ],
      verseCounts: { GEN: 31, ISA: 12, PSA: 6, MAT: 48, ROM: 39 },
    };

    // Chapters rows: 5 rows of 384 int8 values
    const chaptersRows = new Int8Array(5 * DIMS);
    // Give Isaiah (row 1) the highest dot product
    chaptersRows[1 * DIMS + 0] = 100; // ~0.78 score
    // Give Genesis (row 0) moderate score
    chaptersRows[0 * DIMS + 0] = 50; // ~0.39 score

    // Words index (Sayings of Jesus)
    const wordsIdx: CorpusIndex<WordsEntry> = {
      corpus: "words",
      model: "test-model",
      dims: DIMS,
      quantization: "int8-unit-127",
      generatedAt: "2026-09-04T00:00:00Z",
      entries: [
        { id: "JHN 4:14", book: "JHN", chapter: 4, verse: 14, label: "John 4:14" },
      ],
    };
    const wordsRows = new Int8Array(1 * DIMS);
    wordsRows[0] = 80; // ~0.62 score

    // Early index (Ante-Nicene Fathers)
    const earlyIdx: CorpusIndex<EarlyEntry> = {
      corpus: "early",
      model: "test-model",
      dims: DIMS,
      quantization: "int8-unit-127",
      generatedAt: "2026-09-04T00:00:00Z",
      entries: [
        { id: "didache#1", textId: "didache", section: 1, label: "Didache §1" },
      ],
    };
    const earlyRows = new Int8Array(1 * DIMS);
    earlyRows[0] = 40; // ~0.31 score

    // Afterlife index (Comparative Antiquity)
    const afterlifeIdx: CorpusIndex<AfterlifeEntry> = {
      corpus: "afterlife",
      model: "test-model",
      dims: DIMS,
      quantization: "int8-unit-127",
      generatedAt: "2026-09-04T00:00:00Z",
      entries: [
        {
          id: "egyptian-duat",
          name: "Egyptian Duat",
          family: "egyptian",
          description: "Underworld journey",
          primaryDoctrine: "Weighing of the Heart",
          label: "Egyptian Duat",
          href: "/evidence/frameworks/egyptian-duat",
        },
      ],
    };
    const afterlifeRows = new Int8Array(1 * DIMS);
    afterlifeRows[0] = 30; // ~0.23 score

    const result = computeOmniResonance(
      "prophetic suffering",
      queryVec,
      manifest,
      chaptersRows,
      wordsIdx,
      wordsRows,
      earlyIdx,
      earlyRows,
      afterlifeIdx,
      afterlifeRows,
      { limitPerHorizon: 3 },
    );

    assert.equal(result.horizons.length, 9);
    assert.equal(result.peakHorizon, "prophets", "Isaiah 53 makes prophets the peak");
    const peak = result.horizons.find((h) => h.id === "prophets");
    assert.ok(peak);
    assert.equal(peak.intensityPercent, 100, "Peak horizon has 100% intensity");

    const wordsH = result.horizons.find((h) => h.id === "words");
    assert.ok(wordsH);
    assert.ok(wordsH.intensityPercent > 50 && wordsH.intensityPercent < 100);

    assert.ok(result.allByRelevance.length > 0);
    // Descending score order
    for (let i = 1; i < result.allByRelevance.length; i++) {
      assert.ok(result.allByRelevance[i - 1].score >= result.allByRelevance[i].score);
    }
  });

  await t.test("parses radar and resonance query commands", () => {
    const r1 = parseResonanceQuery("radar living water");
    assert.ok(r1);
    assert.equal(r1.concept, "living water");
    assert.equal(r1.href, "/scriptures/resonance?q=living%20water");

    const r2 = parseResonanceQuery("resonance divine council");
    assert.ok(r2);
    assert.equal(r2.concept, "divine council");

    const r3 = parseResonanceQuery("concept scapegoat");
    assert.ok(r3);
    assert.equal(r3.concept, "scapegoat");

    const r4 = parseResonanceQuery("spectrum hades");
    assert.ok(r4);
    assert.equal(r4.concept, "hades");

    const r5 = parseResonanceQuery("just random text");
    assert.equal(r5, null);
  });

  await t.test("assembles direct resonance action group in Find overlay", () => {
    const groups = assembleFindGroups({
      query: "> radar living water",
      catalog: [],
      canons: null,
      exact: null,
      related: null,
    });

    assert.equal(groups.length, 1);
    assert.equal(groups[0].id, "resonance");
    assert.equal(groups[0].items[0].href, "/scriptures/resonance?q=living%20water");
    assert.equal(groups[0].items[0].kind, "action");
  });

  await t.test("indexes resonance room and keyword aliases in find catalog", () => {
    const place = FIND_CATALOG.find((p) => p.href === "/scriptures/resonance");
    assert.ok(place, "FIND_CATALOG should contain /scriptures/resonance");
    assert.ok(place.keywords.includes("resonance"));
    assert.ok(place.keywords.includes("radar"));
    assert.ok(place.keywords.includes("spectrum"));
  });

  await t.test("provides curated iconic conceptual sparks with valid epicenters", () => {
    assert.ok(RESONANCE_SPARKS.length >= 8);
    for (const spark of RESONANCE_SPARKS) {
      assert.ok(spark.label.length > 0);
      assert.ok(spark.query.length > 0);
      assert.ok(spark.blurb.length > 0);
      assert.ok(HORIZON_ORDER.includes(spark.epicenter), `Valid epicenter for ${spark.label}`);
    }
  });
});

// These tests reproduce the dropped Gospel/additional chapters from the real index.
import semanticManifest from "../public/scriptures/semantic/manifest.json";
import canonsData from "../public/scriptures/canons.json";

function corpusFixture<T extends WordsEntry | EarlyEntry | AfterlifeEntry>(corpus: "words" | "early" | "afterlife", entries: T[] = []): CorpusIndex<T> {
  return { corpus, model: "test-model", dims: 384, quantization: "int8-unit-127", generatedAt: "test", entries };
}
function compareChapters(index: [string, number][], scores: number[]) {
  const rows = new Int8Array(index.length * 384);
  scores.forEach((score, row) => { rows[row * 384] = score; });
  const query = new Float32Array(384); query[0] = 1;
  const manifest: SemanticManifest = { model: "test-model", dims: 384, translation: "web", quantization: "int8-unit-127",
    generatedAt: "test", chapterIndex: index, verseCounts: {} };
  return computeOmniResonance("test", query, manifest, rows,
    corpusFixture<WordsEntry>("words"), new Int8Array(), corpusFixture<EarlyEntry>("early"), new Int8Array(),
    corpusFixture<AfterlifeEntry>("afterlife"), new Int8Array(), { limitPerHorizon: 2000 });
}

test("Gospel narrative can be the strongest result even with no sayings results", () => {
  const result = compareChapters([["JHN", 1], ["ISA", 53]], [127, 50]);
  assert.equal(result.peakHorizon, "gospels");
  assert.equal(result.allByRelevance[0].id, "JHN.1");
  assert.equal(result.horizons.find((h) => h.id === "words")?.intensityPercent, 0);
});

test("every actual indexed chapter is assigned once and all additional books have valid WEB reader links", () => {
  const index = semanticManifest.chapterIndex as [string, number][];
  const result = compareChapters(index, index.map(() => 80));
  assert.equal(result.coverage.assignedChapters, index.length);
  assert.deepEqual(result.coverage.excludedChapters, []);
  assert.equal(result.horizons.reduce((count, group) => count + group.hits.length, 0), index.length);
  const extra = result.horizons.find((h) => h.id === "additional")!;
  assert.equal(extra.hits.length, 213);
  for (const [book, chapter] of index) {
    assert.ok(scriptureGroup(book));
    const url = new URL(scriptureHitHref(book, chapter), "https://example.test");
    const [, , tradition, routeBook, routeChapter] = url.pathname.split("/");
    assert.ok(canonsData.traditions.find((t) => t.id === tradition)?.books.includes(book));
    assert.equal(routeBook, book); assert.equal(Number(routeChapter), chapter);
    assert.equal(url.searchParams.get("t"), "web");
  }
  assert.deepEqual(result.coverage.unindexedBooks.map((b) => b.book).sort(), ["BEL", "ENO", "JUB", "LJE", "SUS"]);
});

test("unknown indexed books are disclosed rather than silently dropped", () => {
  const result = compareChapters([["ZZZ", 1], ["GEN", 1]], [127, 50]);
  assert.equal(result.coverage.assignedChapters, 1);
  assert.equal(result.coverage.excludedChapters[0].book, "ZZZ");
  assert.equal(result.peakHorizon, "torah");
});

test("empty and nonpositive corpora have no invented peak or visible positive intensity", () => {
  for (const result of [compareChapters([], []), compareChapters([["GEN", 1]], [-127])]) {
    assert.equal(result.peakHorizon, null);
    assert.equal(result.highestScore, 0);
    assert.deepEqual(result.allByRelevance, []);
    assert.ok(result.horizons.every((h) => h.intensityPercent === 0 && h.hits.length === 0));
  }
});
