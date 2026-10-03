import { expect, test, type Locator, type Page } from "@playwright/test";
import path from "node:path";
import secondKings from "../../public/scriptures/text/web/2KI.json";

const STORY_ROUTE = "/angels/stories/open-his-eyes";
const CHAPTER_ROUTE = "/scriptures/protestant/2KI/6?t=web#v14";
const BEATS = ["Surrounded", "Afraid", "The prayer", "Eyes opened", "Reflection"];
const PASSAGE = secondKings.chapters[5].slice(13, 17);

test.beforeEach(async ({ page }) => {
  await page.route("**/_vercel/insights/script.js", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/_vercel/insights/script.js" &&
        (url.hostname === "127.0.0.1" || url.hostname === "localhost")) {
      return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
    }
    return route.continue();
  });
});

function sourceDisclosure(page: Page) {
  return page.locator("details").filter({
    has: page.locator("summary").filter({ hasText: "Read the passage" }),
  });
}

async function expectCompleteStory(page: Page) {
  await expect(
    page.getByRole("heading", { level: 1, name: "Open his eyes.", exact: true }),
  ).toBeVisible();
  for (const beat of BEATS) {
    await expect(
      page.getByRole("heading", { level: 2, name: beat, exact: true }),
    ).toBeVisible();
  }
}

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(
    dimensions.content,
    `Story width ${dimensions.content}px exceeds the ${dimensions.viewport}px viewport`,
  ).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectLoadedImage(image: Locator) {
  await expect(image).toBeVisible();
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          (element as HTMLImageElement).complete &&
          (element as HTMLImageElement).naturalWidth > 0,
      ),
      { message: `Artwork loads: ${await image.getAttribute("src")}` },
    )
    .toBe(true);
}

