import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { get } from "node:http";
import { chromium } from "playwright";
import { LOCAL } from "./storage";

// Requires the managed workspace preview (or a production preview with --production).
// This check deliberately stops at source preview and never calls Jev.
async function main() {
  const production = process.argv.includes("--production");
  const base = new URL(process.argv.find(arg => arg.startsWith("http")) ?? "http://127.0.0.1:3340");
  assert.ok(base.protocol === "http:" && ["127.0.0.1", "localhost"].includes(base.hostname), "Check only an explicitly selected loopback website");
  const statusWithHost = (host: string) => new Promise<number | undefined>((resolve, reject) => {
    get(new URL("/api/research/session", base), { headers: { Host: host } }, response => { response.resume(); resolve(response.statusCode); }).once("error", reject);
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.setDefaultTimeout(60000);
  const errors: string[] = [], providerRequests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (new URL(request.url()).hostname.endsWith("typesafe.ai")) providerRequests.push(request.url()); });
  const output = path.join(LOCAL, "website-check");
  fs.mkdirSync(output, { recursive: true });
  try {
    if (production) {
      assert.equal((await fetch(new URL("/api/research/session", base))).status, 404);
      assert.equal((await page.goto(new URL("/scriptures/research", base).href))?.status(), 404);
      assert.equal((await page.goto(new URL("/scriptures", base).href))?.status(), 200);
      assert.equal(await page.getByRole("link", { name: "Open local Jev research workspace →" }).count(), 0);
    } else {
      // Test the complete Next rewrite, including the incoming Host before proxying.
      assert.equal(await statusWithHost(`attacker.example:${base.port}`), 404);
      assert.equal((await fetch(new URL("/api/research/session", base), { headers: { Origin: "https://attacker.example" } })).status, 403);
      assert.equal((await fetch(new URL("/api/research/session", base), { headers: { "Sec-Fetch-Site": "cross-site" } })).status, 403);
      assert.equal((await fetch(new URL("/api/research/runs", base))).status, 403);
      const session = await (await fetch(new URL("/api/research/session", base))).json();
      assert.deepEqual(Object.keys(session).sort(), ["keyAvailable", "model", "token"]);
      const rejected = await fetch(new URL("/api/research/preview", base), { method: "POST", headers: { "Content-Type": "application/json", "x-jev-session": session.token }, body: JSON.stringify({ mode: "check-claim", claim: "Test", right: { kind: "hosted", selector: "file:/etc/passwd" } }) });
      assert.equal(rejected.status, 400);
      await page.goto(new URL("/scriptures/research", base).href);
      await page.getByText(/^(Saved key connected|Key setup needed)$/).waitFor();
      await page.getByRole("button", { name: "Preview sources and request count" }).click();
      await page.locator("#results-title").filter({ hasText: "dry run" }).waitFor();
      await page.getByRole("button", { name: "Try supplied text" }).click();
      const text = 'A gentle answer calms anger. <script>globalThis.researchInjected=true</script><img src=x onerror="globalThis.researchInjected=true">';
      await page.getByLabel("Evidence — choose a .txt or .md file").setInputFiles({ name: "browser-check.txt", mimeType: "text/plain", buffer: Buffer.from(text) });
      await page.getByRole("button", { name: "Preview sources and request count" }).click();
      await page.locator("#results-title").filter({ hasText: "dry run" }).waitFor();
      await page.locator("blockquote").filter({ hasText: text }).waitFor();
      assert.equal(await page.evaluate(() => Reflect.get(globalThis, "researchInjected")), undefined);
      const downloaded = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download JSON", exact: true }).click();
      const file = path.join(output, "preview.json"); await (await downloaded).saveAs(file);
      const run = JSON.parse(fs.readFileSync(file, "utf8"));
      assert.equal(run.attempts, 0); assert.equal(run.status, "dry-run");
      await page.locator("body").press("Control+Home");
      await page.screenshot({ path: path.join(output, "desktop.png"), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, "mobile.png"), fullPage: true });
    }
    assert.deepEqual(providerRequests, []); assert.deepEqual(errors, []);
    console.log(`${production ? "Production exclusion" : "Local website, host/origin/session guards, source preview, file input, escaping, downloads, and mobile layout"}: passed; no Jev calls.`);
  } finally { await browser.close(); }
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
