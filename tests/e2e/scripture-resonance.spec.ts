import { expect, test } from "@playwright/test";

test("resonance preserves download choice, searches every group, and opens the indexed translation", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  const modelRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/models/")) modelRequests.push(request.url());
  });
  await page.goto("/scriptures/resonance?q=word%20made%20flesh%20logos%20wisdom");
  const input = page.getByRole("textbox", { name: "Search conceptual theme across corpus groups" });
  await expect(input).toHaveValue("word made flesh logos wisdom");
  await expect(page.getByText(/first meaning search downloads about 47 MB/)).toBeVisible();
  expect(modelRequests).toHaveLength(0);
  await page.getByRole("button", { name: "Compute Resonance", exact: true }).click();
  const coverage = page.getByText("Index coverage: 1402 of 1402 indexed Scripture chapters assigned", { exact: true });
  await expect(coverage).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("region", { name: "Relative similarity across corpus groups" }).getByRole("button")).toHaveCount(9);
  await coverage.click();
  for (const id of ["LJE", "SUS", "BEL", "ENO", "JUB"]) {
    await expect(page.locator(".scr-resonance-coverage li").filter({ hasText: `(${id})` })).toBeVisible();
  }
  await page.getByRole("button", { name: "Gospel Chapters (4)", exact: true }).click();
  await expect(page.locator(".scr-horizon-detail .scr-evidence-card")).toHaveCount(4);
  await expect(page.locator(".scr-horizon-detail .scr-evidence-link").first()).toHaveAttribute("href", /\/scriptures\/protestant\/(MAT|MRK|LUK|JHN)\/\d+\?t=web/);
  await page.getByRole("button", { name: "Up to 4 per group (36)", exact: true }).click();
  await expect(page.locator(".scr-horizon-all-view .scr-evidence-card")).toHaveCount(36);
  await expect(page.getByText(/Scores across these different kinds of content are not calibrated/)).toBeVisible();
  await page.getByRole("button", { name: "Additional Scripture Books (4)", exact: true }).click();
  const link = page.locator(".scr-horizon-detail .scr-evidence-link").first();
  await expect(link).toHaveAttribute("href", /\?t=web$/);
  await link.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/World English Bible · \d+ verses/)).toBeVisible();
  expect(errors).toEqual([]);
});
