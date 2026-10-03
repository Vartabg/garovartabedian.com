import { expect, test, type Page } from "@playwright/test";

function findButton(page: Page) {
  return page
    .getByRole("navigation", { name: "Primary site navigation" })
    .getByRole("button", { name: "Find" });
}

const customPassages = [
  {
    target: "Isaiah 53:5",
    text: "by his wounds we are healed",
  },
  {
    target: "Daniel 7:13",
    text: "there came with the clouds of the sky one like a son of man",
  },
  {
    target: "1 Corinthians 15:10",
    text: "by the grace of God I am what I am",
  },
] as const;

test("the remaining custom Jesus passage targets resolve to hosted evidence", async ({
  page,
}) => {
  for (const passage of customPassages) {
    const response = await page.goto(
      `/jesus/dossier?target=${encodeURIComponent(passage.target)}`,
    );
    expect(response?.status(), passage.target).toBe(200);
    await expect(page).toHaveURL((url) =>
      url.pathname === "/jesus/dossier" &&
      url.searchParams.get("target") === passage.target,
    );
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: `${passage.target} (Historical Jesus & Classical Scholarship Dossier)`,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Full Dossier" })).toBeEnabled();

    await page
      .getByRole("button", { name: "Raw Markdown (NotebookLM Ingestion)" })
      .click();
    const markdown = page.getByRole("textbox", {
      name: "Raw Markdown dossier content",
    });
    await expect(markdown).toHaveValue(new RegExp(`### ${passage.target}`));
    expect(await markdown.inputValue()).toContain(passage.text);
  }
});

test("a curated Isaiah deep link is selected in SSR and includes all twelve verses", async ({
  page,
  request,
}) => {
  const path = "/jesus/dossier?preset=messianic-servant-isaiah53";
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toMatch(
    /class="jsu-dossier-preset-card is-selected" aria-pressed="true"[\s\S]*?The Suffering Servant &amp; The Pierced One[\s\S]*?<\/button>/,
  );
  expect(html).toContain(
    '<h2 class="jsu-dossier-active-title">The Suffering Servant &amp; The Pierced One',
  );

  await page.goto(path);
  const preset = page
    .getByRole("region", { name: "Scholarly preset dossiers" })
    .getByRole("button", { name: /The Suffering Servant & The Pierced One/ });
  await expect(preset).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Raw Markdown (NotebookLM Ingestion)" })
    .click();
  const markdown = await page
    .getByRole("textbox", { name: "Raw Markdown dossier content" })
    .inputValue();
  const verseHeadings = markdown.match(/^### Isaiah 53:\d+$/gm) ?? [];
  expect(verseHeadings).toEqual(
    Array.from({ length: 12 }, (_, index) => `### Isaiah 53:${index + 1}`),
  );
  expect(markdown).not.toMatch(/^### Isaiah 53:13$/m);
});

test("Find preserves an unknown demon target when it opens the Angels dossier", async ({
  page,
}) => {
  await page.goto("/angels/demons");
  await page.waitForLoadState("networkidle");
  await findButton(page).click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("searchbox", { name: "Find" });
  await input.fill("> dossier demons Asmodaeus");

  const option = dialog.getByRole("option", {
    name: /Angels & Demons research collation for “demons Asmodaeus”/,
  });
  await expect(option).toHaveAttribute(
    "href",
    "/angels/dossier?target=Asmodaeus",
  );
  await input.press("Enter");

  await expect(page).toHaveURL((url) =>
    url.pathname === "/angels/dossier" &&
    url.searchParams.get("target") === "Asmodaeus",
  );
  await expect(
    page.getByRole("searchbox", {
      name: "Target scripture passage or theological topic",
    }),
  ).toHaveValue("Asmodaeus");
});

test("the custom Jesus dossier rejects a range above its 200-verse limit", async ({
  page,
}) => {
  await page.goto("/jesus/dossier");
  await page.waitForLoadState("networkidle");
  const prophecyCategory = page.getByRole("button", {
    name: "Messianic Prophecy",
    exact: true,
  });
  await prophecyCategory.click();
  await expect(prophecyCategory).toHaveAttribute("aria-pressed", "true");
  const input = page.getByRole("textbox", {
    name: "Enter scripture reference or historical inquiry",
  });
  await input.fill("Psalm 119:1-201");
  await page.getByRole("button", { name: "Generate Dossier" }).click();

  await expect(page.locator(".jsu-dossier-source-error[role=alert]")).toHaveText(
    "A dossier request can include at most 200 verses per reference.",
  );
  await expect(page).toHaveURL(/\/jesus\/dossier$/);
});
