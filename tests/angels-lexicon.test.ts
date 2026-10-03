import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildChapterIndex,
  buildLexicon,
  lemmaCore,
  matchTerm,
} from "../scripts/angels/build-lexicon.mjs";
import { LEXICON_TERMS } from "../scripts/angels/lexicon-terms.mjs";
import type {
  ChapterIndexData,
  DemonsData,
  EncountersData,
  FallData,
  LexiconData,
  OrderData,
  TeachingData,
} from "../src/lib/angels/types";
import type { Canons } from "../src/lib/scriptures/types";

/**
 * The vocabulary room says its numbers come from the tagged text. These tests
 * make that a property of the repository rather than a promise: the committed
 * lexicon must equal what the generator produces from the hosted originals
 * today, every term must really occur, every occurrence must land on a hosted
 * verse, every reverse link must point at an anchor a room actually renders,
 * and a note that says "Once" or "Twice" must be counting correctly.
 */

const readJson = <T,>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const canons = readJson<Canons>("public/scriptures/canons.json");
const committedLexicon = readJson<LexiconData>("public/angels/lexicon.json");
const committedIndex = readJson<ChapterIndexData>("public/angels/chapter-index.json");

test("OSHB lemma cores keep the homograph letter and drop the prefixes", () => {
  assert.equal(lemmaCore("4397", "oshb"), "4397");
  assert.equal(lemmaCore("c/b/8147", "oshb"), "8147");
  assert.equal(lemmaCore("l/8163 c", "oshb"), "8163 c");
  assert.equal(lemmaCore("8314 b", "oshb"), "8314 b");
  assert.equal(lemmaCore("ἄγγελος", "sblgnt"), "ἄγγελος");
});

test("a phrase counts its head only when the partner sits within two tokens", () => {
  const unclean = LEXICON_TERMS.find((term) => term.id === "unclean-spirit")!;
  assert.deepEqual(matchTerm(unclean, ["ἐν", "πνεῦμα", "ἀκάθαρτος"]), [1]);
  assert.deepEqual(matchTerm(unclean, ["ἀκάθαρτος", "ὁ", "πνεῦμα"]), [2]);
  assert.deepEqual(matchTerm(unclean, ["πνεῦμα", "ὁ", "θεός", "ἀκάθαρτος"]), []);
  assert.deepEqual(matchTerm(unclean, ["πνεῦμα", "ἅγιος"]), []);
  const plain = LEXICON_TERMS.find((term) => term.id === "angelos")!;
  assert.deepEqual(matchTerm(plain, ["ὁ", "ἄγγελος", "καί", "ἄγγελος"]), [1, 3]);
});

test("the committed lexicon and chapter index match what the hosted text produces today", () => {
  const lexicon = buildLexicon();
  assert.deepEqual(committedLexicon, lexicon, "run: npm run data:angels-lexicon");
  assert.deepEqual(committedIndex, buildChapterIndex(lexicon), "run: npm run data:angels-lexicon");
});

test("every term occurs, every occurrence lands on a hosted verse, and pairs cross languages", () => {
  const byId = new Map(committedLexicon.terms.map((term) => [term.id, term]));
  for (const term of committedLexicon.terms) {
    assert.ok(term.tokens > 0, `${term.id} has no occurrences`);
    assert.equal(
      term.tokens,
      term.chapters.reduce((sum, chapter) => sum + chapter.count, 0),
      `${term.id}: tokens must equal the sum of its chapters`,
    );
    assert.equal(term.books, new Set(term.chapters.map((c) => c.book)).size, `${term.id}: book count`);
    for (const occurrence of term.chapters) {
      const translations = canons.books[occurrence.book]?.trans ?? [];
      assert.ok(translations.length > 0, `${term.id}: ${occurrence.book} is not a hosted book`);
      const text = readJson<{ chapters: string[][] }>(
        `public/scriptures/text/${translations[0]}/${occurrence.book}.json`,
      );
      const verses = text.chapters[occurrence.chapter - 1];
      assert.ok(verses, `${term.id}: ${occurrence.book} ${occurrence.chapter} is not hosted`);
      assert.ok(occurrence.verses.length > 0 && occurrence.count >= occurrence.verses.length);
      for (const verse of occurrence.verses) {
        assert.ok(
          verse >= 1 && verse <= verses.length,
          `${term.id}: ${occurrence.book} ${occurrence.chapter}:${verse} is out of range`,
        );
      }
    }
    if (term.pair) {
      const pair = byId.get(term.pair);
      assert.ok(pair, `${term.id} pairs with missing ${term.pair}`);
      assert.equal(pair.pair, term.id, `${term.id} ↔ ${term.pair} is not symmetric`);
      assert.notEqual(pair.lang, term.lang, `${term.id} ↔ ${term.pair} must cross languages`);
    }
  }
  assert.equal(committedLexicon.totals.terms, committedLexicon.terms.length);
  assert.equal(
    committedLexicon.totals.tokens,
    committedLexicon.terms.reduce((sum, term) => sum + term.tokens, 0),
  );
});

