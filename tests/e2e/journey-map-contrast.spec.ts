import { expect, test } from "@playwright/test";
import type { AxeResults } from "axe-core";
import path from "node:path";

for (const theme of ["Light", "Dark"]) {
  test(`the pale journey dossier remains readable in the explicit ${theme} theme`, async ({ page }) => {
    await page.goto("/jesus/life");
    // Set the real reading preference before starting WebGL. Software-rendered
    // CI browsers can stall pointer hit testing while the terrain is loading.
    await page.getByRole("button", { name: "Open reading and accessibility settings" }).click();
    await page.getByRole("dialog", { name: "Reading & accessibility" }).getByLabel("Page theme", { exact: true }).selectOption(theme.toLowerCase());
    await page.getByRole("button", { name: "Close accessibility settings" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", theme.toLowerCase());

    await page.getByRole("button", { name: "Terrain", exact: true }).click();
    const dossier = page.locator(".jsu-terrain-dossier");
    await expect(dossier).toBeVisible();
    await dossier.scrollIntoViewIfNeeded();
    await page.addScriptTag({ path: path.join(process.cwd(), "node_modules/axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const { axe } = window as unknown as { axe: { run: (context: string, options: unknown) => Promise<AxeResults> } };
      const result = await axe.run(".jsu-terrain-dossier", { runOnly: { type: "rule", values: ["color-contrast"] } });
      return result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
    });
    expect(violations, `${theme} journey dossier contrast`).toEqual([]);
  });
}
