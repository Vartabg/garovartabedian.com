import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { loadReadingJourney } from "../../src/lib/evidence/reading-journey-server";

const route = "/scriptures/read/isaiah-53-clement-16";
const moduleRequire = createRequire(path.resolve("package.json"));

test("Find leads to the reading path; reading and Trace make no assessment requests", async ({ page }) => {
  const requests: string[] = [];
  const scripts: Promise<string>[] = [];
  page.on("request", r => requests.push(r.url()));
  page.on("response", r => { if (r.url().includes("/_next/static/chunks/") && r.url().endsWith(".js")) scripts.push(r.text().catch(() => "")); });
  await page.goto(route);
  await expect(page.getByRole("button", { name: "Read", exact: true })).toHaveAttribute("aria-pressed", "true");
  const reader = page.locator("article[data-mode]");
  await expect(reader).toContainText("1 Clement 16");
  await page.getByRole("button", { name: "Trace connections", exact: true }).click();
  expect(requests.some(url => /\/api\/find|api\.typesafe|\/models\/|\/ort\//.test(url))).toBe(false);
  // The site shell may prefetch search (which shares PublicAssessment). Check
  // the unique comparison module, not copy also present in the search bundle.
  const comparisonMarker = "The AI checks Isaiah 53:5 against the complete first paragraph";
  expect((await Promise.all(scripts)).some(text => text.includes(comparisonMarker))).toBe(false);
  await page.getByRole("link", { name: "Compare these passages", exact: false }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Check this connection" })).toBeVisible();
  expect((await Promise.all(scripts)).some(text => text.includes(comparisonMarker))).toBe(true);
  expect(requests.some(url => /\/api\/find/.test(url))).toBe(false);
  await page.getByRole("button", { name: "Return to reading" }).click();
  await page.getByRole("button", { name: "Find", exact: true }).click();
  await page.getByRole("searchbox", { name: "Find", exact: true }).fill("Isaiah Clement");
  await expect(page.getByText("Isaiah and 1 Clement — Reading path", { exact: true })).toBeVisible();
});

for (const width of [320, 390, 1440]) test(`source notes restore the exact reading position at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(route);
  const trigger = page.getByRole("link", { name: "Source note: 1 Clement 16 · the suffering passage", exact: true });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const before = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("by His stripes we were healed.");
  await dialog.getByText("Read the surrounding context", { exact: true }).click();
  await expect(dialog).toContainText("Ye see, beloved");
  await dialog.locator("summary").last().focus();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => ({ x: scrollX, y: scrollY }))).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("hosted text is unchanged; preferences persist while Read remains the default", async ({ page }) => {
  const journey = await loadReadingJourney();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  expect((await page.locator('[data-early-paragraph="0"] [data-source-segment]').allTextContents()).join("")).toBe(journey.early[0]);
  await expect(page.locator("#isaiah-5 [data-source-segment]")).toHaveText(journey.scripture[4]);
  await page.getByText("Read all of Isaiah 53 · World English Bible", { exact: true }).click();
  expect(await page.locator("[data-context-verse]").allTextContents()).toEqual(journey.scripture);
  await page.getByText("Reading appearance", { exact: true }).click();
  await page.locator("article").getByLabel("Text size", { exact: true }).selectOption("largest");
  await page.locator("article").getByLabel("Page theme", { exact: true }).selectOption("dark");
  await page.locator("article").getByLabel("Monochrome", { exact: true }).check();
  await page.getByRole("button", { name: "Trace connections" }).click();
  const before = await page.locator('[data-source-segment]').first().evaluate(el => getComputedStyle(el.parentElement!).fontSize);
  expect(parseFloat(before)).toBeGreaterThanOrEqual(26);
  const roles = page.getByLabel("Passage roles").locator("span");
  const styles = await roles.evaluateAll(els => els.map(el => ({ color: getComputedStyle(el).color, line: getComputedStyle(el).borderBottomStyle })));
  expect(new Set(styles.map(style => style.color)).size).toBe(1);
  expect(styles.map(style => style.line)).toEqual(["solid", "dashed", "dotted"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.reload();
  await expect(page.locator("article[data-mode]")).toHaveAttribute("data-mode", "read");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-size", "largest");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-reading-monochrome", "true");
});

test("AI suggestions stay unreviewed, resume privately, and preserve reading on quota failure", async ({ page }) => {
  const journey = await loadReadingJourney();
  let posts = 0;
  const id = "11111111-1111-4111-8111-111111111111";
  await page.route("**/api/find/session", r => r.fulfill({ json: { ready: true } }));
  await page.route("**/api/find/jobs", r => {
    posts++;
    const input = r.request().postDataJSON();
    expect(input.anchor).toEqual(journey.anchor);
    expect(input.sources).toEqual([journey.candidate]);
    return r.fulfill({ status: 202, json: { id } });
  });
  const job = {
    id, status: "complete",
    passages: [{ title: "1 Clement 16", text: "Exact source <script>unsafe()</script>", context: journey.early[0], edition: "Ante-Nicene Fathers (1885)", role: "legacy-edition; may include translator/editorial material", href: "/early/1clement#chapter-16" }],
    items: [{ position: 0, state: "complete", error: null, reply: {
      model: "jev-1.13.0",
      answers: { judgment: { type: "choice", choice: "close-wording", probabilities: { "close-wording": 0.8, "substantial-paraphrase": 0.1, "thematic-overlap": 0.05, unrelated: 0.02, "insufficient-context": 0.03 } } },
    } }],
  };
  await page.route("**/api/find/jobs/*", r => r.fulfill({ json: job }));
  await page.goto(route);
  await page.getByRole("link", { name: "Compare these passages", exact: false }).first().click();
  await page.getByRole("button", { name: "Check this connection" }).click();
  await expect(page.getByRole("dialog").getByText("Unreviewed", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Close wording", { exact: true })).toBeVisible();
  await page.getByRole("dialog").getByText("Passage and context", { exact: true }).click();
  expect(await page.getByRole("dialog").locator("script").count()).toBe(0);
  await page.getByRole("button", { name: "Return to reading" }).click();
  await page.reload();
  await page.getByRole("link", { name: "Compare these passages", exact: false }).first().click();
  await expect(page.getByRole("dialog").getByText("Unreviewed", { exact: true })).toBeVisible();
  expect(posts).toBe(1);
  expect(await page.getByRole("dialog").innerText()).not.toMatch(/jev|typesafe/i);
  await page.unroute("**/api/find/jobs");
  await page.route("**/api/find/jobs", r => r.fulfill({ status: 429, json: { error: "Today's assessment allowance is used. Search remains available." } }));
  await page.getByRole("button", { name: "Reload saved check" }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("allowance is used");
  await page.getByRole("button", { name: "Return to reading" }).click();
  await expect(page.locator("#isaiah-5 [data-source-segment]")).toHaveText(journey.scripture[4]);
});

test("the complete reading and source references survive without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${process.env.PORT ?? "3000"}${route}`);
  await expect(page.getByRole("heading", { name: "Wounds, healing, and humility" })).toBeVisible();
  await expect(page.locator('[data-early-paragraph="0"]')).toContainText("Ye see, beloved");
  await page.getByRole("link", { name: "Source note: Isaiah 53:5 · World English Bible", exact: true }).click();
  await expect(page).toHaveURL(/#note-isaiah-suffering$/);
  await expect(page.locator("#note-isaiah-suffering")).toBeVisible();
  await context.close();
});

test("themes, monochrome and the open note have no automated WCAG A/AA violations", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page.addScriptTag({ path: moduleRequire.resolve("axe-core/axe.min.js") });
  await page.getByText("Reading appearance", { exact: true }).click();
  for (const theme of ["light", "warm", "dark"]) {
    await page.locator("article").getByLabel("Page theme", { exact: true }).selectOption(theme);
    const violations = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (target: string, options: unknown) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }).axe;
      return (await axe.run("article[data-mode]", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations;
    });
    expect(violations).toEqual([]);
  }
  await page.locator("article").getByLabel("Monochrome", { exact: true }).check();
  await page.getByRole("link", { name: "Source note: Isaiah 53:5 · World English Bible", exact: true }).click();
  const violations = await page.evaluate(async () => (await (window as unknown as { axe: { run: (target: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe.run("dialog", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations);
  expect(violations).toEqual([]);
  const output = testInfo.outputPath("reading-note-phone.png");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output });
});
