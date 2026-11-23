import { expect, test } from "@playwright/test";

// Both game URLs load complete HTML documents with their own renderer. A
// request to the host's Next chunks can return 200 and still break hydration.
test("both Hermon modes launch from scoped assets without the former domain", async ({ page }) => {
  test.setTimeout(90_000);
  const models = new Set<string>();
  const misplaced: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  // GLTFLoader can finish takeoff with missing textures. Surface that error
  // and any embedded image the host's production policy refused to load.
  page.on("console", message => {
    if (/couldn.t load texture|refused to connect to .?blob:|connecting to .?blob:.*violates/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  await page.route(/https?:\/\/([^/]+\.)?(halaverga\.com|halaverga-flight\.vercel\.app)\//, route => {
    misplaced.push(route.request().url());
    return route.abort();
  });
  page.on("request", request => {
    const pathname = new URL(request.url()).pathname;
    if (/^\/(?:_next\/static\/|models\/|textures\/|api\/(?:vote|results)\b)/.test(pathname)) misplaced.push(pathname);
  });
  page.on("response", response => {
    const pathname = new URL(response.url()).pathname;
    if (response.ok() && pathname.endsWith(".glb")) models.add(pathname);
    if (pathname.startsWith("/play/hermon/") && response.status() >= 400) misplaced.push(pathname);
  });

  await page.goto("/play/hermon");
  await page.getByRole("button", { name: "Ascend Mount Hermon" }).click({ timeout: 40_000 });
  // Calm flight-first launch: no Watchers battle HUD or 8-mode lab button on desktop by default.
  await expect(page.getByTestId("battle-hud")).toHaveCount(0);
  await expect(page.getByTestId("controls-trigger")).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(page.getByTestId("flight-telemetry")).toHaveAttribute("data-flying", "true");
  // Hold W to accelerate with full momentum flight.
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(700);
  await page.keyboard.up("KeyW");
  const speed = Number(await page.getByTestId("flight-telemetry").getAttribute("data-speed"));
  expect(speed).toBeGreaterThan(5);
  // Opt into the Watchers' battle cleanly mid-flight without losing flight state.
  await page.getByRole("button", { name: "Watchers", exact: true }).click();
  await expect(page.getByTestId("battle-hud")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("flight-telemetry")).toHaveAttribute("data-flying", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Take your time." })).toBeVisible();

  await page.goto("/play/hermon/crossing");
  await page.getByRole("button", { name: "Take wing" }).click({ timeout: 40_000 });
  await expect(page.getByRole("main")).toHaveAttribute("data-phase", "flight");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume flight" })).toBeVisible();
  expect(models).toContain("/play/hermon/models/archangel.glb");
  expect(models).toContain("/play/hermon/models/watcher.glb");
  expect(misplaced).toEqual([]);
  expect(errors).toEqual([]);
});

test.describe("the text alternative on a phone", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test("the crossing links to a choice, its consequence and its source", async ({ page }) => {
    await page.goto("/play/hermon/crossing");
    await page.getByRole("link", { name: "Story & source" }).click();
    await expect(page).toHaveURL(/\/play\/hermon\/crossing\/account$/);
    await page.getByText("Follow the wind up the shoulder", { exact: true }).press("Enter");
    await expect(page.locator("details[open] p")).toContainText("A second fire answers");
    await page.getByRole("link", { name: /Read 1 Enoch 6/ }).click();
    await expect(page).toHaveURL(/\/early\/enoch#chapter-6$/);
    await expect(page.locator("#chapter-6")).toBeVisible();
  });
});
