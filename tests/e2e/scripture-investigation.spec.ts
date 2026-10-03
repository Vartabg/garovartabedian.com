import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("investigation connects findings, containing passages, downloads, and the correct Clement chapter", async ({ page }, testInfo) => {
  await page.goto("/scriptures/catena");
  await page.getByRole("link", { name: "Open the source investigation" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Isaiah 53 in 1 Clement 16");
  await expect(page.getByText("4 excerpts match the hosted sources · Editorial draft")).toBeVisible();

  const evidence = page.locator("#clement-suffering");
  await evidence.getByText("Read the full containing passage", { exact: true }).click();
  await expect(evidence.locator("details[open]")).toContainText("For Christ is of those who are humble-minded");

  const downloaded = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download research dossier (.md)" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("isaiah-53-clement-16.md");
  const downloadedPath = testInfo.outputPath("isaiah-53-clement-16.md");
  await download.saveAs(downloadedPath);
  const markdown = await readFile(downloadedPath, "utf8");
  expect(markdown).toContain("Editorial review: draft");
  expect(markdown).toContain("Artifact SHA-256:");

  await evidence.getByRole("link", { name: "Read the source passage" }).click();
  await expect(page).toHaveURL(/\/early\/1clement#chapter-16$/);
  await expect(page.locator("#chapter-16")).toHaveCount(1);
  await expect(page.locator("#chapter-16").locator("..")).toContainText("Chapter XVI.—Christ as an example of humility.");
  await expect(page.locator("#chapter-16").locator("..")).toContainText("by His stripes we were healed");
  await expect(page.locator("#s15")).toHaveCount(1);
  await expect(page.locator("#chapter-xvi")).toHaveCount(1);
});

test("investigation remains readable at a phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/scriptures/investigations/isaiah-53-clement-16");
  await page.locator("#clement-suffering").getByText("Inspect this quotation’s source check", { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(page.locator("#clement-suffering blockquote")).toBeVisible();
});
