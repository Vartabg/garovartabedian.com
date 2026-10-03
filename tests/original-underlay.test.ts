import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import manifest from "../public/scriptures/original/manifest.json" with { type: "json" };
import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import prophecies from "../public/jesus/prophecies.json" with { type: "json" };
import fall from "../public/angels/fall.json" with { type: "json" };

const ROOT = path.join(import.meta.dirname, "..");
const canons = canonsData as { books: Record<string, { name: string; chapters: number }> };
const books = manifest.books as Record<string, string>;

/** The labels OriginalLine can print. A new edition must be given one. */
const KNOWN_EDITIONS = new Set(["oshb", "sblgnt", "lxx"]);

test("every hosted edition has a language label the toggle can print", () => {
  for (const [book, edition] of Object.entries(books)) {
    assert.ok(
      KNOWN_EDITIONS.has(edition),
      `${book} uses edition "${edition}", which OriginalLine cannot name`,
    );
  }
});

test("the underlay is offered only where a chapter file actually exists", () => {
  // The rooms decide whether to show the toggle from this manifest alone. If
  // the manifest claimed a book the build never emitted, a reader would get an
  // affordance that always fails.
  for (const book of Object.keys(books)) {
    assert.ok(canons.books[book], `manifest lists unknown book ${book}`);
    const first = path.join(ROOT, "public/scriptures/original", book, "1.json");
    assert.ok(existsSync(first), `${book} is in the manifest but has no chapter 1`);
  }
});

test("the Greek New Testament really does omit the passage the copy says it omits", () => {
  // The Words room tells a reader that the hosted critical edition prints no
  // text at John 8:1-11. That claim has to stay true, or the honest message
  // becomes a false one.
  const john8 = JSON.parse(
    readFileSync(path.join(ROOT, "public/scriptures/original/JHN/8.json"), "utf8"),
  ) as { edition: string; verses: { number: number }[] };
  const numbers = new Set(john8.verses.map((verse) => verse.number));

  assert.equal(john8.edition, "sblgnt");
  for (let verse = 1; verse <= 11; verse++) {
    assert.ok(!numbers.has(verse), `SBLGNT now prints John 8:${verse}`);
  }
  assert.ok(numbers.has(12), "John 8:12 should still be present");

  // And the verse the room shows the message on is genuinely a red-letter one.
  const words = JSON.parse(
    readFileSync(path.join(ROOT, "public/jesus/words/JHN.json"), "utf8"),
  ) as Record<string, string>;
  assert.ok(words["8:11"], "John 8:11 is no longer marked as his words");
});

test("no room offers a Septuagint reading the site does not host", () => {
  // The prophecy pairs are where a Septuagint-vs-Masoretic comparison would
  // belong. The site hosts the LXX only for the deuterocanon, so the room must
  // not imply a Greek Isaiah is one tap away. This asserts the data situation
  // the copy was written against.
  const lxxBooks = Object.entries(books)
    .filter(([, edition]) => edition === "lxx")
    .map(([book]) => book);
  assert.ok(lxxBooks.length > 0, "no LXX books are hosted at all");

  const hebrewCanonWithLxx = lxxBooks.filter((book) =>
    ["GEN", "EXO", "PSA", "ISA", "JER", "DAN", "MIC", "ZEC"].includes(book),
  );
  assert.deepEqual(
    hebrewCanonWithLxx,
    [],
    "an LXX edition now exists for a Hebrew-canon book; the prophecy room can offer the comparison",
  );
});

test("the refs the rooms pass to the underlay parse into hosted chapters", () => {
  // A ref the underlay cannot resolve produces a toggle that opens onto
  // nothing. These are the two datasets that feed it.
  const refs: string[] = [
    ...(prophecies as { prophecy: { ref: string }; fulfillment: { ref: string }[] }[]).flatMap(
      (pair) => [pair.prophecy.ref, ...pair.fulfillment.map((f) => f.ref)],
    ),
    ...(fall as { steps: { ref?: string; second?: { ref: string } }[] }).steps.flatMap((step) =>
      [step.ref, step.second?.ref].filter((ref): ref is string => Boolean(ref)),
    ),
  ];
  assert.ok(refs.length > 50, `only ${refs.length} refs collected`);

  for (const ref of refs) {
    const match = /^([A-Z0-9]{3})\s+(\d+):(\d+)/.exec(ref);
    if (!match) continue;
    const [, book, chapter] = match;
    if (!books[book]) continue;
    assert.ok(
      existsSync(path.join(ROOT, "public/scriptures/original", book, `${chapter}.json`)),
      `${ref} offers an underlay but ${book} ${chapter} is not hosted`,
    );
  }
});