test("a note that says how often a word occurs is counting correctly", () => {
  for (const term of committedLexicon.terms) {
    const opening = /^(Once|Twice|Four times)\b/.exec(term.note);
    if (!opening) continue;
    const expected = { Once: 1, Twice: 2, "Four times": 4 }[opening[1]];
    assert.equal(term.tokens, expected, `${term.id}: note says "${opening[1]}" but the text has ${term.tokens}`);
  }
  // Claims about where a word lives.
  const only = (id: string, books: string[]) => {
    const term = committedLexicon.terms.find((t) => t.id === id)!;
    assert.deepEqual([...new Set(term.chapters.map((c) => c.book))].sort(), books.sort(), id);
  };
  only("beelzeboul", ["MAT", "MRK", "LUK"]);
  only("saraph", ["ISA"]);
  only("azazel", ["LEV"]);
  only("asmodaios", ["TOB"]);
  only("lilith", ["ISA"]);
  only("sair", ["LEV", "2CH", "ISA"]);
  only("evil-spirit", ["JDG", "1SA"]);
  const gospels = new Set(["MAT", "MRK", "LUK", "JHN"]);
  const possessed = committedLexicon.terms.find((t) => t.id === "daimonizomai")!;
  assert.ok(possessed.chapters.every((c) => gospels.has(c.book)), "daimonizomai: Gospels only");
  const archangel = committedLexicon.terms.find((t) => t.id === "archangelos")!;
  assert.deepEqual(
    archangel.chapters.map((c) => `${c.book} ${c.chapter}`),
    ["1TH 4", "JUD 1"],
  );
});

test("every reverse link points at an anchor a room renders, and every cited chapter is indexed", () => {
  const order = readJson<OrderData>("public/angels/order.json");
  const demons = readJson<DemonsData>("public/angels/demons.json");
  const fall = readJson<FallData>("public/angels/fall.json");
  const encounters = readJson<EncountersData>("public/angels/encounters.json");
  const teaching = readJson<TeachingData>("public/angels/teaching.json");
  const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const anchors = new Set<string>([
    "/angels#enemy-titles",
    ...order.bands.map((band) => `/angels#band-${band.id}`),
    ...order.named.map((named) => `/angels#${slug(named.name)}`),
    ...demons.demons.map((demon) => `/angels/demons#${demon.id}`),
    ...fall.steps.map((step) => `/angels/fall#${step.id}`),
    ...encounters.appeared.map((a) => `/angels/encounters#enc-${a.ref.replace(/[^A-Za-z0-9]+/g, "-")}`),
    ...encounters.castOut.map((x) => `/angels/encounters#enc-${x.ref.replace(/[^A-Za-z0-9]+/g, "-")}`),
    ...teaching.entries.map((entry) => `/angels#${entry.id}`),
  ]);
  const termIds = new Set(committedLexicon.terms.map((term) => term.id));

  for (const [key, chapter] of Object.entries(committedIndex.chapters)) {
    assert.match(key, /^[1-4]?[A-Z][A-Z0-9]{1,4}\/[1-9]\d*$/, key);
    for (const entry of chapter.entries) {
      assert.ok(anchors.has(entry.href), `${key}: ${entry.href} is not an anchor any room renders`);
      assert.ok(entry.label.trim().length > 0 && entry.room.trim().length > 0, `${key}: ${entry.href}`);
    }
    assert.equal(new Set(chapter.entries.map((e) => e.href)).size, chapter.entries.length, `${key}: duplicate links`);
    for (const term of chapter.terms) {
      assert.ok(termIds.has(term.id), `${key}: unknown term ${term.id}`);
      assert.ok(term.count > 0);
    }
  }

  // Spot checks a reader would notice: Mark 5 knows Legion; Isaiah 6 knows the seraphim.
  const mark5 = committedIndex.chapters["MRK/5"];
  assert.ok(mark5.entries.some((e) => e.href === "/angels/demons#legion"), "Mark 5 → Legion");
  assert.ok(mark5.terms.some((t) => t.id === "legion"), "Mark 5 vocabulary → λεγιών");
  const isaiah6 = committedIndex.chapters["ISA/6"];
  assert.ok(isaiah6.terms.some((t) => t.id === "saraph"), "Isaiah 6 vocabulary → שָׂרָף");
  assert.ok(isaiah6.entries.some((e) => e.room === "The encounters"), "Isaiah 6 → the encounters");

  // The teaching anchors exist only because the home page gives each card its id.
  const home = readFileSync("src/app/angels/AngelsHome.tsx", "utf8");
  assert.match(home, /<article key=\{t\.id\} id=\{t\.id\} className="an-teaching-card">/);
});
