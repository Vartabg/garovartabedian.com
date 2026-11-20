import { expect, test, type Page } from "@playwright/test";

const WORLD_ROUTES = [
  "/scriptures",
  "/jesus",
  "/apostles",
  "/early",
  "/church",
  "/angels",
  "/word",
  "/evidence",
] as const;

const JESUS_ROUTES = [
  "/jesus",
  "/jesus/words",
  "/jesus/life",
  "/jesus/risen",
  "/jesus/prophecy",
  "/jesus/history",
  "/jesus/lens",
] as const;

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.content,
    `document width ${dimensions.content}px exceeded viewport ${dimensions.viewport}px`,
  ).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test("shared buttons keep device-appropriate targets without overflow", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const minimumTarget = ["phone", "tablet"].includes(testInfo.project.name)
    ? 48
    : 44;
  const surfaces = [
    { route: "/", selector: ".ui-button" },
    { route: "/hire", selector: ".ui-button" },
    { route: "/jesus", selector: ".jl-now button" },
    {
      route: "/scriptures",
      selector: ".dw-chip, .dw-tab, .dw-goto-go, .dw-translation select",
    },
    {
      route: "/early",
      selector: ".ew-catalog-eras button, .ew-visual-picker select",
    },
    { route: "/early/ignatius", selector: ".map-picker select" },
    { route: "/church/tree", selector: ".ch-tree-picker select" },
    {
      route: "/jesus/life",
      selector:
        ".jsu-map-place-picker select, .jsu-map-view-switch button, .jsu-journey-console button",
    },
    { route: "/jesus/words", selector: ".jsu-word-tools select" },
    { route: "/scriptures/topics", selector: ".scr-topics-az button" },
    { route: "/evidence#claim-index", selector: ".hw-claim-filters button" },
  ] as const;

  for (const surface of surfaces) {
    const response = await page.goto(surface.route);
    expect(response?.status(), `${surface.route} should load`).toBe(200);
    const targets = page.locator(`${surface.selector}:visible`);
    expect(
      await targets.count(),
      `${surface.route} should expose ${surface.selector}`,
    ).toBeGreaterThan(0);

    // Render offscreen content-visibility sections before measuring their controls.
    await targets.first().scrollIntoViewIfNeeded();

    const measurements = await targets.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute("aria-label") ?? element.textContent?.trim(),
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    for (const measurement of measurements) {
      const context = `${surface.route} ${measurement.label ?? surface.selector}`;
      expect(measurement.width, context).toBeGreaterThanOrEqual(minimumTarget);
      expect(measurement.height, context).toBeGreaterThanOrEqual(minimumTarget);
    }
    await expectNoDocumentOverflow(page);
  }
});

test("large buttons never shrink when coarse input is present", async ({
  page,
}) => {
  await page.goto("/");
  const control = page.locator(".ui-button").first();
  const height = await control.evaluate((element) => {
    element.classList.remove("ui-button--md");
    element.classList.add("ui-button--lg");
    return element.getBoundingClientRect().height;
  });

  expect(height).toBeGreaterThanOrEqual(56);
});

test("the compact accessibility trigger never covers a live target", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "compact touch layout only");

  const surfaces = [
    { route: "/", selector: ".st-nav a, .st-nav button, .st-nav summary, .st-front-actions a" },
    { route: "/jesus", selector: ".site-header a, .site-header button, .site-header summary, .jl-more a" },
    { route: "/early/ignatius", selector: ".map-picker select" },
    { route: "/scriptures/topics", selector: ".scr-topics-az button" },
  ] as const;

  for (const surface of surfaces) {
    await page.goto(surface.route);
    const trigger = page.locator(".discovery-lens-bar .a11y-trigger");
    const targets = page.locator(`${surface.selector}:visible`);
    await expect(trigger).toBeVisible();
    expect(await targets.count()).toBeGreaterThan(0);

    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(triggerBox!.y).toBeLessThan(100);
    const targetBoxes = await targets.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
    );

    for (const target of targetBoxes) {
      const overlaps =
        triggerBox!.x < target.right &&
        triggerBox!.x + triggerBox!.width > target.left &&
        triggerBox!.y < target.bottom &&
        triggerBox!.y + triggerBox!.height > target.top;
      expect(overlaps, `${surface.route} has a target beneath the trigger`).toBe(
        false,
      );
    }
  }
});

