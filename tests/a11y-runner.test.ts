import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { desktopConfig } from "lighthouse";
import { routes } from "../scripts/a11y/config.mjs";
import { createLighthouseAuditor, validateLighthouseResult } from "../scripts/a11y/lighthouse.mjs";
import { partitionRoutes, startAuditWorker, validateWorkerResult } from "../scripts/a11y/pool.mjs";
import { killChild } from "../scripts/lib/child-control.mjs";

type LaunchChrome = typeof import("chrome-launcher").launch;
type RunLighthouse = typeof import("lighthouse").default;

const resultWithScore = (score: unknown = 1, runtimeError?: unknown) => ({
  lhr: { categories: { accessibility: { score } }, runtimeError },
});

function mockAuditor(outcomes: unknown[]) {
  const launches: Parameters<LaunchChrome>[0][] = [];
  const killed: number[] = [];
  const calls: Parameters<RunLighthouse>[] = [];
  const reports: { path: string; report: unknown }[] = [];
  const delays: number[] = [];
  const auditor = createLighthouseAuditor({
    launchChrome: (async (options: Parameters<LaunchChrome>[0]) => {
      launches.push(options);
      const id = launches.length;
      return { port: 9000 + id, kill: async () => { killed.push(id); } };
    }) as unknown as LaunchChrome,
    killChromeInstances: () => [],
    runLighthouse: (async (...args) => {
      calls.push(args);
      const outcome = outcomes.shift();
      if (outcome instanceof Error) throw outcome;
      return outcome;
    }) as RunLighthouse,
    writeReport: (path: string, report: unknown) => { reports.push({ path, report }); },
    retryDelay: async (attempt: number) => { delays.push(attempt); },
    log: () => {},
  });
  return { auditor, launches, killed, calls, reports, delays };
}

test("one or two workers audit every route exactly once, including the visual story and source tools", () => {
  assert.equal(routes.length, 44);
  for (const slug of ["come-and-eat", "peace-be-with-you", "every-language"]) {
    assert.ok(routes.includes(`/apostles/stories/${slug}`));
  }
  assert.ok(routes.includes("/work/accessibility"));
  assert.ok(routes.includes("/word/free"));
  assert.ok(routes.includes("/jesus/words"));
  assert.ok(routes.includes("/scriptures/ethiopian/JUB/18"));
  assert.ok(routes.includes("/angels/stories/open-his-eyes"));
  assert.ok(routes.includes("/angels/stories/i-am-with-you"));
  assert.ok(routes.includes("/angels/stories/the-gate-opened"));
  assert.ok(routes.includes("/angels/stories"));
  assert.ok(routes.includes("/angels/dossier?preset=watchers-nephilim-enoch"));
  assert.ok(routes.includes("/jesus/dossier?preset=resurrection-minimal-facts"));
  assert.ok(routes.includes("/scriptures/investigations/isaiah-53-clement-16"));
  for (const count of [1, 2]) {
    const groups = partitionRoutes(routes, count);
    assert.equal(groups.length, count);
    assert.deepEqual(groups.flat().sort(), [...routes].sort());
    assert.equal(new Set(groups.flat()).size, routes.length);
    assert.ok(Math.max(...groups.map((group: string[]) => group.length)) -
      Math.min(...groups.map((group: string[]) => group.length)) <= 1);
  }
  assert.deepEqual(partitionRoutes(["/"], 2), [["/"]]);
});

test("invalid worker counts and ambiguous route assignments fail before launch", () => {
  for (const count of [0, -1, 3, 1.5, NaN, Infinity, "2", undefined]) {
    assert.throws(() => partitionRoutes(routes, count), /A11Y_WORKERS/);
  }
  assert.throws(() => partitionRoutes([], 2), /nonempty and unique/);
  assert.throws(() => partitionRoutes(["/", "/"], 2), /nonempty and unique/);
});

