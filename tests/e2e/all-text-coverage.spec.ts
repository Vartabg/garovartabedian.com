import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

for (const width of [320, 1280]) test(`Find reaches real writing paragraphs and returns to its selected search at ${width}px`, async ({ page, context }) => {
  await context.addCookies([{ name: "preview_access", value: "test-only", url: `http://127.0.0.1:${process.env.PORT ?? 3000}` }]);
  const authHeaders: string[] = [];
  await page.route("**/api/library-search?**", async route => { authHeaders.push(await route.request().headerValue("cookie") ?? ""); await route.continue(); });
  await page.setViewportSize({ width, height: 900 });
  const providers: string[] = [], errors: string[] = [];
  page.on("request", request => { if (/typesafe|\/api\/find\//.test(request.url())) providers.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await dialog.getByRole("combobox", { name: "Find Scripture edition" }).selectOption("kjv");
  await dialog.getByRole("button", { name: "Passages & writings", exact: true }).click();
  await dialog.getByRole("searchbox", { name: "Find", exact: true }).fill("love your enemies");
  const writing = dialog.locator(".find-group").filter({ has: page.getByRole("heading", { name: "Words in the writings" }) }).getByRole("option").first();
  await expect(writing).toContainText("Complete phrase");
  await expect(writing).toContainText("Translated text");
  const target = new URL(await writing.getAttribute("href") as string, "http://local");
  expect(target.pathname).toMatch(/^\/early\/library\//); expect(target.hash).toMatch(/^#p\d+/);
  expect(target.searchParams.get("findTrans")).toBe("kjv");
  await writing.click();
  await expect(page.locator(target.hash)).toContainText(/love your enemies/i);
  await expect(page.locator("[data-reading-surface]")).toHaveAttribute("data-reading-mode", "read");
  await page.getByRole("link", { name: "← Back to results for “love your enemies”" }).click();
  await expect(page).toHaveURL(/\/scriptures\/search\?q=love%20your%20enemies&trans=kjv&scope=texts$/);
  const writings = page.getByRole("region", { name: "Other writings", exact: true });
  await writings.locator("summary").click();
  await expect(writings.locator("li").first()).toContainText("Complete phrase");
  await expect(writings.getByRole("link", { name: /Search all writing passages/ })).toHaveAttribute("href", "/early/search?q=love+your+enemies");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(providers).toEqual([]); expect(errors).toEqual([]);
  expect(authHeaders.length).toBeGreaterThan(0);
  expect(authHeaders.every(header => header.includes("preview_access=test-only"))).toBe(true);
});

test("writing filters and result pages survive reading; no matches offer the same scoped wording choices", async ({ page }) => {
  await page.goto("/early/search?q=love+your+enemies&kind=primary-text&record=2-clement");
  const first = page.locator(".ew-library-results li").first();
  await expect(first).toContainText("Complete phrase");
  await first.getByRole("link").click();
  await expect(page).toHaveURL(/\/early\/library\/2-clement\/2-clem-13\?.*findFrom=writings.*#p4$/);
  await page.getByRole("link", { name: "← Back to results for “love your enemies”" }).click();
  await expect(page).toHaveURL(/\/early\/search\?q=love\+your\+enemies&kind=primary-text&record=2-clement$/);
  await page.goto("/early/search?q=loneliness&kind=commentary&record=1-clement");
  await expect(page.getByText(/No word matches in the selected texts/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Search “alone”", exact: true })).toHaveAttribute("href", "/early/search?q=alone&kind=commentary&record=1-clement");
  await page.goto("/early/search?q=not+peace&kind=primary-text");
  await expect(page.getByText(/Your negation stays in the query/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Try related wording" })).toHaveCount(0);
});

for (const [edition, book, tradition] of [["web", "JHN", "protestant"], ["kjv", "JHN", "protestant"], ["drb", "JHN", "catholic"], ["brenton", "GEN", "orthodox"], ["charles", "JUB", "ethiopian"]]) test(`${edition} uses lossless reading groups and keeps verse actions`, async ({ page }) => {
  const source = JSON.parse(readFileSync(`public/scriptures/text/${edition}/${book}.json`, "utf8")).chapters[0] as string[];
  await page.goto(`/scriptures/${tradition}/${book}/1?t=${edition}#v2`);
  await expect(page.locator("[data-reading-edition]")).toHaveAttribute("data-reading-edition", edition);
  await expect(page.locator("#chapter-text")).toHaveClass(/scr-flow/);
  await expect(page.locator("#chapter-text .scr-v")).toHaveCount(source.length);
  const actual = await page.locator("#chapter-text .scr-verse").evaluateAll(nodes => nodes.map(node => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".scr-vnum, svg").forEach(n => n.remove());
    return clone.textContent;
  }));
  expect(actual).toEqual(source);
  expect(await page.locator(".scr-reading-paragraph").count()).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Verse 2 — open study tools", exact: true }).click();
  await expect(page.locator("#vp2")).toBeVisible();
});

test("poetry, saved verse layout, original alignment and comparison stay distinct", async ({ page }) => {
  await page.goto("/scriptures/protestant/PSA/119");
  await expect(page.locator("#chapter-text")).not.toHaveClass(/scr-flow/);
  await expect(page.locator("#chapter-text .scr-v")).toHaveCount(176);
  await page.addInitScript(() => localStorage.setItem("scr:easy", JSON.stringify({ flow: false })));
  await page.goto("/scriptures/protestant/JHN/3");
  await expect(page.locator("html")).toHaveAttribute("data-reading-ready", "true");
  await expect(page.locator("#chapter-text")).not.toHaveClass(/scr-flow/);
  await page.goto("/scriptures/protestant/JHN/3?t=web&c=kjv");
  await expect(page.locator(".scr-cmp-cells").first()).toBeVisible();
  await expect(page.locator("#chapter-text")).not.toHaveClass(/scr-flow/);
  await page.goto("/scriptures/protestant/JHN/3?t=web&o=1");
  await expect(page.getByRole("complementary", { name: "Original-language edition" })).toBeVisible();
  await expect(page.locator("#chapter-text")).not.toHaveClass(/scr-flow/);
});

test("search is useful without JavaScript and enlarged reading/search reflow with bounded accessibility checks", async ({ page, browser }) => {
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const plain = await nojs.newPage();
  const base = `http://127.0.0.1:${process.env.PORT ?? 3000}`;
  await plain.goto(`${base}/early/search?q=love+your+enemies`);
  await expect(plain.locator(".ew-library-results li").first()).toContainText("Complete phrase");
  await plain.goto(`${base}/scriptures/protestant/JHN/3`);
  expect(await plain.locator(".scr-reading-paragraph").count()).toBeGreaterThan(2);
  await expect(plain.locator("#v16")).toBeAttached();
  await nojs.close();
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => localStorage.setItem("garovartabedian:reading:v2", JSON.stringify({ size: "largest", spacing: "spacious", monochrome: true })));
  for (const route of ["/scriptures/protestant/JHN/3", "/early/search?q=love+your+enemies"]) {
    await page.goto(route);
    await page.addStyleTag({ content: "p { line-height: 1.5 !important; margin-bottom: 2em !important; letter-spacing: .12em !important; word-spacing: .16em !important; }" });
    const overflow = await page.evaluate(() => [...document.querySelectorAll("main *")].filter(el => { const box = el.getBoundingClientRect(); return box.width > 0 && box.right > innerWidth + 1; }).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width, text: el.textContent?.slice(0, 90) })).slice(0, 12));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), JSON.stringify({ route, overflow })).toBe(true);
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    const violations = await page.evaluate(async () => (await (window as unknown as { axe: { run: (target: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations);
    expect(violations).toEqual([]);
  }
});
