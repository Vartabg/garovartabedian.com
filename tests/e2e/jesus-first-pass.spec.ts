import { expect, test, type Page } from "@playwright/test";

const sermonId = "sermon-on-the-mount";
const sermonTitle = "Sermon on the Mount";

async function expectOpenMapEvent(page: Page, id: string, title: string) {
  await expect(page.getByRole("combobox", { name: "Current stop", exact: true })).toHaveValue(id);
  await expect(page.locator(".jsu-map-event-card")).toContainText(title);
  await expect(page.locator(`#life-stop-${id} .jsu-pair-head`)).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(`#life-event-${id} .scr-ref`).first()).toBeVisible();
  await expect(page.locator(`#life-stop-${id}`)).toBeInViewport();
}

// These cases run in the chromium project, whose phone project does not include
// this file. Exercise the same new journeys explicitly at a phone width too.
for (const width of [1280, 390]) {
  test.describe(`Jesus first pass at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("named starts choose a useful lens, and a silent moment leads to its Gospel account", async ({ page }) => {
      await page.goto("/jesus");
      await expect(page.locator("article.jl-moment")).toHaveCount(0);
      const begin = page.getByRole("button", { name: "Begin his life", exact: true });
      if (process.env.JESUS_REVIEW_SCREENSHOTS) {
        await page.screenshot({ path: test.info().outputPath("overview-starts.png") });
      }
      await begin.focus();
      await begin.press("Enter");

      const annunciation = page.getByRole("article", { name: "The annunciation", exact: true });
      await expect(page).toHaveURL(/\/jesus#annunciation$/);
      await expect(annunciation.getByRole("tab", { name: /The Gospels/ })).toHaveAttribute("aria-selected", "true");
      await expect(annunciation.getByRole("link", { name: "Read in context" }).first()).toBeVisible();

      await annunciation.getByRole("tab", { name: /His words/ }).click();
      const gospelAction = annunciation.getByRole("button", { name: "Read the Gospel account", exact: true });
      await gospelAction.focus();
      await gospelAction.press("Enter");
      await expect(page).toHaveURL(/#annunciation$/);
      await expect(annunciation.getByRole("tab", { name: /The Gospels/ })).toHaveAttribute("aria-selected", "true");
      await annunciation.getByRole("button", { name: /After/ }).click();
      await expect(page.getByRole("article", { name: "Born in Bethlehem", exact: true })
        .getByRole("tab", { name: /The Gospels/ })).toHaveAttribute("aria-selected", "true");

      await page.getByRole("button", { name: "Read the Sermon on the Mount", exact: true }).click();
      const sermon = page.getByRole("article", { name: sermonTitle, exact: true });
      await expect(page).toHaveURL(/#sermon-on-the-mount$/);
      await expect(sermon.getByRole("tab", { name: /His words/ })).toHaveAttribute("aria-selected", "true");
      await expect(sermon.locator(".jl-words")).toContainText("Blessed");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

      await page.getByRole("link", { name: "Examine the historical evidence", exact: true }).click();
      await expect(page).toHaveURL(/\/jesus\/history$/);
      await expect(page.getByRole("heading", { name: "What can history actually establish?", level: 1 })).toBeVisible();
    });

    test("comparator inspection follows the current language, passage and word filter", async ({ page }) => {
      await page.goto("/jesus/harmony");
      const comparator = page.locator(".synoptic-comparator");
      const word = comparator.locator(".verse-line p span").filter({ hasText: /^are\s*$/ }).first();
      await word.click();
      const inspector = page.getByRole("complementary", { name: "Word inspection details" });
      await expect(inspector).toContainText("Function word");
      await page.getByRole("checkbox", { name: "Dim function words" }).uncheck();
      await expect(inspector).toHaveCount(0);
      await word.click();
      await expect(inspector).toContainText("In all displayed accounts");
      await page.getByRole("button", { name: "Greek (SBLGNT)", exact: true }).click();
      await expect(inspector).toHaveCount(0);
      await page.getByRole("button", { name: "Matching sequences only", exact: true }).click();
      await expect(comparator.locator(".verse-line").first()).toContainText("Μακάριοι");
      await page.locator("#pericope-select").selectOption("feeding-5000");
      await expect(comparator.locator("article")).toHaveCount(4);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      if (process.env.JESUS_REVIEW_SCREENSHOTS) {
        await page.getByRole("button", { name: "Greek (SBLGNT)", exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: test.info().outputPath("comparator-controls.png") });
      }
    });

    test("named starts leave a saved choice intact and malformed overview fragments stay usable", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        if (!localStorage.getItem("jesus-life-lenses:v1")) {
          localStorage.setItem("jesus-life-lenses:v1", JSON.stringify({ id: "baptism", lens: "prophecy" }));
        }
      });
      await page.goto("/jesus");
      await expect(page.getByRole("button", { name: "Begin his life", exact: true })).toBeVisible();
      const baptism = page.getByRole("article", { name: "Baptized in the Jordan", exact: true });
      await expect(baptism).toBeVisible();
      await expect(baptism.getByRole("tab", { name: /Prophecy/ })).toHaveAttribute("aria-selected", "true");

      // An incoming moment wins over saved history, while the chosen lens stays.
      await page.goto(`/jesus#${sermonId}`);
      const sermon = page.getByRole("article", { name: sermonTitle, exact: true });
      await expect(sermon.getByRole("tab", { name: /Prophecy/ })).toHaveAttribute("aria-selected", "true");
      await page.evaluate(() => { window.history.replaceState(window.history.state, "", "#%E0%A4%A"); });
      await page.reload();
      await expect(sermon.getByRole("tab", { name: /Prophecy/ })).toHaveAttribute("aria-selected", "true");
      await page.evaluate(() => { window.location.hash = "#not-a-moment"; });
      await page.getByRole("button", { name: "Begin his life", exact: true }).click();
      await expect(page.getByRole("article", { name: "The annunciation", exact: true })
        .getByRole("tab", { name: /The Gospels/ })).toHaveAttribute("aria-selected", "true");
      expect(errors).toEqual([]);
    });

    test("the overview hands the Sermon to the map, including direct links and changing fragments", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/jesus");
      await page.getByRole("button", { name: "Read the Sermon on the Mount", exact: true }).click();
      await page.getByRole("article", { name: sermonTitle, exact: true })
        .getByRole("link", { name: "On the full map", exact: true }).click();
      await expect(page).toHaveURL(/\/jesus\/life#life-event-sermon-on-the-mount$/);
      await expectOpenMapEvent(page, sermonId, sermonTitle);
      await expect(page.getByRole("slider", { name: "Journey position", exact: true })).toHaveValue("14");
      await expect(page.locator(".jsu-map-place-picker select")).toHaveValue("galilee-mountain");
      await expect(page.locator(`#life-event-${sermonId}`)).toContainText("Blessed");

      await page.reload();
      await expectOpenMapEvent(page, sermonId, sermonTitle);
      await page.evaluate(() => { window.location.hash = "#life-stop-baptism"; });
      await expectOpenMapEvent(page, "baptism", "Baptized in the Jordan");
      await page.evaluate(() => { window.location.hash = "#life-event-sermon-on-the-mount"; });
      await expectOpenMapEvent(page, sermonId, sermonTitle);

      // Invalid hash changes leave the selected event usable; a malformed
      // initial fragment also leaves the ordinary journey controls working.
      for (const hash of ["#life-event-not-an-event", "#life-event-%E0%A4%A"]) {
        await page.evaluate((next) => { window.location.hash = next; }, hash);
        await expect(page.getByRole("combobox", { name: "Current stop", exact: true })).toHaveValue(sermonId);
      }
      await page.evaluate(() => { window.history.replaceState(window.history.state, "", "#life-event-%E0%A4%A"); });
      await page.reload();
      await page.getByRole("button", { name: "Atlas", exact: true }).click();
      await page.getByRole("combobox", { name: "Current stop", exact: true }).selectOption("baptism");
      await page.getByRole("button", { name: "Read event", exact: true }).click();
      await expectOpenMapEvent(page, "baptism", "Baptized in the Jordan");

      await page.goto("/jesus");
      await page.goto(`/jesus/life#life-event-${sermonId}`);
      await expectOpenMapEvent(page, sermonId, sermonTitle);
      expect(errors).toEqual([]);
    });
  });
}
