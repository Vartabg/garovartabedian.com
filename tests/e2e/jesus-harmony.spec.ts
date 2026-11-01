import { expect, test } from "@playwright/test";

test("a link can open the word-by-word comparison on a chosen passage", async ({ page }) => {
  await page.goto("/jesus/harmony?passage=temptation");
  const passage = page.locator("#pericope-select");
  await expect(passage).toHaveValue("temptation");

  // Choosing another passage keeps the address shareable.
  await passage.selectOption("gethsemane");
  await expect(page).toHaveURL(/\/jesus\/harmony\?passage=gethsemane$/);
  await page.reload();
  await expect(passage).toHaveValue("gethsemane");

  // An unknown id falls back to the first passage instead of an empty page.
  await page.goto("/jesus/harmony?passage=not-a-passage");
  await expect(passage).toHaveValue("beatitudes");
});
