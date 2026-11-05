import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SCRIPTURE_STORIES, getScriptureStory } from "../src/lib/scriptures/stories";
import { chapterLength, readSpan } from "../src/lib/scriptures/story-text";

describe("scripture stories", () => {
  const joseph = getScriptureStory("joseph");

  it("opens Joseph from the hosted Genesis text", () => {
    assert.ok(joseph);
    assert.equal(SCRIPTURE_STORIES.length, 1);
    assert.equal(getScriptureStory("missing"), undefined);
    const coat = joseph.parts.find((part) => part.id === "coat");
    assert.equal(coat?.kind, "verses");
    if (coat?.kind !== "verses") return;
    const opening = readSpan(joseph.book, coat.spans[0]);
    assert.match(opening[0].text, /^Jacob lived in the land/);
    assert.match(opening[2].text, /tunic of many colors/);
    const reveal = joseph.parts.find((part) => part.id === "reveal");
    assert.equal(reveal?.kind, "verses");
    if (reveal?.kind !== "verses") return;
    const named = readSpan(joseph.book, reveal.spans[0]).find((verse) => verse.verse === 3);
    assert.match(named?.text ?? "", /I am Joseph/);
    const ending = joseph.parts.find((part) => part.id === "good");
    assert.equal(ending?.kind, "verses");
    if (ending?.kind !== "verses") return;
    const meant = readSpan(joseph.book, ending.spans[0]).find((verse) => verse.verse === 20);
    assert.match(meant?.text ?? "", /you meant evil against me, but God meant it for good/);
  });

  it("keeps every span inside the hosted chapter and does not drop Judah or the household list", () => {
    assert.ok(joseph);
    for (const part of joseph.parts) {
      if (part.kind !== "verses") continue;
      for (const span of part.spans) {
        assert.ok(span.start >= 1 && span.end <= chapterLength(joseph.book, span.chapter), part.id);
        assert.equal(readSpan(joseph.book, span).length, span.end - span.start + 1);
      }
    }
    const judah = joseph.parts.find((part) => part.id === "judah");
    assert.equal(judah?.kind, "bridge");
    if (judah?.kind === "bridge") assert.match(judah.href, /\/GEN\/38/);
    const goshen = joseph.parts.find((part) => part.id === "goshen");
    assert.equal(goshen?.kind, "verses");
    if (goshen?.kind === "verses") {
      assert.equal(goshen.between?.chapter, 46);
      assert.equal(goshen.between?.verse, 8);
      assert.equal(goshen.spans[0].end, 7);
      assert.equal(goshen.spans[1].start, 28);
    }
    const chapters = joseph.parts.flatMap((part) =>
      part.kind === "verses" ? part.spans.map((span) => span.chapter) : [],
    );
    for (let index = 1; index < chapters.length; index += 1) {
      assert.ok(chapters[index] >= chapters[index - 1]);
    }
  });
});
