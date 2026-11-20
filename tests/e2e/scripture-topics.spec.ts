import { test, expect } from "@playwright/test";

test("topics open on the largest, a letter leads with its larger topics, and search lists the matches", async ({ page }) => {
  await page.goto("/scriptures/topics");
  const head = page.locator(".scr-topics-head");
  const rows = page.locator(".scr-topics-head + .scr-topics-list > li");
  const letters = page.getByRole("navigation", { name: "Browse by letter" });

  await expect(page.getByRole("heading", { name: "The 40 largest topics", exact: true })).toBeVisible();
  await expect(rows).toHaveCount(40);
  await expect(rows.first()).toContainText("God");
  await expect(rows.first()).toBeInViewport();
  await expect(page.getByRole("link", { name: "Jesus, the Christ", exact: true })).toHaveAttribute("href", "/scriptures/topics/JESUS%2C%20THE%20CHRIST");
  await expect(letters.getByRole("button")).toHaveCount(25);
  await expect(page.locator(".scr-topic-atlas")).toHaveCount(0);

  // A letter: its larger topics first, the rest one tap away.
  await letters.getByRole("button", { name: "S", exact: true }).click();
  await expect(head).toContainText("71 with 20 or more references");
  await expect(rows).toHaveCount(71);
  const fold = page.locator(".scr-topics-fold");
  await expect(fold.locator("summary")).toHaveText("All 570 topics under S");
  await expect(fold).not.toHaveAttribute("open", "");
  await fold.locator("summary").click();
  await expect(fold.locator(".scr-topics-list > li")).toHaveCount(570);

  // A small letter lists everything; picking it again returns to the largest topics.
  await letters.getByRole("button", { name: "Q", exact: true }).click();
  await expect(head).toContainText("10 topics");
  await expect(rows).toHaveCount(10);
  await expect(fold).toHaveCount(0);
  await letters.getByRole("button", { name: "Q", exact: true }).click();
  await expect(head).toContainText("The 40 largest topics");

  // Search, then a topic page with its capitals kept.
  await page.getByLabel("Search topics").fill("faith");
  await expect(head).toContainText("4 topics match");
  await expect(rows).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  await page.getByRole("link", { name: "Faith", exact: true }).click();
  await expect(page).toHaveURL(/\/scriptures\/topics\/FAITH$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Faith");
  await page.goto(`/scriptures/topics/${encodeURIComponent("WORD OF GOD")}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Word of God");
  await expect(page).toHaveTitle(/^Word of God/);
});
