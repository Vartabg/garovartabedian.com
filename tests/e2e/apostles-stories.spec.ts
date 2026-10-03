import { expect, test } from "@playwright/test";
import john from "../../public/scriptures/text/web/JHN.json";
import acts from "../../public/scriptures/text/web/ACT.json";
import { APOSTLE_STORIES } from "../../src/lib/apostles/stories";
import twelve from "../../public/apostles/twelve.json";

test("the new home opens every apostle record and all three visual stories", async ({ page }) => {
  await page.goto("/apostles");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Called. Changed. Sent.");
  const index = page.getByRole("region", { name: "Meet the apostles" });
  await expect(index.locator("ul > li")).toHaveCount(13);
  for (const a of twelve.apostles) await expect(index.locator(`a[href='/apostles/twelve#${a.id}']`)).toBeVisible();
  await index.locator("a[href='/apostles/twelve#james-alphaeus']").click();
  await expect(page.locator("details#james-alphaeus")).toHaveAttribute("open", "");
  await page.goto("/apostles#visual-stories");
  for (const story of APOSTLE_STORIES) await expect(page.locator(`#visual-stories a[href='/apostles/stories/${story.slug}']`)).toBeVisible();
});

for (const story of APOSTLE_STORIES) {
  test(`${story.kind}: exact source, distinct loaded scenes, working onward links`, async ({ page }) => {
    await page.goto(`/apostles/stories/${story.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(story.title);
    const images = page.locator(".as-story figure img");
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    const source = page.getByRole("region", { name: "The passage behind the story" });
    await source.getByText(`Read the passage · ${story.reference}`, { exact: true }).click();
    const verses = (story.book === "JHN" ? john : acts).chapters[story.chapter - 1].slice(story.start - 1, story.end);
    for (const verse of verses) await expect(source).toContainText(verse);
    await expect(source.getByRole("link", { name: "Read the full chapter" })).toHaveAttribute("href", `/scriptures/protestant/${story.book}/${story.chapter}?t=web#v${story.start}`);
    await expect(page.getByRole("navigation", { name: "More Apostles stories" }).getByRole("link")).toHaveCount(2);
  });

  test(`${story.kind}: no JavaScript still gives the narrative and complete passage`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}/apostles/stories/${story.slug}`);
    await expect(page.getByRole("heading", { name: story.opening.title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: story.after.title, exact: true })).toBeVisible();
    await expect(page.locator(".as-reflect button").first()).toBeDisabled();
    const source = page.getByRole("region", { name: "The passage behind the story" });
    await source.locator("summary").click();
    await expect(source).toContainText((story.book === "JHN" ? john : acts).chapters[story.chapter - 1][story.end - 1]);
    await context.close();
  });
}

test("each reflection has its own keyboard-operable action and leaves the text available", async ({ page }) => {
  await page.goto("/apostles/stories/come-and-eat");
  const third = page.getByRole("button", { name: "Third question", exact: true });
  await third.focus(); await third.press("Enter");
  await expect(third).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".as-reflect [role=status]")).toContainText("Feed my sheep.");
  await expect(page.getByRole("region", { name: "Question one", exact: true })).toBeVisible();
  await page.goto("/apostles/stories/peace-be-with-you");
  const slider = page.getByRole("slider", { name: "Move from demand to confession" });
  await slider.focus(); await slider.press("End");
  await expect(slider).toHaveValue("100");
  await expect(slider).toHaveAttribute("aria-valuetext", "Thomas’s confession");
  await expect(page.getByRole("button", { name: "The confession", exact: true })).toHaveAttribute("aria-pressed", "true");
  await slider.press("Home"); await expect(slider).toHaveValue("0");
  await expect(page.getByText("“My Lord and my God!”", { exact: true })).toBeVisible();
  await page.goto("/apostles/stories/every-language");
  const group = page.getByRole("button", { name: "Egypt and Libya", exact: true });
  await group.focus(); await group.press("Space");
  await expect(group).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("article", { name: "East", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Egypt and Libya", exact: true })).toHaveAttribute("data-selected", "true");
});

test("home and stories reflow with enlarged type, reduced motion and forced colors", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.addInitScript(() => {
    localStorage.setItem("garovartabedian:a11y:v1", JSON.stringify({ font: "dyslexic", size: "largest", reduceMotion: true }));
  });
  for (const url of ["/apostles", ...APOSTLE_STORIES.map((s) => `/apostles/stories/${s.slug}`)]) {
    await page.goto(url);
    await expect(page.locator("html")).toHaveAttribute("data-a11y-font", "dyslexic");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth), { message: url, timeout: 10_000 }).toBeLessThanOrEqual(321);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const menu = page.locator(".site-nav-menu > summary");
    await menu.click();
    await expect(page.locator(".site-nav-panel")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
    await menu.click();
    const controls = page.locator(".as-reflect button");
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});
