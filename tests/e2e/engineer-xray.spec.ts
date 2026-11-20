import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const chapter = "/scriptures/protestant/MRK/4";
const expectedXrefLinks = () => {
  const { refs } = JSON.parse(readFileSync("public/scriptures/xref/MRK.json", "utf8")) as { refs: Record<string, string[]> };
  return Object.entries(refs).filter(([key]) => key.startsWith("4:")).reduce((sum, [, targets]) => sum + targets.length, 0);
};

test("Engineer annotates the chapter in place and Reader hides every tag", async ({ page }) => {
  await page.goto(chapter);
  const tags = page.locator(".xray-tag");
  const foot = page.getByRole("region", { name: "How this page reached you" });
  await expect(tags).toHaveCount(6);
  for (let i = 0; i < 6; i += 1) await expect(tags.nth(i)).toBeHidden();
  await expect(foot).toBeHidden();
  const textBefore = await page.locator("#chapter-text").boundingBox();

  await page.getByRole("button", { name: "Engineer", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-lens", "engineer");
  for (let i = 0; i < 6; i += 1) await expect(tags.nth(i)).toBeVisible();
  await expect(foot).toBeVisible();
  await expect(page.locator('.xray-tag[data-xray="xref"]')).toContainText(`${expectedXrefLinks()} links from 41 verses`);
  await expect(page.locator('.xray-tag[data-xray="original"]')).toContainText("drafted by AI models");
  await expect(page.locator('.xray-tag[data-xray="guide"]')).toContainText("human-reviewed guides on the site");
  await expect(foot).toContainText("Browser specs that drive chapter pages");

  // A tag sits above its region; neither overlaps the other.
  for (let i = 0; i < 6; i += 1) {
    const [tag, region] = await tags.nth(i).evaluate((el) => {
      const next = el.nextElementSibling as HTMLElement | null;
      const box = (node: Element | null) => (node ? node.getBoundingClientRect().toJSON() : null);
      return [box(el), box(next)];
    });
    expect(tag).not.toBeNull();
    if (region && region.height > 0) expect(region.top).toBeGreaterThanOrEqual(tag.bottom - 1);
  }

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-site-lens", "engineer");
  await expect(tags.first()).toBeVisible();

  await page.getByRole("button", { name: "Reader", exact: true }).click();
  for (let i = 0; i < 6; i += 1) await expect(tags.nth(i)).toBeHidden();
  await expect(foot).toBeHidden();
  // Reader is exactly where it was before the lens was ever switched.
  expect(await page.locator("#chapter-text").boundingBox()).toEqual(textBefore);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the foot names the home page's own specs and stays inside a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const homeTag = page.locator('.xray-tag[data-xray="world"]');
  await expect(homeTag).toHaveCount(1);
  await expect(homeTag).toBeHidden();
  await page.getByRole("button", { name: "Engineer", exact: true }).click();
  await expect(homeTag).toBeVisible();
  await expect(homeTag).toContainText("Built from");
  const tagBox = await homeTag.boundingBox();
  const frontBox = await page.locator(".st-frontispiece").boundingBox();
  expect(tagBox).not.toBeNull();
  expect(frontBox).not.toBeNull();
  expect(frontBox!.y).toBeGreaterThanOrEqual(tagBox!.y + tagBox!.height - 1);
  const foot = page.getByRole("region", { name: "How this page reached you" });
  await expect(foot).toBeVisible();
  await expect(foot).toContainText("Browser specs that drive the home page");
  await expect(foot.getByRole("link", { name: "Full release record" })).toHaveAttribute("href", "/work/garovartabedian");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
