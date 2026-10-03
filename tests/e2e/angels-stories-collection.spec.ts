import { expect, test, type Locator, type Page } from "@playwright/test";
import path from "node:path";
import genesis from "../../public/scriptures/text/web/GEN.json";
import acts from "../../public/scriptures/text/web/ACT.json";

const COLLECTION = "/angels/stories";
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

const stories = [
  {
    slug: "i-am-with-you",
    title: "I am with you.",
    region: "Explore Jacob’s dream",
    slider: "Lift your gaze",
    images: ["bethel-dream.jpg"],
    artworkCount: 4,
    beats: ["Nightfall", "The dream", "The promise", "Waking"],
    chapter: "/scriptures/protestant/GEN/28",
    firstVerse: 10,
    passage: genesis.chapters[27].slice(9, 19),
    controls: ["At the stone", "The whole dream"],
  },
  {
    slug: "the-gate-opened",
    title: "The gate opened.",
    region: "Light in the cell",
    images: ["peter-cell.jpg", "peter-cell-light.jpg"],
    artworkCount: 6,
    beats: ["Kept in the prison", "Follow me", "The gate opened", "Now I truly know"],
    chapter: "/scriptures/protestant/ACT/12",
    firstVerse: 5,
    passage: acts.chapters[11].slice(4, 11),
    controls: ["Explore the light", "Before", "After"],
  },
] as const;

type Story = (typeof stories)[number];

function passageRegion(page: Page) {
  return page.getByRole("region", { name: "The passage behind the story" });
}

async function expectCompleteNarrative(page: Page, story: Story) {
  await expect(page.getByRole("heading", { level: 1, name: story.title, exact: true })).toBeVisible();
  for (const beat of story.beats) {
    await expect(page.getByRole("heading", { level: 2, name: beat, exact: true })).toBeVisible();
  }
}

async function expectExactPassage(page: Page, story: Story) {
  const source = passageRegion(page);
  await expect(source.locator("details")).toHaveAttribute("open", "");
  await expect(source).toContainText("World English Bible");
  for (const verse of story.passage) {
    await expect(source).toContainText(verse);
  }
  await expect(source.getByRole("link", { name: "Read the full chapter" })).toHaveAttribute(
    "href", `${story.chapter}?t=web#v${story.firstVerse}`,
  );
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

async function expectTitleTextFits(page: Page, title: Locator) {
  await expectFullyInView(page, title);
  const textBounds = await title.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const lines: { text: string; left: number; right: number }[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width > 0) lines.push({ text: node.textContent.trim(), left: rect.left, right: rect.right });
      }
    }
    return {
      left: Math.max(0, box.left),
      right: Math.min(document.documentElement.clientWidth, box.right),
      lines,
    };
  });
  for (const line of textBounds.lines) {
    expect.soft(line.left, `${line.text} text left edge`).toBeGreaterThanOrEqual(textBounds.left - 1);
    expect.soft(line.right, `${line.text} text right edge`).toBeLessThanOrEqual(textBounds.right + 1);
  }
}

async function expectNoDocumentOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
}

async function expectLoadedArtwork(image: Locator) {
  await expect(image).toHaveAttribute("alt", /\S/);
  await expect(image).toBeVisible();
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) => {
    const img = element as HTMLImageElement;
    return img.complete && img.naturalWidth > 0;
  })).toBe(true);
}

async function captureSurface(page: Page, surface: Locator, filename: string, fullPage = false) {
  if (!process.env.STORY_CAPTURE_DIR) return;
  const options = {
    path: path.join(process.env.STORY_CAPTURE_DIR, filename),
    animations: "disabled" as const,
  };
  const artwork = surface.locator("img");
  for (const image of await artwork.all()) {
    await image.scrollIntoViewIfNeeded();
  }
  await expect.poll(() => artwork.evaluateAll((images) => images.every((element) => {
    const image = element as HTMLImageElement;
    return image.complete && image.naturalWidth > 0;
  }))).toBe(true);
  if (fullPage) await page.screenshot({ ...options, fullPage: true });
  else await surface.screenshot(options);
}

