import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`discovery and persistent lens at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Reader", exact: true })).toHaveAttribute("aria-pressed", "true");
    const desk = page.locator("#discover");
    await expect(desk.getByRole("link")).toHaveCount(6);
    await expect(desk.locator('a[href="/scriptures/word-bridge"]')).toContainText("Word Bridge");
    await page.locator('a[href="#discover"]').click();
    await expect(desk.getByRole("heading", { name: "Follow your curiosity." })).toBeInViewport();
    await page.getByRole("button", { name: "Engineer", exact: true }).click();
    await expect(page.getByRole("complementary", { name: "Behind this page" })).toBeVisible();
    await expect(desk.locator(".lens-reader-copy").first()).toBeHidden();
    await expect(desk.locator(".lens-engineer-copy").first()).toBeVisible();
    await desk.getByRole("link", { name: /One passage. Five witnesses/ }).click();
    await expect(page).toHaveURL(/\/scriptures\/polyglot$/);
    await expect(page.locator("#engineering-notes")).toContainText("Edition-aware loaders");
    await expect(page.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.locator(".world-related-tools > summary").click();
    const compass = page.getByRole("navigation", { name: "Related research tools" });
    await expect(compass.getByRole("link")).toHaveCount(3);
    await expect(compass.locator('a[href="/scriptures/polyglot"]')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Reader", exact: true }).click();
    await expect(page.locator("#engineering-notes")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("the lens remains usable when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", { value() { throw new Error("blocked"); } });
    Object.defineProperty(Storage.prototype, "setItem", { value() { throw new Error("blocked"); } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Engineer", exact: true }).click();
  await expect(page.locator("#engineering-notes")).toBeVisible();
  await page.getByRole("button", { name: "Reader", exact: true }).click();
  await expect(page.locator("#engineering-notes")).toHaveCount(0);
});

test("the research desk is usable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#discover .discovery-tool")).toHaveCount(4);
  await page.locator('a.discovery-tool[href="/scriptures/catena"]').click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Catena");
  await context.close();
});

test("lens changes synchronize across tabs", async ({ page, context }) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/evidence");
  await page.getByRole("button", { name: "Engineer", exact: true }).click();
  await expect(other.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute("aria-pressed", "true");
  await other.getByRole("button", { name: "Reader", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reader", exact: true })).toHaveAttribute("aria-pressed", "true");
  await other.close();
});

test("both lenses meet accessibility checks in light and dark themes", async ({ page }) => {
  await page.goto("/");
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.dataset.a11yTheme = theme; }, theme);
    for (const lens of ["Reader", "Engineer"]) {
      await page.getByRole("button", { name: lens, exact: true }).click();
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (context: string, options: unknown) => Promise<{ violations: { id: string; nodes: { target: unknown; failureSummary?: string }[] }[] }> } }).axe;
        return (await axe.run(".discovery-lens, #discover", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, problem: n.failureSummary })) }));
      });
      expect(violations, `${theme} / ${lens}`).toEqual([]);
    }
  }
});

test("the compass follows its world's palette in the warm reading theme", async ({ page }) => {
  await page.goto("/angels");
  await page.evaluate(() => { document.documentElement.dataset.a11yTheme = "warm"; });
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe;
    return (await axe.run(".curiosity-compass", { runOnly: { type: "rule", values: ["color-contrast"] } })).violations;
  });
  expect(violations).toEqual([]);
});

test.describe("lens with enlarged reading preferences", () => {
  test.use({ viewport: { width: 320, height: 844 }, hasTouch: true, isMobile: true });
  test("the lens reflows at 320px with enlarged OpenDyslexic text", async ({ page }) => {
    await page.goto("/angels/stories/i-am-with-you");
    await page.getByRole("button", { name: "Open reading and accessibility settings" }).tap();
    const settings = page.getByRole("dialog", { name: "Reading & accessibility" });
    await settings.getByLabel("Text size", { exact: true }).selectOption("largest");
    await settings.getByLabel("Reading typeface", { exact: true }).selectOption("dyslexic");
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      content: document.documentElement.scrollWidth,
      overflow: Array.from(document.querySelectorAll(".discovery-lens *")).filter(el => el.getBoundingClientRect().right > 321).map(el => ({ tag: el.tagName, className: el.className, right: el.getBoundingClientRect().right })),
    }));
    expect(dimensions.content, JSON.stringify(dimensions)).toBeLessThanOrEqual(321);
    await settings.getByRole("button", { name: "Close accessibility settings" }).tap();
    await expect(settings).toBeHidden();
    await page.getByRole("button", { name: "Engineer", exact: true }).tap();
    await expect(page.locator("#engineering-notes")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  });
});
