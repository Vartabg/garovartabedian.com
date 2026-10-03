import { expect, test } from "@playwright/test";

test("Jubilees context connects the book briefing, chapter movement, and Charles references", async ({ page }) => {
  await page.goto("/scriptures/ethiopian/JUB");
  await expect(page.getByRole("heading", { name: "Where you are when this opens" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How the text reached you" })).toBeVisible();

  await page.goto("/scriptures/ethiopian/JUB/1");
  const context = page.getByRole("complementary", { name: "Before you read" });
  await expect(context).toBeVisible();
  await expect(context).toContainText("Editorial context");
  await context.getByText("Where this chapter fits", { exact: true }).click();
  await expect(context.getByRole("heading", { name: "Leading into this chapter" })).toBeVisible();
  const nextReference = context.locator('a[href^="/scriptures/ethiopian/JUB/2?t=charles#v"]').first();
  await expect(nextReference).toBeVisible();
  await nextReference.click();
  await expect(page.getByRole("heading", { name: "Jubilees 2", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/JUB\/2\?t=charles#v\d+/);

  await page.getByRole("button", { name: /Cheat Sheet — Jubilees 2/ }).click();
  await expect(page.locator(".scr-guide-panel")).toContainText("Agent-reviewed");
  await expect(page.locator(".scr-guide-panel")).not.toContainText("Human-reviewed");

  await page.setViewportSize({ width: 390, height: 844 });
  await context.scrollIntoViewIfNeeded();
  await expect(context).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("Jubilees carries the complete Abraham account from chapter 17 into 18", async ({
  page,
}) => {
  await page.goto("/scriptures/ethiopian/JUB/17");

  const chapter17 = page.getByRole("article", { name: "Jubilees chapter 17" });
  await expect(chapter17).toBeVisible();
  await expect(
    chapter17.getByRole("button", { name: /^Verse \d+ — open study tools$/ }),
  ).toHaveCount(18);
  await expect(chapter17.locator("#v15")).toContainText(
    "in the seventh week, in the first year thereof",
  );
  await expect(chapter17.locator("#v16")).toContainText("the prince Mastêmâ");

  await page.getByRole("link", { name: "Next chapter", exact: true }).click();
  await expect(page).toHaveURL(/\/scriptures\/ethiopian\/JUB\/18(?:\?t=charles)?$/);
  const chapter18 = page.getByRole("article", { name: "Jubilees chapter 18" });
  await expect(chapter18).toBeVisible();
  await expect(
    chapter18.getByRole("button", { name: /^Verse \d+ — open study tools$/ }),
  ).toHaveCount(19);
  await expect(chapter18.locator("#v10")).toContainText("and he was terrified");
  await expect(chapter18.locator("#v12")).toContainText("a ram caught . . . by his horns");
  await expect(chapter18.locator("#v19")).toContainText(
    "they should observe this festival seven days",
  );

  const verse12 = chapter18.getByRole("button", {
    name: "Verse 12 — open study tools",
    exact: true,
  });
  await verse12.click();
  await expect(verse12).toHaveAttribute("aria-expanded", "true");
  await expect(
    chapter18.getByRole("group", { name: "Jubilees 18:12 tools" }),
  ).toBeVisible();
});

test("the Jubilees chapter picker reaches chapter 50 and stops at the book boundary", async ({
  page,
}) => {
  await page.goto("/scriptures/ethiopian/JUB/18");
  await page.getByRole("button", {
    name: "Jubilees 18 — go to another chapter or book",
  }).click();

  const picker = page.getByRole("dialog", { name: "Go to", exact: true });
  await expect(
    picker.getByRole("link", { name: /^Jubilees chapter \d+$/ }),
  ).toHaveCount(50);
  await picker.getByRole("link", { name: "Jubilees chapter 50", exact: true }).click();

  await expect(page).toHaveURL(/\/scriptures\/ethiopian\/JUB\/50(?:\?t=charles)?$/);
  const chapter = page.getByRole("article", { name: "Jubilees chapter 50" });
  await expect(chapter).toBeVisible();
  await expect(
    chapter.getByRole("button", { name: /^Verse \d+ — open study tools$/ }),
  ).toHaveCount(13);
  await expect(chapter.locator("#v13")).toContainText(
    "Herewith is completed the account of the division of the days.",
  );
  await expect(page.getByRole("link", { name: "Next chapter", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Previous chapter", exact: true })).toHaveAttribute(
    "href",
    /\/scriptures\/ethiopian\/JUB\/49(?:\?t=charles)?$/,
  );
});

test("a Jubilees chapter beyond the complete 50-chapter book returns not found", async ({
  page,
}) => {
  const response = await page.goto("/scriptures/ethiopian/JUB/51");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Jubilees chapter 51" })).toHaveCount(0);
});

test("a search with no WEB matches can switch to Charles and retain it for accented queries", async ({
  page,
}) => {
  const matches = page.getByRole("list", { name: "Ranked scripture word matches" });
  const references = matches.getByRole("link", { name: /^Jubilees \d+:\d+$/ });
  const input = page.getByRole("searchbox", { name: "Search Scripture" });

  await page.goto("/scriptures/search");
  await expect(page.getByRole("search", { name: "Search Scriptures" })).toHaveAttribute(
    "data-enhanced",
    "true",
  );
  await input.fill("Mastema");
  await input.press("Enter");
  await expect(page.getByText(/No word matches were found in the World English Bible index/)).toBeVisible();
  await expect(matches).toHaveCount(0);

  const translation = page.getByRole("combobox", { name: "Scripture edition:" });
  await expect(translation).toHaveValue("web");
  await translation.selectOption("charles");
  await expect(page).toHaveURL((url) =>
    url.pathname === "/scriptures/search" &&
    url.searchParams.get("q") === "Mastema" &&
    url.searchParams.get("trans") === "charles",
  );
  await expect(matches).toBeVisible();
  await expect(matches.getByRole("link", { name: "Jubilees 17:16", exact: true })).toBeVisible();
  const plainReferences = await references.evaluateAll((links) =>
    links.map((link) => { const url = new URL(link.getAttribute("href")!, location.origin); return `${url.pathname}?t=${url.searchParams.get("t")}${url.hash}`; }),
  );
  expect(plainReferences.length).toBeGreaterThan(0);

  await input.fill("Mastêmâ");
  await input.press("Enter");
  await expect(page).toHaveURL((url) =>
    url.pathname === "/scriptures/search" &&
    url.searchParams.get("q") === "Mastêmâ" &&
    url.searchParams.get("trans") === "charles",
  );
  await expect(input).toHaveValue("Mastêmâ");
  await expect(translation).toHaveValue("charles");
  await expect(matches).toBeVisible();
  await expect(references).toHaveCount(plainReferences.length);
  expect(await references.evaluateAll((links) =>
    links.map((link) => { const url = new URL(link.getAttribute("href")!, location.origin); return `${url.pathname}?t=${url.searchParams.get("t")}${url.hash}`; }),
  )).toEqual(plainReferences);

  await matches.getByRole("link", { name: "Jubilees 17:16", exact: true }).click();
  await expect(page).toHaveURL(/\/scriptures\/ethiopian\/JUB\/17\?t=charles&find=Mast%C3%AAm%C3%A2&findTrans=charles#v16$/);
  await expect(
    page.getByRole("article", { name: "Jubilees chapter 17" }).locator("#v16"),
  ).toContainText("And the prince Mastêmâ came and said before God");
});
