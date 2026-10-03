import { expect, test } from "@playwright/test";

test("the Scriptures landing page keeps reading and discovery within reach", async ({
  page,
}) => {
  await page.goto("/scriptures");

  await expect(
    page.getByRole("heading", { name: "Start with the text." }),
  ).toBeVisible();
  const intentIndex = page.getByRole("navigation", {
    name: "Choose how to enter Scripture",
  });
  await expect(intentIndex).toBeVisible();
  await expect(intentIndex.getByRole("link")).toHaveCount(4);
  await expect(
    intentIndex.getByRole("link", { name: /Understand/ }),
  ).toHaveAttribute("href", "/scriptures/protestant/JHN/1#study");
  await expect(
    page.getByRole("link", { name: "Begin with John 1" }),
  ).toBeVisible();
  const scriptureSearch = page.getByRole("search", {
    name: "Search Scriptures",
  });
  await expect(scriptureSearch).toBeVisible();
  await expect(scriptureSearch).toHaveAttribute("data-enhanced", "true");
  await scriptureSearch.getByRole("searchbox").fill("John 3:16");
  await scriptureSearch.getByRole("searchbox").press("Enter");
  await expect(page).toHaveURL(/\/scriptures\/search\?q=John%203%3A16$/);

  await page.goBack();

  const shelf = page.locator("details.scr-book-browser");
  await expect(shelf).not.toHaveAttribute("open", "");

  const bookSearch = page.getByRole("searchbox", { name: "Search books" });
  await bookSearch.fill("John");
  await expect(page.getByText("4 matches")).toBeVisible();
  await expect(shelf).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "John 21 chapters" }),
  ).toBeVisible();

  await page.reload();
  await page.locator("details.scr-book-browser > summary").click();
  await expect(page.locator("details.scr-book-browser")).toHaveAttribute(
    "open",
    "",
  );
  await expect(
    page.getByRole("link", { name: "Genesis 50 chapters" }),
  ).toBeVisible();
});

test("scripture search recognizes a human-entered passage reference", async ({
  page,
}) => {
  await page.goto("/scriptures/search");

  await expect(
    page.getByRole("search", { name: "Search Scriptures" }),
  ).toHaveAttribute("data-enhanced", "true");
  const input = page.getByRole("searchbox", { name: "Search Scripture" });
  await input.fill("John 3:16");
  await input.press("Enter");

  await expect(page).toHaveURL(/\/scriptures\/search\?q=John%203%3A16$/);
  await expect(page.getByText("Passage recognized · John 3:16")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open John 3:16 in context" }),
  ).toHaveAttribute("href", "/scriptures/protestant/JHN/3?t=web&find=John+3%3A16&findTrans=web#v16");
  await expect(page.getByText(/For God so loved the world/)).toBeVisible();
});

test("the native no-JavaScript form submission preserves the search query", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL as string,
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    await page.goto("/scriptures/search");
    const input = page.getByRole("searchbox", { name: "Search Scripture" });
    await input.fill("John 3:16");
    await input.press("Enter");
    await expect(page).toHaveURL((url) => {
      return (
        url.pathname === "/scriptures/search" &&
        url.searchParams.get("q") === "John 3:16"
      );
    });
  } finally {
    await context.close();
  }
});

test("scripture search preserves text entered before hydration", async ({
  page,
}) => {
  let releaseScripts!: () => void;
  const scriptsReleased = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });

  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, async (route) => {
    await scriptsReleased;
    await route.continue();
  });

  const navigation = page.goto("/scriptures/search", { waitUntil: "load" });
  const input = page.getByRole("searchbox", { name: "Search Scripture" });

  try {
    await input.waitFor({ state: "visible" });
    await input.fill("John 3:16");
  } finally {
    releaseScripts();
  }

  await navigation;
  await expect(
    page.getByRole("search", { name: "Search Scriptures" }),
  ).toHaveAttribute("data-enhanced", "true");
  await expect(input).toHaveValue("John 3:16");
  await expect(page.getByRole("button", { name: "Clear search" })).toBeVisible();
});

test("search totals stay honest and browser history keeps the input synchronized", async ({
  page,
}) => {
  await page.goto("/scriptures/search?q=love%20neighbor");

  const input = page.getByRole("searchbox", { name: "Search Scripture" });
  await expect(page.getByText(/485 total matches/)).toBeVisible();
  await expect(input).toHaveValue("love neighbor");

  await input.fill("the");
  await input.press("Enter");
  await expect(
    page.getByText(/only common words omitted from the concordance: the/),
  ).toBeVisible();

  await page.goBack();
  await expect(page.getByText(/485 total matches/)).toBeVisible();
  await expect(input).toHaveValue("love neighbor");

  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page).toHaveURL(/\/scriptures\/search$/);
  await expect(input).toHaveValue("");
  await expect(page.getByText(/Search 81 books in World English Bible/)).toBeVisible();
});

test("one search separates exact words from curated related passages", async ({
  page,
}) => {
  await page.goto(
    "/scriptures/search?q=what%20does%20Scripture%20say%20about%20worry",
  );

  await expect(
    page.getByRole("heading", { name: "Words and phrases" }),
  ).toBeVisible();

  const related = page.getByRole("region", { name: "Related passages · KJV" });
  await expect(
    related.getByRole("heading", { name: "Related passages · KJV" }),
  ).toBeVisible();
  await expect(related.getByRole("link", { name: "Care" })).toHaveAttribute(
    "href",
    "/scriptures/topics/CARE",
  );
  await expect(
    related.getByRole("link", { name: "Matthew 6:25–34" }),
  ).toHaveAttribute("href", "/scriptures/protestant/MAT/6?t=kjv&find=what+does+Scripture+say+about+worry&findTrans=web#v25");
  await expect(
    related.getByText(/index connections, not a generated answer/),
  ).toBeVisible();
});
