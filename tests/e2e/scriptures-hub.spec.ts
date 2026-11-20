import { expect, test } from "@playwright/test";
import { scriptureStudyCatalog } from "../../src/lib/scriptures/study-catalog";

test("the Scripture desk offers reading, word study, and every public study tool", async ({ page }) => {
  await page.goto("/scriptures");
  const storyStrip = page.locator(".scr-hub-stories .st-stories-strip");
  await expect(storyStrip.getByRole("link")).toHaveCount(27);
  await expect(page.locator("#scr-all-stories")).toHaveAttribute("href", "/scriptures/stories");
  const stopRepeats = ((await page.locator("main").innerText()).match(/One stop at a time/g) ?? []).length;
  expect(stopRepeats).toBeLessThanOrEqual(1);
  const start = page.getByRole("navigation", { name: "Start studying" });
  await expect(start.getByRole("link")).toHaveCount(4);
  await expect(start.getByRole("link").nth(0)).toHaveAttribute("href", "#read");
  await expect(start.getByRole("link").nth(1)).toHaveAttribute("href", "/scriptures/search");
  await expect(start.getByRole("link").nth(2)).toHaveAttribute("href", "/scriptures/word-bridge");
  await expect(start.getByRole("link").nth(3)).toHaveAttribute("href", "/scriptures/polyglot");

  const catalog = page.getByRole("region", { name: "Find a way into your question." });
  for (const group of scriptureStudyCatalog()) {
    const navigation = catalog.getByRole("navigation", { name: group.title });
    await expect(navigation).toBeVisible();
    for (const tool of group.tools) {
      await expect(navigation.locator(`a[href="${tool.href}"]`)).toContainText(tool.label);
    }
  }
  await expect(catalog.locator('a[href="/scriptures/find"], a[href="/scriptures/research"]')).toHaveCount(0);
  const collection = await page.locator('.world-scr > script[type="application/ld+json"]').textContent();
  const parts = JSON.parse(collection ?? "{}").hasPart as { name: string; url: string }[];
  expect(parts.find((part) => part.url.endsWith("/scriptures/search"))?.name).toBe("Search the text");
  expect(parts.find((part) => part.url.endsWith("/scriptures/word-bridge"))?.name).toBe("Word Bridge");
  await start.getByRole("link").nth(0).click();
  await expect(page).toHaveURL(/\/scriptures#read$/);
  await expect(page.locator("#read")).toBeFocused();
  await expect(page.getByRole("region", { name: "Choose a book and chapter" })).toBeVisible();
  await expect(page.getByRole("tabpanel").getByRole("link", { name: /^John, / })).toBeVisible();
  await start.getByRole("link").nth(1).click();
  await expect(page.getByRole("heading", { level: 1, name: "Search the text", exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/^Search the text/);
});

test("the desk remains readable at 320 pixels and enlarged text", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/scriptures");
  await page.screenshot({ path: testInfo.outputPath("hub-320px.png") });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const start = page.getByRole("navigation", { name: "Start studying" });
  for (const link of await start.getByRole("link").all()) {
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: testInfo.outputPath("hub-320px-large-text.png") });
  const overflowing = await page.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
    .map((element) => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right }))
    .slice(0, 15));
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), JSON.stringify(overflowing)).toBe(false);
  await start.getByRole("link").nth(0).click();
  await expect(page.getByRole("combobox", { name: "Go to" })).toBeInViewport();
  await start.getByRole("link").nth(2).focus();
  await expect(start.getByRole("link").nth(2)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/word-bridge$/);
  await expect(page.getByRole("heading", { level: 1, name: "Word Bridge" })).toBeVisible();
});

for (const width of [320, 390, 1280]) {
  test(`a told story ends with links into its own passage (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/scriptures/stories/noah");
    const more = page.getByRole("navigation", { name: "More on this story" });
    await expect(more.getByRole("link")).toHaveCount(3);
    await expect(more.getByRole("link").nth(0)).toHaveAttribute("href", "/scriptures/protestant/GEN/6?t=web#v1");
    await expect(more.getByRole("link").nth(0)).toHaveText(/^Read Genesis 6–9/);
    await expect(more.getByRole("link").nth(1)).toHaveAttribute(
      "href",
      "/scriptures/polyglot?tradition=protestant&book=GEN&chapter=9&verse=13&translation=web",
    );
    await expect(more.getByRole("link").nth(2)).toHaveAttribute("href", "/scriptures/protestant/GEN/9?t=web&study=word-bridge#v13");
    // The layout's general links are replaced on story pages, not added to.
    await expect(page.getByText("Read the chapters in order")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Continue exploring" })).toBeHidden();
    await expect(page.getByText("More research tools")).toBeHidden();
    for (const link of await more.getByRole("link").all()) {
      expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    // The longest lines belong to David; they must wrap inside the page.
    await page.goto("/scriptures/stories/david");
    await expect(page.getByRole("navigation", { name: "More on this story" }).getByRole("link")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.goto("/scriptures/stories/esther");
    const alone = page.getByRole("navigation", { name: "More on this story" }).getByRole("link");
    await expect(alone).toHaveCount(1);
    await expect(alone).toHaveText(/^Read Esther 2–8/);
  });
}

test("a story's lines open the comparison and the word links on the verse it quotes", async ({ page }) => {
  await page.goto("/scriptures/stories/noah");
  const more = page.getByRole("navigation", { name: "More on this story" });
  await more.getByRole("link", { name: /^Compare translations of Genesis 9:13/ }).click();
  await expect(page).toHaveURL(/\/scriptures\/polyglot\?.*book=GEN&chapter=9&verse=13/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Compare translations");
  await expect(page.getByText("I do set my bow in the cloud", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("I set my rainbow in the cloud", { exact: false }).first()).toBeVisible();

  await page.goto("/scriptures/stories/noah");
  await more.getByRole("link", { name: /^See the Hebrew words behind Genesis 9:13/ }).click();
  await expect(page).toHaveURL(/GEN\/9\?t=web&study=word-bridge#v13$/);
  await expect(page.locator("#vp13 .scr-bridge")).toBeVisible();

  await page.goto("/scriptures/stories/noah");
  await more.getByRole("link", { name: /^Read Genesis 6–9/ }).click();
  await expect(page).toHaveURL(/GEN\/6\?t=web#v1$/);
});
