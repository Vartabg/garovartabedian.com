import { expect, test } from "@playwright/test";

test("book navigation names the edition whose chapters it opens", async ({ page }) => {
  await page.goto("/scriptures/protestant");
  const ezra = page.locator('.scr-book-list a[href="/scriptures/protestant/EZR"]');
  await expect(ezra).toContainText("10 chapters · World English Bible");
  await ezra.click();
  await expect(page.locator(".scr-chapter-cell")).toHaveCount(10);

  await page.goto("/scriptures/catholic");
  await expect(page.locator('.scr-book-list a[href="/scriptures/catholic/EST"]')).toContainText("16 chapters");
});

test("matrix separates traditional enumeration, hosted records and edition chapter counts", async ({ page }) => {
  await page.goto("/scriptures/canons");
  await page.getByRole("button", { name: "Jewish Tanakh (39 hosted entries)", exact: true }).click();
  await page.getByRole("button", { name: "Ezra — hosted editions and details", exact: true }).focus();
  await page.keyboard.press("Enter");
  const dossier = page.getByRole("region", { name: "Book dossier" });
  await expect(dossier).toBeFocused();
  await expect(dossier).toContainText("World English Bible: 10 chapters");
  await expect(dossier).toContainText("Brenton");
  await expect(dossier).toContainText("23 chapters");
  await expect(dossier).toContainText("traditional 24-book scroll division");
  await dossier.getByRole("button", { name: "Close dossier", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ezra — hosted editions and details", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Compare Two Traditions", exact: true }).click();
  await page.locator("#comp-trad-a").selectOption("tanakh");
  await expect(page.locator("#comp-trad-a-counts")).toHaveText(/Traditional enumeration: 24 Books.*Hosted entries in this matrix: 39/);
});

test("canon selectors fit a narrow screen with enlarged text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/scriptures/canons");
  await page.getByRole("button", { name: "Compare Two Traditions", exact: true }).click();
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  for (const id of ["comp-trad-a", "comp-trad-b"]) {
    const selector = page.locator(`#${id}`);
    await selector.selectOption("ethiopian");
    await expect(selector).toHaveValue("ethiopian");
    const bounds = await selector.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  }
});
