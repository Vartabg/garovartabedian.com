import { test, expect } from "@playwright/test";

test("source groups start closed, open in place, and a link to one opens it", async ({ page }) => {
  await page.goto("/sources");
  const groups = page.locator("details.source-group");
  await expect(groups).toHaveCount(9);
  await expect(page.locator("details.source-group[open]")).toHaveCount(0);
  await expect(groups.first().locator("summary")).toBeInViewport();

  const jesus = page.locator("#jesus-history");
  await jesus.locator("summary").click();
  await expect(jesus).toHaveAttribute("open", "");
  await expect(jesus.getByRole("heading", { name: "Method", exact: true })).toBeVisible();
  await expect(jesus.locator(".source-links > li")).toHaveCount(5);
  await expect(jesus.getByRole("link", { name: /Explore Jesus/ })).toBeVisible();

  await page.goto("/sources#word-ownership");
  await expect(page.locator("#word-ownership")).toHaveAttribute("open", "");
  await expect(page.locator("#word-ownership > summary")).toBeInViewport();
  // The group opened by hand stays open: a link to another group adds to it.
  await expect(jesus).toHaveAttribute("open", "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});