async function expectFullyInView(page: Page, target: Locator) {
  await target.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  const bounds = await target.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  });
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }));
  expect.soft(bounds.left, `${target} left edge`).toBeGreaterThanOrEqual(-1);
  expect.soft(bounds.right, `${target} right edge`).toBeLessThanOrEqual(viewport.width + 1);
  expect.soft(bounds.top, `${target} top edge`).toBeGreaterThanOrEqual(-1);
  expect.soft(bounds.bottom, `${target} bottom edge`).toBeLessThanOrEqual(viewport.height + 1);
  const intersection = await target.evaluate((element) => new Promise<{
    left: number; right: number; top: number; bottom: number;
  }>((resolve) => {
    const observer = new IntersectionObserver(([entry]) => {
      observer.disconnect();
      const rect = entry.intersectionRect;
      resolve({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
    });
    observer.observe(element);
  }));
  // Check ancestor clipping too, with only one pixel of rounding tolerance at each edge.
  expect.soft(intersection.left, `${target} clipped left edge`).toBeLessThanOrEqual(bounds.left + 1);
  expect.soft(intersection.right, `${target} clipped right edge`).toBeGreaterThanOrEqual(bounds.right - 1);
  expect.soft(intersection.top, `${target} clipped top edge`).toBeLessThanOrEqual(bounds.top + 1);
  expect.soft(intersection.bottom, `${target} clipped bottom edge`).toBeGreaterThanOrEqual(bounds.bottom - 1);
}

async function captureStory(page: Page, filename: string) {
  if (process.env.STORY_CAPTURE_DIR) {
    await page.screenshot({
      path: path.join(process.env.STORY_CAPTURE_DIR, filename),
      animations: "disabled",
    });
  }
}

test("the featured story is reachable from the Angels & Demons entrance", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  await page.goto("/angels");
  const begin = page.getByRole("link", { name: /Begin the story/ });
  await expect(begin).toHaveAttribute("href", STORY_ROUTE);
  await begin.focus();
  await begin.press("Enter");
  await expect(page).toHaveURL(/\/angels\/stories\/open-his-eyes$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Open his eyes.", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("slider", { name: "Reveal the unseen" })).toBeVisible();
  expect(runtimeErrors, "The entrance and hydrated story should have no runtime errors").toEqual([]);
});

test("all five beats and the complete source remain accessible with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto(STORY_ROUTE);
  expect(response?.status()).toBe(200);
  await expectCompleteStory(page);
  await expectLoadedImage(page.locator('img[src*="dothan-unseen.jpg"]').first());
  await captureStory(page, "desktop-first-view.png");

  const source = sourceDisclosure(page);
  const summary = source.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(source).toHaveAttribute("open", "");
  for (const verse of PASSAGE) {
    await expect(source).toContainText(verse);
  }
  await expect(source).toContainText("World English Bible");

  const chapter = source.locator(`a[href="${CHAPTER_ROUTE}"]`);
  await expect(chapter).toHaveAccessibleName(/\S/);
  await chapter.click();
  await expect(page).toHaveURL(/\/scriptures\/protestant\/2KI\/6\?t=web#v14$/);
  await expect(page.locator("#v14")).toContainText(PASSAGE[0]);
});

test("each Dothan scene has distinct, fully loaded artwork and the comparison pair appears once", async ({ page }) => {
  await page.goto(STORY_ROUTE);
  const article = page.getByRole("article", { name: "Open his eyes.", exact: true });
  const artwork = article.locator("img:not(footer img):not(nav img)");
  await expect(artwork).toHaveCount(7);
  await expect(page.getByRole("slider", { name: "Reveal the unseen" })).toHaveValue("0");
  for (const image of await artwork.all()) {
    await expectLoadedImage(image);
  }
  const sources = await artwork.evaluateAll((images) => images.map((element) => {
    const image = element as HTMLImageElement;
    const requested = new URL(image.currentSrc || image.src, document.baseURI);
    const original = requested.pathname === "/_next/image"
      ? new URL(requested.searchParams.get("url") || requested.href, document.baseURI)
      : requested;
    return decodeURIComponent(original.pathname);
  }));
  expect(sources.every((source) => source.startsWith("/angels/stories/"))).toBe(true);
  expect(new Set(sources).size, `Each narrative scene has its own source: ${sources.join(", ")}`)
    .toBe(7);
});

test("the reveal and both comparison endpoints work entirely by keyboard", async ({
  page,
}) => {
  await page.goto(STORY_ROUTE);
  const reveal = page.getByRole("button", { name: "Open his eyes", exact: true });
  const slider = page.getByRole("slider", { name: "Reveal the unseen" });
  await expect(slider).toHaveValue("0");
  await expect(reveal).toHaveAttribute("aria-pressed", "false");
  await reveal.focus();
  await reveal.press("Enter");
  await expect(reveal).toHaveAttribute("aria-pressed", "true");
  await expect(slider).toHaveValue("100");

  const reset = page.getByRole("button", { name: "See the first view again" });
  await reset.focus();
  await reset.press("Space");
  await expect(reveal).toHaveAttribute("aria-pressed", "false");
  await expect(slider).toHaveValue("0");
  await expect(reveal).toBeFocused();

  const before = page.getByRole("button", { name: "Before", exact: true });
  const after = page.getByRole("button", { name: "After", exact: true });
  await slider.focus();
  await slider.press("Home");
  await expect(slider).toHaveValue("0");
  await expect(slider).toHaveAttribute("aria-valuetext", "Only the first view is shown");
  await expect(before).toHaveAttribute("aria-pressed", "true");
  await expect(after).toHaveAttribute("aria-pressed", "false");

  await slider.press("ArrowRight");
  expect(Number(await slider.inputValue())).toBeGreaterThan(0);
  expect(Number(await slider.inputValue())).toBeLessThan(100);
  await expect(slider).toHaveAttribute("aria-valuetext", /\d+% of the revealed view is shown/);

  await slider.press("End");
  await expect(slider).toHaveValue("100");
  await expect(slider).toHaveAttribute("aria-valuetext", "The revealed view is fully shown");
  await expect(before).toHaveAttribute("aria-pressed", "false");
  await expect(after).toHaveAttribute("aria-pressed", "true");

  await before.focus();
  await before.press("Enter");
  await expect(slider).toHaveValue("0");
  await after.focus();
  await after.press("Space");
  await expect(slider).toHaveValue("100");
});

for (const width of [390, 320]) {
  test(`story controls and the expanded source fit a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(STORY_ROUTE);
    await expectCompleteStory(page);
    await expectNoOverflow(page);

    const reveal = page.getByRole("button", { name: "Open his eyes", exact: true });
    await reveal.click();
    await expect(reveal).toHaveAttribute("aria-pressed", "true");
    if (width === 390) {
      const revealedImage = page.getByRole("region", { name: "Compare the two views" })
        .locator('img[src*="dothan-revealed.jpg"]');
      await expectLoadedImage(revealedImage);
      await captureStory(page, "mobile-reveal.png");
    }
    const after = page.getByRole("button", { name: "After", exact: true });
    await after.click();
    await expect(page.getByRole("slider", { name: "Reveal the unseen" })).toHaveValue("100");

    const source = sourceDisclosure(page);
    const summary = source.locator("summary");
    await summary.click();
    await expect(source).toContainText(PASSAGE[3]);
    for (const target of [reveal, after, summary]) {
      const box = await target.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await expectNoOverflow(page);
  });
}

test("enlarged OpenDyslexic text in Light appearance keeps narrow-screen controls fully visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(STORY_ROUTE);
  await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
  const settings = page.getByRole("dialog", { name: "Reading & accessibility" });
  await settings.getByLabel("Text size", { exact: true }).selectOption("largest");
  await settings.getByLabel("Reading typeface", { exact: true }).selectOption("dyslexic");
  await settings.getByLabel("Page theme", { exact: true }).selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-size", "largest");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-font", "dyslexic");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "light");
  await settings.getByRole("button", { name: "Close accessibility settings" }).click();
  await expect(settings).toBeHidden();
  await page.evaluate(() => document.fonts.ready);

  await expectFullyInView(page, page.getByRole("link", { name: /Begin the story/ }));
  const reveal = page.getByRole("button", { name: "Open his eyes", exact: true });
  await expectFullyInView(page, reveal);
  await reveal.click();
  await expectFullyInView(page, page.getByRole("button", { name: "See the first view again" }));

  const comparison = page.getByRole("region", { name: "Compare the two views" });
  for (const control of [
    comparison.getByRole("button", { name: "Before", exact: true }),
    comparison.getByRole("slider", { name: "Reveal the unseen" }),
    comparison.getByRole("button", { name: "After", exact: true }),
  ]) {
    await expectFullyInView(page, control);
  }
  const source = sourceDisclosure(page);
  await expectFullyInView(page, source.locator("summary"));
  await source.locator("summary").click();
  await expectFullyInView(page, source.locator(`a[href="${CHAPTER_ROUTE}"]`));
  const onward = page.getByRole("navigation", { name: "Continue exploring" });
  for (const link of await onward.getByRole("link").all()) {
    await expectFullyInView(page, link);
  }
  await expectNoOverflow(page);
});

test("the full story, both views, and source disclosure work without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    const response = await page.goto(STORY_ROUTE);
    expect(response?.status()).toBe(200);
    await expectCompleteStory(page);
    await expect(page.getByRole("slider", { name: "Reveal the unseen" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open his eyes", exact: true })).toHaveCount(0);

    const comparison = page.getByRole("region", { name: "Compare the two views" });
    for (const asset of ["dothan-unseen.jpg", "dothan-revealed.jpg"]) {
      const image = comparison.locator(`img[src*="${asset}"]`);
      await expect(image).toHaveAttribute("alt", /\S/);
      await expectLoadedImage(image);
    }

    const source = sourceDisclosure(page);
    await source.locator("summary").click();
    await expect(source).toHaveAttribute("open", "");
    for (const verse of PASSAGE) {
      await expect(source).toContainText(verse);
    }
    await expect(source.locator(`a[href="${CHAPTER_ROUTE}"]`)).toBeVisible();
    await expectNoOverflow(page);
  } finally {
    await context.close();
  }
});