test("world home titles keep a readable measure beside the plate", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "the sidebar grid starts at 1100px");
  // ReadingNarrative sits between .wrap and the hero on most worlds. When the
  // home rules missed it, the 1100px sidebar grid squeezed these titles to
  // about 140px, one or two syllables a line.
  for (const route of ["/church", "/word", "/evidence", "/early"]) {
    expect((await page.goto(route))?.status(), `${route} should load`).toBe(200);
    const title = await page.locator(".world-home-hero h1").boundingBox();
    expect(title?.width, `${route} title width`).toBeGreaterThanOrEqual(320);
  }
  expect((await page.goto("/apostles"))?.status(), "/apostles should load").toBe(200);
  const apostlesTitle = await page.locator(".ap-home-title").boundingBox();
  expect(apostlesTitle?.width, "/apostles title width").toBeGreaterThanOrEqual(320);
});

test("all eight world entrances adapt without document overflow", async ({
  page,
}, testInfo) => {
  const isPhone = testInfo.project.name === "phone";

  for (const route of WORLD_ROUTES) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should load`).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    if (route === "/scriptures") {
      // The picker retains its direct tools.
      await expect(page.locator(".dw")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Start studying" }).getByRole("link")).toHaveCount(4);
      await expect(page.getByRole("region", { name: "Find a way into your question." })).toBeVisible();
      if (isPhone) {
        const brandBox = await page.locator(".world-brand-lockup").boundingBox();
        const navBox = await page.locator(".site-navigation").boundingBox();
        expect(brandBox).not.toBeNull();
        expect(navBox).not.toBeNull();
        expect(Math.abs(brandBox!.y - navBox!.y)).toBeLessThan(20);
      }
      await expectNoDocumentOverflow(page);
      continue;
    }
    if (route === "/jesus") {
      // His life remains the page.
      await expect(page.locator(".jl")).toBeVisible();
      await expect(page.locator(".jl-more a")).toHaveCount(9);
      await expectNoDocumentOverflow(page);
      continue;
    }
    await expectNoDocumentOverflow(page);

    if (isPhone) {
      // The section's pages live in the header menu; its button stays a full target.
      const box = await page.locator(".site-nav-menu > summary").boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  }
});

test("every section home names its section once, in the header, and opens on its title", async ({ page }) => {
  for (const route of WORLD_ROUTES) {
    await page.goto(route);
    const h1 = page.locator("main h1").first();
    await expect(h1).toBeVisible();
    // No label above the title, and no wayfinding box between header and page.
    expect(await h1.evaluate((el) => el.previousElementSibling === null), `${route} has nothing above its title`).toBe(true);
    const brand = (await page.locator("header .brand").innerText()).trim().toLowerCase();
    const repeats = await h1.evaluate((title, name) => {
      const top = title.getBoundingClientRect().top;
      return [...document.querySelectorAll("main *")].filter((el) =>
        el.children.length === 0 &&
        el.getBoundingClientRect().top < top &&
        (el as HTMLElement).innerText?.trim().toLowerCase() === name).length;
    }, brand);
    expect(repeats, `${route} repeats "${brand}" above its title`).toBe(0);
  }
});

const ROOM_ROUTES = [
  "/jesus/parables", "/jesus/words", "/jesus/life", "/jesus/lens", "/jesus/history", "/jesus/prophecy", "/jesus/risen", "/jesus/harmony",
  "/church/faces", "/church/councils", "/church/giants", "/church/tree",
  "/apostles/twelve", "/apostles/sent",
  "/early/didache", "/early/ignatius", "/early/library", "/early/era/jewish",
  "/angels/fall", "/angels/demons", "/angels/encounters", "/angels/vocabulary",
  "/word/cases", "/word/free",
  "/scriptures/protestant", "/scriptures/topics", "/scriptures/search", "/scriptures/canons", "/scriptures/graph",
] as const;

test("room pages leave the section name to the header", async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of ROOM_ROUTES) {
    await page.goto(route);
    const brand = (await page.locator("header .brand").innerText()).trim().toLowerCase();
    const above = await page.locator("main h1").first().evaluate((title) => {
      const top = title.getBoundingClientRect().top;
      return [...document.querySelectorAll("main *")]
        .filter((el) => el.children.length === 0 && el.getBoundingClientRect().top < top)
        .map((el) => (el as HTMLElement).innerText?.trim().toLowerCase());
    });
    expect(above, `${route} repeats "${brand}" above its title`).not.toContain(brand);
    expect(above, `${route} labels its title "Scripture study"`).not.toContain("scripture study");
  }
});

test("the writings shelf lists its eras once: filter buttons, then one heading per era", async ({ page }) => {
  await page.goto("/early");
  await expect(page.getByRole("group", { name: "Filter by era" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Jump to an era" })).toHaveCount(0);
  await expect(page.locator("section.ew-era > .ew-era-head h2")).toHaveCount(4);
});

test("every Jesus room stays readable and truthful at this viewport", async ({
  page,
}) => {
  for (const route of JESUS_ROUTES) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should load`).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0);
    await expectNoDocumentOverflow(page);

    if (route === "/jesus/lens") {
      await expect(page.locator(".jsu-lens-head")).toContainText(
        "Includes 8 sourced perspectives",
      );
    }
  }
});

