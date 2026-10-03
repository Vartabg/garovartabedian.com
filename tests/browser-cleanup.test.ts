import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { closeBrowserServer } from "../scripts/browser/close-server.mjs";

test("browser cleanup releases inherited pipes after a real child exits", { timeout: 5000 }, async () => {
  const child = spawn(process.execPath, ["-e", `
    const { spawn } = require('node:child_process');
    const helper = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 2000)'], {
      stdio: ['ignore', process.stdout, process.stderr]
    });
    helper.unref();
    process.exit(0);
  `], { stdio: ["ignore", "pipe", "pipe"] });
  const closed = once(child, "close");
  try {
    await once(child, "exit");
    // Reproduce the failure: waiting for close alone is still blocked even
    // though the browser process has exited successfully.
    assert.equal(await Promise.race([closed.then(() => "closed"), delay(50, "pipes-open")]), "pipes-open");
    await closeBrowserServer({ process: () => child, kill: () => closed });
    assert.equal(child.stdout.destroyed, true);
    assert.equal(child.stderr.destroyed, true);
    assert.equal(child.listenerCount("exit"), 0);
  } finally {
    child.kill("SIGKILL");
    child.stdout.destroy();
    child.stderr.destroy();
  }
});

test("live browser pipes remain intact until its process exits", { timeout: 5000 }, async () => {
  const child = spawn(process.execPath, ["-e", "process.stdout.write('ready'); setInterval(() => {}, 1000)"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const closed = once(child, "close");
  try {
    await once(child.stdout, "data");
    await closeBrowserServer({
      process: () => child,
      kill: () => {
        assert.equal(child.stdout.destroyed, false);
        child.kill("SIGKILL");
        return closed;
      },
    });
    assert.equal(child.signalCode, "SIGKILL");
    assert.equal(child.stdout.destroyed, true);
    assert.equal(child.listenerCount("exit"), 0);
  } finally {
    child.kill("SIGKILL");
  }
});

test("browser cleanup failures stay failures and remove the exit listener", async () => {
  const child = spawn(process.execPath, ["-e", ""], { stdio: ["ignore", "pipe", "pipe"] });
  const closed = once(child, "close");
  try {
    await assert.rejects(closeBrowserServer({
      process: () => child,
      kill: async () => { throw new Error("cleanup failed"); },
    }), /cleanup failed/);
    assert.equal(child.listenerCount("exit"), 0);
  } finally {
    child.kill("SIGKILL");
    await closed;
  }
});
