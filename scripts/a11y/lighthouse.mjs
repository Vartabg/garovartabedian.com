import { writeFileSync } from "node:fs";
import lighthouse, { desktopConfig } from "lighthouse";
import { killAll, launch } from "chrome-launcher";
import { minimumLighthouseScore, reducedMotionFlag } from "./config.mjs";

export function validateLighthouseResult(result) {
  const report = result?.lhr;
  if (!report) throw new Error("Lighthouse returned no report");
  if (report.runtimeError) {
    throw new Error(`Lighthouse runtime error: ${report.runtimeError.message ?? report.runtimeError.code}`);
  }
  const score = report.categories?.accessibility?.score;
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error(`Lighthouse returned an invalid accessibility score: ${score}`);
  }
  return { score, passed: score >= minimumLighthouseScore };
}

export function createLighthouseAuditor({
  launchChrome = launch,
  killChromeInstances = killAll,
  runLighthouse = lighthouse,
  writeReport = (path, report) => writeFileSync(path, JSON.stringify(report)),
  retryDelay = (attempt) => new Promise((resolve) => setTimeout(resolve, 500 * attempt)),
  log = console.log,
} = {}) {
  let chrome;
  let closed = false;
  async function resetChrome() {
    const previous = chrome;
    chrome = undefined;
    try {
      await previous?.kill();
    } finally {
      // launch() registers Chrome before waiting for debugger readiness. Its
      // rejection can otherwise leave a process without a returned handle.
      // Each worker owns this module's entire set of launcher instances.
      const errors = await killChromeInstances();
      if (errors?.length) throw new AggregateError(errors, "Failed to close Lighthouse Chrome");
    }
  }
  return {
    async audit(url, reportPath) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          if (closed) throw new Error("Lighthouse auditor is closed");
          chrome ??= await launchChrome({
            chromeFlags: ["--headless", "--no-sandbox", `--${reducedMotionFlag}`],
            handleSIGINT: false,
            logLevel: "silent",
          });
          // A shutdown may arrive while Chrome is launching.
          if (closed) throw new Error("Lighthouse auditor is closed");
          const result = await runLighthouse(url, {
            port: chrome.port,
            logLevel: "silent",
            output: "json",
            onlyCategories: ["accessibility"],
            maxWaitForLoad: 60_000,
            // Preserve the fresh-Chrome isolation of the old CLI runner.
            clearStorageTypes: ["all"],
            disableStorageReset: false,
          }, desktopConfig);
          const assessment = validateLighthouseResult(result);
          writeReport(reportPath, result.lhr);
          return assessment;
        } catch (error) {
          // Failed navigation can leave a Lighthouse tab/session behind.
          await resetChrome();
          if (closed || attempt === 3) throw error;
          log(`[a11y] Retrying Lighthouse ${new URL(url).pathname} (${attempt}/2): ${error.message}`);
          await retryDelay(attempt);
        }
      }
    },
    async close() {
      closed = true;
      await resetChrome();
    },
  };
}
