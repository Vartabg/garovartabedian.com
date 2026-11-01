import assert from "node:assert/strict";
import test from "node:test";
import { preserveWordBridge, wordBridgeHref, wordBridgeTarget } from "../src/lib/scriptures/word-bridge-url";

test("a shared Word Bridge link selects WEB and opens exactly its verse", () => {
  const href = wordBridgeHref("protestant", "JHN", 3, 16);
  const url = new URL(href, "https://local.invalid");
  assert.equal(url.searchParams.get("t"), "web");
  assert.equal(wordBridgeTarget(url.search, url.hash, 36), 16);
  assert.equal(wordBridgeTarget("?t=web", "#v16", 36), null);
  assert.equal(wordBridgeTarget("?study=word-bridge", "", 36), 1);
});

test("tool targets reject out-of-chapter, malformed and unsafe verse values", () => {
  for (const hash of ["#v0", "#v37", "#v-1", "#v1.5", "#v999999999999999999999", "#v16/../../", "#study"]) {
    assert.equal(wordBridgeTarget("?study=word-bridge", hash, 36), null, hash);
  }
  assert.equal(wordBridgeTarget("?study=other", "#v16", 36), null);
  assert.equal(wordBridgeTarget("?study=word-bridge", "#v1", 0), null);
});

test("internal bridge URLs reject path injection and invalid passage numbers", () => {
  for (const args of [["//elsewhere", "JHN", 3, 16], ["protestant", "../", 3, 16], ["protestant", "JHN", 0, 16], ["protestant", "JHN", 3, Infinity]] as const) {
    assert.throws(() => wordBridgeHref(args[0], args[1], args[2], args[3]));
  }
});

test("edition changes keep an explicit study request and the same verse", () => {
  const href = "/scriptures/protestant/JHN/3?t=kjv&o=1#v16";
  const url = new URL(preserveWordBridge(href, new URLSearchParams("study=word-bridge&untrusted=ignored")), "https://local.invalid");
  assert.equal(url.searchParams.get("t"), "kjv");
  assert.equal(url.searchParams.get("o"), "1");
  assert.equal(url.searchParams.get("study"), "word-bridge");
  assert.equal(url.searchParams.has("untrusted"), false);
  assert.equal(url.hash, "#v16");
  assert.equal(preserveWordBridge(href, new URLSearchParams()), href);
});