test("Lighthouse fails closed on absent, malformed, or runtime-error reports", () => {
  for (const result of [undefined, null, {}, { lhr: null }]) {
    assert.throws(() => validateLighthouseResult(result), /no report/);
  }
  for (const score of [undefined, null, NaN, Infinity, -0.01, 1.01, "1"]) {
    const result = { lhr: { categories: { accessibility: { score } } } };
    assert.throws(() => validateLighthouseResult(result), /invalid accessibility score/);
  }
  assert.throws(() => validateLighthouseResult(resultWithScore(1, {
    code: "NO_FCP", message: "The page did not paint",
  })), /runtime error: The page did not paint/);
  assert.deepEqual(validateLighthouseResult(resultWithScore(0.95)), { score: 0.95, passed: true });
  assert.deepEqual(validateLighthouseResult(resultWithScore(0.94)), { score: 0.94, passed: false });
});

test("successful routes reuse Chrome while retaining desktop and fresh-origin audits", async () => {
  const first = resultWithScore(1);
  const second = resultWithScore(0.94);
  const state = mockAuditor([first, second]);
  try {
    assert.deepEqual(await state.auditor.audit("https://example.test/", "home.json"), { score: 1, passed: true });
    assert.deepEqual(await state.auditor.audit("https://example.test/jesus/words", "words.json"), { score: 0.94, passed: false });
    assert.equal(state.launches.length, 1);
    assert.equal(state.calls.length, 2, "a valid failing score must not be retried until it passes");
    assert.ok(state.launches[0]?.chromeFlags?.includes("--force-prefers-reduced-motion"));
    assert.equal(state.launches[0]?.handleSIGINT, false);
    for (const [, flags, config] of state.calls) {
      assert.equal(flags?.port, 9001);
      assert.deepEqual(flags?.onlyCategories, ["accessibility"]);
      assert.deepEqual(flags?.clearStorageTypes, ["all"]);
      assert.equal(flags?.disableStorageReset, false);
      assert.equal(flags?.maxWaitForLoad, 60_000);
      assert.equal(config, desktopConfig);
    }
    assert.deepEqual(state.reports, [
      { path: "home.json", report: first.lhr },
      { path: "words.json", report: second.lhr },
    ]);
    assert.deepEqual(state.killed, []);
  } finally {
    await state.auditor.close();
  }
  assert.deepEqual(state.killed, [1]);
  await state.auditor.close();
  assert.deepEqual(state.killed, [1], "cleanup is idempotent");
});

test("thrown navigation and runtime errors recycle Chrome before retrying", async () => {
  const state = mockAuditor([
    new Error("CDP connection lost"),
    resultWithScore(1, { code: "NO_FCP" }),
    resultWithScore(1),
  ]);
  try {
    await state.auditor.audit("https://example.test/", "home.json");
    assert.equal(state.launches.length, 3);
    assert.deepEqual(state.calls.map(([, flags]) => flags?.port), [9001, 9002, 9003]);
    assert.deepEqual(state.killed, [1, 2]);
    assert.deepEqual(state.delays, [1, 2]);
    assert.equal(state.reports.length, 1, "only the completed audit writes its report");
  } finally {
    await state.auditor.close();
  }
  assert.deepEqual(state.killed, [1, 2, 3]);
});

test("exhausted retries clean up and remain failures", async () => {
  const state = mockAuditor([new Error("offline"), undefined, new Error("still offline")]);
  await assert.rejects(state.auditor.audit("https://example.test/", "home.json"), /still offline/);
  assert.equal(state.launches.length, 3);
  assert.deepEqual(state.killed, [1, 2, 3]);
  assert.deepEqual(state.reports, []);
  await state.auditor.close();
  await assert.rejects(state.auditor.audit("https://example.test/", "home.json"), /closed/);
  assert.equal(state.launches.length, 3);
});

