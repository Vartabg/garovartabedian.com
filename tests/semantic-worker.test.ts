import test from "node:test";
import assert from "node:assert/strict";
import { recoveringEmbedder, workerTransport } from "../src/lib/scriptures/semantic-worker";

class FakeWorker extends EventTarget {
  sent: { id: number; texts: string[] }[] = [];
  terminated = false;
  postMessage(message: { id: number; texts: string[] }) { this.sent.push(message); }
  terminate() { this.terminated = true; }
  reply(data: unknown) { this.dispatchEvent(new MessageEvent("message", { data })); }
}

test("an asynchronous worker failure rejects outstanding and future requests", async () => {
  const worker = new FakeWorker(); const embed = workerTransport(worker);
  const first = embed(["word"]); const second = embed(["light"]);
  worker.dispatchEvent(new Event("error"));
  await assert.rejects(first, /worker failed/); await assert.rejects(second, /worker failed/);
  await assert.rejects(embed(["water"]), /worker failed/);
  assert.equal(worker.sent.length, 2); assert.ok(worker.terminated);
});

test("worker inference errors and timeouts terminate failed transports", async () => {
  const worker = new FakeWorker(); const embed = workerTransport(worker, undefined, 10);
  const failed = embed(["word"]); worker.reply({ id: 1, ok: false, error: "model unavailable" });
  await assert.rejects(failed, /model unavailable/);
  const silent = new FakeWorker(); const timed = workerTransport(silent, undefined, 10);
  await assert.rejects(timed(["light"]), /timed out/); assert.ok(silent.terminated);
});

test("success resolves the matching request and clears its failure timer", async () => {
  const worker = new FakeWorker(); const embed = workerTransport(worker, undefined, 10);
  const first = embed(["word"]); worker.reply({ id: 1, ok: true, data: Float32Array.of(1, 0) });
  assert.deepEqual(await first, Float32Array.of(1, 0));
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(worker.terminated, false);
});

test("async primary failure falls back on the same query; fallback initialization can retry", async () => {
  let primaryCalls = 0, fallbackCalls = 0;
  const embed = recoveringEmbedder(async () => async () => { primaryCalls++; throw new Error("dead worker"); }, async () => {
    if (++fallbackCalls === 1) throw new Error("offline");
    return async () => Float32Array.of(1, 0);
  });
  await assert.rejects(embed(["word"]), /offline/);
  assert.deepEqual(await embed(["word"]), Float32Array.of(1, 0));
  assert.deepEqual(await embed(["light"]), Float32Array.of(1, 0));
  assert.equal(primaryCalls, 1); assert.equal(fallbackCalls, 2);
});


test("teardown failure cannot strand pending callers", async () => {
  const worker = new FakeWorker(); worker.terminate = () => { throw new Error("teardown failed"); };
  const embed = workerTransport(worker);
  const request = embed(["word"]);
  worker.dispatchEvent(new Event("error"));
  await assert.rejects(request, /worker failed/);
  await assert.rejects(embed(["light"]), /worker failed/);
});
