import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  mergeStudyTrail,
  type StudyTrailEntry,
} from "../src/lib/scriptures/prefs";
import type { Canons } from "../src/lib/scriptures/types";

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

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test("computed neighbours use a valid canon and retain the chosen translation when available", async () => {
  const { default: ChapterNeighbours } = await import("../src/app/scriptures/[tradition]/[book]/[chapter]/ChapterNeighbours");
  const canons = JSON.parse(readFileSync("public/scriptures/canons.json", "utf8")) as Canons;
  const markup = renderToStaticMarkup(<ChapterNeighbours canons={canons} traditionId="protestant" translation="kjv" bookName="Isaiah" chapter={53} data={{ book: "ISA", chapter: 53, neighbours: [{ book: "2MA", chapter: 9, score: .8, xrefLinks: 0 }, { book: "JOB", chapter: 15, score: .7, xrefLinks: 0 }] }} />);
  assert.doesNotMatch(markup, /protestant\/2MA/);
  assert.match(markup, /protestant\/JOB\/15\?t=kjv/);
  assert.match(markup, /2MA\/9\?t=/);
});
