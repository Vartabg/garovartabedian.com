import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalTraditionId,
  scriptureCanonicalPath,
  sharesProtestantWebText,
  topicCanonicalPath,
} from "../src/lib/scriptures/canonical";

describe("scripture canonicals", () => {
  it("keeps Protestant pages on the Protestant URL", () => {
    assert.equal(scriptureCanonicalPath("protestant", "JHN", 3), "/scriptures/protestant/JHN/3");
    assert.equal(scriptureCanonicalPath("protestant", "GEN"), "/scriptures/protestant/GEN");
  });

  it("rewrites Ethiopian/Armenian WEB overlap to Protestant", () => {
    assert.equal(scriptureCanonicalPath("ethiopian", "JHN", 3), "/scriptures/protestant/JHN/3");
    assert.equal(scriptureCanonicalPath("armenian", "GEN"), "/scriptures/protestant/GEN");
    assert.ok(sharesProtestantWebText("ethiopian", "JHN"));
  });

  it("rewrites Orthodox NT (WEB; no Brenton) to Protestant", () => {
    assert.equal(scriptureCanonicalPath("orthodox", "JHN", 3), "/scriptures/protestant/JHN/3");
    assert.equal(canonicalTraditionId("orthodox", "MAT"), "protestant");
  });

  it("keeps Catholic DRB books on the Catholic URL", () => {
    assert.equal(scriptureCanonicalPath("catholic", "JHN", 3), "/scriptures/catholic/JHN/3");
    assert.equal(scriptureCanonicalPath("catholic", "TOB"), "/scriptures/catholic/TOB");
    assert.equal(sharesProtestantWebText("catholic", "JHN"), false);
  });

  it("keeps Orthodox Brenton OT on the Orthodox URL", () => {
    assert.equal(scriptureCanonicalPath("orthodox", "GEN", 1), "/scriptures/orthodox/GEN/1");
    assert.equal(canonicalTraditionId("orthodox", "GEN"), "orthodox");
  });

  it("keeps books that are not on the Protestant shelf", () => {
    assert.equal(scriptureCanonicalPath("ethiopian", "TOB"), "/scriptures/ethiopian/TOB");
    assert.equal(scriptureCanonicalPath("ethiopian", "LJE"), "/scriptures/ethiopian/LJE");
    assert.equal(scriptureCanonicalPath("orthodox", "PS2"), "/scriptures/orthodox/PS2");
    assert.equal(scriptureCanonicalPath("armenian", "3MA"), "/scriptures/armenian/3MA");
  });

  it("topic canonicals are a single /scriptures/topics/{id} URL", () => {
    assert.equal(topicCanonicalPath("FAITH"), "/scriptures/topics/FAITH");
    assert.equal(
      topicCanonicalPath("JESUS, THE CHRIST"),
      "/scriptures/topics/JESUS%2C%20THE%20CHRIST",
    );
  });
});
