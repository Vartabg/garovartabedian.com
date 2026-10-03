import { test, expect } from "@playwright/test";
const preview = "/scriptures/read/isaiah-53-clement-16";
const early = "/early/1clement#chapter-16";

test("inline essay and edition notes hydrate without resetting saved appearance", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydrat|Minified React error/i.test(message.text())) errors.push(message.text()); });
  await page.addInitScript(() => localStorage.setItem("garovartabedian:reading:v2", JSON.stringify({ theme: "warm", size: "large", font: "book" })));
  for (const route of ["/jesus/history/belief-and-growth", "/early/library/1-clement/1-clem-4"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-reading-ready", "true");
    await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "warm");
    await expect(page.locator("html")).toHaveAttribute("data-a11y-size", "large");
    await expect(page.locator("dialog.reading-note")).toHaveCount(0);
    const note = page.locator(".reading-note-link").first();
    await note.click();
    await expect(page.locator("body > dialog.reading-note")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(note).toBeFocused();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-reading-ready", "true");
    await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "warm");
  }
  expect(errors).toEqual([]);
});

test("shared controls migrate once, synchronize, and never multiply reading size", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("garovartabedian:a11y:v1", JSON.stringify({ font: "dyslexic", size: "large", theme: "dark", spacious: true }));
    localStorage.setItem("scr:easy", JSON.stringify({ textSize: 3, font: "serif", lineSpace: 0, flow: true, speechRate: 0.7 }));
    localStorage.setItem("garovartabedian:reading-path:v1", JSON.stringify({ size: "largest", theme: "warm" }));
  });
  await page.goto(early);
  await expect(page.locator("html")).toHaveAttribute("data-a11y-font", "dyslexic");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "dark");
  expect(await page.locator(".ew-para p").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(29.25, 1);
  await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
  const panel = page.getByRole("dialog", { name: "Reading & accessibility" });
  await panel.getByLabel("Text size", { exact: true }).selectOption("large");
  await panel.getByLabel("Page theme", { exact: true }).selectOption("warm");
  await page.getByRole("button", { name: "Close accessibility settings" }).click();
  await page.getByText("Reading appearance", { exact: true }).click();
  await expect(page.locator("article").getByLabel("Text size", { exact: true })).toHaveValue("large");
  await page.goto("/scriptures/protestant/ISA/53?t=kjv#v5");
  await expect(page.locator("[data-reading-edition]")).toHaveAttribute("data-reading-edition", "kjv");
  expect(await page.locator(".scr-read-text").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(22, 1);
  await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "warm");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("scr:easy")!).speechRate)).toBe(0.7);
  expect(await page.evaluate(() => localStorage.getItem("garovartabedian:a11y:v1"))).not.toBeNull();
});

