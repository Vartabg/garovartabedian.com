import { expect, test } from "@playwright/test";

test("the parables page carries three tags under Engineer, none under Reader, and every checked passage is shown", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/jesus/parables");
  const tags = page.locator(".xray-tag");
  await expect(tags).toHaveCount(3);
  for (const id of ["parables", "checksums", "counts"]) await expect(page.locator(`.xray-tag[data-xray="${id}"]`)).toBeHidden();

  await page.getByRole("button", { name: "Engineer", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-lens", "engineer");
  await expect(page.locator('.xray-tag[data-xray="parables"]')).toContainText("Built from");
  // The checksum tag sits with the early writings, so it shows once that group is chosen.
  await page.getByRole("navigation", { name: "Parable groups" }).getByRole("button", { name: /^Early writings/ }).click();
  await expect(page.locator('.xray-tag[data-xray="checksums"]')).toBeVisible();
  await expect(page.locator('.xray-tag[data-xray="checksums"]')).toContainText(/(\d+) shown, 0 withheld/);
  await expect(page.locator('.xray-tag[data-xray="counts"]')).toContainText("parabolē: Matthew 17, Mark 13, Luke 18, John 0");
  // The page-wide tag does not box the overview; the region tags do outline what they describe.
  expect(await page.locator('.xray-tag[data-xray="parables"]').evaluate((el) => getComputedStyle(el.nextElementSibling as Element).outlineStyle)).toBe("none");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Reader", exact: true }).click();
  await expect(page.locator('.xray-tag[data-xray="parables"]')).toBeHidden();
});
