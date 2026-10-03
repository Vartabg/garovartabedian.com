import assert from "node:assert/strict";
import test from "node:test";
import { loadQueryEmbedder } from "../src/lib/scriptures/semantic";

test("shared query engine gives later clients their own progress and survives the first client's abort", {timeout:5000}, async t => {
  const workers: StubWorker[] = [];
  let currentPosted!: () => void, laterPosted!: () => void;
  const currentReady = new Promise<void>(resolve => { currentPosted = resolve; });
  const laterReady = new Promise<void>(resolve => { laterPosted = resolve; });
  class StubWorker extends EventTarget {
    sent: {id?: number; texts?: string[]; cancel?: number}[] = [];
    terminated = false;
    constructor() { super(); workers.push(this); }
    postMessage(message: {id?: number; texts?: string[]; cancel?: number}) { this.sent.push(message);
      if (message.texts?.[0] === "current") currentPosted();
      if (message.texts?.[0] === "later") laterPosted();
    }
    terminate() { this.terminated = true; }
    reply(message: unknown) { this.dispatchEvent(new MessageEvent("message", {data:message})); }
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, "Worker");
  Object.defineProperty(globalThis, "Worker", {configurable:true, value:StubWorker});
  t.after(() => { if (original) Object.defineProperty(globalThis, "Worker", original);
    else Reflect.deleteProperty(globalThis, "Worker"); });
  const firstProgress: string[] = [], nextProgress: string[] = [], laterProgress: string[] = [];
  const first = await loadQueryEmbedder();
  const next = await loadQueryEmbedder();
  assert.equal(workers.length, 0); // Loading a client alone does not download the model.
  const controller = new AbortController();
  const abandoned = first(["old"], {signal:controller.signal, onProgress:status => firstProgress.push(status)});
  const canceled = assert.rejects(abandoned, {name:"AbortError"});
  const current = next(["current"], {onProgress:status => nextProgress.push(status)});
  await currentReady;
  const worker = workers[0];
  assert.equal(workers.length, 1);
  controller.abort(); await canceled;
  worker.reply({id:0, progress:"loading"});
  assert.deepEqual(firstProgress, []);
  assert.deepEqual(nextProgress, ["loading"]);
  worker.reply({id:worker.sent.find(x => x.texts?.[0] === "current")!.id, ok:true, data:new Float32Array([1])});
  assert.deepEqual(await current, new Float32Array([1]));
  const later = first(["later"], {onProgress:status => laterProgress.push(status)});
  await laterReady;
  const laterId = worker.sent.find(x => x.texts?.[0] === "later")!.id;
  worker.reply({id:laterId, progress:"ready"});
  worker.reply({id:laterId, ok:true, data:new Float32Array([2])});
  await later;
  assert.deepEqual(laterProgress, ["ready"]);
  assert.deepEqual(firstProgress, []);
  assert.equal(worker.terminated, false);
});