test("explicit anchors, source notes and Back/Forward preserve a passage without provider calls", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", req => { if (/api\/find|typesafe/.test(req.url())) calls.push(req.url()); });
  await page.goto(early);
  await expect.poll(() => page.locator("#chapter-16").evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(180);
  await expect(page.locator("article[data-reading-mode]")).toHaveAttribute("data-reading-mode", "read");
  await page.getByRole("button", { name: "Trace connections", exact: true }).click();
  const note = page.locator(".ew-section").filter({ has: page.locator("#chapter-16") }).getByRole("link", { name: /Psalms? 22/ }).first();
  await note.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  const passageTop = await page.locator("#s15-p1").evaluate(el => el.getBoundingClientRect().top);
  await note.click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Suggested text match" });
  await expect(dialog).toContainText("Unreviewed");
  await expect(dialog).toContainText("World English Bible");
  await page.keyboard.press("Escape");
  await expect(note).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  await note.click();
  await dialog.getByRole("link", { name: "Open the full source" }).click();
  await expect(page).toHaveURL(/\/scriptures\/.*\?t=web#v/);
  await expect(page.locator("[data-reading-edition]")).toHaveAttribute("data-reading-edition", "web");
  await page.goBack();
  await expect(page).toHaveURL(/early\/1clement#chapter-16/);
  await expect.poll(() => page.locator("#s15-p1").evaluate((el, y) => Math.abs(el.getBoundingClientRect().top - y), passageTop)).toBeLessThan(3);
  await page.goForward();
  await expect(page).toHaveURL(/\?t=web#v/);
  expect(calls).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) test(`shared reading reflows across collections at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const route of ["/early/library/gospel-mary", "/jesus/history/belief-and-growth", "/apostles/stories/come-and-eat", "/word/cases"]) {
    await page.goto(route);
    // The edition record retains its catalog; its hosted section is the reading surface.
    if (route.includes("gospel-mary")) await page.getByRole("link", { name: "Start reading →" }).click();
    await expect(page.locator("[data-reading-surface]").first()).toBeAttached();
    await page.addStyleTag({ content: "p { line-height: 1.5 !important; margin-bottom: 2em !important; letter-spacing: .12em !important; word-spacing: .16em !important; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
  }
});

test("reading and edition references remain usable with storage disabled and without JavaScript", async ({ browser, page }) => {
  await page.addInitScript(() => { for (const key of ["localStorage", "sessionStorage"]) Object.defineProperty(window, key, { get() { throw new DOMException("Blocked", "SecurityError"); } }); });
  await page.goto(preview);
  await page.getByText("Reading appearance", { exact: true }).click();
  await page.locator("article").getByLabel("Page theme", { exact: true }).selectOption("warm");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "warm");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const nojs = await context.newPage();
  await nojs.goto(`http://127.0.0.1:${process.env.PORT ?? 3000}/early/1clement#chapter-16`);
  await expect(nojs.locator(".ew-section").filter({ has: nojs.locator("#chapter-16") })).toContainText("by His stripes we were healed");
  await nojs.getByText("About this writing, artwork and sources", { exact: true }).click();
  await expect(nojs.getByRole("link", { name: "J. B. Lightfoot", exact: true })).toBeVisible();
  await context.close();
});

test("returning after a text-size change restores the same stable paragraph", async ({ page }) => {
  await page.goto(early);
  const paragraph = page.locator("#s15-p1");
  await paragraph.scrollIntoViewIfNeeded();
  // Follow an actual source link, preserving the source history entry.
  await page.getByRole("button", { name: "Trace connections", exact: true }).click();
  const note = paragraph.getByRole("link", { name: "Psalms 22:6", exact: true });
  await note.click();
  const place = await paragraph.locator("[data-reading-fragment]").evaluateAll(els => {
    const el = els.find(p => p.getBoundingClientRect().bottom > 100)!;
    return { id: el.id, top: el.getBoundingClientRect().top };
  });
  await page.getByRole("dialog").getByRole("link", { name: "Open the full source" }).click();
  await expect(page).toHaveURL(/\/scriptures\/.*\?t=web#v/);
  await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
  await page.getByRole("dialog", { name: "Reading & accessibility" }).getByLabel("Text size", { exact: true }).selectOption("largest");
  await page.goBack();
  await expect(paragraph).toBeVisible();
  await expect.poll(() => page.locator(`[id="${place.id}"]`).evaluate((el, top) => Math.abs(el.getBoundingClientRect().top - top), place.top)).toBeLessThan(3);
});

test("reference previews open the exact edition they display", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/3?t=kjv#v16");
  await expect(page.locator("[data-reading-edition]")).toHaveAttribute("data-reading-edition", "kjv");
  await page.locator("#v16 .scr-vnum").click();
  const refs = page.locator(".scr-vpanel");
  await refs.getByRole("button", { name: /Romans 5:8/ }).click();
  await expect(refs.locator(".scr-refquote")).toContainText("King James Version");
  await expect(refs.getByRole("link", { name: /Go to Romans 5:8/ })).toHaveAttribute("href", /\?t=kjv#v8$/);
});

test("saved appearance and citation placement work before application hydration", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("garovartabedian:reading:v2", JSON.stringify({ size: "largest", theme: "dark", font: "book" })));
  await page.route("**/_next/static/chunks/**", route => route.abort());
  await page.goto(early);
  await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-a11y-size", "largest");
  expect(await page.locator(".ew-para p").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(26, 1);
  await expect.poll(() => page.locator("#chapter-16").evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(180);
});
