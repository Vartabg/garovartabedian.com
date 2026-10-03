import { expect, test } from "@playwright/test";

test("Genesis context names its source edition when another edition is being read", async ({ page }) => {
  await page.goto("/scriptures/orthodox/GEN/1?t=brenton");
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("Brenton Septuagint");
  const context = page.getByRole("complementary", { name: "Before you read" });
  await expect(context).toContainText("References use World English Bible.");
  await context.getByText("Where this chapter fits", { exact: true }).click();
  const nextReference = context.locator('a[href^="/scriptures/orthodox/GEN/2?t=web#v"]').first();
  await expect(nextReference).toBeVisible();
  await nextReference.click();
  await expect(page).toHaveURL(/\/GEN\/2\?t=web#v\d+/);
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("World English Bible");
  await expect(page.getByRole("heading", { name: "Genesis 2", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Cheat Sheet — Genesis 2/ }).click();
  await expect(page.locator(".scr-guide-panel")).toContainText("Agent-reviewed");
  await expect(page.locator(".scr-guide-panel")).not.toContainText("Human-reviewed");

  await page.goto("/scriptures/orthodox/GEN/5?t=brenton");
  await page.getByRole("button", { name: /Cheat Sheet — Genesis 5/ }).click();
  await expect(page.locator(".scr-guide-keyverses a").first()).toHaveAttribute("href", /\/GEN\/5\?t=web#v\d+/);
  await expect(page.locator(".scr-guide-outline a").first()).toHaveAttribute("href", /\/GEN\/5\?t=web#v\d+/);
  await page.getByRole("button", { name: /Why does another hosted edition give Adam a different age/ }).click();
  const questionLink = page.locator(".scr-guide-q-refs").getByRole("link", { name: "5:3", exact: true });
  await expect(questionLink).toHaveAttribute("href", "/scriptures/orthodox/GEN/5?t=web#v3");
  await questionLink.click();
  await expect(page).toHaveURL(/\/GEN\/5\?t=web#v3/);
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("World English Bible");
});

test("Genesis context remains usable on mobile at the book's conclusion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/scriptures/protestant/GEN/50");
  const context = page.getByRole("complementary", { name: "Before you read" });
  await context.getByText("Where this chapter fits", { exact: true }).click();
  await expect(context.getByRole("heading", { name: "Where the book goes from here" })).toBeVisible();
  await expect(context.locator('a[href*="/GEN/51"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Next chapter", exact: true })).toHaveCount(0);
  const briefingLink = context.getByRole("link", { name: "About Genesis", exact: true });
  await expect(briefingLink).toHaveAttribute("href", "/scriptures/protestant/GEN");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await briefingLink.click();
  await expect(page.getByRole("heading", { name: "How the text reached you" })).toBeVisible();
});