test("failed Chrome launch cleans registered processes before a new attempt", async () => {
  const events: string[] = [];
  let launches = 0;
  const auditor = createLighthouseAuditor({
    launchChrome: (async () => {
      launches += 1;
      events.push(`launch ${launches}`);
      if (launches === 1) throw new Error("debugger never ready");
      return { port: 9002, kill: async () => { events.push("kill returned Chrome"); } };
    }) as unknown as LaunchChrome,
    killChromeInstances: () => { events.push("kill registered Chrome"); return []; },
    runLighthouse: (async () => resultWithScore()) as unknown as RunLighthouse,
    writeReport: () => {},
    retryDelay: async () => {},
    log: () => {},
  });
  try {
    await auditor.audit("https://example.test/", "home.json");
    assert.deepEqual(events, ["launch 1", "kill registered Chrome", "launch 2"]);
  } finally {
    await auditor.close();
  }
  assert.deepEqual(events.slice(-2), ["kill returned Chrome", "kill registered Chrome"]);
});

test("shutdown during Chrome launch closes the late browser without auditing", async () => {
  let finishLaunch!: (chrome: Awaited<ReturnType<LaunchChrome>>) => void;
  let killed = 0;
  let audited = false;
  const auditor = createLighthouseAuditor({
    launchChrome: () => new Promise((resolve) => { finishLaunch = resolve; }),
    killChromeInstances: () => [],
    runLighthouse: (async () => { audited = true; return resultWithScore(); }) as unknown as RunLighthouse,
    writeReport: () => {},
  });
  const pending = auditor.audit("https://example.test/", "home.json");
  await auditor.close();
  finishLaunch({ port: 9001, kill: async () => { killed += 1; } } as unknown as Awaited<ReturnType<LaunchChrome>>);
  await assert.rejects(pending, /closed/);
  assert.equal(killed, 1);
  assert.equal(audited, false);
});

test("worker reports must prove complete, unique route coverage", () => {
  const assigned = ["/", "/jesus/words"];
  for (const reported of [["/"], ["/", "/"], ["/", "/other"], [...assigned, "/extra"]]) {
    assert.throws(() => validateWorkerResult({
      type: "complete", routes: reported, failures: [],
    }, assigned), /every assigned route exactly once/);
  }
  assert.throws(() => validateWorkerResult({ type: "complete", routes: assigned, failures: [false] }, assigned), /valid completion report/);
  assert.deepEqual(validateWorkerResult({
    type: "complete", routes: [...assigned].reverse(), failures: ["Axe (dark) /: contrast"],
  }, assigned), ["Axe (dark) /: contrast"]);
});

test("child crashes, absent reports, duplicate reports, and partial coverage cannot pass", { timeout: 15_000 }, async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "garo-a11y-workers-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const fixture = join(directory, "worker.mjs");
  writeFileSync(fixture, `
const options = JSON.parse(process.argv[2]);
const complete = { type: "complete", routes: options.routes, failures: ["Axe (dark) /: contrast"] };
const send = (message) => new Promise((resolve, reject) => process.send(message, error => error ? reject(error) : resolve()));
if (options.mode === "signal") process.kill(process.pid, "SIGTERM");
else if (options.mode === "no-report") process.disconnect();
else {
  await send(options.mode === "partial" ? { ...complete, routes: ["/"] } : complete);
  if (options.mode === "duplicate") await send(complete);
  if (options.mode === "crash") process.exitCode = 2;
  process.disconnect();
}
`);
  const cases: [string, RegExp | null][] = [
    ["complete", null],
    ["no-report", /0 completion reports/],
    ["duplicate", /2 completion reports/],
    ["partial", /every assigned route exactly once/],
    ["crash", /exited with 2/],
    ["signal", /exited with SIGTERM/],
  ];
  for (const [mode, expectedError] of cases) {
    await t.test(mode, async () => {
      const worker = startAuditWorker(fixture, { id: 1, routes: ["/", "/jesus/words"], mode });
      try {
        if (expectedError) await assert.rejects(worker.done, expectedError);
        else assert.deepEqual(await worker.done, ["Axe (dark) /: contrast"]);
      } finally {
        killChild(worker.child, "SIGKILL");
      }
    });
  }
});
