import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isRenderableSectionPlate,
  sectionImageSrc,
  sectionSlug,
} from "../src/lib/early/sections";

describe("sectionSlug", () => {
  it("slugs arabic chapters", () => {
    assert.equal(sectionSlug("Chapter 12"), "chapter-12");
    assert.equal(sectionSlug("Chapter 1. The Two Ways"), "chapter-1");
  });

  it("slugs roman chapters and fragments", () => {
    assert.equal(sectionSlug("Chapter I"), "chapter-i");
    assert.equal(sectionSlug("Fragment VII"), "fragment-vii");
  });

  it("slugs free headings", () => {
    assert.equal(
      sectionSlug("The Book of the Watchers (chapters 1–36)"),
      "the-book-of-the-watchers-chapters-1-36",
    );
  });

  it("returns undefined for missing headings", () => {
    assert.equal(sectionSlug(undefined), undefined);
    assert.equal(sectionSlug(""), undefined);
  });

  it("builds section image paths", () => {
    assert.equal(
      sectionImageSrc("enoch", "chapter-40"),
      "/early/sections/enoch/chapter-40.jpg",
    );
  });

  it("rejects stub-sized section plates", () => {
    assert.equal(isRenderableSectionPlate(39_999), false);
    assert.equal(isRenderableSectionPlate(40_000), true);
  });
});
