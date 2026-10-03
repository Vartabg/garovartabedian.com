import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/find/**", route => route.abort("blockedbyclient"));
});

for (const [query, expected] of [
  ["light of the world", ["John 9:5", "Matthew 5:14", "John 8:12"]],
  ["love your enemies", ["Luke 6:27", "Matthew 5:44", "Luke 6:35"]],
] as const) test(`complete phrases lead the public results: ${query}`, async ({ page }) => {
  await page.goto(`/scriptures/search?q=${encodeURIComponent(query)}`);
  const list = page.getByRole("list", { name: "Ranked scripture word matches" });
  await expect(list.locator(".scr-ref").first()).toHaveText(expected[0]);
  expect(await list.locator(".scr-ref").allTextContents()).toEqual(expect.arrayContaining([...expected]));
  for (let i = 0; i < 3; i++) {
    await expect(list.locator("li").nth(i).locator(".scr-ref")).toHaveText(expected[i]);
    await expect(list.locator("li").nth(i).locator(".scr-hit-match")).toHaveText("Complete phrase");
  }
});

test("loneliness explains missing wording and offers an edition-faithful next step", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/scriptures/search?q=loneliness&trans=drb&scope=texts");
  await expect(page.getByText(/No word matches were found in the Douay/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Try related wording" }).getByRole("link", { name: "Search “alone”" })).toHaveAttribute("href", "/scriptures/search?q=alone&trans=drb&scope=texts");
  const related = page.getByRole("region", { name: "Related passages · KJV" });
  await expect(related.getByRole("link", { name: "Friendship", exact: true })).toBeVisible();
  const link = related.locator(".scr-ref").first();
  const target = new URL(await link.getAttribute("href") as string, "https://local.invalid");
  expect(target.searchParams.get("t")).toBe("kjv");
  expect(target.searchParams.get("findTrans")).toBe("drb");
  await link.click();
  await expect(page.locator("[data-reading-edition]")).toHaveAttribute("data-reading-edition", "kjv");
  await page.getByRole("link", { name: "← Back to results for “loneliness”" }).click();
  await expect(page).toHaveURL(/\/scriptures\/search\?q=loneliness&trans=drb&scope=texts$/);
  expect(new URL(page.url()).searchParams.get("trans")).toBe("drb");
  expect(new URL(page.url()).searchParams.get("scope")).toBe("texts");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("a negated query preserves the contrast and labels it without claiming support", async ({ page }) => {
  await page.goto("/scriptures/search?q=not%20peace%20but%20a%20sword");
  await expect(page.getByText(/Your negation stays in the query/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Ranked scripture word matches" }).locator(".scr-ref").first()).toHaveText("Matthew 10:34");
  await expect(page.getByRole("navigation", { name: "Try related wording" })).toHaveCount(0);
});

test("the nav popup carries its edition and scope into search and the reader", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await dialog.getByRole("combobox", { name: "Find Scripture edition" }).selectOption("kjv");
  await dialog.getByRole("button", { name: "Passages & writings", exact: true }).click();
  await dialog.getByRole("searchbox", { name: "Find" }).fill("light of the world");
  await expect(dialog.getByRole("heading", { name: "Words and phrases (KJV)" })).toBeVisible();
  await dialog.getByRole("button", { name: /^Search passages/ }).click();
  await expect(page).toHaveURL(/\/scriptures\/search\?q=light%20of%20the%20world&trans=kjv&scope=texts$/);
  const url = new URL(page.url());
  expect(url.pathname).toBe("/scriptures/search"); expect(url.searchParams.get("trans")).toBe("kjv"); expect(url.searchParams.get("scope")).toBe("texts");
  await page.getByRole("searchbox", { name: "Search Scripture", exact: true }).fill("John 8:12");
  await page.getByRole("searchbox", { name: "Search Scripture", exact: true }).press("Enter");
  const passage = page.getByRole("link", { name: "Open John 8:12 in context" });
  await expect(passage).toHaveAttribute("href", /t=kjv&find=John\+8%3A12&findTrans=kjv&findScope=texts#v12$/);
  await passage.click();
  await expect(page.locator("[data-reading-edition]")).toHaveAttribute("data-reading-edition", "kjv");
});

test("public search and its edition selector pass bounded accessibility checks", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/scriptures/search?q=loneliness");
  await expect(page.getByText(/No word matches were found/)).toBeVisible();
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const audit = (target: string) => page.evaluate(async target => (await (window as unknown as { axe: { run: (target: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe.run(target, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations, target);
  expect(await audit("main")).toEqual([]);
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  await page.getByRole("dialog", { name: "Find" }).getByRole("searchbox", { name: "Find" }).fill("loneliness");
  await expect(page.getByRole("dialog", { name: "Find" }).getByText(/No word matches in/)).toBeVisible();
  expect(await audit(".find-dialog")).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
