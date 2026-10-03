import { test, expect } from "@playwright/test";
import path from "node:path";
for (const route of ["/early/1clement", "/jesus/history/belief-and-growth", "/apostles/stories/come-and-eat", "/angels/stories/open-his-eyes", "/angels/stories/i-am-with-you", "/angels/stories/the-gate-opened", "/scriptures/protestant/JHN/3"]) {
  test(`reading themes retain accessible contrast and structure: ${route}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
    const settings = page.getByRole("dialog", { name: "Reading & accessibility" });
    for (const theme of ["system", "light", "warm", "dark"]) {
      await settings.getByLabel("Page theme", { exact: true }).selectOption(theme);
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (target: string, options: unknown) => Promise<{ violations: { id: string; nodes: { target: unknown; failureSummary: string }[] }[] }> } }).axe;
        return (await axe.run("body", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, problem: n.failureSummary })) }));
      });
      expect(violations, `${route} ${theme}`).toEqual([]);
    }
    await settings.getByLabel("Monochrome", { exact: true }).check();
    await settings.getByText("Accessibility options", { exact: true }).click();
    await settings.getByLabel("Higher contrast", { exact: true }).check();
    await settings.getByLabel("Reduce motion", { exact: true }).check();
    await settings.getByRole("button", { name: "Close accessibility settings" }).click();
    await page.emulateMedia({ forcedColors: "active" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
}