async function captureStory(page: Page, story: Story, mode: "desktop-scene" | "mobile-reading") {
  const surface = mode === "desktop-scene"
    ? page.getByRole("region", { name: story.region, exact: true })
    : page.getByRole("article", { name: story.title, exact: true });
  await captureSurface(page, surface, `${story.slug}-${mode}.png`, mode === "mobile-reading");
}

test("the world entrance leads to the collection and all three complete story routes", async ({ page }) => {
  await page.goto("/angels");
  const collectionLink = page.getByRole("link", { name: "Explore the stories", exact: true });
  await expect(collectionLink).toHaveAttribute("href", COLLECTION);
  await collectionLink.focus();
  await collectionLink.press("Enter");
  await expect(page).toHaveURL(/\/angels\/stories$/);

  for (const story of [{ slug: "open-his-eyes", title: "Open his eyes." }, ...stories]) {
    await expect(page.getByRole("heading", { level: 1, name: "Visual stories.", exact: true })).toBeVisible();
    const route = `${COLLECTION}/${story.slug}`;
    const card = page.locator(`a[href="${route}"]`);
    await expect(card).toHaveAccessibleName(new RegExp(story.title.replace(/\.$/, "")));
    await card.focus();
    await card.press("Enter");
    await expect(page).toHaveURL((url) => url.pathname === route);
    await expect(page.getByRole("heading", { level: 1, name: story.title, exact: true })).toBeVisible();
    if (story.slug === "open-his-eyes") {
      await page.goBack();
    } else {
      await page.getByRole("link", { name: "All visual stories", exact: true }).click();
    }
    await expect(page).toHaveURL(/\/angels\/stories$/);
  }
});

