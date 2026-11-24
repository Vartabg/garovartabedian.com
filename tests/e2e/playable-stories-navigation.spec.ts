import { expect, test, type Page } from "@playwright/test";

const hub = "/scriptures/stories/play";
const temple = `${hub}/overturned-tables`;
const elah = `${hub}/valley-of-elah`;
const storm = `${hub}/storm-on-the-lake`;

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

test("Valley of Elah sheds Saul’s armor, gathers five stones, faces Goliath, and replays cleanly", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(elah);
  await expect(page.getByRole("heading", { level: 1, name: "The Valley of Elah" })).toBeVisible();
  await expect(page.getByText("Armor 3 / 3", { exact: true })).toBeVisible();
  await expect(page.getByText(/\b0\s*\/\s*5\b/)).toBeVisible();

  const summary = page.locator("summary").filter({ hasText: /^Valley targets$/i });
  await summary.press("Enter");
  const targets = page.locator("details[open]").filter({ has: summary });

  // All 5 brook stones stay locked while Saul's armor is worn.
  await expect(targets.getByRole("button", { name: /^Smooth stone/i, disabled: true })).toHaveCount(5);

  // Shed sword, coat of mail, and bronze helmet sequentially.
  await page.getByLabel("Valley of Elah", { exact: true }).press("Space");
  await expect(page.getByText("Armor 2 / 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Set aside coat of mail", exact: true }).first().click();
  await expect(page.getByText("Armor 1 / 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Set aside bronze helmet", exact: true }).first().click();
  await expect(page.getByText("Armor set aside", { exact: true })).toBeVisible();
  await expect(targets.getByRole("button", { name: /^Smooth stone/i, disabled: false })).toHaveCount(5);

  // Gather all 5 smooth stones from the brook in non-sequential order.
  for (const [index, stoneName] of ["Smooth stone 3", "Smooth stone 1", "Smooth stone 5", "Smooth stone 2", "Smooth stone 4"].entries()) {
    const btn = targets.getByRole("button", { name: new RegExp(`^${stoneName}`) });
    await btn.click();
    await expect(page.getByText(new RegExp(`\\b${index + 1}\\s*/\\s*5\\b`))).toBeVisible({ timeout: 15_000 });
  }

  // Step into the valley floor standoff -> untimed sling phase.
  const meetBtn = targets.getByRole("button", { name: /^Step into the valley/i });
  await meetBtn.click();
  await expect(page.getByText("Sling ready", { exact: true })).toBeVisible({ timeout: 15_000 });
  const card = page.locator(".elah-card");
  await expect(card.getByText(/doesn’t save with sword and spear/i)).toBeVisible();

  // Pause and resume cleanly during untimed sling stance.
  await page.getByRole("button", { name: "Pause", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Resume", exact: true }).press("Enter");

  // Deliberate release resolves the valley and unlocks verse cycling + replay.
  await page.getByRole("button", { name: "Release stone", exact: true }).first().click();
  await expect(page.getByText("Valley open", { exact: true })).toBeVisible();
  const readBtn = page.getByRole("button", { name: "Read verse", exact: true });
  await expect(readBtn).toBeEnabled();
  await readBtn.click();
  await expect(card.getByText(/no sword in David’s hand/i)).toBeVisible();

  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.getByText("Armor 3 / 3", { exact: true })).toBeVisible();
  await expect(page.getByText(/\b0\s*\/\s*5\b/)).toBeVisible();
});

test("Storm on the Lake launches at dusk, fights the squall, wakes Jesus, calms the sea, and replays cleanly", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(storm);
  await expect(page.getByRole("heading", { level: 1, name: "The storm on the lake" })).toBeVisible();
  await expect(page.getByText("Evening 0 / 2", { exact: true })).toBeVisible();

  const summary = page.locator("summary").filter({ hasText: /^Boat targets$/i });
  await summary.press("Enter");
  const targets = page.locator("details[open]").filter({ has: summary });

  // Complete evening launch tasks (sail & oars)
  await targets.getByRole("button", { name: /^Set the sail/ }).click();
  await expect(page.getByText("Evening 1 / 2", { exact: true })).toBeVisible({ timeout: 15_000 });
  await targets.getByRole("button", { name: /^Pull the oars/ }).click();
  await expect(page.getByText("Squall 0 / 3", { exact: true })).toBeVisible({ timeout: 15_000 });

  // Fight squall (drop sail + bail bow & midship)
  for (const [label, status] of [
    ["Bail bow water", "Squall 1 / 3"],
    ["Drop the sail", "Squall 2 / 3"],
    ["Bail midship water", "Boat filling"],
  ]) {
    await targets.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    await expect(page.getByText(status, { exact: true })).toBeVisible({ timeout: 15_000 });
  }

  // Wake Jesus in the stern -> untimed rebuke turning point
  await targets.getByRole("button", { name: /^Wake Jesus/ }).click();
  await expect(page.getByText("Jesus in the stern", { exact: true })).toBeVisible({ timeout: 15_000 });
  const card = page.locator(".storm-card");
  await expect(card.getByText(/don’t you care that we are dying/i)).toBeVisible();

  // Pause & resume cleanly before speaking stillness
  await page.getByRole("button", { name: "Pause", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Resume", exact: true }).press("Enter");

  // Speak to the sea -> Great calm + Mark 4:39–41 verse cycling + replay
  await page.getByRole("button", { name: "Speak to the sea", exact: true }).first().click();
  await expect(page.getByText("Great calm", { exact: true })).toBeVisible();
  await expect(card.getByText(/Peace! Be still!/i)).toBeVisible();

  const readBtn = page.getByRole("button", { name: "Read verse", exact: true });
  await readBtn.click();
  await expect(card.getByText(/Why are you so afraid/i)).toBeVisible();
  await readBtn.click();
  await expect(card.getByText(/wind and the sea obey him/i)).toBeVisible();

  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.getByText("Evening 0 / 2", { exact: true })).toBeVisible();
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
      ["Enter the Valley of Elah", elah],
      ["Read David’s story", "/scriptures/stories/david"],
      ["Read 1 Samuel 17", "/scriptures/protestant/1SA/17?t=web#v1"],
      ["Board the Galilee boat", storm],
      ["Read Mark 4:35–41", "/scriptures/protestant/MRK/4?t=web#v35"],
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

  test("the Valley of Elah page opens 1 Samuel 17 without starting the game", async ({ page }) => {
    await page.goto(elah);
    const summary = page.locator("summary").filter({ hasText: /^Read 1 Samuel 17$/i });
    await summary.press("Enter");
    const reading = page.locator("details[open]").filter({ has: summary });
    await expect(reading.locator('a[href*="/scriptures/protestant/1SA/17"]')).toBeVisible();
    await expect(reading.locator('a[href="/scriptures/stories/david"]')).toBeVisible();
    await expect(reading.getByText(/no sword in David’s hand/i)).toBeVisible();
  });

  test("the Storm on the Lake page opens the Gospel accounts without starting the game", async ({ page }) => {
    await page.goto(storm);
    const summary = page.locator("summary").filter({ hasText: /^Read the Gospel accounts$/i });
    await summary.press("Enter");
    const reading = page.locator("details[open]").filter({ has: summary });
    await expect(reading.locator('a[href*="/scriptures/protestant/MRK/4"]')).toBeVisible();
    await expect(reading.locator('a[href*="/scriptures/protestant/LUK/8"]')).toBeVisible();
    await expect(reading.getByText(/Peace! Be still!/i)).toBeVisible();
  });
});
