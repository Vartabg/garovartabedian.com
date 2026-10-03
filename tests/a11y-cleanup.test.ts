import assert from "node:assert/strict";
import test from "node:test";
import { settleBrowserCleanup } from "../scripts/a11y/cleanup.mjs";

test("a clean first attempt resolves empty and reports nothing", async () => {
  let attempts = 0;
  const reports: [number, boolean][] = [];
  const failures = await settleBrowserCleanup(async () => {
    attempts += 1;
    return [];
  }, {
    onFailures: (list, willRetry) => reports.push([list.length, willRetry]),
  });
  assert.deepEqual(failures, []);
  assert.equal(attempts, 1);
  assert.deepEqual(reports, []);
});

test("a transient teardown race retries once and settles clean", async () => {
  const outcomes = [[new Error("kill ESRCH: Chrome already exiting")], []];
  let attempts = 0;
  const reported: boolean[] = [];
  const failures = await settleBrowserCleanup(async () => {
    const outcome = outcomes[attempts];
    attempts += 1;
    return outcome;
  }, {
    onFailures: (_list, willRetry) => reported.push(willRetry),
  });
  assert.deepEqual(failures, []);
  assert.equal(attempts, 2);
  assert.deepEqual(reported, [true]);
});

test("a wedged browser fails every attempt and surfaces every component error", async () => {
  const first = new Error("closeBrowserServer wedged");
  const second = new Error("Lighthouse Chrome wedged");
  const outcomes = [[first], [first, second]];
  let attempts = 0;
  const reported: boolean[] = [];
  const failures = await settleBrowserCleanup(async () => {
    const outcome = outcomes[attempts];
    attempts += 1;
    return outcome;
  }, {
    onFailures: (list, willRetry) => {
      reported.push(willRetry);
      assert.ok(list.length >= 1);
    },
  });
  assert.equal(attempts, 2);
  assert.deepEqual(reported, [true, false]);
  assert.equal(failures.length, 2);
  assert.equal(failures[0], first);
  assert.equal(failures[1], second);
});

test("retries are configurable and both parameters are validated", async () => {
  let attempts = 0;
  const wedged = async () => {
    attempts += 1;
    return [new Error("browser still alive")];
  };
  const failures = await settleBrowserCleanup(wedged, { retries: 0, onFailures: () => {} });
  assert.equal(attempts, 1);
  assert.equal(failures.length, 1);
  await assert.rejects(
    settleBrowserCleanup(wedged, { retries: -1 }),
    /Cleanup retries must be a non-negative integer/,
  );
  await assert.rejects(
    settleBrowserCleanup("not a function" as unknown as () => Promise<unknown[]>),
    /Cleanup attempt must be a function/,
  );
});