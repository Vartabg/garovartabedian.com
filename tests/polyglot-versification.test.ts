import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import PolyglotPage from "../src/app/scriptures/polyglot/page";
import { selectHistoricPsalmVerses } from "../src/app/scriptures/polyglot/PolyglotClient";
import type { PolyglotAlignedVerse } from "../src/lib/scriptures/polyglot";
import type { BookText } from "../src/lib/scriptures/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const readBook = (translation: "brenton" | "drb"): BookText =>
  JSON.parse(
    readFileSync(`public/scriptures/text/${translation}/PSA.json`, "utf8"),
  ) as BookText;

async function getInitialAligned(preset: string): Promise<PolyglotAlignedVerse[]> {
  const page = await PolyglotPage({
    searchParams: Promise.resolve({ preset }),
  });
  const suspense = React.Children.toArray(page.props.children).at(-1);

  assert.ok(
    React.isValidElement<{
      children: React.ReactElement<{ initialAligned: PolyglotAlignedVerse[] }>;
    }>(suspense),
  );
  return suspense.props.children.props.initialAligned;
}

test("client loader selects and normalizes the hosted historic Psalm chapters", () => {
  const brenton = readBook("brenton");
  const drb = readBook("drb");

  const brenton22 = selectHistoricPsalmVerses(brenton.chapters, "PSA", 22);
  const drb22 = selectHistoricPsalmVerses(drb.chapters, "PSA", 22);
  const brenton110 = selectHistoricPsalmVerses(brenton.chapters, "PSA", 110);
  const drb110 = selectHistoricPsalmVerses(drb.chapters, "PSA", 110);

  assert.match(brenton22?.[15] ?? "", /pierced my hands and my feet/i);
  assert.match(drb22?.[15] ?? "", /dug my hands and feet/i);
  assert.match(brenton110?.[0] ?? "", /The Lord said to my Lord/i);
  assert.match(drb110?.[0] ?? "", /The Lord said to my Lord/i);

  assert.deepEqual(
    selectHistoricPsalmVerses([["Genesis 1"], ["Genesis 2"]], "GEN", 2),
    ["Genesis 2"],
  );
});

test("server loader aligns Psalm 22 against Psalm 21 without moving modern witnesses", async () => {
  const aligned = await getInitialAligned("psalm-22");
  const verse16 = aligned.find((verse) => verse.number === 16);

  assert.ok(verse16);
  assert.match(
    verse16.originalVerse?.words.map((word) => word.text).join(" ") ?? "",
    /כָּ֝אֲרִ֗י/,
  );
  assert.match(verse16.brentonText ?? "", /pierced my hands and my feet/i);
  assert.match(verse16.drbText ?? "", /dug my hands and feet/i);
  assert.match(verse16.kjvText ?? "", /pierced my hands and my feet/i);
  assert.match(verse16.webText ?? "", /pierced my hands and feet/i);
});

test("server loader aligns Hebrew Psalm 110 against historic Psalm 109", async () => {
  const aligned = await getInitialAligned("psalm-110");
  const verse1 = aligned.find((verse) => verse.number === 1);

  assert.ok(verse1);
  assert.match(
    verse1.originalVerse?.words.map((word) => word.text).join(" ") ?? "",
    /נְאֻ֤ם יְהוָ֨ה/,
  );
  assert.match(verse1.brentonText ?? "", /The Lord said to my Lord/i);
  assert.match(verse1.drbText ?? "", /The Lord said to my Lord/i);
  assert.match(verse1.kjvText ?? "", /The LORD said unto my Lord/);
  assert.match(verse1.webText ?? "", /Yahweh says to my Lord/);
});
