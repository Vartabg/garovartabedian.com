import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const homes = ["/", "/scriptures", "/jesus", "/apostles", "/early", "/church", "/word", "/angels", "/evidence"];

test("the Jesus home's tag shows the number the life-lens index holds, and reads as one block", async ({ page }) => {
  const moments = (JSON.parse(readFileSync("public/jesus/life-lenses.json", "utf8")) as { moments: unknown[] }).moments.length;
  await page.addInitScript(() => { try { localStorage.setItem("garovartabedian:lens:v1", "engineer"); } catch { /* storage blocked */ } });
  await page.goto("/jesus");
  const tag = page.locator('.xray-tag[data-xray="world"]');
  await expect(tag).toContainText(`${moments} moments on the life map`);
  // A home's tag describes the page, so the sibling after it is not outlined.
  expect(await tag.evaluate((el) => getComputedStyle(el.nextElementSibling as Element).outlineStyle)).toBe("none");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-site-lens", "engineer");
  await expect(tag).toBeVisible();
});

for (const home of homes) {
  test(`${home} carries one Built-from tag under Engineer and none under Reader`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(home);
    const tag = page.locator('.xray-tag[data-xray="world"]');
    await expect(tag).toHaveCount(1);
    await expect(tag).toBeHidden();

    await page.getByRole("button", { name: "Engineer", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-site-lens", "engineer");
    await expect(tag).toBeVisible();
    await expect(tag).toContainText("Built from");
    await expect(tag).toContainText(/\d/);
    await expect(page.getByRole("region", { name: "How this page reached you" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.getByRole("button", { name: "Reader", exact: true }).click();
    await expect(tag).toBeHidden();
  });
}