test("Jesus word study remains readable at this viewport", async ({
  page,
}, testInfo) => {
  await page.goto("/jesus/words");
  await expect(page).toHaveTitle("His words — Jesus Christ");
  const reader = page.locator(".jsu-word-reader");
  await expect(reader.locator(".scr-verse-text").first()).toBeVisible();
  await expect(page.locator(".jsu-book-select select")).toHaveValue("MAT");
  await expect(page.locator(".jsu-word-filter")).not.toHaveAttribute("open", "");
  const studyTools = page.locator("#words-study-tools > details");
  await expect(studyTools).toHaveCount(3);
  for (const disclosure of await studyTools.all()) {
    await expect(disclosure).not.toHaveAttribute("open", "");
  }
  await expect(page.locator(".jsu-word-results")).toContainText(
    /speaking verses? in Matthew/,
  );

  const distribution = page.locator(".jsu-word-distribution");
  await distribution.locator(":scope > summary").click();
  await expect(distribution.locator(".jsu-word-bar")).toHaveCount(9);
  if (testInfo.project.name === "phone") {
    const firstBar = await distribution.locator(".jsu-word-bar").first().boundingBox();
    expect(firstBar?.height).toBeGreaterThanOrEqual(44);
  }
  await expectNoDocumentOverflow(page);

  await distribution.getByRole("button", { name: /^Mark: \d+ speaking verses$/ }).click();
  await expect(page.locator(".jsu-book-select select")).toHaveValue("MRK");
  await expect(page.locator(".jsu-chapter-select select")).toHaveValue("1");
  await expect(reader.locator(".jsu-chapter")).toHaveText("Mark 1");
  await expect(reader.locator(".scr-verse-text").first()).toContainText("The time is fulfilled");
  await expect(reader).toBeFocused();
  await expect(reader.locator(".scr-verse-text").first()).toBeInViewport();
});

