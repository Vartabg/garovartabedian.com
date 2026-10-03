import test from "node:test";
import assert from "node:assert/strict";
import {
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

test("abort before start rejects with AbortError and posts nothing", async () => {
  const worker = new FakeWorker();
  const embed = workerTransport(worker);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(embed(["word"], { signal: controller.signal }), isAbort);
  assert.equal(worker.sent.length, 0);
  assert.equal(worker.terminated, false);
  // The transport stays usable and the aborted call consumed no id.
  const next = embed(["light"]);
  assert.deepEqual(worker.sent, [{ id: 1, texts: ["light"] }]);
  worker.reply({ id: 1, ok: true, data: Float32Array.of(1, 0) });
  assert.deepEqual(await next, Float32Array.of(1, 0));
});

test("abort during pending work rejects only that call, posts cancel, and never terminates", async () => {
  const worker = new FakeWorker();
  const embed = workerTransport(worker, undefined, 25);
  const controller = new AbortController();
  const canceled = embed(["word"], { signal: controller.signal });
  const live = embed(["light"]);
  controller.abort();
  await assert.rejects(canceled, isAbort);
  assert.deepEqual(worker.sent.at(-1), { cancel: 1 });
  assert.equal(worker.terminated, false);
  // The other caller is untouched and resolves normally.
  worker.reply({ id: 2, ok: true, data: Float32Array.of(0, 1) });
  assert.deepEqual(await live, Float32Array.of(0, 1));
  // Waiting past the canceled call's original timeout proves its timer was
  // removed: a leaked timer would have terminated the whole transport.
  await sleep(40);
  assert.equal(worker.terminated, false);
  const next = embed(["water"]);
  worker.reply({ id: 3, ok: true, data: Float32Array.of(1, 1) });
  assert.deepEqual(await next, Float32Array.of(1, 1));
});

test("two clients, one canceled: scoped progress reaches only the live caller", async () => {
  const worker = new FakeWorker();
  const legacy: string[] = [];
  const embed = workerTransport(worker, (status) => legacy.push(status));
  const controller = new AbortController();
  const aProgress: string[] = [];
  const bProgress: string[] = [];
  const a = embed(["word"], { signal: controller.signal, onProgress: (s) => aProgress.push(s) });
  const b = embed(["light"], { onProgress: (s) => bProgress.push(s) });
  controller.abort();
  await assert.rejects(a, isAbort);
  worker.reply({ id: 2, progress: "Downloading model — 40%" });
  worker.reply({ id: 1, progress: "late progress for the canceled call" });
  assert.deepEqual(bProgress, ["Downloading model — 40%"]);
  assert.deepEqual(aProgress, []); // No progress for canceled calls.
  assert.deepEqual(legacy, []); // Scoped progress bypasses the shared callback.
  worker.reply({ id: 2, ok: true, data: Float32Array.of(1) });
  assert.deepEqual(await b, Float32Array.of(1));
});

test("legacy broadcast reaches the shared callback and each live caller's own handler", async () => {
  const worker = new FakeWorker();
  const legacy: string[] = [];
  const embed = workerTransport(worker, (status) => legacy.push(status));
  const own: string[] = [];
  const a = embed(["word"], { onProgress: (s) => own.push(s) });
  const b = embed(["light"]);
  worker.reply({ id: 0, progress: "Downloading model — 10%" });
  assert.deepEqual(legacy, ["Downloading model — 10%"]);
  assert.deepEqual(own, ["Downloading model — 10%"]);
  worker.reply({ id: 1, ok: true, data: Float32Array.of(1) });
  worker.reply({ id: 2, ok: true, data: Float32Array.of(2) });
  assert.deepEqual(await a, Float32Array.of(1));
  assert.deepEqual(await b, Float32Array.of(2));
});

test("a real worker failure still terminates and rejects everyone, canceled or not", async () => {
  const worker = new FakeWorker();
  const embed = workerTransport(worker);
  const controller = new AbortController();
  const canceled = embed(["word"], { signal: controller.signal });
  const live = embed(["light"]);
  controller.abort();
  await assert.rejects(canceled, isAbort);
  worker.dispatchEvent(new Event("error"));
  await assert.rejects(live, /worker failed/);
  assert.ok(worker.terminated);
  await assert.rejects(embed(["water"]), /worker failed/);
});

test("legacy broadcast with no live callers notifies nobody", async () => {
  const worker = new FakeWorker();
  const legacy: string[] = [];
  const embed = workerTransport(worker, (status) => legacy.push(status));
  const controller = new AbortController();
  const canceled = embed(["word"], { signal: controller.signal });
  controller.abort(); // The last live caller goes away.
  await assert.rejects(canceled, isAbort);
  worker.reply({ id: 0, progress: "Downloading model — 50%" });
  assert.deepEqual(legacy, []); // A broadcast with no audience calls nobody.
});

test("legacy broadcast honors per-call overrides and dedupes the shared callback", async () => {
  const worker = new FakeWorker();
  const legacy: string[] = [];
  const embed = workerTransport(worker, (status) => legacy.push(status));
  const a: string[] = [];
  const b: string[] = [];
  // Every live caller has its own handler: the legacy callback must stay out.
  const first = embed(["word"], { onProgress: (s) => a.push(s) });
  const second = embed(["light"], { onProgress: (s) => b.push(s) });
  worker.reply({ id: 0, progress: "Downloading model — 10%" });
  assert.deepEqual(a, ["Downloading model — 10%"]);
  assert.deepEqual(b, ["Downloading model — 10%"]);
  assert.deepEqual(legacy, []);
  worker.reply({ id: 1, ok: true, data: Float32Array.of(1) });
  worker.reply({ id: 2, ok: true, data: Float32Array.of(2) });
  await first; await second;
  // Two live callers without handlers share the legacy callback — called once.
  const third = embed(["water"]);
  const fourth = embed(["wine"]);
  worker.reply({ id: 0, progress: "Downloading model — 20%" });
  assert.deepEqual(legacy, ["Downloading model — 20%"]);
  worker.reply({ id: 3, ok: true, data: Float32Array.of(3) });
  worker.reply({ id: 4, ok: true, data: Float32Array.of(4) });
  await third; await fourth;
});
