import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SCRIPTURE_STORIES, getScriptureStory, storyStops } from "../src/lib/scriptures/stories";
import { readSpan } from "../src/lib/scriptures/story-text";

describe("scripture stories", () => {
  const joseph = getScriptureStory("joseph");

  it("keeps Joseph to a short path whose lines point at the hosted text", () => {
    assert.ok(joseph);
    assert.equal(SCRIPTURE_STORIES.length, 14);
    assert.equal(getScriptureStory("missing"), undefined);
    for (const story of SCRIPTURE_STORIES) {
      const path = storyStops(story);
      assert.ok(path.length >= 5 && path.length <= 8, story.slug);
      assert.equal(path.filter((stop) => stop.words).length, 1, story.slug);
      const lowest = Math.max(...path.filter((stop) => stop.place.side === "left").map((stop) => stop.place.y));
      const highest = Math.min(...path.filter((stop) => stop.place.side === "right").map((stop) => stop.place.y));
      assert.ok(highest < lowest, story.slug);
      for (const stop of path) {
        assert.ok(stop.line.split(/\s+/).length <= 16, `${story.slug}:${stop.id}`);
        assert.ok(stop.mark.length > 0 && stop.mark.length <= 12, `${story.slug}:${stop.id}`);
        for (const cite of stop.cites) {
          const verse = readSpan(story.book, { chapter: cite.chapter, start: cite.verse, end: cite.verse })[0];
          assert.ok(verse.text.length > 0, `${story.slug}:${stop.id}`);
        }
      }
    }
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
    const forgotten = stops.find((stop) => stop.id === "forgotten");
    const egypt = stops.find((stop) => stop.id === "egypt");
    const tunic = stops.find((stop) => stop.id === "tunic");
    assert.ok(forgotten && egypt && tunic);
    assert.ok(forgotten.place.y > tunic.place.y, "the pit sits lower than the tunic");
    assert.ok(egypt.place.y < forgotten.place.y, "Egypt rises above the pit");
    assert.ok(stops.every((stop) => stop.mark.length > 0 && stop.mark.length <= 12));
  });
});
