import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "playwright";
import { axeTags, colorSchemes, minimumLighthouseScore, navigationTimeoutMs, probeTimeoutMs } from "./config.mjs";
import { createLighthouseAuditor } from "./lighthouse.mjs";
import { settleBrowserCleanup } from "./cleanup.mjs";
import { closeBrowserServer } from "../browser/close-server.mjs";

const { id, routes, baseUrl, reportsDirectory } = JSON.parse(process.argv[2]);
const axeCorePath = createRequire(import.meta.url).resolve("axe-core");
const lighthouse = createLighthouseAuditor();
let browser;
let browserServer;
let interrupted = false;

async function cleanup() {
  // Browser.close() can wait forever after a long audit even though Chrome has
  // already exited. Launching through BrowserServer gives cleanup a public,
  // forceful kill primitive and keeps a completed route matrix from hanging at
  // shutdown. Claim the current handle before awaiting so repeated signal and
  // finally cleanup calls stay idempotent while still catching a late launch.
  const server = browserServer;
  browserServer = undefined;
  browser = undefined;
  // Teardown can race a browser exiting on its own, rejecting a kill for a
  // process that is already gone by the time the error surfaces. The retry
  // settles that race: an exited browser makes the second attempt clean,
  // while a wedged browser fails again and the run stays red. Every component
  // error is reported with its stack so failures name the real culprit.
  const attemptCleanup = async () => {
    const results = await Promise.allSettled([closeBrowserServer(server), lighthouse.close()]);
    return results.filter((result) => result.status === "rejected").map((result) => result.reason);
  };
  const failures = await settleBrowserCleanup(attemptCleanup, {
    onFailures: (componentFailures, willRetry) => console.error(
      `[a11y:${id}] browser cleanup component ${willRetry ? "error, retrying" : "failed on retry"}:\n` +
      componentFailures.map((error) => error?.stack ?? error).join("\n"),
    ),
  });
  if (failures.length) throw new AggregateError(failures, "Accessibility browser cleanup failed");
}
function interrupt() {
  interrupted = true;
  void cleanup().catch((error) => console.error(error.message));
}
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);
process.once("disconnect", interrupt);

async function runAxe(url, colorScheme) {
  const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: navigationTimeoutMs });
    await page.addScriptTag({ path: axeCorePath });
    const results = await page.evaluate(
      (tags) => window.axe.run(document, { runOnly: { type: "tag", values: tags } }),
      axeTags,
    );
    return results.violations.map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(" ")).join(", ");
      return `${violation.id} (${violation.impact}): ${violation.help} — ${targets}`;
    });
  } finally {
    await context.close();
  }
}

/** One route's full audit: HTTP probe, Axe in every color scheme, then Lighthouse. */
async function auditRoute(route) {
  const failures = [];
  const started = performance.now();
  const url = new URL(route, baseUrl).href;
  console.log(`[a11y:${id}] Testing ${route}...`);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(probeTimeoutMs) });
    if (!response.ok) failures.push(`HTTP ${route}: expected a successful response, received ${response.status}`);
    await response.body?.cancel();
  } catch (error) {
    failures.push(`HTTP ${route}: ${error.message}`);
  }
  // Fresh contexts force both schemes and prevent state leaking between pages.
  for (const colorScheme of colorSchemes) {
    try {
      const violations = await runAxe(url, colorScheme);
      if (violations.length) failures.push(`Axe (${colorScheme}) ${route}:\n    ${violations.join("\n    ")}`);
    } catch (error) {
      failures.push(`Axe (${colorScheme}) ${route}: ${error.message}`);
    }
  }
  const axeFinished = performance.now();
  const reportName = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
  try {
    const { score, passed } = await lighthouse.audit(url, join(reportsDirectory, `${reportName}.json`));
    if (!passed) failures.push(`Lighthouse ${route}: expected at least ${minimumLighthouseScore}, received ${score}`);
  } catch (error) {
    failures.push(`Lighthouse ${route}: ${error.message}`);
  }
  console.log(`[a11y:${id}] ${route}: HTTP + axe ${((axeFinished - started) / 1000).toFixed(1)}s, Lighthouse ${((performance.now() - axeFinished) / 1000).toFixed(1)}s`);
  return failures;
}

async function run() {
  const failures = [];
  const completedRoutes = [];
  try {
    // Use the same system Chrome installation as CI's Playwright tests.
    browserServer = await chromium.launchServer({ channel: "chrome", headless: true });
    browser = await chromium.connect(browserServer.wsEndpoint());
    for (const route of routes) {
      if (interrupted) throw new Error(`Accessibility worker ${id} interrupted`);
      const routeFailures = await auditRoute(route);
      failures.push(...routeFailures);
      completedRoutes.push(route);
    }
    if (interrupted) throw new Error(`Accessibility worker ${id} interrupted`);
  } finally {
    // The parent owns the deadline even if a browser cleanup promise stalls.
    if (process.connected) process.send({ type: "phase", phase: "cleanup" }, () => {});
    console.log(`[a11y:${id}] Closing audit browsers...`);
    await cleanup();
  }
  if (interrupted) throw new Error(`Accessibility worker ${id} interrupted during cleanup`);
  await new Promise((resolve, reject) => process.send(
    { type: "complete", routes: completedRoutes, failures },
    (error) => error ? reject(error) : resolve(),
  ));
}

run().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}).finally(() => {
  process.removeListener("disconnect", interrupt);
  if (process.connected) process.disconnect();
});
