import { test, expect, chromium } from "@playwright/test";
import path from "node:path";

// See offline-reader.spec.ts: saves run serially and get a longer confirmation
// timeout because the offline shell is slow to install under parallel load.
test.describe.configure({ mode: "serial" });
const saved = { timeout: 20_000 };

for (const width of [1280, 390, 320]) test(`saved reader has accessible reflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/scriptures/protestant/JHN/3");
  await page.getByRole("button", { name: "Save chapter offline" }).click();
  await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toBeVisible(saved);
  await page.goto("/scripture-reader/index.html");
  await expect(page.locator(".verse")).not.toHaveCount(0);
  await page.getByRole("button", { name: "Larger text" }).click();
  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules/axe-core/axe.min.js") });
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    const violations = await page.evaluate(async () => (await (window as unknown as { axe: { run: (o: unknown) => Promise<{ violations: unknown[] }> } }).axe.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations);
    expect(violations).toEqual([]);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.getByLabel("Saved chapter")).toBeVisible();
});

test("saved chapter survives a complete browser restart offline", async ({ baseURL }, info) => {
  const profile = info.outputPath("persistent-profile");
  const first = await chromium.launchPersistentContext(profile, { channel: "chrome", baseURL });
  try {
    const page = await first.newPage();
    await page.goto("/scriptures/protestant/JHN/3");
    await page.getByRole("button", { name: "Save chapter offline" }).click();
    await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toBeVisible(saved);
    await page.goto("/scripture-reader/index.html");
    await expect(page.locator("#reading")).toContainText("For God so loved the world");
  } finally { await first.close(); }
  const restarted = await chromium.launchPersistentContext(profile, { channel: "chrome", baseURL, offline: true });
  try {
    const page = await restarted.newPage();
    await page.goto("/scripture-reader/index.html");
    await expect(page.getByRole("heading", { name: "John 3", exact: true })).toBeVisible();
    await expect(page.locator("#reading")).toContainText("For God so loved the world");
    await expect(page.locator("#edition")).toHaveText("World English Bible");
  } finally { await restarted.close(); }
});

test("the reader exposes a valid standalone app manifest", async ({ page, context }) => {
  await page.goto("/scripture-reader/index.html");
  const client = await context.newCDPSession(page);
  const manifest = await client.send("Page.getAppManifest");
  expect(manifest.errors).toEqual([]);
  const data = JSON.parse(manifest.data!);
  expect(data.display).toBe("standalone");
  expect(data.scope).toBe("/scripture-reader/");
  expect(data.start_url).toBe("/scripture-reader/index.html");
  for (const icon of data.icons as { src: string }[]) {
    expect((await page.request.get(new URL(icon.src, manifest.url).href)).ok()).toBe(true);
  }
});