test("Jesus life journey remains interactive at this viewport", async ({
  page,
}) => {
  test.setTimeout(60_000);

  const response = await page.goto("/jesus/life");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("His life on the map — Jesus Christ");
  await expect(page.locator(".jsu-life-rail")).toContainText("40 events");
  await expect(page.locator(".jsu-language-copy")).toContainText(
    "event titles and Scripture text remain in English",
  );

  // The journey controls are view-independent. Exercise them in the static
  // atlas so WebGL camera work cannot keep Playwright's actionability checks
  // unstable on a two-core CI runner; Terrain gets its own render assertions
  // after the controls are proven.
  const atlas = page.getByRole("button", { name: "Atlas" });
  await atlas.click();
  await expect(atlas).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".jsu-atlas-map")).toBeVisible();

  await expect(page.locator(".jsu-life-data-table")).not.toHaveAttribute(
    "open",
    "",
  );
  const currentEvent = page.locator(".jsu-map-event-card");
  await expect(currentEvent).toContainText("The annunciation");
  await expect(page.locator(".jsu-journey-progress")).toContainText(
    "Birth & childhood",
  );
  await page.getByRole("button", { name: "Next journey stop" }).click();
  await expect(currentEvent).toContainText("Born in Bethlehem");
  await page
    .locator(".jsu-journey-picker select")
    .selectOption("shepherds");
  await expect(currentEvent).toContainText("Shepherds hear the news");
  await expect(page.locator(".jsu-journey-picker select")).toHaveValue(
    "shepherds",
  );

  await page.getByRole("button", { name: "Play journey" }).click();
  const pauseJourney = page.getByRole("button", { name: "Pause journey" });
  await expect(pauseJourney).toBeVisible();
  // Play/Pause is a changing command label, not a stable toggle label, so it
  // must not expose a contradictory aria-pressed state.
  expect(await pauseJourney.getAttribute("aria-pressed")).toBeNull();
  await pauseJourney.click();
  await expect(page.getByRole("button", { name: "Play journey" })).toBeVisible();

  await page.getByRole("button", { name: "Read event" }).click();
  await expect(
    page.locator("#life-stop-shepherds .jsu-pair-head"),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#life-event-shepherds")).toBeVisible();
  await page.locator(".jsu-life-data-table > summary").click();
  await expect(page.locator(".jsu-life-data-table")).toHaveAttribute("open", "");
  const languageSelect = page.locator(".jsu-language-selector select");
  await languageSelect.selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(
    page.locator(".jsu-life-data-table thead").first(),
  ).toContainText("Descripción");
  await languageSelect.selectOption("en");

  await page.getByRole("button", { name: "Terrain" }).click();
  await expect(page.locator(".jsu-terrain-map")).toBeVisible();
  await expect(page.locator(".jsu-terrain-marker")).toHaveCount(18);
  await expect(page.locator(".jsu-terrain-boundary")).toContainText(
    "does not claim a precise ancient road",
  );
  await expectNoDocumentOverflow(page);
  await expect(page.locator(".jsu-map-event-card")).toBeVisible();
});

