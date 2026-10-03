import assert from "node:assert/strict";
import test from "node:test";
import { inlineEmbedder, type InlineExtractor } from "../src/lib/scriptures/inline-embedder";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return {promise, resolve};
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test("inline cancellation during shared initialization skips inference and isolates progress", async () => {
  const ready = deferred<InlineExtractor>();
  const calls: string[][] = [], firstProgress: string[] = [], secondProgress: string[] = [];
  let notify!: (status: string) => void, loads = 0;
  const embed = inlineEmbedder(async progress => { loads++; notify = progress; return ready.promise; });
  const controller = new AbortController();
  const first = embed(["abandoned"], {signal: controller.signal, onProgress: s => firstProgress.push(s)});
  const canceled = assert.rejects(first, {name: "AbortError"});
  const second = embed(["current"], {onProgress: s => secondProgress.push(s)});
  await tick();
  notify("loading");
  controller.abort(); await canceled;
  notify("almost ready");
  ready.resolve(async texts => { calls.push(texts); return {data: new Float32Array([1])}; });
  assert.deepEqual(await second, new Float32Array([1]));
  assert.deepEqual(calls, [["current"]]);
  assert.equal(loads, 1);
  assert.deepEqual(firstProgress, ["loading"]);
  assert.deepEqual(secondProgress, ["loading", "almost ready"]);
  notify("late");
  assert.equal(secondProgress.length, 2);
});

test("inline abort settles promptly but serializes real inference until disposal", async () => {
  const finished = deferred<{data: Float32Array; dispose: () => void}>();
  const entered = deferred<void>();
  const calls: string[] = [];
  let disposed = 0;
  const embed = inlineEmbedder(async () => async texts => {
    calls.push(texts[0]);
    if (texts[0] === "running") { entered.resolve(); return finished.promise; }
    return {data: new Float32Array([2])};
  });
  const controller = new AbortController();
  const first = embed(["running"], {signal:controller.signal});
  const canceled = assert.rejects(first, {name:"AbortError"});
  await entered.promise;
  const queuedController = new AbortController();
  const queued = embed(["skip queued"], {signal: queuedController.signal});
  const queuedCanceled = assert.rejects(queued, {name:"AbortError"});
  const current = embed(["current"]);
  controller.abort(); queuedController.abort();
  await Promise.all([canceled, queuedCanceled]); await tick();
  assert.deepEqual(calls, ["running"]);
  finished.resolve({data:new Float32Array([1]), dispose: () => { disposed++; }});
  assert.deepEqual(await current, new Float32Array([2]));
  assert.deepEqual(calls, ["running", "current"]);
  assert.equal(disposed, 1);
});

test("inline model failure remains retryable and pre-aborted calls do not initialize", async () => {
  let loads = 0;
  const embed = inlineEmbedder(async () => {
    if (++loads === 1) throw new Error("model unavailable");
    return async () => ({data: new Float32Array([3])});
  });
  const controller = new AbortController(); controller.abort();
  await assert.rejects(embed(["skip"], {signal: controller.signal}), {name:"AbortError"});
  assert.equal(loads, 0);
  await assert.rejects(embed(["fail"]), /model unavailable/);
  assert.deepEqual(await embed(["retry"]), new Float32Array([3]));
  assert.equal(loads, 2);
});
