import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SCRIPTURE_STORIES, getScriptureStory, storyStops } from "../src/lib/scriptures/stories";
import { readSpan } from "../src/lib/scriptures/story-text";

describe("scripture stories", () => {
  const joseph = getScriptureStory("joseph");

  it("keeps Joseph to a short path whose lines point at the hosted text", () => {
    assert.ok(joseph);
    assert.equal(SCRIPTURE_STORIES.length, 1);
    assert.equal(getScriptureStory("missing"), undefined);
    const stops = storyStops(joseph);
    assert.equal(stops.length, 8);
    for (const stop of stops) {
      assert.ok(stop.line.split(/\s+/).length <= 16, stop.id);
      for (const cite of stop.cites) {
        const verse = readSpan(joseph.book, { chapter: cite.chapter, start: cite.verse, end: cite.verse })[0];
        assert.ok(verse.text.length > 0, stop.id);
      }
    }
    const sold = stops.find((stop) => stop.id === "sold");
    const soldVerse = readSpan(joseph.book, { chapter: 37, start: 28, end: 28 })[0];
    assert.match(soldVerse.text, /twenty pieces of silver/);
    assert.equal(sold?.cites[0].verse, 28);
    const ending = stops.find((stop) => stop.id === "good");
    assert.equal(ending?.words, true);
    const meant = readSpan(joseph.book, { chapter: 50, start: 20, end: 20 })[0];
    assert.match(meant.text, /you meant evil against me, but God meant it for good/);
    assert.deepEqual(joseph.moves.map((move) => move.label), ["Down", "Up", "Face to face"]);
  });
});
