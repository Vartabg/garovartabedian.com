import { expect, test, type Page } from "@playwright/test";

test("the chapter margin turns reading intent into the right depth", async ({
  page,
}) => {
  await page.goto("/scriptures/protestant/JHN/3");

  const margin = page.getByRole("complementary", {
    name: "John 3 study notes",
  });
  await expect(margin).toBeVisible();

  // Wide screens show the glosses with their actions; phones show the
  // four-way strip. Either way the same handlers run.
  const wide = await margin.locator(".scr-gloss-body").isVisible();
  const understand = wide
    ? margin.getByRole("button", { name: /cheat sheet/i })
    : margin.getByRole("button", { name: /Understand/ });
  const connect = wide
    ? margin.getByRole("button", { name: /cross-reference map/i })
    : margin.getByRole("button", { name: /Trace connections/ });
  const source = wide
    ? margin.getByRole("button", { name: /original language/i })
    : margin.getByRole("button", { name: /Source/ });

  await understand.click();
  await expect(
    page.getByRole("button", { name: /Cheat Sheet — John 3/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".scr-guide-panel")).toBeVisible();

  await connect.click();
  await expect(page.locator(".scr-wide-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".scr-threads")).toBeVisible();

  await source.click();
  await expect(page).toHaveURL(/\/scriptures\/protestant\/JHN\/3\?t=web&o=1$/);
  await expect(
    page.getByRole("complementary", { name: "Original-language edition" }),
  ).toBeVisible();
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
