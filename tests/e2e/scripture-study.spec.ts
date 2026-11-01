import { expect, test, type Page } from "@playwright/test";

test("the chapter text comes first and the study tools follow it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/scriptures/protestant/LEV/16");

  // Leviticus 16 carries a chapter context, the longest stack that used to
  // sit above verse 1. Only the title, edition and breadcrumb may now.
  const verseOne = await page.locator("#v1").boundingBox();
  expect(verseOne?.y).toBeLessThan(812 * 0.75);
  const textEnd = await page.locator("#chapter-text").evaluate(
    (el) => el.getBoundingClientRect().bottom + scrollY,
  );
  for (const tool of [
    page.getByRole("complementary", { name: "Chapter context" }),
    page.getByRole("button", { name: "Save chapter offline" }),
    page.getByRole("navigation", { name: "Chapter study tools" }),
    page.getByRole("button", { name: /Cheat Sheet — Leviticus 16/ }),
  ]) {
    const top = await tool.evaluate((el) => el.getBoundingClientRect().top + scrollY);
    expect(top).toBeGreaterThan(textEnd);
  }

  // The next chapter is the first thing after the last verse.
  const onward = page.getByRole("navigation", { name: "Continue reading" });
  await expect(onward.getByRole("link", { name: "Leviticus 17 →" })).toBeVisible();
  const onwardTop = await onward.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  expect(onwardTop - textEnd).toBeLessThan(120);
});

test("study tools below the text open their depth in place", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/3");

  await page.getByRole("button", { name: /Cheat Sheet — John 3/ }).click();
  await expect(
    page.getByRole("button", { name: /Cheat Sheet — John 3/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".scr-guide-panel")).toBeVisible();

  await page.getByRole("button", { name: /Cross-reference map/ }).click();
  await expect(page.locator(".scr-wide-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".scr-threads")).toBeVisible();

  await page.getByRole("button", { name: "Show the original language" }).click();
  await expect(page).toHaveURL(/\/scriptures\/protestant\/JHN\/3\?t=web&o=1$/);
  await expect(
    page.getByRole("complementary", { name: "Original-language edition" }),
  ).toBeVisible();
});

test("paging runs across a book boundary in the same version", async ({ page }) => {
  await page.goto("/scriptures/protestant/MAL/4?t=kjv");
  await expect(page.locator(".scr-rh .scr-read-meta")).toContainText("King James Version");
  await page.getByRole("link", { name: "Next book — Matthew 1" }).click();
  await expect(page).toHaveURL(/\/scriptures\/protestant\/MAT\/1\?t=kjv$/);
  await expect(page.getByRole("link", { name: "Previous book — Malachi 4" })).toBeVisible();
});

/** ReaderClient writes scr:trail:v1 in an effect; don't leave until it lands. */
async function openChapterUntilTrailHas(
  page: Page,
  bookId: string,
  chapter: number,
) {
  await page.goto(`/scriptures/protestant/${bookId}/${chapter}`);
  await expect(
    page.getByRole("article", { name: `John chapter ${chapter}` }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        ({ bookId, chapter }) => {
          try {
            const trail = JSON.parse(
              localStorage.getItem("scr:trail:v1") ?? "[]",
            );
            return (
              Array.isArray(trail) &&
              trail.some(
                (entry) =>
                  entry &&
                  entry.bookId === bookId &&
                  entry.chapter === chapter,
              )
            );
          } catch {
            return false;
          }
        },
        { bookId, chapter },
      ),
    )
    .toBe(true);
}

test("recent chapters return as a private study path on the landing page", async ({
  page,
}) => {
  await openChapterUntilTrailHas(page, "JHN", 1);
  await openChapterUntilTrailHas(page, "JHN", 2);
  await page.goto("/scriptures");

  const trail = page.getByRole("region", {
    name: "Continue where the text led you.",
  });
  await expect(trail).toBeVisible();
  await expect(trail).toContainText("Stored only on this device");
  await expect(trail.getByRole("link", { name: /John 2/ })).toBeVisible();
  await expect(trail.getByRole("link", { name: /John 1/ })).toBeVisible();
});
