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
    const location = new URL(url);
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-wicked-tenants") {
      const entry = page.locator("#parable-wicked-tenants");
      await page.waitForFunction(() => document.querySelector("#parable-wicked-tenants button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      // Early writings wait in a fold below the Gospels; open it so axe checks them too.
      await entry.locator("details.jsu-parable-also > summary").click();
      for (const [number, wording] of [[65, "A [creditor] owned a vineyard"], [66, "stone the builders rejected"]]) {
        const panel = entry.locator(".jsu-parable-thomas").filter({ has: page.getByRole("heading", { name: `Gospel of Thomas · Saying ${number} · outside the canon` }) });
        await panel.waitFor({ state: "visible", timeout: navigationTimeoutMs });
        if (!(await panel.innerText()).includes(wording)) throw new Error(`Thomas saying ${number} did not render its text`);
      }
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-john-vine-branches") {
      const entry = page.locator("#parable-john-vine-branches");
      await page.waitForFunction(() => document.querySelector("#parable-john-vine-branches button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.getByText("I am the true vine", { exact: false }).first().waitFor({ state: "visible", timeout: navigationTimeoutMs });
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-john-bread-of-life") {
      const entry = page.locator("#parable-john-bread-of-life");
      await page.waitForFunction(() => document.querySelector("#parable-john-bread-of-life button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.getByText("I am the bread of life", { exact: false }).first().waitFor({ state: "visible", timeout: navigationTimeoutMs });
      const panels = entry.locator(".jsu-parable-account");
      if (await panels.count() !== 2) throw new Error("Both John bread passages must be visible");
      await panels.nth(1).getByText("I am the bread of life", { exact: false }).first().waitFor({ state: "visible", timeout: navigationTimeoutMs });
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-synoptic-lamp") {
      const entry = page.locator("#parable-synoptic-lamp");
      await page.waitForFunction(() => document.querySelector("#parable-synoptic-lamp button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      const canonical = entry.locator(".jsu-parable-account");
      await canonical.nth(3).waitFor({ state: "visible", timeout: navigationTimeoutMs });
      if (await canonical.count() !== 4) throw new Error("The lamp must show four Gospel passages");
      await entry.locator("details.jsu-parable-also > summary").click();
      const panel = entry.locator(".jsu-parable-thomas");
      await panel.getByRole("heading", { name: "Gospel of Thomas · Saying 33 · outside the canon" }).waitFor({ state: "visible", timeout: navigationTimeoutMs });
      if (!(await panel.innerText()).includes("No one lights a lamp")) throw new Error("Thomas saying 33 did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-james-grain-wheat") {
      const entry = page.locator("#parable-james-grain-wheat");
      await page.waitForFunction(() => document.querySelector("#parable-james-grain-wheat button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      const panel = entry.locator(".jsu-parable-james");
      await panel.getByRole("heading", { name: "Secret Book of James · 8.16–27 · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await panel.innerText()).includes("The message is like a grain of wheat")) throw new Error("James grain passage did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-james-foreigners") {
      const entry = page.locator("#parable-james-foreigners");
      await page.waitForFunction(() => document.querySelector("#parable-james-foreigners button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      const panel = entry.locator(".jsu-parable-james");
      await panel.getByRole("heading", { name: "Secret Book of James · Few Have Found the Kingdom · paragraph 3 · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await panel.innerText()).includes("Be like foreigners")) throw new Error("James figure did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-hermas-elm-vine") {
      const entry = page.locator("#parable-hermas-elm-vine");
      await page.waitForFunction(() => document.querySelector("#parable-hermas-elm-vine button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      const panel = entry.locator(".jsu-parable-early");
      await panel.getByRole("heading", { name: "The Shepherd of Hermas · Another Parable · paragraphs 1–10 · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await panel.innerText()).includes("elm and a vine")) throw new Error("Hermas passage did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-clement-two-one") {
      const entry = page.locator("#parable-clement-two-one");
      await page.waitForFunction(() => document.querySelector("#parable-clement-two-one button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.locator(".jsu-parable-early").getByText("outside the canon", { exact: false }).first().waitFor({ timeout: navigationTimeoutMs });
      const thomas = entry.locator(".jsu-parable-thomas");
      await thomas.getByRole("heading", { name: "Gospel of Thomas · Saying 22 · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await thomas.innerText()).includes("When you make the two into one")) throw new Error("Thomas saying 22 did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-didache-two-ways") {
      const entry = page.locator("#parable-didache-two-ways");
      await page.waitForFunction(() => document.querySelector("#parable-didache-two-ways button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.getByRole("heading", { name: "Epistle of Barnabas · 18–20 · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (await entry.locator(".jsu-parable-early").count() !== 2) throw new Error("Two ways comparison is incomplete");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-synoptic-yoke") {
      const entry = page.locator("#parable-synoptic-yoke");
      await page.waitForFunction(() => document.querySelector("#parable-synoptic-yoke button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.locator("details.jsu-parable-also > summary").click();
      await entry.getByRole("heading", { name: "Acts of Thomas · 82–86 · excerpt · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await entry.innerText()).includes("meekness is the good yoke")) throw new Error("Acts of Thomas yoke did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-acts-thomas-tower") {
      const entry = page.locator("#parable-acts-thomas-tower");
      await page.waitForFunction(() => document.querySelector("#parable-acts-thomas-tower button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.getByRole("heading", { name: "Acts of Thomas · 130 · excerpt · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await entry.innerText()).includes("who buildeth a tower")) throw new Error("Acts of Thomas tower did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-synoptic-physician-sick") {
      const entry = page.locator("#parable-synoptic-physician-sick");
      await page.waitForFunction(() => document.querySelector("#parable-synoptic-physician-sick button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.locator("details.jsu-parable-also > summary").click();
      await entry.getByRole("heading", { name: "Acts of Thomas · 95 · excerpt · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await entry.innerText()).includes("physician of souls")) throw new Error("Acts physician comparison did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-barnabas-cornerstone") {
      const entry = page.locator("#parable-barnabas-cornerstone");
      await page.waitForFunction(() => document.querySelector("#parable-barnabas-cornerstone button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.getByRole("heading", { name: "Epistle of Barnabas · 6:1–19 · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await entry.innerText()).includes("foundations of Zion")) throw new Error("Barnabas chapter did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-acts-thomas-prayer") {
      const entry = page.locator("#parable-acts-thomas-prayer");
      await page.waitForFunction(() => document.querySelector("#parable-acts-thomas-prayer button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      await entry.getByRole("heading", { name: "Acts of Thomas · 145–147 · excerpt · outside the canon" }).waitFor({ timeout: navigationTimeoutMs });
      if (!(await entry.innerText()).includes("My mouth sufficeth not to praise thee")) throw new Error("Acts of Thomas prayer did not render its text");
    }
    if (location.pathname === "/jesus/parables" && location.hash === "#parable-thomas-empty-jar") {
      const entry = page.locator("#parable-thomas-empty-jar");
      await page.waitForFunction(() => document.querySelector("#parable-thomas-empty-jar button")?.getAttribute("aria-expanded") === "true", null, { timeout: navigationTimeoutMs });
      const panel = entry.locator(".jsu-parable-thomas");
      await panel.waitFor({ state: "visible", timeout: navigationTimeoutMs });
      if (!(await panel.innerText()).includes("jar of flour")) throw new Error("Thomas saying 97 did not render its text");
    }
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
