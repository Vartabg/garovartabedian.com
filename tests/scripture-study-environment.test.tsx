import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StudyTable from "../src/app/scriptures/[tradition]/[book]/[chapter]/StudyTable";
import {
  mergeStudyTrail,
  type StudyTrailEntry,
} from "../src/lib/scriptures/prefs";
import type { Canons, ChapterGuide } from "../src/lib/scriptures/types";

const entry = (
  bookId: string,
  bookName: string,
  chapter: number,
  updatedAt: number,
): StudyTrailEntry => ({
  traditionId: "protestant",
  bookId,
  bookName,
  chapter,
  href: `/scriptures/protestant/${bookId}/${chapter}?t=web`,
  updatedAt,
});

test("the private study trail keeps the newest unique chapters", () => {
  const johnOne = entry("JHN", "John", 1, 1);
  const johnTwo = entry("JHN", "John", 2, 2);
  const psalmTwentyThree = entry("PSA", "Psalms", 23, 3);
  const johnOneAgain = entry("JHN", "John", 1, 4);

  const merged = mergeStudyTrail(
    [psalmTwentyThree, johnTwo, johnOne],
    johnOneAgain,
    3,
  );

  assert.deepEqual(
    merged.map((item) => [item.bookId, item.chapter, item.updatedAt]),
    [
      ["JHN", 1, 4],
      ["PSA", 23, 3],
      ["JHN", 2, 2],
    ],
  );
});

test("the margin presents chapter purpose, connections, and provenance together", () => {
  const guide = JSON.parse(
    readFileSync("public/scriptures/guides/JHN/3.json", "utf8"),
  ) as ChapterGuide;
  const canons = JSON.parse(
    readFileSync("public/scriptures/canons.json", "utf8"),
  ) as Canons;
  const tradition = canons.traditions.find((item) => item.id === "protestant");
  if (!tradition) throw new Error("The Protestant tradition must exist in canons.json.");
  const markup = renderToStaticMarkup(
    <StudyTable
      bookName="John"
      chapter={3}
      chapterCount={21}
      verseCount={36}
      traditionName="Protestant canon"
      translationName="World English Bible"
      translationLicense="Public domain"
      guide={guide}
      originalAvailable
      showOriginal={false}
      compareName="King James Version"
      activeIntent="understand"
      onIntent={() => {}}
      canons={canons}
      tradition={tradition}
      openVerse={16}
      openRefs={["ROM 5:8", "1JN 4:9"]}
    />,
  );

  // The phone strip keeps the four ways in; the wide glosses carry the same
  // actions in context under rubric headings.
  for (const intent of ["Read", "Understand", "Trace connections", "Source"]) {
    assert.match(markup, new RegExp(`>${intent}<`));
  }
  assert.match(markup, /aria-label="John 3 study notes"/);
  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /In the margin/);
  assert.match(markup, new RegExp(guide.summary.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(markup, /Connect · John 3:16/);
  assert.match(markup, /href="\/scriptures\/protestant\/ROM\/5\?t=web#v8"/);
  assert.match(markup, />Romans 5:8</);
  assert.match(markup, />1 John 4:9</);
  assert.match(markup, /World English Bible · Public domain/);
  assert.match(markup, /Original-language layer available/);
  assert.match(markup, /Show the original language/);
  assert.match(markup, /King James Version/);
  assert.match(markup, /href="\/sources#scripture-texts"/);
});

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test("computed neighbours use a valid canon and retain the chosen translation when available", async () => {
  const { default: ChapterNeighbours } = await import("../src/app/scriptures/[tradition]/[book]/[chapter]/ChapterNeighbours");
  const canons = JSON.parse(readFileSync("public/scriptures/canons.json", "utf8")) as Canons;
  const markup = renderToStaticMarkup(<ChapterNeighbours canons={canons} traditionId="protestant" translation="kjv" bookName="Isaiah" chapter={53} data={{ book: "ISA", chapter: 53, neighbours: [{ book: "2MA", chapter: 9, score: .8, xrefLinks: 0 }, { book: "JOB", chapter: 15, score: .7, xrefLinks: 0 }] }} />);
  assert.doesNotMatch(markup, /protestant\/2MA/);
  assert.match(markup, /protestant\/JOB\/15\?t=kjv/);
  assert.match(markup, /2MA\/9\?t=/);
});