test("homepage and dense world tools remain readable at this viewport", async ({
  page,
}, testInfo) => {
  const isPhone = testInfo.project.name === "phone";

  await page.goto("/");
  await expectNoDocumentOverflow(page);
  await expect(page.locator(".st-nav-links")).toBeVisible();
  if (isPhone) {
    const firstRow = page.locator(".st-rail-row").first();
    const rowBox = await firstRow.boundingBox();
    expect(rowBox?.height).toBeGreaterThanOrEqual(96);
    expect(rowBox?.height).toBeLessThan(400);
    for (const action of [
      page.locator(".st-intro-primary"),
      page.locator(".st-intro-secondary"),
    ]) {
      const actionBox = await action.boundingBox();
      expect(actionBox?.height).toBeGreaterThanOrEqual(44);
    }
    const siteMenu = page
      .getByRole("navigation", { name: "Primary site navigation" })
      .locator(".site-nav-menu > summary");
    const menuBox = await siteMenu.boundingBox();
    expect(menuBox?.height).toBeGreaterThanOrEqual(44);
    await siteMenu.click();
    await expect(page.locator(".site-nav-panel")).toBeVisible();
    await expect(
      page.locator('.site-nav-group--worlds a[href="/evidence"]'),
    ).toBeVisible();
    await siteMenu.click();
  }

  await page.goto("/scriptures");
  await expect(page.locator(".dw")).toBeVisible();
  await expect(page.locator(".dw-spine")).toHaveCount(66);
  await expectNoDocumentOverflow(page);

  await page.goto("/scriptures/protestant/JHN/3");
  // Verse 1 is on the first screen at every width; the bar holds paging,
  // the chapter picker, Listen and Aa on one line.
  const verseOne = await page.locator("#v1").boundingBox();
  const viewport = page.viewportSize();
  expect(verseOne && viewport && verseOne.y + verseOne.height).toBeLessThan(
    viewport?.height ?? 0,
  );
  const bar = page.getByRole("navigation", { name: "Reading controls" });
  for (const control of await bar.locator(".scr-bar-btn").all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(56);
  }
  // One Aa on the reader: the bar's. The floating site-wide control would
  // open the same appearance panel.
  await expect(bar.getByRole("button", { name: /^Aa — Reading and accessibility settings/ })).toBeVisible();
  await expect(page.locator(".a11y-trigger")).toBeHidden();
  await expectNoDocumentOverflow(page);

  for (const route of ["/word#fences", "/church/councils"]) {
    await page.goto(route);
    const frame = page.locator(".responsive-svg-frame").first();
    await frame.scrollIntoViewIfNeeded();
    await expect(frame).toBeVisible();
    const dimensions = await frame.evaluate((element) => ({
      client: element.clientWidth,
      content: element.scrollWidth,
    }));
    if (isPhone) {
      expect(dimensions.content).toBeGreaterThan(dimensions.client);
      await expect(page.locator(".responsive-svg-hint").first()).toBeVisible();
    }
    await expectNoDocumentOverflow(page);
  }

  await page.goto("/word");
  await expect(page.locator("#word-ledger")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search the word record" })).toBeVisible();
  await expect(page.locator(".word-results button").first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /ESV/ }).click();
  await expect(page.locator("#word-entry-detail")).toContainText("English Standard Version");
  await expect(page.locator(".word-timeline")).toBeVisible();
  await expect(page.locator(".word-source-card")).toBeVisible();

  await page.getByRole("searchbox", { name: "Search the word record" }).fill("not-a-translation");
  await expect(page.locator(".word-entry-detail--empty")).toBeVisible();

  await page.getByRole("searchbox", { name: "Search the word record" }).fill("");
  await page.goto("/word/cases");
  await page.goto("/word#word-entry-esv");
  await expect(page.locator("#word-entry-detail")).toContainText("English Standard Version");
  await expect
    .poll(() => page.locator("#word-entry-detail").evaluate((element) => element.getBoundingClientRect().top))
    .toBeLessThan(240);
  await expectNoDocumentOverflow(page);

  if (isPhone) {
    const searchBox = await page.getByRole("searchbox", { name: "Search the word record" }).boundingBox();
    expect(searchBox?.height).toBeGreaterThanOrEqual(44);
    const resultButton = await page.locator(".word-results button").first().boundingBox();
    expect(resultButton?.height).toBeGreaterThanOrEqual(44);
  }
});

test("reading and accessibility choices persist without blocking keyboard use", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Open reading and accessibility settings",
  });

  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Reading & accessibility" }),
  ).toBeVisible();

  await page.getByRole("dialog", { name: "Reading & accessibility" }).getByLabel("Reading typeface", { exact: true }).selectOption("dyslexic");
  await page.getByText("Accessibility options", { exact: true }).click();
  await page.getByText("Extra text spacing", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-font",
    "dyslexic",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-spacing",
    "spacious",
  );

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-font",
    "dyslexic",
  );
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Reading & accessibility" }),
  ).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the front door's story pictures scroll inside the first screen and open a story", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator(".st-stories-strip");
  await expect(strip.getByRole("link")).toHaveCount(27);
  // One row that scrolls sideways by itself; the page never does.
  const row = await strip.evaluate((list) => ({
    scrolls: list.scrollWidth > list.clientWidth,
    tops: new Set([...list.querySelectorAll("li")].map((item) => Math.round(item.getBoundingClientRect().top))).size,
  }));
  expect(row.scrolls).toBe(true);
  expect(row.tops).toBe(1);
  await expectNoDocumentOverflow(page);
  // A keyboard user can step over the pictures to the link after them.
  const skip = page.getByRole("link", { name: "Skip the story pictures" });
  await skip.focus();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: /^All 27 stories/ })).toBeFocused();
  await strip.getByRole("link", { name: "Noah" }).click();
  await expect(page).toHaveURL(/\/scriptures\/stories\/noah$/);
});

