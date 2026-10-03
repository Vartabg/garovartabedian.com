import { expect, test } from "@playwright/test";

test("book map isolates direction and hub search replaces the rendered page", async ({ page }) => {
  await page.goto("/scriptures/graph");
  const map = page.getByRole("region", { name: "See where the references lead" });
  await map.getByRole("button", { name: "Show connections for Matthew" }).click();
  await map.getByRole("combobox", { name: "Direction", exact: true }).selectOption("outgoing");
  const flows = map.getByRole("list", { name: "Shown book connections" });
  await expect(flows.getByRole("listitem")).toHaveCount(3);
  for (const item of await flows.getByRole("listitem").all()) await expect(item).toContainText(/^Matthew/);
  await map.getByRole("combobox", { name: "Direction", exact: true }).selectOption("incoming");
  await expect(flows.getByRole("listitem")).toHaveCount(2);
  await expect(page.locator(".scr-graph-threads > li")).toHaveCount(12);
  await page.getByRole("button", { name: "Browse all 913 paths" }).click();
  const first = await page.locator(".scr-graph-threads > li").first().textContent();
  await page.getByRole("button", { name: "Next paths" }).click();
  await expect(page.locator(".scr-graph-threads > li").first()).not.toHaveText(first!);
  await page.getByRole("searchbox", { name: "Find a book or verse in these paths" }).fill("no such reference");
  await expect(page.locator(".scr-graph-threads > li")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next paths" })).toBeDisabled();
});

test("scrubbing the journey pauses playback and retains the selected event", async ({ page }) => {
  await page.goto("/jesus/life");
  await page.getByRole("button", { name: "Play journey" }).click();
  const slider = page.getByRole("slider", { name: "Journey position" });
  await slider.focus();
  await slider.press("End");
  await expect(page.getByRole("button", { name: "Play journey" })).toBeVisible();
  await expect(slider).toHaveValue("39");
  await expect(page.getByRole("button", { name: "Next journey stop" })).toBeDisabled();
  await slider.press("Home");
  await expect(page.locator(".jsu-map-event-card")).toContainText("The annunciation");
});

test("a lost terrain context returns to the atlas without losing the selected stop", async ({ page }) => {
  await page.goto("/jesus/life");
  await page.getByRole("combobox", { name: "Current stop" }).selectOption("shepherds");
  await page.getByRole("button", { name: "Terrain", exact: true }).click();
  await expect(page.locator(".jsu-terrain-marker")).toHaveCount(18);
  await page.locator(".maplibregl-canvas").evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByRole("button", { name: "Atlas", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".jsu-map-event-card")).toContainText("Shepherds hear the news");
  await expect(page.locator(".jsu-terrain-map")).toHaveCount(0);
});
