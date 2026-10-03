import { expect, test } from "@playwright/test";

test("loads the Hexapla preset named in the URL", async ({ page }) => {
  await page.goto("/scriptures/polyglot?preset=psalm-22");

  const apparatus = page.getByRole("region", {
    name: "Digital Polyglot Apparatus",
  });
  await expect(
    apparatus.getByRole("button", { name: /Psalm 22:14/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(apparatus.getByRole("combobox", { name: "Book:" })).toHaveValue(
    "PSA",
  );
  await expect(
    apparatus.getByRole("combobox", { name: "Chapter:" }),
  ).toHaveValue("22");
});
