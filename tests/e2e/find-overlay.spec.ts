import { expect, test, type Page } from "@playwright/test";

function findButton(page: Page) {
  return page
    .getByRole("navigation", { name: "Primary site navigation" })
    .getByRole("button", { name: "Find" });
}

async function openFind(page: Page) {
  const find = findButton(page);
  await expect(find).toBeVisible();
  await find.click();
  await expect(page.getByRole("dialog", { name: "Find" })).toBeVisible();
  return page.getByRole("dialog", { name: "Find" });
}

test("Find jumps from the front door to an early text by name", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await openFind(page);
  await dialog.getByRole("searchbox", { name: "Find" }).fill("Didache");
  const didache = dialog
    .getByRole("option")
    .filter({ hasText: "The Didache" })
    .first();
  await expect(didache).toBeVisible();
  await didache.click();
  await expect(page).toHaveURL(/\/early\/didache\?find=Didache&findTrans=web&findScope=all$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("Find opens a chapter from a typed reference", async ({
  page,
}, testInfo) => {
  await page.goto("/church/councils");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("John 3");
  await expect(
    dialog.getByRole("heading", { name: "Open a passage" }),
  ).toBeVisible({
    timeout: 10_000,
  });
  const passage = dialog.getByRole("option", { name: /^John 3 / });
  await expect(passage).toBeVisible();
  await input.press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/protestant\/JHN\/3\?t=web&find=John\+3&findTrans=web&findScope=all$/);

  if (testInfo.project.name !== "phone") {
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: "Find" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Find" })).toHaveCount(0);
  }
});

test("Find exact words open a verse in the reader", async ({ page }) => {
  await page.goto("/");
  const dialog = await openFind(page);
  await dialog
    .getByRole("searchbox", { name: "Find" })
    .fill("light of the world");
  await expect(
    dialog.getByRole("heading", { name: "Words and phrases (WEB)" }),
  ).toBeVisible({ timeout: 15_000 });
  const verse = dialog
    .locator("section.find-group")
    .filter({ hasText: "Words and phrases (WEB)" })
    .getByRole("option")
    .first();
  await expect(verse).toHaveAttribute("href", /\/scriptures\/.+#v\d+$/);
  await verse.click();
  await expect(page).toHaveURL(/\/scriptures\/.+#v\d+$/);
});

test("Find empty state continues from a chapter", async ({ page }) => {
  await page.goto("/scriptures/protestant/MRK/14");
  const dialog = await openFind(page);
  await expect(
    dialog.getByRole("heading", { name: "You are here" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("option").filter({ hasText: "Mark 14" }).first(),
  ).toBeVisible();
  await expect(
    dialog.getByRole("option").filter({ hasText: "Mark 15" }).first(),
  ).toBeVisible();
});

test("Find restores focus to the header button on Escape", async ({ page }) => {
  await page.goto("/hire");
  const find = findButton(page);
  await find.click();
  await expect(page.getByRole("dialog", { name: "Find" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Find" })).toHaveCount(0);
  await expect(find).toBeFocused();
});

test("the shared menu still opens from a deep page", async ({ page }) => {
  await page.goto("/church/councils");
  const navigation = page.getByRole("navigation", {
    name: "Primary site navigation",
  });
  await navigation.locator(".site-nav-menu > summary").click();
  await expect(navigation.locator(".site-nav-group--section")).toBeVisible();
});

test("Find trigger meets a 44px target and does not overflow the phone", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "phone chrome only");
  await page.goto("/jesus/words");
  const find = findButton(page);
  const box = await find.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await find.click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".find-shortcut")).toBeHidden();
  const input = dialog.getByRole("searchbox", { name: "Find" });
  const inputBox = await input.boundingBox();
  const viewport = page.viewportSize();
  expect(inputBox).toBeTruthy();
  expect(viewport).toBeTruthy();
  expect((inputBox?.y ?? 0) + (inputBox?.height ?? 0)).toBeLessThanOrEqual(
    (viewport?.height ?? 0) + 1,
  );

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);

  await page.goto("/");
  const homeNav = page.getByRole("navigation", { name: "Primary site navigation" });
  await homeNav.locator(".site-nav-menu > summary").click();
  const firstMenuLink = homeNav.locator(".site-nav-group a").first();
  const linkBox = await firstMenuLink.boundingBox();
  const labelBox = await firstMenuLink.locator("strong").boundingBox();
  expect(linkBox).toBeTruthy();
  expect(labelBox).toBeTruthy();
  expect((labelBox?.x ?? 0) - (linkBox?.x ?? 0)).toBeLessThan(24);
});

test("Find executes quick action to switch theme", async ({ page }) => {
  await page.goto("/");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("> dark");
  const darkOpt = dialog.getByRole("option", { name: /Theme: Dark/ });
  await expect(darkOpt).toBeVisible();
  await darkOpt.click();
  await expect(page.locator("html")).toHaveAttribute("data-a11y-theme", "dark");
});

test("Find jumps to an ecumenical council in the church world", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("Nicaea");
  const council = dialog
    .getByRole("option")
    .filter({ hasText: "First Council of Nicaea" })
    .first();
  await expect(council).toBeVisible();
  await council.click();
  await expect(page).toHaveURL(/\/church\/councils#nicaea-1$/);
});

test("Find multi-translation search shows translation header", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("kjv: charity");
  await expect(
    dialog.getByRole("heading", { name: "Words and phrases (KJV)" }),
  ).toBeVisible({ timeout: 15_000 });
});

test("Find's popup separates text searches from site destinations", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await openFind(page);
  await expect(
    dialog.getByRole("button", { name: "Everything", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    dialog.getByRole("heading", { name: "Classical Knowledge Console" }),
  ).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "loneliness", exact: false })
    .click();
  await expect(dialog.getByRole("searchbox", { name: "Find" })).toHaveValue(
    "loneliness",
  );
  await expect(
    dialog.getByRole("button", { name: /^Search passages/ }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await dialog.getByRole("button", { name: "Site pages", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: /^Search passages/ }),
  ).toHaveCount(0);
  await dialog.getByRole("searchbox", { name: "Find" }).fill("Didache");
  await expect(
    dialog.getByRole("option").filter({ hasText: "The Didache" }).first(),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Clear search", exact: true })
    .click();
  await expect(dialog.getByRole("searchbox", { name: "Find" })).toHaveValue("");
  await dialog.getByRole("button", { name: "Commands", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Classical Knowledge Console" }),
  ).toBeVisible();
});

test("Find previews the actual edition and context before opening a passage", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "phone",
    "Desktop source preview; phone uses inline snippets.",
  );
  await page.goto("/");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("kjv: John 11:35");
  await expect(
    dialog.getByRole("option", { name: /^John 11:35/ }),
  ).toBeVisible();
  await input.press("ArrowDown");
  const preview = dialog.getByRole("complementary", { name: "Result preview" });
  await expect(preview).toContainText("King James Version");
  await expect(preview.locator("blockquote")).toHaveText("Jesus wept.");
  await preview.locator("summary").click();
  await expect(preview).toContainText("Where have ye laid him?");
  await expect(page).toHaveURL(/\/$/);
  await preview.getByRole("button", { name: /Read this passage/ }).click();
  await expect(page).toHaveURL(/\/JHN\/11\?t=kjv&find=John\+11%3A35&findTrans=kjv&findScope=all#v35$/);
});

test("Find can launch text search from its explicit popup action using the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await openFind(page);
  await dialog.getByRole("searchbox", { name: "Find" }).fill("depression");
  const action = dialog.getByRole("button", { name: /^Search passages/ });
  await action.focus();
  await action.press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/(find|search)\?q=depression/);
});

test("Find keeps navigation available when a source preview fails", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "phone", "Desktop source preview.");
  await page.route("**/scriptures/text/kjv/JHN.json", (route) =>
    route.fulfill({ status: 503, body: "Fixture source unavailable" }),
  );
  await page.goto("/");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("kjv: John 11:35");
  await expect(
    dialog.getByRole("option", { name: /^John 11:35/ }),
  ).toBeVisible();
  await input.press("ArrowDown");
  const preview = dialog.getByRole("complementary", { name: "Result preview" });
  await expect(preview).toContainText("This preview couldn’t load");
  await expect(
    preview.getByRole("button", { name: /Read this passage/ }),
  ).toBeEnabled();
});

