import { test, expect } from "@playwright/test";

test("the accessibility case study is discoverable and its example works by keyboard", async ({ page }) => {
  await page.goto("/work");
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Accessibility is a product feature" }) });
  await card.getByRole("link", { name: "Read case study" }).click();
  await expect(page).toHaveURL(/\/work\/accessibility$/);
  const save = page.getByRole("button", { name: "Save sample passage" });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Sample passage saved. It stays here until you leave this page.");
  await page.keyboard.press("Space");
  await expect(page.getByRole("status")).toHaveText("Sample passage removed.");
  await expect(save).toHaveAttribute("aria-pressed", "false");
});
