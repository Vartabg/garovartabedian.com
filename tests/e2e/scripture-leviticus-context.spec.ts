import { expect, test } from "@playwright/test";
import web from "../../public/scriptures/text/web/LEV.json";
import brenton from "../../public/scriptures/text/brenton/LEV.json";

test("Leviticus context preserves its checked edition across the chapter five/six division", async ({ page }) => {
  await page.goto("/scriptures/orthodox/LEV/6?t=brenton");
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("Brenton Septuagint");
  await expect(page.locator("#chapter-text")).toContainText(brenton.chapters[5][1]);
  const context = page.getByRole("complementary", { name: "Before you read" });
  await expect(context).toContainText("References use World English Bible.");
  await context.locator('a[href^="/scriptures/orthodox/LEV/6?t=web#v"]').first().click();
  await expect(page).toHaveURL(/\/LEV\/6\?t=web#v\d+/);
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("World English Bible");
  await expect(page.locator("#chapter-text")).toContainText(web.chapters[5][1]);

  await page.getByRole("button", { name: /Cheat Sheet — Leviticus 6/ }).click();
  await expect(page.locator(".scr-guide-panel")).toContainText("Agent-reviewed");
  await expect(page.locator(".scr-guide-panel")).not.toContainText("Human-reviewed");
  await expect(page.locator(".scr-guide-keyverses a").first()).toBeVisible();
  for (const href of await page.locator(".scr-guide-keyverses a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toMatch(/\/LEV\/6\?t=web#v\d+/);
  }
});

test("Leviticus closing context connects to Numbers and stays usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/scriptures/protestant/LEV/27");
  const context = page.getByRole("complementary", { name: "Before you read" });
  await context.getByText("Where this chapter fits", { exact: true }).click();
  await expect(context).toContainText("Numbers");
  await expect(context.locator('a[href*="/LEV/28"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Next chapter", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.getByRole("link", { name: "About Leviticus", exact: true }).click();
  await expect(page.getByRole("heading", { name: "How the text reached you" })).toBeVisible();
});
