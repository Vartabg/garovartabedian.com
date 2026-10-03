import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const clement = JSON.parse(readFileSync("public/early/texts/1clement.json", "utf8"));
const enoch = JSON.parse(readFileSync("public/early/texts/enoch.json", "utf8"));
const longSection = "book-iii-prophecies-in-isaiah-and-the-psalms-respecting-christ-s-humiliation";
const libraryRoute = `/early/library/tertullian-against-marcion/${longSection}`;
const library = JSON.parse(readFileSync(`content/early-library/readings/tertullian-against-marcion/${longSection}.json`, "utf8"));

test("Clement has readable quotations with unchanged words, glossary and chapter citations", async ({ page }) => {
  const providerCalls: string[] = [];
  page.on("request", r => { if (/api\/find|typesafe/.test(r.url())) providerCalls.push(r.url()); });
  await page.goto("/early/1clement#chapter-16");
  await expect(page.locator("html")).toHaveAttribute("data-reading-ready", "true");
  const paragraph = page.locator("#s15-p1");
  await expect(paragraph.locator("blockquote")).toHaveCount(2);
  expect(await paragraph.locator("[data-reading-fragment]").count()).toBeGreaterThan(6);
  expect((await paragraph.locator("[data-reading-fragment]").allTextContents()).join("")).toBe(clement.sections[15].paragraphs[0]);
  expect(await paragraph.locator(".gloss-term").count()).toBeGreaterThan(0);
  await expect(page.locator("#chapter-16")).toBeAttached();
  await expect(page.locator("#s15")).toBeAttached();
  await page.getByText("About this reading layout", { exact: true }).click();
  await expect(page.locator(".reading-layout-note")).toContainText("editorial reading breaks");
  const scripture = paragraph.getByRole("link", { name: "Psalms 22:6", exact: true });
  await page.getByRole("button", { name: "Trace connections", exact: true }).click();
  await scripture.click();
  await expect(page.getByRole("dialog")).toContainText("Unreviewed");
  await page.keyboard.press("Escape");
  await expect(scripture).toBeFocused();
  expect(providerCalls).toEqual([]);
});

test("supplied Enoch lineation and library fragments are preserved in server-rendered paragraphs", async ({ page }) => {
  await page.goto("/early/enoch#s1-p1");
  const fragments = page.locator("#s1-p1 [data-reading-fragment]");
  expect((await fragments.allTextContents()).join("")).toBe(enoch.sections[1].paragraphs[0]);
  expect(await fragments.count()).toBeGreaterThan(3);
  expect(await fragments.first().evaluate(el => getComputedStyle(el).whiteSpace)).toBe("pre-line");
  await page.goto("/early/library/gospel-mary/opening");
  const source = JSON.parse(readFileSync("content/early-library/readings/gospel-mary/opening.json", "utf8"));
  for (const [i, block] of source.blocks.entries()) {
    const id = block.noteId ? `note-${block.noteId}` : `p${i + 1}`;
    const expected = block.noteId ? block.text.replace(/^\[\^[^\]]+\]:\s*/, "") : block.text;
    expect((await page.locator(`[id="${id}"] [data-reading-fragment]`).allTextContents()).join("")).toBe(expected);
  }
});

test("long library prose is formatted and edition notes retain their own role and return control", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(libraryRoute);
  expect(await page.locator("#p2 [data-reading-fragment]").count()).toBeGreaterThan(3);
  // This section contains inline note controls; compare the text around them
  // after replacing each rendered control with its original marker.
  const actual = await page.locator("#p2 [data-reading-fragment]").evaluateAll(nodes => nodes.map(el => {
    const copy = el.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("sup").forEach(sup => {
      const href = sup.querySelector("a")?.getAttribute("href") ?? "";
      const marker = href.replace(/^#annotation-/, "");
      sup.replaceWith(document.createTextNode(`[^${marker}]`));
    });
    return copy.textContent;
  }).join(""));
  expect(actual).toBe(library.blocks[1].text);
  await page.goto("/early/library/1-clement/1-clem-4");
  const note = page.locator(".reading-note-link").first();
  await note.click();
  await expect(page.locator("body > dialog")).toContainText("translator or historical editor");
  await page.getByRole("button", { name: "Return to reading" }).click();
  await expect(note).toBeFocused();
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) test(`formatted passages reflow with enlarged type and spacing at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(() => localStorage.setItem("garovartabedian:reading:v2", JSON.stringify({ size: "largest", spacing: "spacious", monochrome: true })));
  for (const route of ["/early/1clement#chapter-16", "/early/enoch#s1-p1", libraryRoute]) {
    await page.goto(route);
    await page.addStyleTag({ content: "p { line-height: 1.5 !important; margin-bottom: 2em !important; letter-spacing: .12em !important; word-spacing: .16em !important; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
    const quote = page.locator(".reading-quotation").first();
    if (await quote.count()) {
      expect(await quote.evaluate(el => getComputedStyle(el).borderInlineStartStyle)).toBe("solid");
      const style = await quote.evaluate(el => ({ label: getComputedStyle(el.querySelector(".reading-quotation-label")!).color, ink: getComputedStyle(el.querySelector("p")!).color }));
      expect(style.label).toBe(style.ink);
    }
  }
});

test("new subparagraph links restore exactly after changing text size and browser Back", async ({ page }) => {
  await page.goto("/early/1clement#chapter-16");
  await expect(page.locator("html")).toHaveAttribute("data-reading-ready", "true");
  const fragment = page.locator("#s15-p1 [data-reading-fragment]").nth(3);
  const anchor = await fragment.getAttribute("id");
  await page.goto(`/early/1clement#${anchor}`);
  await expect.poll(() => fragment.evaluate(el => Math.abs(el.getBoundingClientRect().top - 80))).toBeLessThan(15);
  const initial = await fragment.evaluate(el => el.getBoundingClientRect().top);
  // Follow a real source URL without moving the reading viewport to the link.
  await page.locator('a[href="/early/library"]').first().evaluate((el: HTMLAnchorElement) => el.click());
  await expect(page).toHaveURL(/\/early\/library$/);
  const saved = await page.evaluate(() => Object.keys(sessionStorage).filter(k => k.startsWith("reading:position:")).map(k => JSON.parse(sessionStorage.getItem(k)!)));
  await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
  await page.getByRole("dialog", { name: "Reading & accessibility" }).getByLabel("Text size", { exact: true }).selectOption("largest");
  await page.goBack();
  await expect.poll(() => fragment.evaluate((el, top) => Math.abs(el.getBoundingClientRect().top - top), initial), { message: JSON.stringify({ anchor, initial, saved }) }).toBeLessThan(3);
});

test("formatting works without JavaScript and quotations pass a bounded accessibility check", async ({ page, browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const nojs = await context.newPage();
  await nojs.goto(`http://127.0.0.1:${process.env.PORT ?? 3000}/early/1clement#chapter-16`);
  await expect(nojs.locator("#s15-p1 blockquote")).toHaveCount(2);
  expect((await nojs.locator("#s15-p1 [data-reading-fragment]").allTextContents()).join("")).toBe(clement.sections[15].paragraphs[0]);
  await context.close();
  await page.goto(libraryRoute);
  await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
  const violations = await page.evaluate(async () => (await (window as unknown as { axe: { run: (target: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe.run("[data-reading-surface]", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations);
  expect(violations).toEqual([]);
});
