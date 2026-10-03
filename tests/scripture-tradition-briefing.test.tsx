import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TraditionBriefingView, {
  TraditionBriefingDeep,
} from "../src/app/scriptures/[tradition]/TraditionBriefing";
import type {
  Canons,
  TraditionBriefing,
} from "../src/lib/scriptures/types";

const readJson = <T,>(file: string): T =>
  JSON.parse(readFileSync(file, "utf8")) as T;

const canons = readJson<Canons>("public/scriptures/canons.json");
const briefingFiles = readdirSync("public/scriptures/traditions")
  .filter((file) => file.endsWith(".json"))
  .sort();
const briefings = briefingFiles.map((file) =>
  readJson<TraditionBriefing>(`public/scriptures/traditions/${file}`),
);

const allClaimSourceIds = (briefing: TraditionBriefing) => [
  ...briefing.facts.flatMap((item) => item.sourceIds),
  ...briefing.formation.flatMap((item) => item.sourceIds),
  ...briefing.distinctives.flatMap((item) => item.sourceIds),
  ...briefing.reception.flatMap((item) => item.sourceIds),
  ...briefing.variations.flatMap((item) => item.sourceIds),
  ...briefing.debates.flatMap((debate) =>
    debate.positions.flatMap((position) => position.sourceIds),
  ),
  ...briefing.hosting.sourceIds,
];

test("every Scripture tradition has one deep, sourced briefing", () => {
  assert.deepEqual(
    briefings.map((briefing) => briefing.tradition).sort(),
    canons.traditions.map((tradition) => tradition.id).sort(),
  );

  for (const briefing of briefings) {
    const tradition = canons.traditions.find((item) => item.id === briefing.tradition);
    assert.ok(tradition, `${briefing.tradition} must resolve to canon metadata`);
    assert.equal(briefing.traditionName, tradition.name);
    assert.ok(briefing.oneLine.length >= 80, `${briefing.tradition} needs a real one-line thesis`);
    assert.ok(briefing.orient.length >= 180, `${briefing.tradition} needs orientation`);
    assert.ok(briefing.keepInMind.length >= 180, `${briefing.tradition} needs a counting caution`);
    assert.ok(briefing.facts.length >= 4, `${briefing.tradition} needs facts`);
    assert.ok(briefing.formation.length >= 4, `${briefing.tradition} needs formation history`);
    assert.ok(briefing.distinctives.length >= 3, `${briefing.tradition} needs canon differences`);
    assert.ok(briefing.reception.length >= 3, `${briefing.tradition} needs reception context`);
    assert.ok(briefing.variations.length >= 3, `${briefing.tradition} needs internal variation`);
    assert.ok(briefing.debates.length >= 2, `${briefing.tradition} needs honest disagreements`);
    assert.ok(briefing.sources.length >= 5, `${briefing.tradition} needs an evidence base`);
  }
});

test("every tradition claim resolves evidence and every linked book exists", () => {
  for (const briefing of briefings) {
    const sourceIds = briefing.sources.map((source) => source.id);
    assert.equal(
      new Set(sourceIds).size,
      sourceIds.length,
      `${briefing.tradition} source ids must be unique`,
    );
    for (const source of briefing.sources) {
      assert.ok(source.href || source.url, `${briefing.tradition}/${source.id} needs a link`);
      if (source.url) assert.match(source.url, /^https:\/\//);
    }

    const usedSourceIds = allClaimSourceIds(briefing);
    assert.ok(usedSourceIds.length > 0);
    for (const sourceId of usedSourceIds) {
      assert.ok(
        sourceIds.includes(sourceId),
        `${briefing.tradition} should resolve source ${sourceId}`,
      );
    }
    for (const sourceId of sourceIds) {
      assert.ok(
        usedSourceIds.includes(sourceId),
        `${briefing.tradition} source ${sourceId} should support a visible claim`,
      );
    }

    for (const claim of [...briefing.distinctives, ...briefing.reception, ...briefing.variations]) {
      assert.ok(claim.sourceIds.length > 0, `${briefing.tradition}/${claim.title} needs evidence`);
      for (const bookId of claim.bookIds ?? []) {
        assert.ok(canons.books[bookId], `${briefing.tradition} should resolve book ${bookId}`);
      }
    }
  }
});

test("every tradition briefing renders the full treatment without client JavaScript", () => {
  for (const briefing of briefings) {
    const tradition = canons.traditions.find((item) => item.id === briefing.tradition)!;
    const markup = renderToStaticMarkup(
      <>
        <TraditionBriefingView
          briefing={briefing}
          tradition={tradition}
          canons={canons}
        />
        <TraditionBriefingDeep
          briefing={briefing}
          tradition={tradition}
          canons={canons}
        />
      </>,
    );

    assert.match(markup, /Before you count books/);
    assert.match(markup, /How this shelf took shape/);
    assert.match(markup, /What changes on this shelf/);
    assert.match(markup, /How this tradition receives Scripture/);
    assert.match(markup, /Variation inside this tradition/);
    assert.match(markup, /Where Christians genuinely disagree/);
    assert.match(markup, /Hosted-text boundary/);
    assert.match(markup, /Where this comes from/);
    assert.match(markup, /Evidence:/);
    assert.doesNotMatch(markup, />\[0\]</);
  }
});

test("the Armenian shelf follows the sourced current 48 plus 27 shape", () => {
  const armenian = canons.traditions.find((item) => item.id === "armenian")!;
  const matthewIndex = armenian.books.indexOf("MAT");
  assert.equal(matthewIndex, 48, "Armenian Old Testament should contain 48 represented books");
  assert.equal(armenian.books.length, 75);
  assert.ok(armenian.books.includes("1ES"));
  assert.ok(armenian.books.includes("3MA"));
  for (const historicalOrOtherLocalBook of ["2ES", "MAN", "PS2", "4MA", "DAG"]) {
    assert.ok(!armenian.books.includes(historicalOrOtherLocalBook));
  }
});

test("tradition-specific cautions prevent famous counts from overstating the hosted corpus", () => {
  const ethiopian = briefings.find((item) => item.tradition === "ethiopian")!;
  const orthodox = briefings.find((item) => item.tradition === "orthodox")!;
  const armenian = briefings.find((item) => item.tradition === "armenian")!;

  assert.match(ethiopian.hosting.summary, /not the church.s traditional eighty-one-book count/i);
  assert.match(ethiopian.hosting.unavailable ?? "", /Meqabyan/);
  assert.match(orthodox.distinctives.map((item) => item.text).join(" "), /appendix/i);
  assert.match(armenian.keepInMind, /Third Corinthians/);
});
