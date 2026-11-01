import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { closeBrowserServer } from "../browser/close-server.mjs";

// Match the accessibility runner's BrowserServer ownership and close inherited
// pipes after process exit so Playwright can finish its normal cleanup.
const require = createRequire(import.meta.url);
let server, child, interrupted = false;
const stop = () => {
  interrupted = true;
  child?.kill("SIGTERM");
  void closeBrowserServer(server).catch((error) => console.error(error.message));
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  server = await chromium.launchServer({
    channel: "chrome", headless: true, host: "127.0.0.1",
    // Let Chrome select its graphics backend; forcing CPU rendering can starve
    // terrain frames. Keep software fallback available when Chrome needs it.
    // Replace only the final audio output stream, preserving real media decoding.
    args: ["--enable-unsafe-swiftshader", "--disable-audio-output"],
  });
  if (interrupted) throw new Error("Browser tests interrupted.");
  child = spawn(process.execPath, [
    join(dirname(require.resolve("playwright/package.json")), "cli.js"), "test", "--config=playwright.release.config.ts",
    "--workers=2", "--reporter=list", ...process.argv.slice(2),
  ], { stdio: "inherit", env: { ...process.env, RELEASE_BROWSER_ENDPOINT: server.wsEndpoint() } });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code));
  });
  if (interrupted || code !== 0) throw new Error(`Browser tests failed (${code}).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeBrowserServer(server);
  process.removeListener("SIGINT", stop);
  process.removeListener("SIGTERM", stop);
}
