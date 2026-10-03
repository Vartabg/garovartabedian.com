import { test, expect } from "@playwright/test";

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`a saved chapter and translation reopen offline with ${reducedMotion} motion`, async ({ page, context }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => { errors.push(String(error)); });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/scriptures/protestant/JHN/3");
    await page.getByRole("button", { name: "Save chapter offline" }).click();
    await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toBeVisible();
    await page.bringToFront();
    await page.getByRole("link", { name: "Open saved chapters" }).click();
    await expect(page).toHaveURL(/\/scripture-reader\/index\.html$/);
    await expect(page.getByRole("heading", { name: "John 3", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    await page.close();
    await context.setOffline(true);
    const reopened = await context.newPage();
    reopened.on("pageerror", (error) => { errors.push(String(error)); });
    await reopened.emulateMedia({ reducedMotion });
    await reopened.goto("/scripture-reader/index.html");
    await expect(reopened.getByRole("heading", { name: "John 3", exact: true })).toBeVisible();
    await expect(reopened.getByText(/For God so loved the world/)).toBeVisible();
    await expect(reopened.getByText("World English Bible", { exact: true })).toBeVisible();
    await reopened.getByRole("button", { name: "Larger text" }).click();
    await reopened.reload();
    await expect(reopened.locator("#status")).toContainText("Saved on this device");
    expect(errors).toEqual([]);
    await context.setOffline(false);
  });
}

test("an unavailable offline shell cannot produce a saved confirmation", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.serviceWorker, "register", { value: () => Promise.reject(new Error("Registration denied")) });
  });
  await page.goto("/scriptures/protestant/JHN/3");
  await page.getByRole("button", { name: "Save chapter offline" }).click();
  await expect(page.getByText("Could not save this chapter. Check your connection and available browser storage, then try again.", { exact: true })).toBeVisible();
  await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toHaveCount(0);
});

test("translation identity, reading preferences and removal persist across offline reloads", async ({ page, context }) => {
  for (const translation of ["web", "kjv"]) {
    await page.goto(`/scriptures/protestant/JHN/3?t=${translation}`);
    await page.getByRole("button", { name: "Save chapter offline" }).click();
    await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toBeVisible();
  }
  await page.goto("/scripture-reader/index.html");
  const chapters = page.getByLabel("Saved chapter");
  await expect(chapters.locator("option")).toHaveCount(2);
  await chapters.selectOption({ label: "John 3 · King James Version" });
  await page.getByRole("button", { name: "Larger text" }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#edition")).toHaveText("King James Version");
  await expect(page.locator("#size")).toHaveText("110%");
  await expect(page.locator("#reading")).toContainText("whosoever believeth in him");
  await page.locator("#chapter-footer summary").click();
  await page.getByRole("button", { name: "Remove saved chapter" }).click();
  await expect(chapters.locator("option")).toHaveCount(1);
  await page.reload();
  await expect(chapters.locator("option")).toHaveCount(1);
  await expect(page.locator("#edition")).toHaveText("World English Bible");
});

for (const entry of ["shared link", "in-page switch"]) {
  test(`a pending KJV load from a ${entry} cannot save WEB verses under the KJV identity`, async ({ page, context }) => {
    let releaseKjv!: () => void;
    let heldResolve!: () => void;
    const gate = new Promise<void>((resolve) => { releaseKjv = resolve; });
    const held = new Promise<void>((resolve) => { heldResolve = resolve; });
    await page.route("**/scriptures/text/kjv/JHN.json", async (route) => {
      heldResolve();
      await gate;
      await route.continue();
    });
    try {
      if (entry === "shared link") {
        await page.goto("/scriptures/protestant/JHN/3?t=kjv");
      } else {
        await page.goto("/scriptures/protestant/JHN/3");
        await page.getByRole("button", { name: /Reading settings/ }).click();
        const settings = page.getByRole("dialog", { name: "Reading", exact: true });
        await settings.getByRole("combobox", { name: "Version", exact: true }).selectOption("kjv");
        await expect(settings).toBeHidden();
      }
      await held;
      await expect(page.locator(".scr-read-meta")).toContainText("King James Version");
      await expect(page.getByText(/Loading King James Version/)).toBeVisible();
      await expect(page.getByText(/This chapter isn/)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Save chapter offline" })).toBeDisabled();
    } finally {
      releaseKjv();
    }
    await expect(page.getByRole("button", { name: "Save chapter offline" })).toBeEnabled();
    await expect(page.locator("#chapter-text")).toContainText("whosoever believeth in him");
    await page.getByRole("button", { name: "Save chapter offline" }).click();
    await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Open saved chapters" }).click();
    await expect(page.getByRole("heading", { name: "John 3", exact: true })).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("#edition")).toHaveText("King James Version");
    await expect(page.locator("#reading")).toContainText("whosoever believeth in him");
    await context.setOffline(false);
  });
}

test("a failed KJV response shows a truthful error without a saved confirmation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => { errors.push(String(error)); });
  await page.route("**/scriptures/text/kjv/JHN.json", async (route) => {
    await route.fulfill({ status: 503, contentType: "text/plain", body: "unavailable" });
  });
  await page.goto("/scriptures/protestant/JHN/3?t=kjv");
  await expect(page.getByText(/Could not load King James Version/)).toBeVisible();
  await expect(page.getByText(/This chapter isn/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save chapter offline" })).toBeDisabled();
  await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a failed comparison leaves the primary translation readable and saveable", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => { errors.push(String(error)); });
  await page.route("**/scriptures/text/kjv/JHN.json", async (route) => {
    await route.fulfill({ status: 503, contentType: "text/plain", body: "unavailable" });
  });
  await page.goto("/scriptures/protestant/JHN/3?c=kjv");
  await expect(page.getByRole("alert").filter({ hasText: "Could not load King James Version comparison text" })).toBeVisible();
  await expect(page.locator("#chapter-text")).toContainText("whoever believes in him");
  await page.getByRole("button", { name: "Save chapter offline" }).click();
  await expect(page.getByText("John 3 saved for offline reading.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open saved chapters" }).click();
  await expect(page.getByRole("heading", { name: "John 3", exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#edition")).toHaveText("World English Bible");
  await expect(page.locator("#reading")).toContainText("whoever believes in him");
  expect(errors).toEqual([]);
});

test("a missing primary chapter stays unavailable when the comparison also fails", async ({ page }) => {
  await page.route("**/scriptures/text/web/JHN.json", async (route) => {
    await route.fulfill({ json: { chapters: [] } });
  });
  await page.route("**/scriptures/text/kjv/JHN.json", async (route) => {
    await route.fulfill({ status: 503, contentType: "text/plain", body: "unavailable" });
  });
  await page.goto("/scriptures/protestant/JHN/3?c=kjv");
  await expect(page.getByText(/This chapter isn/)).toBeVisible();
  await expect(page.getByText(/is still available to read and save/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save chapter offline" })).toBeDisabled();
});

test("a storage write failure cannot claim that the chapter was saved", async ({ page }) => {
  await page.addInitScript(() => {
    Cache.prototype.put = () => Promise.reject(new DOMException("Storage full", "QuotaExceededError"));
  });
  await page.goto("/scriptures/protestant/JHN/3");
  await page.getByRole("button", { name: "Save chapter offline" }).click();
  await expect(page.getByText(/Could not save this chapter/)).toBeVisible();
});