test("long-intro catalog pages surface a primary link on the first phone screen and clean pages drop duplicate hero kickers", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/early", "/early/library", "/apostles/twelve", "/church", "/evidence", "/word"]) {
    await page.goto(route);
    // The library's first-screen actions are its shelves, which open in place.
    const firstScreenLinks = await page.locator(route === "/early/library" ? "main .ew-shelf > summary" : "main a[href]").evaluateAll((links) =>
      links
        .map((link) => {
          const rect = link.getBoundingClientRect();
          const style = getComputedStyle(link);
          return {
            href: link.getAttribute("href"),
            bottom: rect.bottom,
            top: rect.top,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none",
          };
        })
        .filter((item) => item.visible && item.top >= 0 && item.bottom <= 844 && item.height >= 44),
    );
    expect(firstScreenLinks.length, `${route} should expose a >=44px link on screen 1 at 390x844`).toBeGreaterThan(0);
  }

  for (const route of [
    "/about",
    "/services",
    "/work",
    "/work/garovartabedian",
    "/work/excel-handler",
    "/hire",
    "/resume",
    "/contact",
    "/labs",
    "/sources",
  ]) {
    await page.goto(route);
    const hasHeroKicker = await page.locator("main h1").first().evaluate((h1) => {
      const prev = h1.previousElementSibling;
      return Boolean(prev && (prev.classList.contains("kicker") || prev.tagName === "P"));
    });
    expect(hasHeroKicker, `${route} should not repeat a hero kicker above h1`).toBe(false);
  }
});

test("a long section name wraps beside Find and Menu instead of pushing them to a second row on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/word", "/word/cases", "/angels/demons", "/angels/stories/open-his-eyes"]) {
    await page.goto(route);
    const brandBox = await page.locator(".world-brand-lockup").boundingBox();
    const navBox = await page.locator(".site-navigation").boundingBox();
    expect(brandBox, `${route} brand`).not.toBeNull();
    expect(navBox, `${route} navigation`).not.toBeNull();
    const brandMiddle = brandBox!.y + brandBox!.height / 2;
    const navMiddle = navBox!.y + navBox!.height / 2;
    expect(Math.abs(brandMiddle - navMiddle), `${route} header should stay on one row`).toBeLessThan(12);
    await expectNoDocumentOverflow(page);
  }
});

test("section homes give their ways in once: buttons under the opening paragraph, nothing repeating them", async ({ page }) => {
  await page.goto("/early");
  await expect(page.locator(".world-hero-actions a")).toHaveCount(4);
  await expect(page.locator(".world-home-hero-facets")).toHaveCount(0);

  for (const [route, count] of [["/church", 5], ["/evidence", 4], ["/word", 4]] as const) {
    await page.goto(route);
    const hrefs = await page.locator(".world-hero-actions a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.length, `${route} hero links`).toBe(count);
    expect(new Set(hrefs).size, `${route} hero links repeat`).toBe(count);
  }
});

test("home titles share Fraunces display type and deep reference pages fold long inventories on phones", async ({ page }) => {
  for (const route of [
    "/",
    "/scriptures",
    "/jesus",
    "/apostles",
    "/early",
    "/church",
    "/angels",
    "/word",
    "/evidence",
    "/work",
  ]) {
    await page.goto(route);
    const fontFamily = await page
      .locator("main h1")
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase());
    expect(fontFamily, `${route} h1 should render in Fraunces`).toContain("fraunces");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/angels", "/evidence", "/evidence/frameworks"]) {
    await page.goto(route);
    const screens = await page.evaluate(
      () => document.documentElement.scrollHeight / 844,
    );
    expect(
      screens,
      `${route} should fold deep inventories below 34 phone screens (was 49-58)`,
    ).toBeLessThan(34);
  }
});
