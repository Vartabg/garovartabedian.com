import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { APOSTLE_STORIES, getApostleStory } from "../src/lib/apostles/stories";
import john from "../public/scriptures/text/web/JHN.json";
import acts from "../public/scriptures/text/web/ACT.json";
import twelve from "../public/apostles/twelve.json";

test("every story has a complete canonical passage and a working record destination", () => {
  const slugs = new Set<string>();
  for (const story of APOSTLE_STORIES) {
    assert.ok(!slugs.has(story.slug)); slugs.add(story.slug);
    const chapter = (story.book === "JHN" ? john : acts).chapters[story.chapter - 1];
    assert.equal(chapter.slice(story.start - 1, story.end).length, story.end - story.start + 1);
    assert.ok(chapter[story.start - 1]);
    if (story.recordHref.includes("#")) {
      assert.ok(twelve.apostles.some((a) => a.id === story.recordHref.split("#")[1]));
    }
    assert.equal(getApostleStory(story.slug)?.title, story.title);
  }
  assert.equal(getApostleStory("not-a-story"), undefined);
});

test("each narrative has two distinct shipped paintings, not repeated scene crops", () => {
  const paths = APOSTLE_STORIES.flatMap((s) => [s.image, s.encounterImage]);
  assert.equal(new Set(paths).size, 6);
  for (const image of paths) assert.ok(fs.existsSync(`public${image}`), image);
});
