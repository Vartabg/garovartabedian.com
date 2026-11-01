import { test, expect } from "@playwright/test";

/**
 * Cross-page navigation: the homepage's two direct gateways, its eight-world
 * ordered rail, and the switcher that follows a visitor into every room.
 * A broken path here means the front door no longer matches the site's shape.
 */

const WORLDS = [
  { href: "/scriptures", label: "Scriptures" },
  { href: "/jesus", label: "Jesus Christ" },
  { href: "/apostles", label: "The Apostles" },
  { href: "/early", label: "The Writings" },
  { href: "/church", label: "The Church" },
  { href: "/angels", label: "Angels & Demons" },
  { href: "/word", label: "Who Owns the Word?" },
  { href: "/evidence", label: "How We Know" },
];

const HOME_RAIL = [
  "/jesus",
  "/scriptures",
  "/apostles",
  "/early",
  "/church",
  "/word",
  "/angels",
  "/evidence",
];

test("homepage exposes its primary gateways and guided record", async ({
  page,
  request,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Jesus Christ." }),
  ).toBeVisible();
  await expect(page.locator('a.st-intro-primary[href="/jesus/words"]')).toBeVisible();
  await expect(page.locator('a.st-intro-secondary[href="/scriptures"]')).toBeVisible();

  const railDoors = page.locator("a.st-rail-title");
  await expect(railDoors).toHaveCount(HOME_RAIL.length);

  for (const href of HOME_RAIL) {
    await expect(page.locator(`a.st-rail-title[href="${href}"]`)).toBeVisible();
  }

  for (const world of WORLDS) {
    const res = await request.get(world.href);
    expect(res.status(), `expected ${world.href} to resolve`).toBe(200);
  }
});

test("homepage reveals server-rendered sections with motion enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  // The worlds rail is the one revealed section left after the 2026-10-15 cut.
  const worlds = page.locator("#worlds");
  await worlds.scrollIntoViewIfNeeded();
  await expect(worlds).toHaveClass(/\bin\b/);
  await expect(worlds).toBeVisible();
});

test("homepage points to independent work and the mission page", async ({
  page,
}) => {
  await page.goto("/");
  const aboutNavigation = page.getByRole("navigation", {
    name: "About this work",
  });
  await expect(
    aboutNavigation.locator('a[href="/services"]')
  ).toBeVisible();
  await expect(
    aboutNavigation.locator('a[href="/about"]')
  ).toBeVisible();
});

test("the world switcher navigates client-side and coaches once per page load", async ({
  page,
}) => {
  await page.goto("/jesus");
  const switcher = page.getByRole("navigation", {
    name: "Step between the worlds of this site",
  });
  await expect(switcher).toBeVisible();
  await expect(switcher.locator(".vsw-coach")).toBeVisible();

  await switcher.getByRole("link", { name: /^The Apostles:/ }).click();
  await expect(page).toHaveURL(/\/apostles$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(switcher.locator(".vsw-coach")).toHaveCount(0);

  await page.reload();
  await expect(switcher.locator(".vsw-coach")).toBeVisible();
});

test("an angels deep link reaches the visible record and glossary popovers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/angels#order-ladder");
  expect(response?.status()).toBe(200);

  const orderLadder = page.locator("#order-ladder");
  await expect(orderLadder.locator("xpath=ancestor::details")).toHaveCount(0);
  await expect(orderLadder).toBeVisible();

  const term = orderLadder.locator(".gloss-term").first();
  await term.click();
  await expect(term).toHaveAttribute("aria-expanded", "true");
  // The card is portaled to <body> so host containment (content-visibility)
  // can't clip it — see Gloss.tsx.
  await expect(page.locator('.gloss-pop[role="note"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test("the angels field guide jumps to its already visible record", async ({ page }) => {
  await page.goto("/angels");

  const orderLadder = page.locator("#order-ladder");
  await expect(orderLadder).toBeVisible();
  await expect(orderLadder.locator("xpath=ancestor::details")).toHaveCount(0);
  await page.locator('a.an-field-gate[href="#order-ladder"]').click();
  await expect(page).toHaveURL(/\/angels#order-ladder$/);
  await expect(orderLadder).toBeInViewport();
});

test("a reading page opens the menu on its own next steps and folds the rest", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/scriptures/protestant/MRK/1");
  const navigation = page.getByRole("navigation", { name: "Primary site navigation" });
  await navigation.locator(".site-nav-menu > summary").click();
  const here = navigation.locator(".site-nav-here");
  await expect(here.getByRole("heading", { name: "From Mark 1" })).toBeVisible();
  expect(await here.getByRole("link").count()).toBeGreaterThan(0);
  // Paging and the book stay with the reader bar and breadcrumb, not the menu.
  await expect(here.locator('a[href*="/MRK/2"], a[href$="/MRK"]')).toHaveCount(0);
  // The whole site is one tap further, and nothing in it repeats.
  const everything = navigation.locator(".site-nav-everything");
  await expect(everything.locator('a[href="/church"]')).toBeHidden();
  await everything.locator("summary").click();
  await expect(everything.locator('a[href="/church"]')).toBeVisible();
  const hrefs = await everything.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(hrefs).size).toBe(hrefs.length);
  // The generic "Continue exploring" links, the worlds strip and a second Aa
  // are gone here; the research tools beside them stay.
  await expect(page.locator(".world-next")).toBeHidden();
  await expect(page.locator(".world-related-tools summary")).toBeVisible();
  await expect(page.locator(".vsw")).toBeHidden();
  await expect(page.locator(".a11y-trigger")).toBeHidden();

  await page.goto("/early/1clement");
  await navigation.locator(".site-nav-menu > summary").click();
  await expect(navigation.getByRole("heading", { name: "From 1 Clement" })).toBeVisible();
  await expect(navigation.locator('.site-nav-here a[href="/early/era/fathers"]')).toBeVisible();

  // Following a From-here link to a page without one clears it client-side.
  await page.goto("/scriptures/protestant/MRK/1");
  await navigation.locator(".site-nav-menu > summary").click();
  await navigation.locator('.site-nav-here a[href^="/angels"]').click();
  await expect(page).toHaveURL(/\/angels/);
  await navigation.locator(".site-nav-menu > summary").click();
  await expect(navigation.locator(".site-nav-here")).toHaveCount(0);
  await expect(navigation.getByText("Explore the whole site", { exact: true })).toBeVisible();

  // A page without From here keeps the whole menu.
  await page.goto("/jesus");
  await navigation.locator(".site-nav-menu > summary").click();
  await expect(navigation.locator(".site-nav-here")).toHaveCount(0);
  await expect(navigation.getByText("Explore the whole site", { exact: true })).toBeVisible();
});

