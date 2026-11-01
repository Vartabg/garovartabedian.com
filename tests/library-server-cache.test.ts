import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLibraryServerCache } from "../src/lib/early/library-server-cache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
  return { promise, resolve, reject };
}

describe("production library process cache", () => {
  it("shares an in-flight and successful index between independent API and RSC consumers", async () => {
    const host = {};
    const options = { production: true, directory: "/checkout/content/early-library", schema: "v1", host };
    const api = createLibraryServerCache(options);
    const rsc = createLibraryServerCache(options);
    const loading = deferred<{ search: (query: string) => string }>();
    let apiLoads = 0;
    let rscLoads = 0;
    const first = api.get("search", () => { apiLoads += 1; return loading.promise; });
    const second = rsc.get<{ search: (query: string) => string }>("search", async () => { rscLoads += 1; return { search: () => "wrong index" }; });
    assert.equal(first, second);
    await Promise.resolve();
    assert.equal(apiLoads, 1);
    assert.equal(rscLoads, 0);
    const index = { search: (query: string) => `source result: ${query}` };
    loading.resolve(index);
    assert.equal((await first).search("love your enemies"), "source result: love your enemies");
    assert.equal(await second, index);
    const later = createLibraryServerCache(options).get("search", async () => { throw new Error("must not reload"); });
    assert.equal(later, first);
    assert.equal(await later, index);
  });

  it("evicts a rejected shared promise and single-flights the retry", async () => {
    const options = { production: true, directory: "/checkout", schema: "v1", host: {} };
    const firstConsumer = createLibraryServerCache(options);
    const secondConsumer = createLibraryServerCache(options);
    const loading = deferred<string>();
    let loads = 0;
    const first = firstConsumer.get("catalog", () => { loads += 1; return loading.promise; });
    const second = secondConsumer.get("catalog", async () => "must not run");
    const rejection = assert.rejects(first, /temporary read failure/);
    loading.reject(new Error("temporary read failure"));
    await rejection;
    await assert.rejects(second, /temporary read failure/);
    const retry = secondConsumer.get("catalog", async () => { loads += 1; return "confirmed catalog"; });
    const joinedRetry = firstConsumer.get("catalog", async () => "must not run");
    assert.notEqual(retry, first);
    assert.equal(retry, joinedRetry);
    assert.equal(await retry, "confirmed catalog");
    assert.equal(loads, 2);
  });

  it("also retries a loader that throws before returning a promise", async () => {
    const cache = createLibraryServerCache({ production: true, directory: "/checkout", schema: "v1", host: {} });
    const failed = cache.get("search", () => { throw new Error("invalid source"); });
    await assert.rejects(failed, /invalid source/);
    assert.equal(await cache.get("search", async () => "new index"), "new index");
  });

  it("isolates checkouts, schema versions and catalog versus index resources", async () => {
    const host = {};
    const base = { production: true, directory: "/checkout-a", schema: "v1", host };
    const first = createLibraryServerCache(base);
    const otherCheckout = createLibraryServerCache({ ...base, directory: "/checkout-b" });
    const otherSchema = createLibraryServerCache({ ...base, schema: "v2" });
    const values = await Promise.all([
      first.get("catalog", async () => "a catalog"),
      first.get("search", async () => "a index"),
      otherCheckout.get("search", async () => "b index"),
      otherSchema.get("search", async () => "new schema index"),
    ]);
    assert.deepEqual(values, ["a catalog", "a index", "b index", "new schema index"]);
  });

  it("keeps nonproduction consumers local without writing shared host state", async () => {
    const host = Object.freeze({});
    const options = { production: false, directory: "/checkout", schema: "v1", host };
    const beforeReload = createLibraryServerCache(options);
    const afterReload = createLibraryServerCache(options);
    assert.equal(await beforeReload.get("search", async () => "old development index"), "old development index");
    assert.equal(await beforeReload.get("search", async () => "must not reload"), "old development index");
    assert.equal(await afterReload.get("search", async () => "new development index"), "new development index");
    assert.deepEqual(Reflect.ownKeys(host), []);
  });
});
