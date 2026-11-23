import { expect, test, type Page } from "@playwright/test";

const hub = "/scriptures/stories/play";
const temple = `${hub}/overturned-tables`;

test("a filtered Stories shelf opens the games and keeps its place on Back", async ({ page }) => {
  await page.goto("/scriptures/stories");
  await expect(page.getByText("All 27 stories, from Genesis to Acts")).toBeVisible();
  await page.getByRole("button", { name: "afraid", exact: true }).click();
  await expect(page.getByText(/stories where people were afraid/)).toBeVisible();

  const fromShelf = page.getByRole("article").getByRole("link", { name: "Playable stories", exact: true });
  await fromShelf.click();
  await expect(page.getByRole("heading", { level: 1, name: "Playable stories" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "afraid", exact: true })).toHaveAttribute("aria-pressed", "true");
  await fromShelf.click();

  const game = page.getByRole("link", { name: "Enter the temple court", exact: true });
  const documentRequest = page.waitForRequest((request) =>
    request.isNavigationRequest() && new URL(request.url()).pathname === temple
  );
  await game.press("Enter");
  await documentRequest;
  await expect(page.getByRole("heading", { level: 1, name: "The overturned tables" })).toBeVisible();
});

const moneyTable = /^Money table\b/i;
const doveSeat = /^Dove seller[’']s seat\b/i;

function progress(page: Page, cleared: number) {
  return page.getByText(new RegExp(`\\b${cleared}\\s*/\\s*5\\b`));
}

async function openTargets(page: Page) {
  const summary = page.locator("summary").filter({ hasText: /^Courtyard targets$/i });
  await summary.press("Enter");
  return page.locator("details[open]").filter({ has: summary });
}

test("Space flips the first table and the passage can be barred before the court clears", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(temple);
  await expect(page.getByRole("button", { name: "Flip table", exact: true })).toBeEnabled();
  await expect(progress(page, 0)).toBeVisible();
  await page.getByLabel("Temple courtyard", { exact: true }).press("Space");
  await expect(progress(page, 1)).toBeVisible();

  await page.getByRole("button", { name: "Pause", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Resume", exact: true }).press("Enter");
  const targets = await openTargets(page);
  await expect(targets.getByRole("button", { name: moneyTable, disabled: true })).toHaveCount(1);
  await expect(targets.getByRole("button", { name: doveSeat })).toHaveCount(2);
  const passage = targets.getByRole("button", { name: /^East passage/i });
  await passage.press("Enter");
  await expect(passage).toBeDisabled({ timeout: 15_000 });
  await expect(page.getByText("Passage barred", { exact: true })).toBeVisible();

  for (const [index, name] of [doveSeat, moneyTable, doveSeat, moneyTable].entries()) {
    await targets.getByRole("button", { name, disabled: false }).first().press("Enter");
    await expect(progress(page, index + 2)).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByRole("heading", { level: 2, name: "A house of prayer" })).toBeVisible();
  await expect(targets.getByRole("button", { disabled: true })).toHaveCount(6);
  const teachingCard = page.locator(".court-teaching");
  const teachButton = page.getByRole("button", { name: "Teach", exact: true });
  await expect(teachButton).toBeEnabled();
  await teachButton.press("Enter");
  await expect(teachingCard.getByText(/den of robbers/i)).toBeVisible();
  await teachButton.press("Enter");
  await expect(teachingCard.getByText(/multitude was astonished/i)).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).press("Enter");
  await expect(progress(page, 0)).toBeVisible();
  await expect(page.getByRole("button", { name: "Flip table", exact: true })).toBeEnabled();
});

test("the passage can be barred after the last seat is overturned", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(temple);
  const targets = await openTargets(page);
  const teaching = page.getByRole("heading", { level: 2, name: "A house of prayer" });
  for (const [index, name] of [moneyTable, doveSeat, moneyTable, moneyTable, doveSeat].entries()) {
    await targets.getByRole("button", { name, disabled: false }).first().click();
    await expect(progress(page, index + 1)).toBeVisible({ timeout: 15_000 });
  }
  await expect(teaching).toBeHidden();
  await targets.getByRole("button", { name: /^East passage/i }).click();
  await expect(teaching).toBeVisible({ timeout: 15_000 });

  // Complete Act II (healing and answering scribes) and Act III (evening departure).
  for (const name of [/^Lame visitor/i, /^Blind visitor/i, /^Chief priests and scribes/i]) {
    const btn = targets.getByRole("button", { name });
    await btn.click();
    await expect(btn).toBeDisabled({ timeout: 15_000 });
  }
  await expect(page.getByText("Evening", { exact: true })).toBeVisible();
  const eastArch = targets.getByRole("button", { name: /^East archway \(evening\)/i });
  await eastArch.click();
  await expect(page.getByRole("heading", { level: 2, name: "Evening" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".court-teaching").getByText(/went out of the city/i)).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(progress(page, 0)).toBeVisible();
  await expect(page.getByRole("button", { name: "Flip table", exact: true })).toBeEnabled();
});

test.describe("the game index without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });

  test("offers the games, crossing account and original passages on a narrow screen", async ({ page }) => {
    await page.goto(hub);
    const collection = page.getByRole("article", { name: "Playable stories" });
    for (const [name, href] of [
      ["Enter the temple court", temple],
      ["Read Mark 11:15–18", "/scriptures/protestant/MRK/11?t=web#v15"],
      ["Start free flight over Hermon", "/play/hermon"],
      ["Play The Cloven Arch", "/play/hermon/crossing"],
      ["Read the crossing", "/play/hermon/crossing/account"],
      ["Read 1 Enoch 6 in the Ethiopian canon", "/scriptures/ethiopian/ENO/6?t=charles#v4"],
      ["Read David’s story", "/scriptures/stories/david"],
      ["Read 1 Samuel 17", "/scriptures/protestant/1SA/17?t=web#v1"],
    ]) {
      const link = collection.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await collection.getByRole("link", { name: "Read David’s story" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "David" })).toBeVisible();
  });

  test("the Temple page opens both Gospel accounts without starting the game", async ({ page }) => {
    await page.goto(temple);
    const summary = page.locator("summary").filter({ hasText: /^Read the Gospel accounts$/i });
    await summary.press("Enter");
    const accounts = page.locator("details[open]").filter({ has: summary });
    await expect(accounts.locator('a[href*="/scriptures/protestant/MRK/11"]')).toBeVisible();
    await expect(accounts.locator('a[href*="/scriptures/protestant/JHN/2"]')).toBeVisible();
    await expect(accounts.getByText(/a house of prayer for all the nations/i)).toBeVisible();
  });
});
