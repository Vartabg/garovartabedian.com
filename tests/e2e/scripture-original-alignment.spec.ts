import { expect, test } from "@playwright/test";

for (const variant of ["t=drb&o=1", "t=web&c=drb&o=1", "t=drb&c=web&o=1"]) {
  test(`the reader rejects unaligned LXX underlays for ${variant}`, async ({ page }) => {
    const originalRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/scriptures/original/1MA/1.json")) originalRequests.push(request.url());
    });
    await page.goto(`/scriptures/catholic/1MA/1?${variant}`);
    await expect(page).not.toHaveURL(/[?&]o=1/);
    await expect(page.locator(".scr-original-line")).toHaveCount(0);
    expect(originalRequests).toEqual([]);
    await expect(page.locator("#chapter-text")).toBeVisible();
  });
}

for (const variant of ["t=web&o=1", "t=web&c=brenton&o=1"]) {
  test(`the reader still loads an aligned LXX underlay for ${variant}`, async ({ page }) => {
    await page.goto(`/scriptures/catholic/1MA/1?${variant}`);
    await expect(page.locator(".scr-original-line").first()).toBeVisible();
    await expect(page).toHaveURL(/[?&]o=1/);
    await expect(page.getByRole("complementary", { name: "Original-language edition" }))
      .toContainText("Septuagint Greek · Rahlfs LXX + lxx-morph");
  });
}
