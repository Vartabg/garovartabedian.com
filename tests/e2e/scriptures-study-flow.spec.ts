import { expect, test } from "@playwright/test";
import { getWorldRoutes } from "../../src/lib/site-navigation";

test("Word Bridge shares its own page identity", async ({ page }) => {
  await page.goto("/scriptures/word-bridge");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Word Bridge");
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "Word Bridge");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /\/scriptures\/word-bridge$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/scriptures\/word-bridge$/);
});

test("study entrances reflow with enlarged text while the reader keeps its own controls", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 740 });
  const overflow: { path: string; elements: string[] }[] = [];
  for (const { href: path } of getWorldRoutes("scriptures")) {
    await page.goto(path);
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) {
      overflow.push({ path, elements: await page.locator("main *").evaluateAll(elements => elements.filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(el => el.outerHTML.slice(0, 320))) });
    }
    if (path === "/scriptures") {
      const passageInput = page.getByRole("combobox", { name: "Go to", exact: true });
      expect(await passageInput.evaluate(el => {
        const style = getComputedStyle(el);
        return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      })).toBeGreaterThan(120);
    }
    if (path === "/scriptures/word-bridge") await expect(page.locator(".site-navigation").getByRole("button", { name: "Find", exact: true })).toBeVisible();
  }
  expect(overflow).toEqual([]);
  await page.goto("/scriptures/protestant/JHN/3?t=web#v16");
  await expect(page.locator(".world-guide")).toBeHidden();
  await expect(page.getByRole("button", { name: "Word Bridge", exact: true })).toBeVisible();
});

test("Find reveals Word Bridge by name without a model download", async ({ page }) => {
  const modelRequests: string[] = [];
  page.on("request", request => { if (/\/(?:models|ort)\//.test(request.url())) modelRequests.push(request.url()); });
  await page.goto("/");
  await page.locator(".site-navigation").getByRole("button", { name: "Find", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Find", exact: true });
  await dialog.getByRole("searchbox", { name: "Find", exact: true }).fill("Word Bridge");
  await dialog.getByRole("option").filter({ hasText: "Word Bridge" }).first().click();
  await expect(page).toHaveURL(/\/scriptures\/word-bridge(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Word Bridge", exact: true, level: 1 })).toBeVisible();
  expect(modelRequests).toEqual([]);
});

test("a verse keeps its edition through comparison, a dossier and a return to reading", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/3?t=kjv&study=word-bridge#v16");
  await page.getByRole("navigation", { name: "Study this verse further" }).getByRole("link", { name: "Compare translations", exact: true }).click();
  await expect(page).toHaveURL(/book=JHN&chapter=3&verse=16&translation=kjv/);
  await expect(page.getByRole("complementary", { name: "Study passage" })).toContainText("John 3:16");
  await page.getByRole("navigation", { name: "Continue studying this passage" }).getByRole("link", { name: "Build a research dossier", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Study passage" })).toContainText("King James Version");
  await page.getByRole("navigation", { name: "Continue studying this passage" }).getByRole("link", { name: "Return to reading", exact: true }).click();
  await expect(page).toHaveURL(/JHN\/3\?t=kjv#v16$/);
  await expect(page.locator("#v16 .scr-verse")).toContainText("only begotten Son");
});

test("curated study paths explain their scope and keep a return to the starting verse", async ({ page }) => {
  for (const tool of ["catena", "diachronic", "disputation", "parallels"]) {
    await page.goto(`/scriptures/${tool}?tradition=protestant&book=JHN&chapter=3&verse=16&translation=kjv`);
    const context = page.getByRole("complementary", { name: "Study passage" });
    await expect(context).toContainText("John 3:16");
    await expect(context).toContainText("selected");
    if (tool === "parallels") {
      await page.getByRole("link", { name: "The Prophecy Jude Quoted", exact: true }).click();
      await expect(page).toHaveURL(/parallels\/jude-enoch-quotation\?tradition=protestant&book=JHN&chapter=3&verse=16&translation=kjv/);
      await expect(context).toContainText("John 3:16");
      await page.getByRole("navigation", { name: "Matrix navigation" }).getByRole("link", { name: "All parallel claims", exact: true }).click();
      await expect(page).toHaveURL(/parallels\?tradition=protestant&book=JHN&chapter=3&verse=16&translation=kjv/);
    }
    await context.getByRole("link", { name: "Return to reading", exact: true }).click();
    await expect(page).toHaveURL(/JHN\/3\?t=kjv#v16$/);
  }
});

test("parallel comparisons share the Scripture theme and keep one main landmark", async ({ page }) => {
  for (const path of ["/scriptures/parallels", "/scriptures/parallels/jude-enoch-quotation"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator(".scr-parallels-theme .transition").first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    for (const theme of ["light", "dark", "warm"]) {
      await page.evaluate(async theme => {
        document.documentElement.dataset.a11yTheme = theme;
        await new Promise(requestAnimationFrame);
      }, theme);
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (context: string, options: unknown) => Promise<{ violations: { id: string; nodes: { target: unknown; failureSummary?: string }[] }[] }> } }).axe;
        return (await axe.run(".scr-parallels-theme", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, problem: n.failureSummary })) }));
      });
      expect(violations, `${path} / ${theme}`).toEqual([]);
    }
  }
});

test("source comparison controls remain usable on a narrow enlarged page", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/scriptures/parallels/jude-enoch-quotation");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await page.getByText("Sources and review history", { exact: true }).click();
  await expect(page.getByText("Review Scope:", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy citation", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  await page.getByRole("button", { name: "christian", exact: true }).click();
  await expect(page.getByRole("button", { name: "christian", exact: true })).toHaveAttribute("aria-pressed", "true");
});
