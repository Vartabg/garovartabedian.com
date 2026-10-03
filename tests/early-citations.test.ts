import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { chapterAnchors, chapterNumber, resolveEarlyChapter } from "../src/lib/early/citations";
import { sectionSlug } from "../src/lib/early/sections";
import { CATENA_RECEPTION } from "../src/lib/scriptures/catena";
import type { EarlyText } from "../src/lib/early/types";

describe("early-writing chapter citations", () => {
  it("normalizes Arabic and canonical Roman headings independently of titles", () => {
    assert.equal(chapterNumber("Chapter XVI.—Christ as an example of humility."), 16);
    assert.equal(chapterNumber("Chapter 16. A revised title"), 16);
    assert.equal(chapterNumber("Chapter XLIX"), 49);
    for (const heading of [undefined, "Chapter IIII", "Chapter IIX", "Chapter CIVIC", "Chapter 0", "Fragment XVI"]) {
      assert.equal(chapterNumber(heading), undefined);
    }
  });

  it("refuses a missing or ambiguous chapter instead of falling back to an index", () => {
    const sections = [{ heading: "Chapter XVI" }, { heading: "Chapter 16" }];
    assert.throws(() => resolveEarlyChapter(sections, 16), /found 2/);
    assert.throws(() => resolveEarlyChapter(sections, 17), /found 0/);
    assert.deepEqual(chapterAnchors(sections), [undefined, undefined]);
  });

  it("resolves every Catena link to the intended chapter across different introduction offsets", () => {
    for (const entry of CATENA_RECEPTION) {
      const text: EarlyText = JSON.parse(readFileSync(`public/early/texts/${entry.workId}.json`, "utf8"));
      const section = resolveEarlyChapter(text.sections, entry.section);
      const anchor = chapterAnchors(text.sections)[text.sections.indexOf(section)];
      assert.equal(entry.href, `/early/${entry.workId}#${anchor}`, entry.id);
      if (entry.id === "catena-isa-53-5-clement") {
        assert.equal(text.sections.indexOf(section), 15);
        assert.ok(section.paragraphs[0].includes(entry.excerpt));
      }
      if (entry.workId === "didache" && entry.section === 8) assert.equal(text.sections.indexOf(section), 8);
    }
  });

  it("adds no duplicate numeric aliases alongside the existing heading anchors across hosted texts", () => {
    for (const file of readdirSync("public/early/texts").filter((file) => file.endsWith(".json"))) {
      const text: EarlyText = JSON.parse(readFileSync(`public/early/texts/${file}`, "utf8"));
      const existing = text.sections.map((section) => sectionSlug(section.heading));
      const aliases = chapterAnchors(text.sections).filter((anchor, index) => anchor && anchor !== existing[index]);
      assert.equal(new Set(aliases).size, aliases.length, file);
      assert.ok(aliases.every((anchor) => !existing.includes(anchor)), file);
    }
  });
});
