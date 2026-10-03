import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LONG_TEXT_PLATE_THRESHOLD,
  defaultPlateDensity,
  shouldShowSectionPlate,
} from "../src/lib/early/plate-density";

describe("plate density", () => {
  it("stays full under the long-text threshold", () => {
    assert.equal(defaultPlateDensity(LONG_TEXT_PLATE_THRESHOLD), "full");
    assert.equal(defaultPlateDensity(10), "full");
  });

  it("goes sparse above the threshold", () => {
    assert.equal(defaultPlateDensity(LONG_TEXT_PLATE_THRESHOLD + 1), "sparse");
    assert.equal(defaultPlateDensity(108), "sparse");
  });

  it("shows every plate in full mode", () => {
    for (let i = 0; i < 20; i++) {
      assert.equal(shouldShowSectionPlate("full", i, false), true);
    }
  });

  it("keeps book boundaries and the lead-in when sparse", () => {
    assert.equal(shouldShowSectionPlate("sparse", 0, false), true);
    assert.equal(shouldShowSectionPlate("sparse", 1, false), true);
    assert.equal(shouldShowSectionPlate("sparse", 2, false), true);
    assert.equal(shouldShowSectionPlate("sparse", 99, true), true);
  });

  it("keeps every Nth plate after the lead-in when sparse", () => {
    // SPARSE_LEAD=3, SPARSE_EVERY=4 → show indexes 3, 7, 11, …
    assert.equal(shouldShowSectionPlate("sparse", 3, false), true);
    assert.equal(shouldShowSectionPlate("sparse", 4, false), false);
    assert.equal(shouldShowSectionPlate("sparse", 7, false), true);
    assert.equal(shouldShowSectionPlate("sparse", 8, false), false);
  });
});
