import { expect, test } from "@playwright/test";

test("encounters can be searched and filtered without losing passage destinations", async ({ page }) => {
  await page.goto("/angels/encounters");
  const finder = page.getByRole("region", { name: "Find the encounter." });
  const results = finder.getByRole("navigation", { name: "Matching encounters" });
  await expect(results.getByRole("link")).toHaveCount(61);

  await finder.getByRole("button", { name: "Confrontations, 15", exact: true }).click();
  await expect(results.getByRole("link")).toHaveCount(15);
  await finder.getByRole("searchbox").fill("Mark 5");
  await expect(results.getByRole("link")).toHaveCount(1);
  await expect(results).toContainText("The Gerasene Legion");
  await expect(page.locator("article.an-enc")).toHaveCount(61);

  await results.getByRole("link").click();
  await expect(page).toHaveURL(/#enc-MRK-5-1-20$/);
  const encounter = page.locator("#enc-MRK-5-1-20");
  await expect(encounter).toBeFocused();
  await expect(encounter.getByRole("link", { name: "Matthew 8:28–34", exact: true }))
    .toHaveAttribute("href", "/scriptures/protestant/MAT/8#v28");
  await expect(encounter.getByRole("link", { name: "Luke 8:26–39", exact: true }))
    .toHaveAttribute("href", "/scriptures/protestant/LUK/8#v26");

  await finder.getByRole("searchbox").fill("no-such-encounter");
  await expect(results.getByRole("link")).toHaveCount(0);
  await expect(results).toContainText("No matching encounters");
  await finder.getByRole("button", { name: "Reset filters" }).click();
  await expect(results.getByRole("link")).toHaveCount(61);
});

test("fall progress remains keyboard accessible and tracks the selected fragment", async ({ page }) => {
  await page.goto("/angels/fall");
  const progress = page.getByRole("navigation", { name: "Fall reading progress" });
  const target = progress.locator('a[href="#isa-14-12-15"]');
  await expect(progress.getByRole("link")).toHaveCount(14);
  await target.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#isa-14-12-15$/);
  await expect(target).toHaveAttribute("aria-current", "step");
  await expect(page.locator("#isa-14-12-15")).toBeFocused();
  const box = await target.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(24);
  expect(box?.height).toBeGreaterThanOrEqual(24);
  const progressHeight = await progress.locator(".an-fall-progress-fill").evaluate(
    (element) => parseFloat((element as HTMLElement).style.height),
  );
  expect(progressHeight).toBeGreaterThan(0);
  expect(progressHeight).toBeLessThan(100);
});

test("the named encounter navigator fits a narrow phone and opens the selected scene", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/angels/encounters");
  const finder = page.getByRole("region", { name: "Find the encounter." });
  await finder.getByRole("button", { name: "Appearances, 46", exact: true }).click();
  await finder.getByRole("searchbox").fill("Gabriel");
  const results = finder.getByRole("navigation", { name: "Matching encounters" });
  await expect(results.getByRole("link")).toHaveCount(4);
  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);
  await results.getByRole("link", { name: /The Annunciation/ }).click();
  await expect(page).toHaveURL(/#enc-LUK-1-26-38$/);
  await expect(page.locator("#enc-LUK-1-26-38")).toBeFocused();
});

test("a dossier deep link stays selected and keyboard operable on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(
    "/angels/dossier?preset=watchers-nephilim-enoch",
  );
  expect(response?.status()).toBe(200);

  const presets = page.getByRole("region", {
    name: "Curated landmark dossiers",
  });
  const watchers = presets.getByRole("button", {
    name: /The Fall of the Watchers & The Origin of Demons/,
  });
  await expect(watchers).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /The Fall of the Watchers & The Origin of Demons/,
    }),
  ).toBeVisible();

  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);

  const adversary = presets.getByRole("button", {
    name: /The Evolution of the Adversary/,
  });
  await watchers.focus();
  await page.keyboard.press("Tab");
  await expect(adversary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(adversary).toHaveAttribute("aria-pressed", "true");
  await expect(watchers).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /The Evolution of the Adversary/,
    }),
  ).toBeVisible();
});
