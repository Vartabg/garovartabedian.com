import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`comparison to dossier to reader retains the selected KJV verse at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const modelRequests: string[] = [];
    page.on("request", (request) => { if (/\/(?:models|ort)\//.test(request.url())) modelRequests.push(request.url()); });
    await page.goto("/scriptures/polyglot?tradition=protestant&book=JHN&chapter=3&verse=16&translation=kjv");
    const passage = page.getByRole("complementary", { name: "Study passage" });
    await expect(passage).toContainText("John 3:16");
    await expect(passage).toContainText("only begotten Son");
    await expect(page.getByRole("combobox", { name: "Book:", exact: true })).toHaveValue("JHN");
    await expect(page.getByRole("combobox", { name: "Chapter:", exact: true })).toHaveValue("3");
    await passage.getByRole("link", { name: "Build a research dossier" }).click();
    await expect(page).toHaveURL(/\/scriptures\/dossier\?.*book=JHN.*chapter=3.*verse=16.*translation=kjv/);
    await expect(page.getByRole("textbox", { name: "Dossier Target Query" })).toHaveValue("John 3:16");
    await expect(passage).toContainText("only begotten Son");
    await page.getByRole("button", { name: "Generate Dossier", exact: true }).click();
    await expect(page.getByRole("button", { name: "Generate Dossier", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Raw Markdown (.md)", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Markdown Dossier Output" })).toHaveValue(/only begotten Son/);
    await passage.getByRole("link", { name: "Return to reading" }).click();
    await expect(page).toHaveURL(/\/scriptures\/protestant\/JHN\/3\?t=kjv#v16$/);
    await expect(page.getByRole("article", { name: "John chapter 3" })).toContainText("only begotten Son");
    expect(modelRequests).toEqual([]);
  });
}

test("invalid passage context is explained instead of opening a default comparison", async ({ page }) => {
  await page.goto("/scriptures/polyglot?book=JHN&chapter=3&verse=999&translation=kjv");
  await expect(page.getByRole("status").filter({ hasText: "This passage link is invalid" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Digital Polyglot Apparatus" })).toHaveCount(0);
});

test("a Charles passage remains a named source when its dossier is regenerated", async ({ page }) => {
  await page.goto("/scriptures/dossier?tradition=ethiopian&book=ENO&chapter=1&verse=1&translation=charles");
  const passage = page.getByRole("complementary", { name: "Study passage" });
  await expect(passage).toContainText("Charles");
  await page.getByRole("button", { name: "Generate Dossier", exact: true }).click();
  await expect(page.getByRole("button", { name: "Generate Dossier", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Copy Full Dossier (.md)", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Raw Markdown (.md)", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Markdown Dossier Output" })).toHaveValue(/Charles/);
  await expect(page.getByRole("status").filter({ hasText: "Could not load" })).toHaveCount(0);
  await expect(passage.getByRole("link", { name: "Return to reading" })).toHaveAttribute("href", "/scriptures/ethiopian/ENO/1?t=charles#v1");
});


test("an unverified Joel division shows only the selected edition and a clear availability note", async ({ page }) => {
  await page.goto("/scriptures/polyglot?tradition=orthodox&book=JOL&chapter=3&verse=1&translation=brenton");
  const passage = page.getByRole("complementary", { name: "Study passage" });
  await expect(passage).toContainText("pour out of my Spirit");
  await expect(passage).toContainText("Cross-edition correspondence has not been verified");
  await expect(page.getByRole("region", { name: "Digital Polyglot Apparatus" })).not.toContainText("restore the fortunes of Judah");
  await expect(passage.getByRole("link", { name: "Return to reading" })).toHaveAttribute("href", "/scriptures/orthodox/JOL/3?t=brenton#v1");
  await page.getByRole("combobox", { name: "Chapter:", exact: true }).selectOption("1");
  await expect(page.getByRole("status").filter({ hasText: "Cross-edition correspondence" })).toContainText("Joel 1:1");
  await expect(passage).toContainText("controls below show your current selection");
  await expect(passage).toContainText("pour out of my Spirit");
  await page.getByRole("button", { name: /^Psalm 22:14/ }).click();
  await expect(page.getByRole("combobox", { name: "Book:", exact: true })).toHaveValue("PSA");
  await expect(page.getByRole("status").filter({ hasText: "Cross-edition correspondence" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Chapter:", exact: true }).selectOption("23");
  await expect(page.getByRole("status").filter({ hasText: "Brenton and Douay-Rheims are omitted" })).toBeVisible();
});
