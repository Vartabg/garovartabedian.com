import { test, expect } from "@playwright/test";

for (const width of [390, 1280]) {
  test.describe(`edition library at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    test("focused Gnostic collection exposes six readers with distinct witnesses", async ({ page }) => {
      await page.goto("/early/library?group=gnostic");
      await expect(page.getByRole("heading", { name: "Gnostic writings", exact: true })).toBeVisible();
      await expect(page.locator(".scr-card")).toHaveCount(6);
      await page.getByRole("link", { name: /Read edition The Secret Book of John/ }).click();
      await expect(page.locator("article")).toContainText("Samuel Zinner");
      await page.getByRole("link", { name: "Chapter 1 — Berlin Codex", exact: true }).click();
      await expect(page).toHaveURL(/chapter-1-berlin-codex$/);
      await expect(page.locator(".ew-section")).toContainText("John");
      await expect(page.getByRole("heading", { name: "Cite this section" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    });
    test("complete letter, old citation, long work and source-only edition", async ({ page }) => {
      await page.goto("/early/1clement#chapter-59");
      await expect(page.locator("#chapter-59")).toHaveCount(1);
      await page.getByText("About this writing, artwork and sources", { exact: true }).click();
      await expect(page.getByRole("heading", { name: "Other editions of this work" })).toBeVisible();
      await page.getByRole("link", { name: "J. B. Lightfoot", exact: true }).click();
      await expect(page.getByText("1 Clem. 65", { exact: true })).toBeVisible();
      await page.getByRole("link", { name: "1 Clem. 65", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Cite this section" })).toBeVisible();
      await expect(page.locator("article")).toContainText("Lightfoot");
      await expect(page.locator(".ew-section")).toContainText("Amen");
      await page.goto("/early/library/josephus-antiquities-11-20");
      await expect(page.getByRole("link", { name: /Josephus: Antiquities.*I–X/ })).toBeVisible();
      await page.getByRole("link", { name: "Start reading →" }).click();
      await expect(page.getByRole("navigation", { name: "Reading sections" }).first()).toBeVisible();
      await page.getByRole("link", { name: /^Next →/ }).first().click();
      await expect(page.locator(".ew-section p").first()).toBeVisible();
      await page.goto("/early/library/ethiopic-didascalia");
      await expect(page.getByText("Reference only — no text hosted")).toBeVisible();
      await expect(page.getByRole("link", { name: "Open the source scan" })).toHaveAttribute("href", "https://archive.org/details/cu31924096083336");
      await expect(page.getByRole("link", { name: "Start reading →" })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    });
    test("fragment gaps, search types, reference witnesses and bounded payloads", async ({ page }) => {
      const corpusResponses: string[] = [];
      page.on("response", response => { if (/content\/early-library|search\.json|readings\//.test(response.url())) corpusResponses.push(response.url()); });
      await page.goto("/early/library/gospel-mary");
      await page.getByRole("link", { name: "Start reading →" }).click();
      await expect(page.locator("article")).toContainText("Pages 1 through 6 are missing");
      await expect(page.locator("article")).toContainText("Pages 11 through 14 are missing");
      await page.goto("/early/search?q=resurrection&kind=primary-text");
      await expect(page.locator(".ew-library-results li").first()).toContainText("Translated text");
      await page.getByLabel("Search within").selectOption("commentary");
      await page.getByRole("button", { name: "Search", exact: true }).click();
      await expect(page.locator(".ew-library-results li").first()).toContainText("Edition commentary");
      await page.goto("/early/library/community-rule");
      await expect(page.locator("article")).toContainText("1QS");
      await expect(page.locator("article")).toContainText("No English translation");
      expect(corpusResponses).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    });
  });
}
