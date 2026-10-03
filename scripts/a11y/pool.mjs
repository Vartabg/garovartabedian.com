import { fork } from "node:child_process";
import { childAlive, killChild, releaseChild } from "../lib/child-control.mjs";

export function partitionRoutes(routes, workerCount) {
  if (!Number.isInteger(workerCount) || workerCount < 1 || workerCount > 2) {
    throw new Error("A11Y_WORKERS must be 1 or 2");
  }
  if (!routes.length || new Set(routes).size !== routes.length) {
    throw new Error("Accessibility routes must be nonempty and unique");
  }
  const groups = Array.from({ length: Math.min(workerCount, routes.length) }, () => []);
  routes.forEach((route, index) => groups[index % groups.length].push(route));
  return groups;
}

export function validateWorkerResult(result, assignedRoutes) {
  if (result?.type !== "complete" || !Array.isArray(result.routes) ||
      !Array.isArray(result.failures) || result.failures.some((failure) => typeof failure !== "string")) {
    throw new Error("Accessibility worker returned no valid completion report");
  }
  if (result.routes.length !== assignedRoutes.length ||
      new Set(result.routes).size !== assignedRoutes.length ||
      assignedRoutes.some((route) => !result.routes.includes(route))) {
    throw new Error("Accessibility worker did not audit every assigned route exactly once");
  }
  return result.failures;
}

export function startAuditWorker(workerPath, options, {
  runTimeoutMs = 15 * 60_000,
  cleanupTimeoutMs = 15_000,
  terminateGraceMs = 2_000,
  killWaitMs = 2_000,
} = {}) {
  for (const value of [runTimeoutMs, cleanupTimeoutMs, terminateGraceMs, killWaitMs]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 2_147_483_647) {
      throw new Error("Audit worker deadlines must be positive timer-safe integers");
    }
  }
  const child = fork(workerPath, [JSON.stringify(options)], {
    stdio: ["ignore", "inherit", "inherit", "ipc"],
  });
  const done = new Promise((resolve, reject) => {
    let result;
    let messageCount = 0;
    let settled = false;
    let stopping;
    let cleanupDeadline;
    let forceStop;
    let forceDeadline;
    const runDeadline = setTimeout(() => stop("run", runTimeoutMs), runTimeoutMs);
    runDeadline.unref();
    function finish(error, failures) {
      if (settled) return;
      settled = true;
      for (const timer of [runDeadline, cleanupDeadline, forceStop, forceDeadline]) clearTimeout(timer);
      if (error) reject(error);
      else resolve(failures);
    }
    function signal(name) {
      try { killChild(child, name); } catch (error) { onError(error); }
    }
    function stop(phase, timeout) {
      beginStop(new Error(`Accessibility worker ${options.id} ${phase} exceeded ${timeout}ms (PID ${child.pid}).`));
    }
    function beginStop(error) {
      if (settled || stopping) return;
      stopping = error;
      signal("SIGTERM");
      forceStop = setTimeout(() => {
        if (settled) return;
        signal("SIGKILL");
        forceDeadline = setTimeout(() => {
          // Failure to reap a child must not trap the supervisor itself. Keep
          // its PID in the failure; never substitute a global Chrome kill.
          releaseChild(child);
          finish(new Error(`${stopping.message} Child did not exit after SIGKILL.`));
        }, killWaitMs);
        forceDeadline.unref();
      }, terminateGraceMs);
      forceStop.unref();
    }
    function onError(error) {
      if (!child.pid) finish(error);
      else beginStop(new Error(`Accessibility worker ${options.id} process error (PID ${child.pid}): ${error.message}`));
    }
    child.on("message", (message) => {
      if (message?.type === "phase" && message.phase === "cleanup") {
        // Repeated messages cannot keep postponing the shutdown deadline.
        cleanupDeadline ??= setTimeout(() => stop("cleanup", cleanupTimeoutMs), cleanupTimeoutMs);
        cleanupDeadline.unref();
        return;
      }
      result = message;
      messageCount += 1;
      // A valid report is necessary but insufficient: its worker must exit.
      cleanupDeadline ??= setTimeout(() => stop("exit after report", cleanupTimeoutMs), cleanupTimeoutMs);
      cleanupDeadline.unref();
    });
    child.on("error", onError);
    child.once("exit", (code, signal) => {
      try {
        if (stopping) throw stopping;
        if (code !== 0 || signal) throw new Error(`Accessibility worker ${options.id} exited with ${signal ?? code}`);
        if (messageCount !== 1) throw new Error(`Accessibility worker ${options.id} returned ${messageCount} completion reports`);
        finish(null, validateWorkerResult(result, options.routes));
      } catch (error) {
        finish(error);
      }
    });
  });
  return { child, done };
}

/** A failed cleanup must also let the top-level audit command return failure. */
export async function waitForAuditShutdown(server, workers, serverClosed, shutdownTimeoutMs = 15_000) {
  let deadline;
  try {
    await Promise.race([
      Promise.allSettled([serverClosed, ...workers.map((worker) => worker.done)]),
      new Promise((_, reject) => {
        deadline = setTimeout(() => {
          const children = [server, ...workers.map((worker) => worker.child)];
          for (const child of children) releaseChild(child);
          const pids = children.filter(childAlive)
            .map((child) => child.pid).join(", ");
          reject(new Error(`Accessibility shutdown exceeded ${shutdownTimeoutMs}ms; inspect owned PIDs: ${pids || "none (open shutdown handles)"}.`));
        }, shutdownTimeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(deadline);
  }
}
