import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import canons from "../public/scriptures/canons.json";
import health from "../public/meta/corpus-health.json";
import {
  collectGuideRecord,
  GUIDE_RECORD_PATH,
  serializeGuideRecord,
} from "../scripts/site/build-guide-record.mjs";
import { packGuideRecord, packedState, unpackRow, type GuideRecord } from "../src/lib/site/guide-record";
import { GUIDE_RECORD as record, guideRecordFrom } from "../src/lib/site/guide-record-data";

const fresh = collectGuideRecord() as GuideRecord;
const books = canons.books as Record<string, { name: string; chapters: number; trans: string[] }>;

// Garo, 2026-11-20: "Yes, build it". The case study draws the guide checks
// from this file, so it has to be what the checks say today.
test("the public guide record matches the repository", () => {
  assert.deepEqual(record, fresh);
  assert.equal(readFileSync(GUIDE_RECORD_PATH, "utf8"), serializeGuideRecord(fresh));
});

test("a record of another shape stops the build", () => {
  assert.throws(() => guideRecordFrom({ ...record, schemaVersion: 1 }), /schemaVersion 2/);
  assert.throws(() => guideRecordFrom({ ...record, rubrics: undefined }), /schemaVersion 2/);
  assert.throws(() => guideRecordFrom({ ...record, books: [] }), /schemaVersion 2/);
  assert.throws(() => guideRecordFrom(null), /schemaVersion 2/);
});

test("the record has one row for every hosted chapter, in order", () => {
  assert.deepEqual(record.books.map((book) => book.id), canons.bookOrder);
  assert.deepEqual(record.traditions, canons.traditions.map((tradition) => tradition.id));
  for (const book of record.books) {
    const meta = books[book.id];
    assert.equal(book.name, meta.name);
    assert.deepEqual(book.chapters.map((row) => row.chapter), Array.from({ length: meta.chapters }, (_, i) => i + 1));
  }
});

// The reviewer's finding: under the first tradition that lists a book, the
// reader can have no text for a chapter (Psalms 151 under Protestant).
test("every chapter link opens a reader that has that chapter's text", () => {
  const texts = new Map<string, { chapters: string[][] }>();
  const textFor = (translation: string, book: string) => {
    const key = `${translation}/${book}`;
    if (!texts.has(key)) texts.set(key, JSON.parse(readFileSync(path.join("public/scriptures/text", translation, `${book}.json`), "utf8")));
    return texts.get(key)!;
  };
  for (const book of record.books) {
    for (const row of book.chapters) {
      const label = `${book.id} ${row.chapter}`;
      assert.notEqual(row.tradition, null, `${label} has no reader with text`);
      const tradition = canons.traditions[row.tradition!];
      assert.ok(tradition.books.includes(book.id), `${label} links to a tradition without the book`);
      // The chapter page's own rule (pickTranslation).
      const translation = tradition.transPreference.find((candidate) => books[book.id].trans.includes(candidate)) ?? books[book.id].trans[0];
      assert.ok((textFor(translation, book.id).chapters[row.chapter - 1]?.length ?? 0) > 0, `${label} opens ${tradition.id}/${translation} with no text`);
    }
  }
  const psalm151 = record.books.find((book) => book.id === "PSA")!.chapters[150];
  assert.notEqual(record.traditions[psalm151.tradition!], "protestant");
});

test("the record's totals are its rows, and they tie to corpus health", () => {
  const rows = record.books.flatMap((book) => book.chapters);
  const count = (state: string) => rows.filter((row) => row.state === state).length;
  const { totals } = record;
  assert.deepEqual(
    { chapters: rows.length, current: count("current"), earlier: count("earlier"), none: count("none") },
    { chapters: totals.chapters, current: totals.current, earlier: totals.earlier, none: totals.none },
  );
  assert.equal(totals.chapters, health.corpus.books.unionChapterSlots);
  // Each current guide is counted once, under the rubric it is locked to.
  assert.equal(totals.current, health.corpus.guides.v2.passing + health.corpus.guides.v3.passing);
  assert.deepEqual(record.rubrics, [health.corpus.guides.v2.rubricVersion, health.corpus.guides.v3.rubricVersion]);
  for (const [index, block] of [health.corpus.guides.v2, health.corpus.guides.v3].entries()) {
    assert.equal(rows.filter((row) => row.state === "current" && row.rubric === index).length, block.passing, block.rubricVersion);
  }
  assert.equal(totals.current + totals.earlier, health.corpus.guides.files);
  assert.equal(totals.agentReviewed, health.corpus.guides.review.agentReviewed);
  assert.equal(totals.humanReviewed, health.corpus.guides.review.humanReviewed);
  assert.equal(totals.unreviewed, health.corpus.guides.review.untracked);
});

test("a guide is on the current checks only when the rubric reports nothing", () => {
  for (const book of record.books) {
    for (const row of book.chapters) {
      if (row.state === "none") continue;
      const label = `${book.id} ${row.chapter}`;
      if (row.state === "current") {
        assert.equal(row.problems, 0, `${label} is current with problems`);
        assert.ok(row.verses > 0, `${label} is current without a text to check against`);
        assert.notEqual(row.drafter, null, `${label} is current without a drafting record`);
        assert.ok(row.rubric !== null && record.rubrics[row.rubric], `${label} is current without a rubric`);
      } else {
        assert.equal(row.rubric, null, `${label} names a rubric it is not locked to`);
      }
      // The rubric cannot run exactly where the text it checks against lacks the chapter.
      assert.equal(row.problems === null, row.verses === 0, label);
      assert.equal(row.review === "none", row.reviewer === null, label);
      assert.equal(row.review === "none", row.reviewedAt === null, label);
      if (row.reviewer !== null) assert.ok(record.reviewers[row.reviewer], label);
      if (row.drafter !== null) assert.ok(record.drafters[row.drafter], label);
    }
  }
});

test("the packed form the page receives unpacks to the same rows", () => {
  const packed = packGuideRecord(record);
  packed.books.forEach((book, bookIndex) => {
    const source = record.books[bookIndex];
    assert.deepEqual({ id: book.id, name: book.name }, { id: source.id, name: source.name });
    assert.deepEqual(book.rows.map((row, index) => unpackRow(row, index + 1, packed.dates)), source.chapters);
    assert.deepEqual(book.rows.map(packedState), source.chapters.map((row) => row.state));
  });
  assert.ok(JSON.stringify(packed).length * 4 < readFileSync(GUIDE_RECORD_PATH, "utf8").length, "the packed form is a fraction of the file");
});
