import { expect, test } from "@playwright/test";

test("public meaning search scans every WEB book locally and keeps the search edition on return", async ({ page }) => {
  test.setTimeout(120_000);
  const paidRequests: string[] = [], modelRequests: string[] = [], errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    if (request.url().includes("/models/")) modelRequests.push(request.url());
    if (request.method() === "POST" && request.url().includes("/api/find/")) paidRequests.push(request.url());
  });
  await page.route("**/api/find/**", route => route.abort("blockedbyclient"));
  await page.goto("/scriptures/search?q=not%20peace%20but%20a%20sword&trans=drb&scope=texts");
  const meaning = page.getByRole("region", { name: "Meaning suggestions · WEB" });
  await expect(meaning.getByRole("button", { name: "Search by meaning", exact: true })).toBeVisible();
  expect(modelRequests).toHaveLength(0);
  await meaning.getByRole("button", { name: "Search by meaning", exact: true }).click();
  await expect(meaning.getByText(/Searched all 81 indexed WEB books/)).toBeVisible({ timeout: 90_000 });
  const first = meaning.getByRole("list", { name: "Verses ranked by meaning" }).locator(".scr-ref").first();
  await expect(first).toHaveText("Matthew 10:34");
  await expect(first).toHaveAttribute("href", /t=web&find=not\+peace\+but\+a\+sword&findTrans=drb&findScope=texts#v34$/);
  await first.click();
  await expect(page.locator("[data-reading-edition]")).toHaveAttribute("data-reading-edition", "web");
  await expect(page.getByRole("link", { name: "← Back to results for “not peace but a sword”" })).toHaveAttribute("href", "/scriptures/search?q=not%20peace%20but%20a%20sword&trans=drb&scope=texts");
  expect(paidRequests).toEqual([]); expect(errors).toEqual([]);
});
