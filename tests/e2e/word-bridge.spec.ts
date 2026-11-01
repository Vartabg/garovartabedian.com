import { expect, test } from "@playwright/test";

test("a visitor finds Word Bridge from Scripture home and opens a chosen word", async ({ page }) => {
  const modelRequests: string[] = [];
  page.on("request", request => { if (/\/(?:models|ort)\//.test(request.url())) modelRequests.push(request.url()); });
  await page.goto("/");
  await page.getByRole("link", { name: "Open the Scriptures", exact: true }).click();
  await page.getByRole("navigation", { name: "Start studying" }).getByRole("link", { name: /Word Bridge/ }).click();
  await page.getByLabel("Passage reference").fill("John 3:16");
  await page.getByRole("button", { name: "Open Word Bridge", exact: true }).click();
  await expect(page).toHaveURL(/JHN\/3\?t=web&study=word-bridge#v16$/);
  const bridge = page.locator(".scr-bridge");
  await expect(bridge.getByRole("heading", { name: "Word Bridge", exact: true })).toBeVisible();
  await bridge.getByRole("button", { name: "loved", exact: true }).click();
  await expect(bridge.getByRole("button", { name: "ἠγάπησεν", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(bridge).toContainText("G25");
  await page.reload();
  await expect(page.locator("#vp16 .scr-bridge")).toBeVisible();
  expect(modelRequests).toEqual([]);
});

for (const example of [
  { reference: "Matthew 28:1", english: "came", greek: "ἦλθεν" },
  { reference: "Mark 16:1", english: "spices,", greek: "ἀρώματα" },
  { reference: "Luke 24:2", english: "stone", greek: "λίθον" },
  { reference: "John 3:16", english: "loved", greek: "ἠγάπησεν" },
]) test(`public Word Bridge example works: ${example.reference}`, async ({ page }) => {
  await page.goto("/scriptures/word-bridge");
  await page.getByRole("navigation", { name: "Word Bridge examples" }).getByRole("link", { name: example.reference, exact: false }).click();
  const bridge = page.locator(".scr-bridge");
  await bridge.getByRole("button", { name: example.english, exact: true }).click();
  await expect(bridge.getByRole("button", { name: example.greek, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(bridge).toContainText("Grammar");
});

test("KJV explains availability and keeps the verse when switching to WEB", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/3?t=kjv&study=word-bridge#v16");
  await page.locator(".scr-bridge").getByRole("link", { name: "Open this verse in WEB" }).click();
  await expect(page).toHaveURL(/JHN\/3\?t=web&study=word-bridge#v16$/);
  await expect(page.locator("#vp16 .scr-bridge").getByRole("button", { name: "loved", exact: true })).toBeVisible();
});

test("network failure offers a working retry instead of hiding the tool", async ({ page }) => {
  await page.route("**/scriptures/bridge/index.json", route => route.abort("failed"));
  await page.goto("/scriptures/protestant/JHN/3?t=web&study=word-bridge#v16");
  await expect(page.locator(".scr-bridge").getByRole("alert")).toContainText("could not load");
  await page.unroute("**/scriptures/bridge/index.json");
  await page.getByRole("button", { name: "Retry Word Bridge" }).click();
  await expect(page.locator(".scr-bridge").getByRole("button", { name: "loved", exact: true })).toBeVisible();
});

test("Escape closes the tool, clears the shared state and returns focus", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/3?t=web&study=word-bridge#v16");
  await expect(page.locator("#vp16 .scr-bridge")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#vp16")).toHaveCount(0);
  await expect(page).toHaveURL(/JHN\/3\?t=web#v16$/);
  await expect(page.locator("#v16 .scr-vnum")).toBeFocused();
  await page.reload();
  await expect(page.locator("#vp16")).toHaveCount(0);
});

test("an omitted WEB verse explains the gap after a KJV handoff", async ({ page }) => {
  await page.goto("/scriptures/protestant/ACT/8?t=kjv&study=word-bridge#v37");
  await page.locator(".scr-bridge").getByRole("link", { name: "Open this verse in WEB" }).click();
  await expect(page.locator("#vp37 .scr-bridge")).toContainText("is not included");
  await expect(page.locator("#vp37")).toBeFocused();
  await page.getByRole("button", { name: "Close study tools", exact: true }).click();
  await expect(page.locator("#vp37")).toHaveCount(0);
});

test("leaving while a verse loads does not redirect back to the submitted passage", async ({ page }) => {
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/scriptures/text/web/JHN.json", async route => { await pending; await route.continue(); });
  await page.goto("/scriptures/word-bridge");
  await page.getByLabel("Passage reference").fill("John 3:16");
  await page.getByRole("button", { name: "Open Word Bridge", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Opening your verse");
  await page.getByRole("link", { name: "Choose a book and chapter", exact: true }).click();
  await expect(page).toHaveURL(/\/scriptures$/);
  const loaded = page.waitForResponse(response => response.url().endsWith("/scriptures/text/web/JHN.json"));
  release();
  await loaded;
  await expect(page).toHaveURL(/\/scriptures$/);
});

test("an edition gap is explained while the Scripture verse remains readable", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/5?t=web&study=word-bridge#v4");
  await expect(page.locator("#vp4 .scr-bridge")).toContainText("no alignment for this verse");
  await expect(page.locator("#v4 .scr-verse")).toContainText("angel");
});

test("ordinary verse links remain closed; the visible Word Bridge action opens that verse", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/3?t=web#v16");
  await expect(page.locator("#vp16")).toHaveCount(0);
  await page.getByRole("navigation", { name: "Chapter study tools" }).getByRole("button", { name: "Word Bridge", exact: true }).click();
  await expect(page.locator("#vp16 .scr-bridge")).toBeVisible();
  await expect(page).toHaveURL(/study=word-bridge#v16$/);
});

test("the Word Bridge entry and reader work by keyboard on an enlarged narrow page", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/scriptures/word-bridge");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await page.getByLabel("Passage reference").fill("Luke 24:2");
  await page.getByLabel("Passage reference").press("Enter");
  await expect(page.locator("#vp2 .scr-bridge")).toBeVisible();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  const stone = page.locator(".scr-bridge").getByRole("button", { name: "stone", exact: true });
  await stone.focus();
  await stone.press("Enter");
  await expect(page.locator(".scr-bridge")).toContainText("G3037");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});
