import { expect, test, type Locator } from "@playwright/test";

// Cover the world, home, information-page and reading-page header variants.
const routes = ["/jesus/parables", "/", "/about", "/word", "/scriptures/protestant/MRK/1"];

async function expectFitsHorizontally(locator: Locator) {
  const size = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left, right: rect.right, viewport: innerWidth,
      client: element.clientWidth, content: element.scrollWidth,
    };
  });
  expect(size.left).toBeGreaterThanOrEqual(-1);
  expect(size.right).toBeLessThanOrEqual(size.viewport + 1);
  expect(size.content).toBeLessThanOrEqual(size.client + 1);
}

for (const scenario of [
  { width: 320, text: "200%", theme: "light", font: "readable" },
  { width: 320, text: "200%", theme: "dark", font: "readable" },
  { width: 390, text: "200%", theme: "light", font: "readable" },
  { width: 640, text: "200%", theme: "dark", font: "readable" },
  { width: 320, text: "125%", theme: "light", font: "dyslexic" },
  { width: 320, text: "100%", theme: "light", font: "readable" },
  { width: 1280, text: "100%", theme: "light", font: "readable" },
]) {
  test(`navigation reflows at ${scenario.width}px, ${scenario.text} ${scenario.font} text, ${scenario.theme}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: scenario.width, height: 800 });
    for (const route of routes) {
      await test.step(route, async () => {
        await page.goto(route);
        const nav = page.getByRole("navigation", { name: "Primary site navigation" });
        await expect(nav).toBeVisible();
        // Enlarge text independently of viewport size; this catches constraints
        // that an ordinary mobile screenshot or device scale factor would miss.
        await page.evaluate(async (settings) => {
          document.documentElement.style.fontSize = settings.text;
          document.documentElement.dataset.a11yTheme = settings.theme;
          document.documentElement.dataset.a11yFont = settings.font;
          await document.fonts.ready;
        }, scenario);

        const header = page.locator(".site-header .wrap, .st-nav");
        await expectFitsHorizontally(header);
        await expectFitsHorizontally(nav);
        const brand = header.locator(".brand");
        if (await brand.count()) await expectFitsHorizontally(brand);
        const find = nav.getByRole("button", { name: "Find", exact: true });
        const menu = nav.locator(".site-nav-menu > summary");
        for (const control of [find, menu]) {
          await expectFitsHorizontally(control);
          expect((await control.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        }

        await menu.focus();
        await page.keyboard.press("Enter");
        const panel = nav.locator(".site-nav-panel");
        await expect(panel).toBeVisible();
        const everything = panel.locator(".site-nav-everything > summary");
        if (await everything.count()) await everything.click();
        await expectFitsHorizontally(panel);
        for (const link of await panel.getByRole("link").all()) {
          await expectFitsHorizontally(link);
        }
        // The last link remains reachable even when the enlarged menu scrolls.
        const last = panel.getByRole("link").last();
        await last.focus();
        await expect(last).toBeInViewport();
        await page.keyboard.press("Escape");
        await expect(panel).toBeHidden();
        await expect(menu).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(find).toBeFocused();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", { name: "Find", exact: true });
        await expect(dialog).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(find).toBeFocused();
        // The shared links below the content must not reintroduce page-wide
        // scrolling after the header has reflowed. Tables keep their own scroller.
        if (["/jesus/parables", "/", "/about"].includes(route)) {
          const relatedTools = page.locator(".world-related-tools > summary");
          if (await relatedTools.count()) await relatedTools.click();
          for (const link of await page.locator(".curiosity-compass a, .st-rail-title, .site-footer a").all()) {
            await expectFitsHorizontally(link);
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(scenario.width + 1);
        }
      });
    }
  });
}
