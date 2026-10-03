import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { startAuditWorker, waitForAuditShutdown } from "../scripts/a11y/pool.mjs";
import { adoptChild, childAlive, killChild } from "../scripts/lib/child-control.mjs";

test("audit supervision bounds hung cleanup, absent reports, and workers ignoring termination", { timeout: 20_000 }, async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "garo-a11y-shutdown-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const fixture = join(directory, "worker.mjs");
  writeFileSync(fixture, `
const { mode, routes } = JSON.parse(process.argv[2]);
const send = message => new Promise((resolve, reject) => process.send(message, error => error ? reject(error) : resolve()));
const cleanup = { type: "phase", phase: "cleanup" };
if (mode === "zero-on-term") process.on("SIGTERM", () => process.exit(0));
else process.on("SIGTERM", () => {});
if (mode !== "silent") {
  if (mode !== "report-hang") await send(cleanup);
  if (mode === "complete" || mode === "report-hang") {
    await send({ type: "complete", routes, failures: [] });
  }
}
if (mode === "complete") process.disconnect();
else if (mode === "repeat") setInterval(() => process.send(cleanup, () => {}), 10);
else setInterval(() => {}, 1000);
`);
  // Deadlines a misbehaving worker must reach quickly, so the failure modes
  // stay fast and strict.
  const strict = { runTimeoutMs: 2_000, cleanupTimeoutMs: 150, terminateGraceMs: 75, killWaitMs: 500 };
  // Deadlines a well-behaved worker must never reach. The happy path proves the
  // protocol, not latency: on a loaded machine (the release checkout had just
  // run npm ci, lint and typecheck) forking the fixture, exchanging two IPC
  // messages and reaping the child took over 150ms and tripped the strict
  // cleanup deadline. These stay well inside the test timeout, so a genuine
  // hang still fails with the supervisor's own message.
  const patient = { runTimeoutMs: 8_000, cleanupTimeoutMs: 5_000, terminateGraceMs: 2_000, killWaitMs: 500 };
  for (const [mode, expected, limits] of [
    ["complete", null, patient],
    ["cleanup-hang", /cleanup exceeded 150ms/, strict],
    ["repeat", /cleanup exceeded 150ms/, strict],
    // The strict deadline must fire, but the exit-zero response then needs a
    // real grace period to beat SIGKILL on a loaded machine.
    ["zero-on-term", /cleanup exceeded 150ms/, { ...strict, terminateGraceMs: patient.terminateGraceMs }],
    ["report-hang", /exit after report exceeded 150ms/, strict],
    ["silent", /run exceeded 2000ms/, strict],
  ] as const) {
    await t.test(mode, async () => {
      const worker = startAuditWorker(fixture, { id: 7, routes: ["/", "/jesus"], mode }, limits);
      const started = performance.now();
      try {
        if (expected) await assert.rejects(worker.done, expected);
        else assert.deepEqual(await worker.done, []);
        assert.ok(performance.now() - started < 4_000, "supervision must settle, including forceful shutdown");
        if (expected && mode !== "zero-on-term") assert.equal(worker.child.signalCode, "SIGKILL");
        if (mode === "zero-on-term") assert.equal(worker.child.exitCode, 0, "late success must remain a timeout failure");
      } finally {
        killChild(worker.child, "SIGKILL");
      }
    });
  }
  await t.test("failed termination still rejects with an actionable PID", async () => {
    const worker = startAuditWorker(fixture, { id: 8, routes: ["/"], mode: "cleanup-hang" }, strict);
    const kill = worker.child.kill.bind(worker.child);
    const signals: (NodeJS.Signals | number | undefined)[] = [];
    worker.child.kill = (signal) => {
      signals.push(signal);
      worker.child.emit("error", new Error("simulated permission error"));
      return false;
    };
    try {
      await assert.rejects(worker.done, /PID \d+.*did not exit after SIGKILL/);
      assert.deepEqual(signals, ["SIGTERM", "SIGKILL"]);
    } finally {
      if (childAlive(worker.child)) {
        // The pool released this child (process handle + IPC channel) so a
        // SIGKILL-proof worker cannot trap the supervisor in production.
        // Re-adopt it before this test's own reap or the await below can
        // hang on an otherwise idle machine: a drained loop never delivers
        // the death of an unreferenced child.
        adoptChild(worker.child);
        kill("SIGKILL");
        await new Promise<void>((resolve) => worker.child.once("exit", () => resolve()));
      }
    }
  });
});

test("invalid deadlines are rejected before any audit process starts", () => {
  for (const runTimeoutMs of [0, -1, Infinity, NaN, 2_147_483_648]) {
    assert.throws(() => startAuditWorker("unused.mjs", { id: 1, routes: ["/"] }, { runTimeoutMs }), /timer-safe/);
  }
});

test("the audit command also bounds a missing server or worker shutdown event", async () => {
  const released: string[] = [];
  const child = (pid: number) => ({
    pid, exitCode: null, signalCode: null,
    unref: () => released.push(`process ${pid}`),
    channel: { unref: () => released.push(`channel ${pid}`) },
  });
  const server = child(101);
  const workers = [{ child: child(102), done: new Promise(() => {}) }];
  await assert.rejects(waitForAuditShutdown(server, workers, new Promise(() => {}), 50), /shutdown exceeded 50ms.*101, 102/);
  assert.deepEqual(released, ["process 101", "channel 101", "process 102", "channel 102"]);
  released.length = 0;
  await waitForAuditShutdown(server, [{ child: child(102), done: Promise.resolve([]) }], Promise.resolve(), 50);
  assert.deepEqual(released, [], "normal shutdown must not leave a timer that releases handles later");
});