for (const story of stories) {
  test(`${story.title} advances through distinct, fully loaded narrative artwork`, async ({ page }) => {
    await page.goto(`${COLLECTION}/${story.slug}`);
    const article = page.getByRole("article", { name: story.title, exact: true });
    const artwork = article.locator("img:not(footer img):not(nav img):not(.visual-story-source img)");
    await expect(artwork).toHaveCount(story.artworkCount);

    for (const image of await artwork.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element) => {
        const img = element as HTMLImageElement;
        return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
      }), { message: `Narrative artwork loads: ${await image.getAttribute("src")}` }).toBe(true);
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
      .toBe(sources.length);
  });

  test(`${story.title} keeps its complete narrative, keyboard interaction, and exact source in reduced motion`, async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(`${COLLECTION}/${story.slug}`);
    expect(response?.status()).toBe(200);
    await expectCompleteNarrative(page, story);
    const scene = page.getByRole("region", { name: story.region, exact: true });

    if (story.slug === "i-am-with-you") {
      const slider = scene.getByRole("slider", { name: story.slider, exact: true });
      await expect(slider).toHaveValue("0");
      const earth = scene.getByRole("button", { name: "At the stone", exact: true });
      const dream = scene.getByRole("button", { name: "The whole dream", exact: true });
      await expect(earth).toHaveAttribute("aria-pressed", "true");
      await slider.focus();
      await slider.press("End");
      await expect(slider).toHaveValue("100");
      await expect(slider).toHaveAttribute("aria-valuetext", "The whole dream, from earth to heaven");
      await expect(dream).toHaveAttribute("aria-pressed", "true");
      await expect(earth).toHaveAttribute("aria-pressed", "false");
      await slider.press("Home");
      await expect(slider).toHaveValue("0");
      await expect(slider).toHaveAttribute("aria-valuetext", "Close to earth, beside the sleeping Jacob");
      await slider.press("ArrowRight");
      expect(Number(await slider.inputValue())).toBeGreaterThan(0);
      expect(Number(await slider.inputValue())).toBeLessThan(100);
      await expect(slider).toHaveAttribute("aria-valuetext", /\d+% of the way from earth to heaven/);
      await earth.focus();
      await earth.press("Enter");
      await expect(slider).toHaveValue("0");
      await dream.focus();
      await dream.press("Space");
      await expect(slider).toHaveValue("100");
      await expect(dream).toBeFocused();
    } else {
      const across = scene.getByRole("slider", { name: "Move light across the cell", exact: true });
      const vertical = scene.getByRole("slider", { name: "Move light up or down", exact: true });
      const artwork = scene.getByRole("group", { name: "Explore the cell illustration", exact: true });
      const status = scene.getByRole("status");
      const before = scene.getByRole("button", { name: "Before", exact: true });
      const after = scene.getByRole("button", { name: "After", exact: true });
      const explore = scene.getByRole("button", { name: "Explore the light", exact: true });
      await expect(status).toHaveText("Before the light");
      await expect(before).toHaveAttribute("aria-pressed", "true");
      await expect(across).toHaveValue("50");
      await expect(vertical).toHaveValue("45");
      await artwork.focus();
      await artwork.press("ArrowRight");
      expect(Number(await across.inputValue())).toBeGreaterThan(50);
      await artwork.press("ArrowDown");
      expect(Number(await vertical.inputValue())).toBeGreaterThan(45);
      await expect(status).toHaveText("Exploring the light");
      await expect(explore).toHaveAttribute("aria-pressed", "true");
      await across.focus();
      await across.press("End");
      await expect(across).toHaveValue("100");
      await across.press("Home");
      await expect(across).toHaveValue("0");
      await vertical.focus();
      await vertical.press("End");
      await expect(vertical).toHaveValue("100");
      await vertical.press("Home");
      await expect(vertical).toHaveValue("0");
      await after.focus();
      await after.press("Enter");
      await expect(status).toHaveText("The whole cell in light");
      await expect(after).toHaveAttribute("aria-pressed", "true");
      await expect(explore).toHaveAttribute("aria-pressed", "false");
      await before.focus();
      await before.press("Space");
      await expect(status).toHaveText("Before the light");
      await expect(before).toBeFocused();
      await explore.focus();
      await explore.press("Enter");
      await expect(status).toHaveText("Exploring the light");
      await after.focus();
      await after.press("Space");
      await expect(status).toHaveText("The whole cell in light");
    }
    await captureStory(page, story, "desktop-scene");

    const source = passageRegion(page);
    await source.locator("summary").focus();
    await source.locator("summary").press("Enter");
    await expectExactPassage(page, story);
    await source.getByRole("link", { name: "Read the full chapter" }).click();
    await expect(page).toHaveURL((url) => url.pathname === story.chapter && url.hash === `#v${story.firstVerse}`);
    await expect(page.locator(`#v${story.firstVerse}`)).toContainText(story.passage[0]);
    expect(runtimeErrors).toEqual([]);
  });

  test(`${story.title} has a complete illustrated reading and source without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      reducedMotion: "reduce",
      viewport: { width: 320, height: 844 },
    });
    try {
      const page = await context.newPage();
      const response = await page.goto(`${COLLECTION}/${story.slug}`);
      expect(response?.status()).toBe(200);
      await expectCompleteNarrative(page, story);
      const scene = page.getByRole("region", { name: story.region, exact: true });
      await expect(scene.getByRole("slider")).toHaveCount(0);
      await expect(scene.getByRole("button")).toHaveCount(0);
      for (const asset of story.images) {
        await expectLoadedArtwork(scene.locator(`img[src*="${asset}"]`));
      }
      await passageRegion(page).locator("summary").click();
      await expectExactPassage(page, story);
      await expectNoDocumentOverflow(page);
      await page.getByRole("link", { name: "All visual stories", exact: true }).click();
      await expect(page).toHaveURL(/\/angels\/stories$/);
      await expectNoDocumentOverflow(page);
    } finally {
      await context.close();
    }
  });
}

test.describe("touch controls with enlarged reading preferences", () => {
  test.use({ viewport: { width: 320, height: 844 }, hasTouch: true, isMobile: true });

  for (const story of stories) {
    test(`${story.title} keeps all controls usable and visible at 320px with enlarged OpenDyslexic text`, async ({ page }) => {
      await page.goto(`${COLLECTION}/${story.slug}`);
      await page.getByRole("button", { name: "Open reading and accessibility settings" }).tap();
      const settings = page.getByRole("dialog", { name: "Reading & accessibility" });
      await settings.getByLabel("Text size", { exact: true }).selectOption("largest");
      await settings.getByLabel("Reading typeface", { exact: true }).selectOption("dyslexic");
      await expect(page.locator("html")).toHaveAttribute("data-a11y-size", "largest");
      await expect(page.locator("html")).toHaveAttribute("data-a11y-font", "dyslexic");
      await settings.getByRole("button", { name: "Close accessibility settings" }).tap();
      await expect(settings).toBeHidden();
      await page.evaluate(() => document.fonts.ready);

      const scene = page.getByRole("region", { name: story.region, exact: true });
      const controls = story.controls.map((name) => scene.getByRole("button", { name, exact: true }));
      if (story.slug === "i-am-with-you") {
        controls.unshift(scene.getByRole("slider", { name: story.slider, exact: true }));
      } else {
        controls.unshift(
          scene.getByRole("slider", { name: "Move light across the cell", exact: true }),
          scene.getByRole("slider", { name: "Move light up or down", exact: true }),
        );
      }
      for (const control of controls) {
        await expectFullyInView(page, control);
        const box = await control.boundingBox();
        expect.soft(box?.height, `${control} touch target`).toBeGreaterThanOrEqual(44);
        expect.soft(box?.width, `${control} touch target`).toBeGreaterThanOrEqual(44);
      }

      if (story.slug === "i-am-with-you") {
        const slider = scene.getByRole("slider", { name: story.slider, exact: true });
        await scene.getByRole("button", { name: "The whole dream", exact: true }).tap();
        await expect(slider).toHaveValue("100");
        await scene.getByRole("button", { name: "At the stone", exact: true }).tap();
        await expect(slider).toHaveValue("0");
        await scene.getByRole("button", { name: "The whole dream", exact: true }).tap();
        await expect(slider).toHaveValue("100");
      } else {
        const status = scene.getByRole("status");
        await expect(status).toHaveText("Before the light");
        await scene.getByRole("button", { name: "Explore the light", exact: true }).tap();
        await expect(status).toHaveText("Exploring the light");
        await scene.getByRole("button", { name: "After", exact: true }).tap();
        await expect(status).toHaveText("The whole cell in light");
        await scene.getByRole("button", { name: "Before", exact: true }).tap();
        await expect(status).toHaveText("Before the light");
        await scene.getByRole("button", { name: "After", exact: true }).tap();
        await expect(status).toHaveText("The whole cell in light");
        await expectFullyInView(page, status);
      }

      const source = passageRegion(page);
      await expectFullyInView(page, source.locator("summary"));
      await source.locator("summary").tap();
      await expectExactPassage(page, story);
      await expectFullyInView(page, source.getByRole("link", { name: "Read the full chapter" }));
      await expectFullyInView(page, page.getByRole("link", { name: "All visual stories", exact: true }));
      const onward = page.getByRole("navigation", { name: "More visual stories" });
      await expect(onward.getByRole("link")).toHaveCount(2);
      for (const link of await onward.getByRole("link").all()) {
        await expectFullyInView(page, link);
      }
      await expectNoDocumentOverflow(page);
      await captureSurface(page, scene, `${story.slug}-mobile-scene.png`);
      await captureStory(page, story, "mobile-reading");

      await page.getByRole("link", { name: "All visual stories", exact: true }).tap();
      await expect(page).toHaveURL(/\/angels\/stories$/);
      await page.evaluate(() => document.fonts.ready);
      const collection = page.getByRole("article", { name: "Visual stories.", exact: true });
      await expect(collection.getByRole("heading")).toHaveCount(4);
      for (const heading of await collection.getByRole("heading").all()) {
        await expectTitleTextFits(page, heading);
      }
      await expectNoDocumentOverflow(page);
      if (story.slug === "i-am-with-you") {
        await captureSurface(page, collection, "collection-mobile-reading.png", true);
      }

      await collection.getByRole("link", { name: "Explore Angels & Demons", exact: true }).tap();
      await expect(page).toHaveURL(/\/angels$/);
      await expect(page.locator("html")).toHaveAttribute("data-a11y-size", "largest");
      await expect(page.locator("html")).toHaveAttribute("data-a11y-font", "dyslexic");
      await page.evaluate(() => document.fonts.ready);
      const featured = page.locator(".an-featured-story");
      const invitations = featured.locator("h2, .an-story-invitation-title");
      await expect(invitations).toHaveCount(3);
      for (const heading of await invitations.all()) {
        await expectTitleTextFits(page, heading);
      }
      await expectNoDocumentOverflow(page);
      if (story.slug === "i-am-with-you") {
        await captureSurface(page, featured, "home-feature-mobile-reading.png");
      }
    });
  }
});
