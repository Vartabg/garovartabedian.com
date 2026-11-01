import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { saveOfflineChapter, type OfflineChapter } from "../src/lib/scriptures/offline";

const chapter: OfflineChapter = { version: 1, bookId: "JHN", bookName: "John", chapter: 3,
  translation: "web", translationName: "World English Bible", license: "Public domain",
  sourcePath: "/scriptures/text/web/JHN.json", verses: ["For God so loved the world"], savedAt: "2026-10-19T00:00:00Z" };
const original = new Map<string, PropertyDescriptor | undefined>();
let register: () => Promise<ServiceWorkerRegistration>;
let writes: number;
let opens: number;

class Worker extends EventTarget {
  state: ServiceWorkerState = "installing";
  activate() { this.state = "activated"; this.dispatchEvent(new Event("statechange")); }
}
const registration = (worker: Worker) => ({ active: null, waiting: null, installing: worker }) as unknown as ServiceWorkerRegistration;
const drain = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function observe(promise: Promise<unknown>) {
  const result: { state: "pending" | "fulfilled" | "rejected"; error?: unknown } = { state: "pending" };
  void promise.then(() => { result.state = "fulfilled"; }, error => { result.state = "rejected"; result.error = error; });
  return result;
}

beforeEach(() => {
  writes = 0;
  opens = 0;
  let stored: Response | undefined;
  const caches = { open: async () => {
    opens++;
    return { put: async (_key: string, value: Response) => { writes++; stored = value; }, match: async () => stored?.clone() };
  } };
  for (const [key, value] of Object.entries({ window: { isSecureContext: true, caches },
    navigator: { serviceWorker: { register: () => register() } }, caches })) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
});
afterEach(() => {
  for (const [key, descriptor] of original) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  original.clear();
});

test("a slow installation confirms only the activated reader and verified chapter write", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const worker = new Worker();
  let complete!: (value: ServiceWorkerRegistration) => void;
  register = () => new Promise(resolve => { complete = resolve; });
  const pending = saveOfflineChapter(chapter);
  await drain();
  t.mock.timers.tick(10_000);
  assert.equal(writes, 0);
  complete(registration(worker));
  await drain();
  assert.equal(writes, 0, "registration alone cannot claim a saved chapter");
  t.mock.timers.tick(9_999);
  worker.activate();
  assert.equal(await pending, "/scripture-reader/chapters/web/JHN/3.json");
  assert.equal(writes, 1);
});

test("stalled registration times out without writing a chapter or accepting late completion", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const worker = new Worker();
  const added = t.mock.method(worker, "addEventListener");
  let complete!: (value: ServiceWorkerRegistration) => void;
  register = () => new Promise(resolve => { complete = resolve; });
  const result = observe(saveOfflineChapter(chapter));
  await drain();
  t.mock.timers.tick(20_000);
  await drain();
  assert.equal(result.state, "rejected");
  assert.match(String(result.error), /installation timed out/);
  complete(registration(worker));
  await drain();
  worker.activate();
  await drain();
  assert.equal(added.mock.callCount(), 0, "late registration must not retain a listener");
  assert.equal(opens, 0);
  assert.equal(writes, 0);
});

test("the same deadline covers activation and removes its observer on failure", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const worker = new Worker();
  const removed = t.mock.method(worker, "removeEventListener");
  let complete!: (value: ServiceWorkerRegistration) => void;
  register = () => new Promise(resolve => { complete = resolve; });
  const result = observe(saveOfflineChapter(chapter));
  await drain();
  t.mock.timers.tick(10_000);
  complete(registration(worker));
  await drain();
  t.mock.timers.tick(10_000);
  await drain();
  assert.equal(result.state, "rejected", "registration and activation share one deadline");
  assert.match(String(result.error), /installation timed out/);
  assert.equal(removed.mock.callCount(), 1);
  worker.activate();
  await drain();
  assert.equal(writes, 0);
});
