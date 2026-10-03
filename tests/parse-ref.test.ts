import assert from "node:assert/strict";
import { describe, it } from "node:test";
import canonsData from "../public/scriptures/canons.json";
import {
  parseRef,
  parseScriptureQueryRef,
} from "../src/lib/scriptures/refs";
import type { Canons } from "../src/lib/scriptures/types";

const canons = canonsData as Canons;

describe("parseRef", () => {
  it("parses a single verse", () => {
    assert.deepEqual(parseRef("JHN 1:1"), {
      book: "JHN",
      chapter: 1,
      verse: 1,
      endVerse: undefined,
      label: "JHN 1:1",
    });
  });

  it("parses a verse range", () => {
    assert.deepEqual(parseRef("LUK 1:26-33"), {
      book: "LUK",
      chapter: 1,
      verse: 26,
      endVerse: 33,
      label: "LUK 1:26-33",
    });
  });

  it("parses numbered books", () => {
    const ref = parseRef("1CO 13:4-7");
    assert.equal(ref?.book, "1CO");
    assert.equal(ref?.chapter, 13);
    assert.equal(ref?.verse, 4);
    assert.equal(ref?.endVerse, 7);
  });

  it("trims whitespace", () => {
    assert.equal(parseRef("  MAT 5:3  ")?.label, "MAT 5:3");
  });

  it("rejects free text and bad shapes", () => {
    assert.equal(parseRef("John 1:1"), null);
    assert.equal(parseRef("JHN1:1"), null);
    assert.equal(parseRef(""), null);
    assert.equal(parseRef("not a ref"), null);
  });
});

describe("parseScriptureQueryRef", () => {
  it("recognizes full book names from human-entered references", () => {
    assert.deepEqual(parseScriptureQueryRef("John 3:16", canons), {
      book: "JHN",
      chapter: 3,
      verse: 16,
      endVerse: undefined,
      label: "JHN 3:16",
    });
  });

  it("recognizes common abbreviations and verse ranges", () => {
    assert.deepEqual(parseScriptureQueryRef("1 Cor. 13:4–7", canons), {
      book: "1CO",
      chapter: 13,
      verse: 4,
      endVerse: 7,
      label: "1CO 13:4-7",
    });
  });

  it("recognizes hosted deuterocanonical books", () => {
    assert.equal(parseScriptureQueryRef("Wisdom 2:12", canons)?.book, "WIS");
    assert.equal(parseScriptureQueryRef("Susanna 1:1", canons)?.book, "SUS");
  });

  it("rejects chapters outside the hosted book", () => {
    assert.equal(parseScriptureQueryRef("John 99:1", canons), null);
    assert.equal(parseScriptureQueryRef("Unknown 1:1", canons), null);
  });
});
