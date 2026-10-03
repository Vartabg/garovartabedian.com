import test from "node:test";
import assert from "node:assert/strict";
import { createEmbedMessageHandler, type WorkerResponse } from "../src/lib/scriptures/embedder.worker";
import { createCancelQueue } from "../src/lib/scriptures/cancel-queue";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test("tasks are serialized in enqueue order", async () => {
  const queue = createCancelQueue();
  const events: string[] = [];
  const first = gate();
  queue.enqueue(1, async () => { events.push("start1"); await first.promise; events.push("end1"); });
  queue.enqueue(2, async () => { events.push("start2"); });
  await sleep(5);
  assert.deepEqual(events, ["start1"]); // The second waits for the first.
  first.release();
  await sleep(5);
  assert.deepEqual(events, ["start1", "end1", "start2"]);
  assert.equal(queue.size(), 0);
});

test("canceling queued work skips it entirely", async () => {
  const queue = createCancelQueue();
  const ran: number[] = [];
  const first = gate();
  queue.enqueue(1, async () => { await first.promise; ran.push(1); });
  queue.enqueue(2, async () => { ran.push(2); });
  queue.enqueue(3, async () => { ran.push(3); });
  assert.equal(queue.cancel(2), "queued");
  first.release();
  await sleep(5);
  assert.deepEqual(ran, [1, 3]);
  assert.equal(queue.size(), 0);
});

test("canceling running work cannot interrupt it but is observable for suppression", async () => {
  const queue = createCancelQueue();
  const first = gate();
  let started = false;
  let sawCanceled = false;
  queue.enqueue(7, async (isCanceled) => {
    started = true;
    await first.promise; // The WASM call keeps running through the cancel.
    sawCanceled = isCanceled();
  });
  await sleep(5);
  assert.ok(started);
  assert.equal(queue.cancel(7), "running");
  first.release();
  await sleep(5);
  assert.equal(sawCanceled, true);
  assert.equal(queue.size(), 0); // The suppressed id is released, not stored.
});

test("live() lists waiting callers and drops canceled ones", async () => {
  const queue = createCancelQueue();
  const first = gate();
  queue.enqueue(1, async () => { await first.promise; });
  queue.enqueue(2, async () => {});
  await sleep(5);
  assert.deepEqual(queue.live(), [1, 2]);
  queue.cancel(2);
  assert.deepEqual(queue.live(), [1]);
  queue.cancel(1);
  assert.deepEqual(queue.live(), []); // Canceled callers get no further progress.
  first.release();
  await sleep(5);
  assert.equal(queue.size(), 0);
});

test("canceling an unknown or finished id retains nothing", async () => {
  const queue = createCancelQueue();
  assert.equal(queue.cancel(999), "unknown");
  assert.equal(queue.size(), 0);
  queue.enqueue(1, async () => {});
  await sleep(5);
  assert.equal(queue.cancel(1), "unknown");
  assert.equal(queue.size(), 0);
});

test("a throwing task does not stall the queue", async () => {
  const queue = createCancelQueue();
  const ran: number[] = [];
  queue.enqueue(1, async () => { throw new Error("inference blew up"); });
  queue.enqueue(2, async () => { ran.push(2); });
  await sleep(5);
  assert.deepEqual(ran, [2]);
  assert.equal(queue.size(), 0);
});

test("worker handler: cancel during model initialization skips the abandoned inference", async () => {
  const posted: WorkerResponse[] = [];
  const scope = {
    postMessage: (message: WorkerResponse) => { posted.push(message); },
  };
  let releaseInit!: () => void;
  const initGate = new Promise<void>((resolve) => { releaseInit = resolve; });
  let extractCalls = 0;
  const handleMessage = createEmbedMessageHandler(scope, async () => {
    await initGate; // The shared model is still loading.
    return async () => { extractCalls++; return { data: Float32Array.of(1) }; };
  });
  handleMessage({ id: 1, texts: ["abandoned"] });
  await sleep(5);
  handleMessage({ cancel: 1 }); // Canceled during initialization.
  releaseInit();
  await sleep(5);
  assert.equal(extractCalls, 0); // The abandoned inference never started.
  assert.equal(posted.length, 0); // Nothing posted for the canceled id.
  // The shared model load survived: the next request reuses it and resolves.
  handleMessage({ id: 2, texts: ["current"] });
  await sleep(5);
  assert.equal(extractCalls, 1);
  const reply = posted.at(-1);
  assert.ok(reply && reply.id === 2 && "ok" in reply && reply.ok);
});