for (const query of ["root of all evil", "compare love and fear"]) {
  test(`Find searches the complete ordinary phrase: ${query}`, async ({ page }) => {
    await page.goto("/");
    const dialog = await openFind(page);
    const input = dialog.getByRole("searchbox", { name: "Find" });
    await input.fill(query);
    await expect(dialog.getByRole("button", { name: /^Search passages/ })).toBeVisible();
    await input.press("Enter");
    await expect(page).toHaveURL(/\/scriptures\/(?:search|find)\?/);
    expect(new URL(page.url()).searchParams.get("q")).toBe(query);
  });
}

test("Find scholarly commands require an explicit prefix", async ({ page }) => {
  await page.goto("/");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("> compare catholic and protestant");
  await expect(dialog.getByRole("option", { name: /Compare canons/ })).toBeVisible();
  await input.press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/canons#canons-matrix$/);
});

test("Find routes unambiguous non-verse catalog entities on Enter and dismisses on backdrop click", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const find = findButton(page);
  await find.click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await expect(dialog).toBeVisible();

  if (testInfo.project.name !== "phone") {
    // Clicking the modal backdrop outside the dialog rect dismisses Find and restores focus.
    await page.mouse.click(8, 8);
    await expect(dialog).toHaveCount(0);
    await expect(find).toBeFocused();
    await find.click();
  }

  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("Didache");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/early\/didache\?find=Didache&findTrans=web&findScope=all$/);
});

