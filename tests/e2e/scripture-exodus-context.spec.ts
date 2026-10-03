import { expect, test } from "@playwright/test";
import web from "../../public/scriptures/text/web/EXO.json";
import brenton from "../../public/scriptures/text/brenton/EXO.json";

test("Exodus tabernacle context opens its checked edition despite different chapter ordering", async ({ page }) => {
  await page.goto("/scriptures/orthodox/EXO/38?t=brenton");
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("Brenton Septuagint");
  await expect(page.locator("#chapter-text")).toContainText(brenton.chapters[37][0]);
  const context = page.getByRole("complementary", { name: "Before you read" });
  await expect(context).toContainText("References use World English Bible.");
  const chapterReference = context.locator('a[href^="/scriptures/orthodox/EXO/38?t=web#v"]').first();
  await expect(chapterReference).toBeVisible();
  await chapterReference.click();
  await expect(page).toHaveURL(/\/EXO\/38\?t=web#v\d+/);
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("World English Bible");
  await expect(page.locator("#chapter-text")).toContainText(web.chapters[37][0]);

  await page.getByRole("button", { name: /Cheat Sheet — Exodus 38/ }).click();
  await expect(page.locator(".scr-guide-panel")).toContainText("Agent-reviewed");
  await expect(page.locator(".scr-guide-panel")).not.toContainText("Human-reviewed");
  await expect(page.locator(".scr-guide-keyverses a")).toHaveCount(3);
  for (const href of await page.locator(".scr-guide-keyverses a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toMatch(/\/EXO\/38\?t=web#v\d+/);
  }
});

test("Exodus closes with usable mobile context and no invented forty-first chapter", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/scriptures/protestant/EXO/40");
  const context = page.getByRole("complementary", { name: "Before you read" });
  await context.getByText("Where this chapter fits", { exact: true }).click();
  await expect(context.getByRole("heading", { name: "Where the book goes from here" })).toBeVisible();
  await expect(context.locator('a[href*="/EXO/41"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Next chapter", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.getByRole("link", { name: "About Exodus", exact: true }).click();
  await expect(page.getByRole("heading", { name: "How the text reached you" })).toBeVisible();
});
