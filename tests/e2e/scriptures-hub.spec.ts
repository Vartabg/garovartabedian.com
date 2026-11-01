import { expect, test } from "@playwright/test";
import { scriptureStudyCatalog } from "../../src/lib/scriptures/study-catalog";

test("the Scripture desk offers reading, word study, and every public study tool", async ({ page }) => {
  await page.goto("/scriptures");
  const start = page.getByRole("navigation", { name: "Start studying" });
  await expect(start.getByRole("link")).toHaveCount(4);
  await expect(start.getByRole("link").nth(0)).toHaveAttribute("href", "#read");
  await expect(start.getByRole("link").nth(1)).toHaveAttribute("href", "/scriptures/search");
  await expect(start.getByRole("link").nth(2)).toHaveAttribute("href", "/scriptures/word-bridge");
  await expect(start.getByRole("link").nth(3)).toHaveAttribute("href", "/scriptures/polyglot");

  const catalog = page.getByRole("region", { name: "Find a way into your question." });
  for (const group of scriptureStudyCatalog()) {
    const navigation = catalog.getByRole("navigation", { name: group.title });
    await expect(navigation).toBeVisible();
    for (const tool of group.tools) {
      await expect(navigation.locator(`a[href="${tool.href}"]`)).toContainText(tool.label);
    }
  }
  await expect(catalog.locator('a[href="/scriptures/find"], a[href="/scriptures/research"]')).toHaveCount(0);
  const collection = await page.locator('.world-scr > script[type="application/ld+json"]').textContent();
  const parts = JSON.parse(collection ?? "{}").hasPart as { name: string; url: string }[];
  expect(parts.find((part) => part.url.endsWith("/scriptures/search"))?.name).toBe("Search the text");
  expect(parts.find((part) => part.url.endsWith("/scriptures/word-bridge"))?.name).toBe("Word Bridge");
  await start.getByRole("link").nth(0).click();
  await expect(page).toHaveURL(/\/scriptures#read$/);
  await expect(page.locator("#read")).toBeFocused();
  await expect(page.getByRole("region", { name: "Choose a book and chapter" })).toBeVisible();
  await expect(page.getByRole("tabpanel").getByRole("link", { name: /^John, / })).toBeVisible();
  await start.getByRole("link").nth(1).click();
  await expect(page.getByRole("heading", { level: 1, name: "Search the text", exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/^Search the text/);
});

test("the desk remains readable at 320 pixels and enlarged text", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/scriptures");
  await page.screenshot({ path: testInfo.outputPath("hub-320px.png") });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const start = page.getByRole("navigation", { name: "Start studying" });
  for (const link of await start.getByRole("link").all()) {
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const menuBox = await page.locator(".wg-mobile-menu").boundingBox();
  const worldsBox = await page.locator(".wg-worlds-link").boundingBox();
  expect(menuBox && worldsBox && (worldsBox.x >= menuBox.x + menuBox.width - 1 || worldsBox.y >= menuBox.y + menuBox.height - 1), "the section menu and All worlds must not overlap").toBe(true);
  await page.screenshot({ path: testInfo.outputPath("hub-320px-large-text.png") });
  const overflowing = await page.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
    .map((element) => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right }))
    .slice(0, 15));
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), JSON.stringify(overflowing)).toBe(false);
  await start.getByRole("link").nth(0).click();
  await expect(page.getByRole("combobox", { name: "Go to" })).toBeInViewport();
  await start.getByRole("link").nth(2).focus();
  await expect(start.getByRole("link").nth(2)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/word-bridge$/);
  await expect(page.getByRole("heading", { level: 1, name: "Word Bridge" })).toBeVisible();
});
