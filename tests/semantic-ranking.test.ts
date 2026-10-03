import assert from "node:assert/strict";
import test from "node:test";
import { rankRows, rankRowsAsync } from "../src/lib/scriptures/semantic-ranking";
import { waitForShared, yieldToBrowser } from "../src/lib/scriptures/semantic-task";
import { rankCorpusRows, rankCorpusRowsAsync, searchCorpus, searchUnifiedCorpora,
  type CorpusIndex, type WordsEntry } from "../src/lib/semantic-corpus";
import { searchSemantic } from "../src/lib/scriptures/semantic";
import { searchOmniResonance } from "../src/lib/semantic-resonance";

test("cooperative ranking preserves exact scores and stable ties for every top-k", async () => {
  const dims = 8;
  const rows = Int8Array.from({ length: dims * 1000 }, (_, i) => (i * 73 % 255) - 127);
  const query = Float32Array.from({ length: dims }, (_, i) => Math.sin(i));
  for (const k of [0, 1, 12, 40, 1000, 1200]) {
    assert.deepEqual(await rankRowsAsync(query, rows, dims, k), rankRows(query, rows, dims, k));
  }
  assert.deepEqual((await rankRowsAsync([0], new Int8Array(600), 1, 40)).map(x => x.row),
    Array.from({ length: 40 }, (_, i) => i));
});

test("ranking yields between bounded batches and cancellation stops later work", async () => {
  let yields = 0;
  const controller = new AbortController();
  await assert.rejects(rankRowsAsync([1], new Int8Array(1000), 1, 10, {
    signal: controller.signal, budgetMs: 0,
    yieldControl: async () => { yields++; controller.abort(); },
  }), { name: "AbortError" });
  assert.equal(yields, 1);
});

test("ranking rejects pre-aborted calls and malformed input", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(rankRowsAsync([1], new Int8Array(1), 1, 1, {signal:controller.signal}), {name:"AbortError"});
  await assert.rejects(rankRowsAsync([NaN], new Int8Array(1), 1, 1), /invalid/);
  await assert.rejects(rankRowsAsync([1], new Int8Array(1), 1, -1), /limit/);
});

test("canceling one shared wait preserves another consumer and observes later failure", async () => {
  let complete!: (value: number) => void;
  const shared = new Promise<number>(resolve => { complete = resolve; });
  const controller = new AbortController();
  const abandoned = waitForShared(shared, controller.signal);
  const rejected = assert.rejects(abandoned, {name:"AbortError"});
  const current = waitForShared(shared);
  controller.abort(); await rejected;
  complete(42); assert.equal(await current, 42);
  await assert.rejects(waitForShared(Promise.reject(new Error("shared failure")), controller.signal), {name:"AbortError"});
});

test("scheduler enhancement and task fallback both let work continue", async t => {
  let calls = 0;
  const original = Object.getOwnPropertyDescriptor(globalThis, "scheduler");
  t.after(() => { if (original) Object.defineProperty(globalThis, "scheduler", original);
    else Reflect.deleteProperty(globalThis, "scheduler"); });
  Object.defineProperty(globalThis, "scheduler", {configurable: true, value: {yield: async () => { calls++; }}});
  await yieldToBrowser(); assert.equal(calls, 1);
  Object.defineProperty(globalThis, "scheduler", {configurable: true, value: undefined});
  await yieldToBrowser();
});

test("cooperative corpus ranking preserves strongest excerpts and parent deduplication", async () => {
  const index: CorpusIndex<WordsEntry> = {corpus:"words", model:"fixture", dims:1, quantization:"int8-unit-127",
    entries: Array.from({length: 512}, (_, i) => ({id:`chunk-${i}`, parentId:`parent-${i % 20}`,
      book:"MAT", chapter:1, verse:i + 1, label:`Verse ${i + 1}`}))};
  const rows = Int8Array.from({length:512}, (_, i) => (i * 13 % 255) - 127);
  for (const limit of [0, 1, 8, 12, 20, 600]) {
    const actual = await rankCorpusRowsAsync([1], index, rows, limit, {budgetMs:0, yieldControl: async () => {}});
    assert.deepEqual(actual, rankCorpusRows([1], index, rows, limit));
    assert.equal(new Set(actual.map(x => index.entries[x.row].parentId)).size, actual.length);
  }
});

test("all browser search APIs reject pre-aborted calls before fetching or reporting progress", async t => {
  let fetches = 0, progress = 0;
  t.mock.method(globalThis, "fetch", async () => { fetches++; throw new Error("unexpected fetch"); });
  const controller = new AbortController(); controller.abort();
  const options = {signal:controller.signal, onProgress: () => { progress++; }};
  await assert.rejects(searchSemantic("light", options.onProgress, options), {name:"AbortError"});
  await assert.rejects(searchCorpus("words", "light", options), {name:"AbortError"});
  await assert.rejects(searchUnifiedCorpora("light", options), {name:"AbortError"});
  await assert.rejects(searchOmniResonance("light", options), {name:"AbortError"});
  assert.equal(fetches, 0); assert.equal(progress, 0);
});
