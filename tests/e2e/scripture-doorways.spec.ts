import { expect, test } from "@playwright/test";

const tab = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("tablist", { name: "Ways to browse" }).getByRole("tab", { name });

test("every way to browse reaches the same chapter, and the pick survives switching", async ({ page }) => {
  await page.goto("/scriptures");

  await tab(page, "Contents").click();
  await expect(page).toHaveURL(/#contents$/);
  await page.getByRole("button", { name: "Jump to Gospels" }).click();
  await page.getByRole("button", { name: "John 21 chapters" }).click();
  await expect(page.getByRole("link", { name: "John 3", exact: true })).toHaveAttribute(
    "href",
    "/scriptures/protestant/JHN/3?t=web",
  );

  // The chosen book carries into the map, already zoomed to its chapters.
  await tab(page, "Map").click();
  await expect(page.getByRole("link", { name: "John 3, 36 verses" })).toBeVisible();

  // And into the strip, which starts at that book.
  await tab(page, "Strip").click();
  const strip = page.getByRole("slider", { name: "Every chapter in this Bible" });
  await expect(strip).toHaveAttribute("aria-valuetext", "John 1");
  await strip.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(strip).toHaveAttribute("aria-valuetext", "John 3");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/protestant\/JHN\/3\?t=web$/);

  // The way to browse is remembered on this device.
  await page.goto("/scriptures");
  await expect(tab(page, "Strip")).toHaveAttribute("aria-selected", "true");
});

test("the tradition and translation the reader picks shape the shelf and the links", async ({ page }) => {
  await page.goto("/scriptures");
  await page.getByRole("group", { name: "Tradition" }).getByRole("button", { name: /Catholic/ }).click();
  await page.getByLabel("Translation").selectOption("drb");

  await page.getByRole("link", { name: /^Tobit, / }).click();
  await expect(page.getByRole("link", { name: /^Tobit 1, / })).toHaveAttribute(
    "href",
    "/scriptures/catholic/TOB/1?t=drb",
  );
  // Douay-Rheims Daniel has fourteen chapters.
  await page.getByRole("link", { name: /^Daniel, / }).click();
  await expect(page.getByRole("link", { name: /^Daniel 14, / })).toBeVisible();
});

test("the reader's Go to sheet is the same picker, opened at the chapter being read", async ({ page }) => {
  await page.goto("/scriptures/protestant/JHN/3");
  await page.getByRole("button", { name: "John 3 — go to another chapter or book" }).click();
  const sheet = page.getByRole("dialog", { name: "Go to", exact: true });
  const sheetTab = (name: string) => sheet.getByRole("tablist", { name: "Ways to browse" }).getByRole("tab", { name });

  // The shelf, with John out and the chapter being read marked.
  await expect(sheetTab("Shelf")).toHaveAttribute("aria-selected", "true");
  await expect(sheet.getByRole("link", { name: "John 3, 36 verses" })).toHaveAttribute("aria-current", "page");

  // Another way to browse, the same place.
  await sheetTab("Strip").click();
  await expect(sheet.getByRole("slider", { name: "Every chapter in this Bible" })).toHaveAttribute(
    "aria-valuetext",
    "John 3",
  );
  // The reader's address bar keeps its verse anchors; views are not written into it.
  await expect(page).toHaveURL(/\/scriptures\/protestant\/JHN\/3(\?t=web)?$/);

  // Choosing a chapter closes the sheet as the chapter opens.
  await sheetTab("Contents").click();
  await sheet.getByRole("button", { name: /^Romans\b/ }).click();
  await sheet.getByRole("link", { name: "Romans 8", exact: true }).click();
  await expect(page).toHaveURL(/\/scriptures\/protestant\/ROM\/8\?t=web$/);
  await expect(sheet).toHaveCount(0);

  // The view chosen in the reader is the one the Scripture page opens in.
  await page.goto("/scriptures");
  await expect(tab(page, "Contents")).toHaveAttribute("aria-selected", "true");
});
