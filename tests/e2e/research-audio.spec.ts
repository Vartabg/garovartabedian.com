import { expect, test } from "@playwright/test";
import episodes from "../../src/lib/research-audio/episodes.json";

// Every published overview gets the same playback and accessibility checks.
const overviews = episodes.map(({ route, id, sections }) => ({ route, id, sectionCount: sections.length }));

for (const { route, id, sectionCount } of overviews) {
  test(`${id}: accessible expanded transcript across reading themes`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(route);
    await page.locator(".research-audio summary").click();
    await expect(page.locator(".research-audio button").first()).toBeEnabled();
    // Opening a long disclosure scrolls its summary into view. Put the player
    // below the sticky world navigation before auditing its touch targets.
    await page.locator(".research-audio h2").evaluate((heading) => heading.scrollIntoView({ block: "start" }));
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    for (const theme of ["light", "dark", "warm"]) {
      await page.evaluate((theme) => { document.documentElement.dataset.a11yTheme = theme; }, theme);
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (target: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe;
        return (await axe.run(".research-audio", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations;
      });
      expect(violations, theme).toEqual([]);
    }
    await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
    const settings = page.getByRole("dialog", { name: "Reading & accessibility" });
    await settings.getByLabel("Text size", { exact: true }).selectOption("largest");
    await settings.getByLabel("Reading typeface", { exact: true }).selectOption("dyslexic");
    await settings.getByRole("button", { name: "Close accessibility settings" }).click();
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.locator(".research-audio").evaluate((node) => node.scrollWidth > node.clientWidth);
    expect(overflow).toBe(false);
  });

  test(`${id}: explicit playback, chapter seeking, speed and transcript`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mediaRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(".m4a")) mediaRequests.push(request.url());
    });
    await page.goto(route);
    const overview = page.locator(".research-audio");
    await expect(overview).toHaveAttribute("aria-labelledby", `audio-${id}`);
    const audio = overview.locator("audio");
    await expect(audio).toHaveAttribute("preload", "none");
    expect(await audio.evaluate((node: HTMLAudioElement) => node.paused)).toBe(true);
    expect(mediaRequests).toEqual([]);
    await overview.getByLabel("Speed", { exact: true }).selectOption("1.25");
    const secondChapter = overview.getByRole("button", { name: /^Seek to/ }).nth(1);
    await secondChapter.click();
    await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.currentTime)).toBeGreaterThan(20);
    expect(await audio.evaluate((node: HTMLAudioElement) => node.playbackRate)).toBe(1.25);
    await audio.evaluate((node: HTMLAudioElement) => { node.playbackRate = 1.5; });
    await expect(overview.getByLabel("Speed", { exact: true })).toHaveValue("1.5");
    // Exercise actual decoding/playback, not a mocked media element.
    await audio.evaluate((node: HTMLAudioElement) => node.play());
    await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.paused)).toBe(false);
    const start = await audio.evaluate((node: HTMLAudioElement) => node.currentTime);
    await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.currentTime)).toBeGreaterThan(start + 0.1);
    // Another media source must not overlap the overview.
    await page.evaluate(async () => {
      const other = document.createElement("audio");
      other.src = document.querySelector<HTMLAudioElement>(".research-audio audio")!.currentSrc;
      document.body.append(other);
      await other.play();
      other.pause();
      other.remove();
    });
    await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.paused)).toBe(true);
    await overview.getByText("Read the transcript & sources", { exact: true }).click();
    await expect(overview.getByRole("heading", { name: "Source notes" })).toBeVisible();
    expect(await overview.locator("section").count()).toBe(sectionCount);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const { route, id } of overviews) {
 test(`${id}: transcript and native controls survive without JavaScript`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.locator(".research-audio")).toHaveAttribute("aria-labelledby", `audio-${id}`);
  await expect(page.locator(".research-audio audio")).toHaveAttribute("controls", "");
  await expect(page.locator(".research-audio button").first()).toBeDisabled();
  await expect(page.locator(".research-audio select")).toBeDisabled();
  await page.getByText("Read the transcript & sources", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Source notes" })).toBeVisible();
  await context.close();
 });
}

test("audio failure leaves a transcript and a direct file link", async ({ page }) => {
  await page.route("**/research-audio/*.m4a", (route) => route.abort());
  await page.goto("/church/councils");
  await page.getByRole("button", { name: "Seek to What the creed says", exact: true }).click();
  await expect(page.locator(".research-audio [role=status]")).toContainText("could not load");
  await expect(page.getByRole("link", { name: "Open the audio file" })).toHaveAttribute("href", "/research-audio/nicaea.m4a");
});
