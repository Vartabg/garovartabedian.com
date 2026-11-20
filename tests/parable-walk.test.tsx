import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import ParableWalk from "../src/app/jesus/parables/ParableWalk";
import { getParables } from "../src/lib/jesus/server";
import { PARABLE_WALKS, parableWalkFromQuery } from "../src/lib/jesus/parable-walks";
import { parseRef } from "../src/lib/scriptures/refs";
import { readSpan } from "../src/lib/scriptures/story-text";

const ROOT = path.join(import.meta.dirname, "..");

test("the Samaritan walk uses the hosted verses of the existing parable", () => {
  assert.equal(PARABLE_WALKS.length, 1);
  const walk = PARABLE_WALKS[0];
  const parable = getParables().find((item) => item.id === walk.id);
  assert.ok(parable);
  assert.equal(parable.title, "The good Samaritan");
  const account = parseRef(parable.accounts[0].ref);
  assert.ok(account?.endVerse);
  const covered: number[] = [];
  for (const stop of walk.stops) {
    assert.equal(stop.book, account.book);
    assert.equal(stop.chapter, account.chapter);
    assert.ok(stop.start >= account.verse && stop.end <= account.endVerse);
    assert.match(stop.picture.src, /^\/jesus\/parables\/[a-z0-9-]+\.jpg$/);
    assert.equal(stop.picture.alt.includes("Interpretive illustration"), false);
    assert.equal(existsSync(path.join(ROOT, "public", stop.picture.src)), true);
    const verses = readSpan(stop.book, { chapter: stop.chapter, start: stop.start, end: stop.end });
    assert.equal(verses.length, stop.end - stop.start + 1);
    covered.push(...verses.map((verse) => verse.verse));
  }
  assert.deepEqual(covered, Array.from({ length: account.endVerse - account.verse + 1 }, (_, index) => account.verse + index));
});

test("a named story opens on the first moment, and an unknown name does not", () => {
  assert.equal(parableWalkFromQuery(undefined), null);
  assert.equal(parableWalkFromQuery("missing"), null);
  assert.equal(parableWalkFromQuery(["good-samaritan"])?.id, "good-samaritan");

  const closed = renderToStaticMarkup(<ParableWalk />);
  assert.equal(closed.includes("<details"), true);
  assert.equal(closed.includes(" open="), false);
  assert.match(closed, /The good Samaritan/);

  const open = renderToStaticMarkup(<ParableWalk story="good-samaritan" />);
  assert.match(open, /<details[^>]* open=""/);
  assert.match(open, /fell among robbers/);
  assert.match(open, /Go and do likewise/);
  assert.match(open, /<input[^>]*id="good-samaritan-road"[^>]*>/);
  assert.match(open, /<input[^>]*id="good-samaritan-road"[^>]*checked=""|"checked=""[^>]*id="good-samaritan-road"/);
  assert.match(open, /for="good-samaritan-passed"/);
  for (const stop of PARABLE_WALKS[0].stops) assert.match(open, new RegExp(stop.picture.src.replaceAll(".", "\\.")));
});