test("the shared menu exposes the whole site from a deep page", async ({
  page,
}) => {
  await page.goto("/church/councils");
  const navigation = page.getByRole("navigation", {
    name: "Primary site navigation",
  });

  await navigation.locator("summary").click();
  await expect(
    navigation.getByText("Explore the whole site", { exact: true }),
  ).toBeVisible();
  await expect(
    navigation.locator('.site-nav-group--worlds a[href="/church"]'),
  ).toHaveAttribute("aria-current", "location");
  await expect(
    navigation.locator('a[href="/scriptures/search"]'),
  ).toBeVisible();

  await navigation
    .locator('a[href="/scriptures/search"]')
    .click();
  await expect(page).toHaveURL(/\/scriptures\/search$/);
});

test("the shared menu paints above Scripture verse numbers", async ({
  page,
}) => {
  await page.goto("/scriptures/protestant/JHN/3");
  const navigation = page.getByRole("navigation", {
    name: "Primary site navigation",
  });

  await navigation.locator(".site-nav-menu > summary").click();
  await expect(navigation.locator(".site-nav-panel")).toBeVisible();
  // A chapter's menu opens on its short From-here list; unfold the whole
  // site so the panel reaches down over the verse numbers it must cover.
  await navigation.locator(".site-nav-everything > summary").click();
  await expect(navigation.locator(".site-nav-everything a").first()).toBeVisible();

  const overlap = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>(".site-nav-panel");
    if (!panel) return { verseCount: 0, obscuredCount: 0 };

    const panelBox = panel.getBoundingClientRect();
    const verses = Array.from(
      document.querySelectorAll<HTMLElement>(".scr-vnum"),
    ).filter((verse) => {
      const box = verse.getBoundingClientRect();
      return (
        box.left < panelBox.right &&
        box.right > panelBox.left &&
        box.top < panelBox.bottom &&
        box.bottom > panelBox.top
      );
    });
    const obscuredCount = verses.filter((verse) => {
      const box = verse.getBoundingClientRect();
      const left = Math.max(panelBox.left, box.left);
      const right = Math.min(panelBox.right, box.right);
      const top = Math.max(panelBox.top, box.top);
      const bottom = Math.min(panelBox.bottom, box.bottom);
      const topmost = document.elementFromPoint(
        left + (right - left) / 2,
        top + (bottom - top) / 2,
      );
      return topmost?.closest(".site-nav-panel") !== panel;
    }).length;

    return { verseCount: verses.length, obscuredCount };
  });

  expect(overlap.verseCount).toBeGreaterThan(0);
  expect(
    overlap.obscuredCount,
    "verse numbers should not paint above the open Explore menu",
  ).toBe(0);
});

test("a non-existent route renders the site's own 404, not a raw error", async ({
  page,
}) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
});
