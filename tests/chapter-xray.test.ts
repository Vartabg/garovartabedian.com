import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getUnseenForChapter } from "../src/lib/angels/chapter-index";
import { getChapterGuide, getChapterNeighbours } from "../src/lib/scriptures/server";
import { getChapterXray, summarizeBridge, summarizeXref } from "../src/lib/scriptures/server/xray";
import { SCRIPTURE_SOURCES } from "../src/lib/scriptures/sources";
import { chapterXrayTags } from "../src/lib/scriptures/xray-tags";
import type { XrefFile } from "../src/lib/scriptures/types";

// Mark 4 is the worked example of the plan (docs/plans/2026-11-02-engineer-xray.md).
// The numbers are read from the same JSON the page renders, so this test fails
// when the data changes; that is the point.
const mark = JSON.parse(readFileSync("public/scriptures/text/web/MRK.json", "utf8")) as { chapters: string[][] };
const xrefFile = JSON.parse(readFileSync("public/scriptures/xref/MRK.json", "utf8")) as XrefFile;
const bridgeFile = JSON.parse(readFileSync("public/scriptures/bridge/MRK/4.json", "utf8"));
const bridgeIndex = JSON.parse(readFileSync("public/scriptures/bridge/index.json", "utf8"));

const guides = { files: 757, chapterSlots: 1586, agentReviewed: 737, humanReviewed: 0, untracked: 20, batchTemplate: 0 };
const context = {
  translationName: "World English Bible",
  bookId: "MRK",
  bookName: "Mark",
  bookNameFor: (id: string) => ({ MAT: "Matthew", LUK: "Luke" })[id] ?? id,
  source: SCRIPTURE_SOURCES.web,
  originalName: (edition: string) => (edition === "sblgnt" ? "SBL Greek New Testament + MorphGNT" : edition),
  guides,
};

test("Mark 4's x-ray matches its own files", async () => {
  const xray = await getChapterXray({
    bookId: "MRK",
    chapter: 4,
    translation: "web",
    verses: mark.chapters[3],
    originalTranslations: ["web"],
    guide: await getChapterGuide("MRK", 4),
    neighbours: await getChapterNeighbours("MRK", 4),
    unseen: getUnseenForChapter("MRK", 4),
  });

  assert.deepEqual(xray.text, { translation: "web", verses: 41, emptySlots: 0 });
  assert.deepEqual(xray.xref, summarizeXref(xrefFile, 4));
  assert.deepEqual(xray.xref, { verses: 41, links: 570 });
  assert.deepEqual(xray.original, { edition: "sblgnt", verses: 41 });
  assert.deepEqual(xray.bridge, summarizeBridge(bridgeFile, bridgeIndex.books.MRK));
  assert.equal(xray.bridge?.verses, 41);
  assert.equal(xray.bridge?.links, 691);
  assert.deepEqual([xray.bridge?.ok, xray.bridge?.plain, xray.bridge?.flag], [615, 39, 37]);
  assert.deepEqual(xray.bridge?.drafted, { ai: 39, ebible: 0, none: 2 });
  assert.deepEqual(xray.bridge?.book, { words: 14205, linked: 13395, ok: 7557, plain: 1677, flag: 2370 });
  assert.equal(xray.neighbours?.count, 6);
  assert.deepEqual(xray.neighbours?.top, { book: "MAT", chapter: 13, shared: 50 });
  assert.deepEqual(xray.guide, { kind: "published", questions: 10, status: "agent-reviewed", reviewedOn: "2026-08-25", reviewer: "agent editorial panel (7-pass review, 2026-08-24)" });
  assert.deepEqual(xray.unseen, { entries: 0, terms: 1 });

  const tags = chapterXrayTags(xray, context);
  assert.deepEqual(Object.keys(tags), ["text", "original", "xref", "guide", "neighbours", "unseen"]);
  assert.ok(tags.text.facts.includes("41 verses"));
  assert.ok(tags.text.facts.includes("retrieved 2026-07-01"));
  assert.ok(tags.xref.facts.includes("570 links from 41 verses"));
  assert.ok(tags.original.facts.some((fact) => fact.includes("691 links, 615 supported, 39 other, 37 need review")));
  assert.ok(tags.original.facts.some((fact) => fact.startsWith("39 of 41 verses drafted by AI models")));
  assert.ok(tags.guide.facts.includes("0 human-reviewed guides on the site"));
  assert.equal(tags.guide.detail[0], "Site-wide: 757 of 1,586 chapters have a guide; 737 agent-reviewed, 0 human-reviewed, 20 untracked.");
  assert.ok(tags.neighbours.facts.includes("Matthew 13 shares 50 cross-references"));
  assert.ok(tags.unseen.facts.includes("1 lexicon term in the original text"));
  // Nothing in a tag is a path or a URL.
  for (const tag of Object.values(tags)) {
    for (const line of [...tag.facts, ...tag.detail]) assert.doesNotMatch(line, /\/Users\/|https?:/);
  }
});

test("absent data is stated, never hidden or crashed", async () => {
  const xray = await getChapterXray({ bookId: "PSA", chapter: 151, translation: "web", verses: null, originalTranslations: [], guide: null, neighbours: null, unseen: null });
  assert.equal(xray.original, null);
  assert.equal(xray.neighbours, null);
  const tags = chapterXrayTags(xray, { ...context, bookId: "PSA", bookName: "Psalms" });
  assert.deepEqual(tags.original.facts, ["No Greek or Hebrew edition is hosted for this chapter"]);
  assert.deepEqual(tags.neighbours.facts, ["No neighbour record for this chapter"]);
  assert.equal(summarizeBridge(undefined, undefined), null);
  assert.deepEqual(summarizeXref(undefined, 1), { verses: 0, links: 0 });
});
