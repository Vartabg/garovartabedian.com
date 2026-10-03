import test from "node:test";
import assert from "node:assert/strict";
import {
  recoveringEmbedder,
  workerTransport,
} from "../src/lib/scriptures/semantic-worker";

type Sent = { id?: number; texts?: string[]; cancel?: number };

class FakeWorker extends EventTarget {
  sent: Sent[] = [];
  terminated = false;
  postMessage(message: Sent) { this.sent.push(message); }
  terminate() { this.terminated = true; }
  reply(data: unknown) { this.dispatchEvent(new MessageEvent("message", { data })); }
}

const isAbort = (error: unknown) => error instanceof Error && error.name === "AbortError";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("abort does not mark the primary failed or start the fallback", async () => {
  let primaryFactoryCalls = 0;
  let fallbackCalls = 0;
  const embed = recoveringEmbedder(
    async () => {
      primaryFactoryCalls++;
      return async (_texts, options) => {
        if (options?.signal?.aborted) {
          const error = new Error("canceled");
          error.name = "AbortError";
          throw error;
        }
        return Float32Array.of(1, 0);
      };
    },
    async () => {
      fallbackCalls++;
      return async () => Float32Array.of(0);
    },
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(embed(["word"], { signal: controller.signal }), isAbort);
  assert.equal(fallbackCalls, 0);
  // The shared primary survives the abort.
  assert.deepEqual(await embed(["word"]), Float32Array.of(1, 0));
  assert.equal(primaryFactoryCalls, 1);
  assert.equal(fallbackCalls, 0);
});

test("a real failure after an abort still recovers through the fallback", async () => {
  let failNext = false;
  let fallbackCalls = 0;
  const embed = recoveringEmbedder(
    async () => async (_texts, options) => {
      if (options?.signal?.aborted) {
        const error = new Error("canceled");
        error.name = "AbortError";
        throw error;
      }
      if (failNext) throw new Error("dead worker");
      return Float32Array.of(1, 0);
    },
    async () => {
      fallbackCalls++;
      return async () => Float32Array.of(0, 1);
    },
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(embed(["word"], { signal: controller.signal }), isAbort);
  failNext = true;
  // A real worker failure still recovers through the fallback on the same
  // call — the earlier abort neither consumed the fallback nor poisoned it.
  assert.deepEqual(await embed(["word"]), Float32Array.of(0, 1));
  assert.equal(fallbackCalls, 1);
  // Recovery is sticky: later calls go straight to the retained fallback.
  assert.deepEqual(await embed(["word"]), Float32Array.of(0, 1));
  assert.equal(fallbackCalls, 1);
});

test("cancellation during shared initialization does not poison the shared embedder", async () => {
  const worker = new FakeWorker();
  let releaseInit!: () => void;
  const initGate = new Promise<void>((resolve) => { releaseInit = resolve; });
  let factoryCalls = 0;
  let fallbackCalls = 0;
  const embed = recoveringEmbedder(
    async () => {
      factoryCalls++;
      await initGate; // Slow shared startup, e.g. the model download.
      return workerTransport(worker);
    },
    async () => {
      fallbackCalls++;
      return async () => Float32Array.of(0);
    },
  );
  const controller = new AbortController();
  const aborted = embed(["word"], { signal: controller.signal });
  controller.abort(); // Cancel while initialization is still in flight.
  releaseInit();
  await assert.rejects(aborted, isAbort);
  assert.equal(worker.sent.length, 0); // The aborted call posted nothing.
  // Initialization itself was not poisoned: the next call reuses it.
  const later = embed(["light"]);
  await sleep(0); // Let the recovered call reach the transport's sync post.
  assert.deepEqual(worker.sent, [{ id: 1, texts: ["light"] }]);
  worker.reply({ id: 1, ok: true, data: Float32Array.of(1, 0) });
  assert.deepEqual(await later, Float32Array.of(1, 0));
  assert.equal(factoryCalls, 1);
  assert.equal(fallbackCalls, 0);
});

test("abort during shared initialization settles promptly and never invokes the embedder", async () => {
  let releaseInit!: () => void;
  const initGate = new Promise<void>((resolve) => { releaseInit = resolve; });
  const inferred: string[] = [];
  let primaryFactoryCalls = 0;
  let fallbackFactoryCalls = 0;
  const embed = recoveringEmbedder(
    async () => {
      primaryFactoryCalls++;
      await initGate; // Slow shared startup, e.g. the model download.
      return async (texts) => { inferred.push(...texts); return Float32Array.of(1); };
    },
    async () => {
      fallbackFactoryCalls++;
      return async () => Float32Array.of(99);
    },
  );
  const controller = new AbortController();
  const abandoned = embed(["old"], { signal: controller.signal });
  const current = embed(["new"]); // A second consumer shares the same factory.
  controller.abort();
  // Settles on abort — before initialization finishes.
  await assert.rejects(abandoned, isAbort);
  releaseInit();
  assert.deepEqual(await current, Float32Array.of(1));
  assert.equal(primaryFactoryCalls, 1); // The shared factory ran exactly once.
  assert.equal(fallbackFactoryCalls, 0); // Abort never touches the fallback.
  assert.deepEqual(inferred, ["new"]); // The abandoned call never ran inference.
});

test("abort before start never creates the primary or fallback factory", async () => {
  let primaryFactoryCalls = 0;
  let fallbackFactoryCalls = 0;
  const embed = recoveringEmbedder(
    async () => { primaryFactoryCalls++; return async () => Float32Array.of(1); },
    async () => { fallbackFactoryCalls++; return async () => Float32Array.of(99); },
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(embed(["word"], { signal: controller.signal }), isAbort);
  assert.equal(primaryFactoryCalls, 0);
  assert.equal(fallbackFactoryCalls, 0);
});

test("recoveringEmbedder guards per-call progress against delivery after abort", async () => {
  const seen: string[] = [];
  const controller = new AbortController();
  const callbacks: {lateProgress?: (status: string) => void} = {};
  const embed = recoveringEmbedder(
    async () => async (_texts, options) => {
      callbacks.lateProgress = options?.onProgress;
      options?.onProgress?.("early");
      await sleep(20); // Long inference; the caller aborts during it.
      return Float32Array.of(1);
    },
    async () => async () => Float32Array.of(0),
  );
  const call = embed(["word"], { signal: controller.signal, onProgress: (s) => seen.push(s) });
  await sleep(5); // Initialization settles; the long inference is now running.
  controller.abort();
  await assert.rejects(call, isAbort);
  callbacks.lateProgress?.("late"); // A lagging implementation callback after cancellation.
  assert.deepEqual(seen, ["early"]);
});
