import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`section navigation and onward paths stay connected at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/scriptures", "/jesus", "/early", "/church/councils", "/angels/encounters", "/evidence/frameworks"]) {
      await page.goto(route);
      const guide = page.locator(".world-guide");
      await expect(guide).toBeVisible();
      const menu = guide.locator(width < 561 ? ".wg-mobile-menu" : ".wg-browse");
      await menu.locator(":scope > summary").click();
      const links = menu.locator("nav > a");
      expect(await links.count()).toBeGreaterThanOrEqual(3);
      await expect(menu.locator(`a[href="${route}"]`)).toHaveAttribute("aria-current", "page");
      await menu.locator(":scope > summary").press("Escape");
      await expect(menu).not.toHaveAttribute("open", "");
      const next = page.getByRole("navigation", { name: /guided next steps$/ });
      await expect(next.getByRole("link")).toHaveCount(3);
      expect(await next.locator(`a[href="${route}"]`).count()).toBe(0);
      await expect(page.locator(".site-footer-links")).toBeVisible();
      if (route === "/church/councils") await page.screenshot({ path: testInfo.outputPath("section-navigation.png") });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
    }
  });
}

test("all Scripture study tools are reachable from the entrance", async ({ page }) => {
  await page.goto("/scriptures");
  const browse = page.locator(".wg-browse");
  await browse.locator("summary").click();
  const debates = browse.locator('a[href="/scriptures/disputation"]');
  await expect(debates).toBeVisible();
  await debates.click();
  await expect(page).toHaveURL(/\/scriptures\/disputation$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true })).toContainText("Biblical debates");
  await expect(page.locator(".site-nav-direct a[href='/scriptures']")).toHaveAttribute("aria-current", "location");
});

test("portfolio case studies keep a navigable parent and shared footer", async ({ page }) => {
  await page.goto("/work/garovartabedian");
  const trail = page.getByRole("navigation", { name: "Breadcrumb", exact: true });
  await expect(trail.locator('a[href="/work"]')).toBeVisible();
  await expect(trail.locator('[aria-current="page"]')).toHaveText("This research platform");
  await expect(page.locator(".site-footer-links a")).toHaveCount(4);
});

test("the life-map place picker and keyboard moment selection keep every lens on the same event", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/jesus");
  const place = page.locator(".jl-map").getByRole("combobox", { name: "Place", exact: true });
  await place.focus();
  await place.selectOption("bethlehem");
  await expect(place).toBeFocused();
  await expect(page.locator("#jl-moment-title")).toHaveText("Born in Bethlehem");
  await expect(page.locator(".jl-map .map-status")).toContainText("Bethlehem · 3 moments");
  await expect(page.locator(".jl-place.is-here title")).toHaveText("Bethlehem");

  // The equivalent HTML moments are the next keyboard stops after the place picker.
  const birth = page.locator(".jl-here").getByRole("button", { name: "Born in Bethlehem", exact: true });
  const shepherds = page.locator(".jl-here").getByRole("button", { name: "Shepherds hear the news", exact: true });
  await place.press("Tab");
  await expect(birth).toBeFocused();
  await birth.press("Tab");
  await expect(shepherds).toBeFocused();
  await shepherds.press("Enter");
  await expect(shepherds).toHaveAttribute("aria-current", "true");
  await expect(page.locator("#jl-moment-title")).toHaveText("Shepherds hear the news");
  await expect(page.locator(".jl-line [aria-current='true']")).toHaveAttribute("aria-label", "Shepherds hear the news");
  await expect(page).toHaveURL(/\/jesus#shepherds$/);

  const gospels = page.getByRole("tab", { name: /^The Gospels/ });
  await gospels.focus();
  await gospels.press("Enter");
  await expect(gospels).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".jl-gospels")).toBeVisible();
  await expect(page.locator("#jl-moment-title")).toHaveText("Shepherds hear the news");
  await expect(place).toHaveValue("bethlehem");
  await expect(shepherds).toHaveAttribute("aria-current", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("every Ignatius letter can be selected directly and stays selected while browsing its neighbors", async ({ page }) => {
  await page.goto("/early/ignatius");
  const picker = page.locator(".map-guide").getByRole("combobox", { name: "Letter", exact: true });
  const letters = [
    { id: "ignatius-ephesians", title: "To the Ephesians", cite: "To the Ephesians 15 (shorter recension)", from: "Smyrna", to: "Ephesus" },
    { id: "ignatius-magnesians", title: "To the Magnesians", cite: "To the Magnesians 10 (shorter recension)", from: "Smyrna", to: "Magnesia" },
    { id: "ignatius-trallians", title: "To the Trallians", cite: "To the Trallians 6 (shorter recension)", from: "Smyrna", to: "Tralles" },
    { id: "ignatius-romans", title: "To the Romans", cite: "To the Romans 4 (shorter recension)", from: "Smyrna", to: "Rome" },
    { id: "ignatius-philadelphians", title: "To the Philadelphians", cite: "To the Philadelphians 4 (shorter recension)", from: "Troas", to: "Philadelphia" },
    { id: "ignatius-smyrnaeans", title: "To the Smyrnaeans", cite: "To the Smyrnaeans 8 (shorter recension)", from: "Troas", to: "Smyrna" },
    { id: "ignatius-polycarp", title: "To Polycarp", cite: "To Polycarp 3 (shorter recension)", from: "Troas", to: "Smyrna" },
  ];
  await expect(picker.locator("option")).toHaveCount(8);

  for (const [index, letter] of letters.entries()) {
    await picker.selectOption(letter.id);
    await expect(page.locator(".map-status")).toHaveText(`${letter.title} · ${letter.from} → ${letter.to}`);
    await expect(page.locator(".ew-map-letter.active")).toHaveCount(1);
    await expect(page.locator(".ew-map-place.active")).toHaveCount(2);
    await expect(page.locator(".world-pair-head[aria-expanded='true']")).toContainText(letter.title);
    await expect(page.locator(".world-panel .world-cite")).toHaveText(letter.cite);
    await expect(page.locator(".world-panel a")).toHaveAttribute("href", `/early/${letter.id}`);

    await page.locator(".world-pair-block").nth((index + 1) % letters.length).hover();
    await expect(picker).toHaveValue(letter.id);
    await expect(page.locator(".world-panel .world-cite")).toHaveText(letter.cite);
  }

  await picker.selectOption("");
  await expect(page.locator(".map-status")).toContainText("Road overview");
  await expect(page.locator(".ew-map-letter.active")).toHaveCount(0);
  await expect(page.locator(".world-pair-head[aria-expanded='true']")).toHaveCount(0);
  await expect(page.locator(".world-panel")).toHaveCount(0);
});

test("the Scripture map can reset a section zoom and open a chapter through its native book picker", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/scriptures#map");
  await expect(page.getByRole("tab", { name: "Map", exact: true })).toHaveAttribute("aria-selected", "true");
  const picker = page.locator(".dw-map").getByRole("combobox", { name: "Book", exact: true });
  await page.locator(".dw-map-sec-h").filter({ hasText: /^Law/ }).click();
  await expect(picker).toHaveValue("section:law");
  await expect(page.locator(".dw-map .map-status")).toContainText("Law · choose a book");
  await picker.selectOption("");
  await expect(page.locator(".dw-crumbs [aria-current='location']")).toHaveText("Whole Bible");
  await expect(page.locator(".dw-map-sec-h")).toHaveCount(9);
  await picker.selectOption("MAT");
  await expect(page.locator(".dw-map .map-status")).toContainText("Matthew · 28 chapters");
  const chapter = page.locator(".dw-map-box").getByRole("link", { name: /^Matthew 1,/ });
  await chapter.focus();
  await chapter.press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/protestant\/MAT\/1\?t=web/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Matthew");
});

test("shared section and map controls retain accessible structure and contrast in light and dark themes", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/jesus", "/early/ignatius"]) {
    await page.goto(route);
    await expect(page.locator(".world-guide")).toBeVisible();
    await expect(page.locator(".map-guide")).toBeVisible();
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    for (const theme of ["light", "dark"]) {
      await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
      await page.getByRole("dialog", { name: "Reading & accessibility" }).getByLabel("Page theme", { exact: true }).selectOption(theme);
      await page.getByRole("button", { name: "Close accessibility settings" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", theme);
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (context: string, options: unknown) => Promise<{ violations: { id: string; nodes: { target: unknown; failureSummary: string }[] }[] }> } }).axe;
        return (await axe.run(".world-guide, .map-guide", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations
          .map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
      });
      expect(violations, `${route} ${theme} shared controls`).toEqual([]);
    }
  }
});

test("immersive stories keep their reading layout and shared footer in both themes", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/angels/stories", "/angels/stories/open-his-eyes", "/angels/stories/i-am-with-you", "/angels/stories/the-gate-opened"]) {
    await page.goto(route);
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => { document.documentElement.dataset.a11yTheme = theme; }, theme);
      await expect(page.locator(".world-continuation")).toBeHidden();
      await expect(page.locator(".site-footer-links")).toBeVisible();
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (context: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe;
        return (await axe.run("main, .site-footer", { runOnly: { type: "rule", values: ["color-contrast"] } })).violations;
      });
      expect(violations, `${route} ${theme}`).toEqual([]);
    }
  }
});
