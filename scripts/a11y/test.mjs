#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { colorSchemes, routes, readinessTimeoutMs } from "./config.mjs";
import { partitionRoutes, startAuditWorker, waitForAuditShutdown } from "./pool.mjs";
import { childAlive, killChild } from "../lib/child-control.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(directory, "../..");
const port = process.env.PORT ?? "3000";
const baseUrl = process.env.A11Y_BASE_URL ?? `http://127.0.0.1:${port}`;

async function waitForServer(child, getError) {
  const deadline = Date.now() + readinessTimeoutMs;
  while (Date.now() < deadline) {
    if (getError()) throw getError();
    if (!childAlive(child)) {
      throw new Error(`Next.js exited before becoming ready (${child.signalCode ?? child.exitCode})`);
    }
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1000) });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js did not become ready within ${readinessTimeoutMs / 1000} seconds`);
}

async function runAccessibilityTests() {
  const groups = partitionRoutes(routes, Number(process.env.A11Y_WORKERS ?? 2));
  const reportsDirectory = mkdtempSync(join(tmpdir(), "garo-a11y-"));
  const workers = [];
  const started = performance.now();
  // Own the actual server process, so shutdown cannot orphan an npm child.
  const server = spawn(process.execPath, [
    join(repositoryRoot, "node_modules/next/dist/bin/next"), "start",
    "--hostname", "127.0.0.1", "--port", new URL(baseUrl).port || port,
  ], { cwd: repositoryRoot, stdio: "inherit" });
  let serverError;
  server.once("error", (error) => { serverError = error; });
  const serverClosed = new Promise((resolve) => server.once("close", resolve));
  let interrupted = false;
  let forceStop;
  function stop(signal = "SIGTERM") {
    // killChild sends SIGTERM once per child and always escalates to SIGKILL.
    for (const child of [server, ...workers.map((worker) => worker.child)]) killChild(child, signal);
  }
  function beginShutdown() {
    stop();
    forceStop ??= setTimeout(() => stop("SIGKILL"), 10_000);
    forceStop.unref();
  }
  function interrupt() { interrupted = true; beginShutdown(); }
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  function serverExited(code, signal) {
    if (forceStop) return;
    serverError = new Error(`Owned Next.js server exited during accessibility checks (${signal ?? code})`);
    beginShutdown();
  }
  server.once("exit", serverExited);
  try {
    await waitForServer(server, () => serverError);
    if (interrupted) throw new Error("Accessibility run interrupted");
    console.log(`[a11y] Auditing ${routes.length} routes with ${groups.length} isolated workers; reports: ${reportsDirectory}`);
    for (const [index, assignedRoutes] of groups.entries()) {
      workers.push(startAuditWorker(join(directory, "worker.mjs"), {
        id: index + 1, routes: assignedRoutes, baseUrl, reportsDirectory,
      }));
    }
    // A crashed or stalled worker aborts the run and shuts down its peers.
    // Completed audit findings still collect across the full route matrix.
    const results = await Promise.all(workers.map((worker) => worker.done));
    const failures = results.flat();
    if (interrupted) failures.push("Accessibility run interrupted");
    if (serverError) failures.push(serverError.message);
    if (failures.length) throw new Error(`Accessibility checks failed:\n- ${failures.join("\n- ")}`);
  } finally {
    beginShutdown();
    console.log("[a11y] Shutting down audit processes...");
    try {
      await waitForAuditShutdown(server, workers, serverClosed);
    } finally {
      clearTimeout(forceStop);
      process.removeListener("SIGINT", interrupt);
      process.removeListener("SIGTERM", interrupt);
      server.removeListener("exit", serverExited);
    }
  }
  if (interrupted) throw new Error("Accessibility run interrupted during shutdown");
  console.log(`Accessibility checks passed for ${routes.length} routes in ${colorSchemes.length} color schemes, plus Lighthouse accessibility scoring.`);
  console.log(`[a11y] Total: ${((performance.now() - started) / 1000).toFixed(1)}s with ${groups.length} workers.`);
}

runAccessibilityTests().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