test("Find offers clickable source-wording chips and related snippets when exact words miss", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = await openFind(page);
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("loneliness");
  await expect(dialog.getByText(/No word matches in/)).toBeVisible({
    timeout: 15_000,
  });
  const forsakenChip = dialog.locator(".find-chip", { hasText: "forsaken" });
  await expect(forsakenChip).toBeVisible();
  await forsakenChip.click();
  await expect(input).toHaveValue("forsaken");
  await expect(
    dialog.getByRole("heading", { name: "Words and phrases (WEB)" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(dialog.locator("mark.find-hl").first()).toBeVisible();
});

test("Find keeps first result near the top on phone and passes WCAG AA axe checks in light and dark mode", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const dialog = await openFind(page);
  const firstResult = dialog.locator(".find-results").getByRole("option").first();
  await expect(firstResult).toBeVisible();

  if (testInfo.project.name === "phone") {
    const box = await firstResult.boundingBox();
    expect(box).toBeTruthy();
    expect(box?.y ?? 999).toBeLessThan(280);
  }

  await dialog.getByRole("searchbox", { name: "Find" }).fill("light of the world");
  await expect(
    dialog.getByRole("heading", { name: "Words and phrases (WEB)" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(dialog.locator("mark.find-hl").first()).toBeVisible();

  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  for (const theme of ["light", "dark"] as const) {
    const violations = await page.evaluate(async (mode) => {
      document.documentElement.dataset.a11yTheme = mode;
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      const w = window as unknown as {
        axe: {
          run: (
            context: string,
            options: object,
          ) => Promise<{ violations: Array<{ id: string; description: string }> }>;
        };
      };
      const res = await w.axe.run(".find-dialog", {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      return res.violations.map((v) => `${v.id}: ${v.description}`);
    }, theme);
    expect(violations, `axe violations in ${theme} mode`).toEqual([]);
  }
});
