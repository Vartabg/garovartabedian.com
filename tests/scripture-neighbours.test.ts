import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import manifest from "../public/scriptures/neighbors/manifest.json" with { type: "json" };
import {
  TOP_K,
  MIN_SCORE,
  SAME_BOOK_LIMIT,
  xrefChapterKey,
} from "../scripts/scriptures/build-neighbors.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const XREF_DIR = path.join(ROOT, "public/scriptures/xref");

type Neighbour = { book: string; chapter: number; score: number; xrefLinks: number };
type ChapterFile = { book: string; chapter: number; neighbours: Neighbour[] };

const canons = canonsData as { books: Record<string, { name: string; chapters: number }> };

const chapters: ChapterFile[] = Object.values(manifest.chapterRecords);

test("the neighbour corpus is not empty and matches its manifest", () => {
  assert.ok(chapters.length > 1000, `only ${chapters.length} chapters have neighbours`);
  assert.equal(chapters.length, manifest.chaptersIndexed);
  assert.equal(chapters.filter((c) => c.neighbours.length).length, manifest.chaptersWithNeighbours);
  assert.equal(
    chapters.reduce((sum, c) => sum + c.neighbours.length, 0),
    manifest.neighbours,
  );
  assert.equal(manifest.grain, "chapter");
});

test("every neighbour resolves to a real chapter of a hosted book", () => {
  for (const entry of chapters) {
    const self = canons.books[entry.book];
    assert.ok(self, `unknown source book ${entry.book}`);
    assert.ok(
      entry.chapter >= 1 && entry.chapter <= self.chapters,
      `${entry.book} ${entry.chapter} is outside the book`,
    );
    for (const neighbour of entry.neighbours) {
      const meta = canons.books[neighbour.book];
      assert.ok(meta, `${entry.book} ${entry.chapter} points at unknown book ${neighbour.book}`);
      assert.ok(
        neighbour.chapter >= 1 && neighbour.chapter <= meta.chapters,
        `${entry.book} ${entry.chapter} points at ${neighbour.book} ${neighbour.chapter}, which does not exist`,
      );
    }
  }
});

test("the exclusion rules the copy claims are actually enforced", () => {
  for (const entry of chapters) {
    assert.ok(entry.neighbours.length <= TOP_K, `${entry.book} ${entry.chapter} exceeds TOP_K`);

    const seen = new Set<string>();
    let sameBook = 0;
    let previous = Infinity;
    for (const neighbour of entry.neighbours) {
      const key = `${neighbour.book} ${neighbour.chapter}`;
      assert.ok(!seen.has(key), `${entry.book} ${entry.chapter} repeats ${key}`);
      seen.add(key);

      assert.ok(
        neighbour.score >= MIN_SCORE,
        `${entry.book} ${entry.chapter} → ${key} scores ${neighbour.score}, below the published floor`,
      );
      assert.ok(
        neighbour.score <= previous,
        `${entry.book} ${entry.chapter} is not in descending order at ${key}`,
      );
      previous = neighbour.score;

      if (neighbour.book === entry.book) {
        sameBook += 1;
        assert.ok(
          Math.abs(neighbour.chapter - entry.chapter) > 1,
          `${entry.book} ${entry.chapter} lists the adjacent chapter ${neighbour.chapter}`,
        );
      }
    }
    assert.ok(
      sameBook <= SAME_BOOK_LIMIT,
      `${entry.book} ${entry.chapter} keeps ${sameBook} same-book neighbours`,
    );
  }
});

test("the cross-reference agreement counts are true", () => {
  // The page prints "cross-referenced N times" beside a computed link. If that
  // number is wrong the honesty of the whole block is wrong, so it is checked
  // against the cross-reference files rather than trusted from the build.
  const sample = chapters.filter((c) => ["LEV", "MRK", "ROM", "PSA"].includes(c.book));
  assert.ok(sample.length > 0, "sample books produced no neighbour files");

  for (const entry of sample) {
    const xrefFile = path.join(XREF_DIR, `${entry.book}.json`);
    if (!existsSync(xrefFile)) {
      for (const neighbour of entry.neighbours) assert.equal(neighbour.xrefLinks, 0);
      continue;
    }
    const { refs } = JSON.parse(readFileSync(xrefFile, "utf8")) as {
      refs: Record<string, string[]>;
    };
    const counts = new Map<string, number>();
    for (const [source, targets] of Object.entries(refs)) {
      if (Number(source.split(":")[0]) !== entry.chapter) continue;
      for (const target of targets) {
        const key = xrefChapterKey(target);
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    for (const neighbour of entry.neighbours) {
      assert.equal(
        neighbour.xrefLinks,
        counts.get(`${neighbour.book} ${neighbour.chapter}`) ?? 0,
        `${entry.book} ${entry.chapter} → ${neighbour.book} ${neighbour.chapter} claims ${neighbour.xrefLinks} cross-references`,
      );
    }
  }
});

test("the known-good parallels the rework was chosen for are present", () => {
  // These are the results that justified moving from verse grain to chapter
  // grain. If a future model or threshold change loses them, the change has
  // regressed the thing the feature exists to do.
  const expected: [string, number, string, number][] = [
    ["LEV", 11, "DEU", 14],
    ["MRK", 16, "LUK", 24],
    ["MRK", 16, "MAT", 28],
    ["GEN", 1, "PSA", 104],
  ];
  for (const [book, chapter, targetBook, targetChapter] of expected) {
    const entry = chapters.find((c) => c.book === book && c.chapter === chapter);
    assert.ok(entry, `${book} ${chapter} has no neighbour file`);
    assert.ok(
      entry.neighbours.some((n) => n.book === targetBook && n.chapter === targetChapter),
      `${book} ${chapter} no longer reaches ${targetBook} ${targetChapter}`,
    );
  }
});
