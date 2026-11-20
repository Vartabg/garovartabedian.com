import { expect, test, type Locator, type Page } from "@playwright/test";
import path from "node:path";

// The release gate's axe tags (scripts/a11y/config.mjs).
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const compareHref = (book: string, chapter: number, verse: number) =>
  `/scriptures/polyglot?tradition=protestant&book=${book}&chapter=${chapter}&verse=${verse}&translation=web`;
const wordsHref = (book: string, chapter: number, verse: number) =>
  `/scriptures/protestant/${book}/${chapter}?t=web&study=word-bridge#v${verse}`;

/** The two study lines inside a story's passage box. */
const studyLines = (scope: Page | Locator) => scope.getByRole("navigation", { name: "Study this verse" }).getByRole("link");

async function expectLines(lines: Locator, book: string, chapter: number, verse: number) {
  await expect(lines).toHaveCount(2);
  await expect(lines.nth(0)).toHaveAttribute("href", compareHref(book, chapter, verse));
  await expect(lines.nth(1)).toHaveAttribute("href", wordsHref(book, chapter, verse));
  for (const link of await lines.all()) {
    await expect(link).toBeVisible();
    expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
}

async function noSidewaysScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function axeViolations(page: Page) {
  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules/axe-core/axe.min.js") });
  return page.evaluate(async (tags) => {
    const { axe } = window as unknown as {
      axe: { run: (context: Document, options: unknown) => Promise<{ violations: { id: string; nodes: { target: unknown; failureSummary?: string }[] }[] }> };
    };
    const result = await axe.run(document, { runOnly: { type: "tag", values: tags } });
    return result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  }, AXE_TAGS);
}

const PASSAGE_STORIES = [
  { route: "/apostles/stories/come-and-eat", book: "JHN", chapter: 21, verse: 12 },
  { route: "/angels/stories/i-am-with-you", book: "GEN", chapter: 28, verse: 15 },
  { route: "/angels/stories/open-his-eyes", book: "2KI", chapter: 6, verse: 17 },
];

for (const width of [320, 390, 1280]) {
  test(`a story's passage box holds two study lines on its title verse (${width}px)`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    for (const { route, book, chapter, verse } of PASSAGE_STORIES) {
      await page.goto(route);
      const box = page.locator("details", { has: page.locator("summary", { hasText: "Read the passage" }) });
      await expect(box).toHaveCount(1);
      // Hidden until the visitor opens the passage.
      await expect(studyLines(box).first()).toBeHidden();
      await box.locator("summary").click();
      await expectLines(studyLines(box), book, chapter, verse);
      await noSidewaysScroll(page);
    }
  });

  test(`a saying's lines sit under its verse and follow the chosen saying (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/jesus/words?study=mustard-seed");
    const saying = page.locator(".jsu-word-door-saying");
    await expect(saying.locator(".jsu-word-door-verse")).toContainText("mustard seed");
    await expectLines(studyLines(saying), "MAT", 13, 31);
    await noSidewaysScroll(page);
    await page.getByRole("navigation", { name: "Begin with a saying" }).getByRole("button", { name: "Love your enemies" }).click();
    await expectLines(studyLines(page.locator(".jsu-word-door-saying")), "MAT", 5, 44);
  });

  test(`the good Samaritan walk shows its lines on the last step only (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/jesus/parables?story=good-samaritan");
    const walk = page.locator(".parable-walk");
    const lines = studyLines(walk);
    // In the page, but hidden on step 1 (role queries skip hidden elements, so count by class).
    await expect(walk.locator("nav.passage-study a")).toHaveCount(2);
    await expect(walk.locator("nav.passage-study a").first()).toBeHidden();
    await expect(lines).toHaveCount(0);
    for (let step = 0; step < 3; step += 1) {
      await walk.locator(".parable-stop:visible .parable-stop-nav label", { hasText: "Next" }).click();
    }
    await expect(walk.locator(".parable-stop:visible .parable-stop-where")).toHaveText("4 of 4");
    await expectLines(lines, "LUK", 10, 37);
    await noSidewaysScroll(page);
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`the study lines pass the accessibility gate with the passage open (${colorScheme})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const { route } of PASSAGE_STORIES) {
      await page.goto(route);
      await page.locator("summary", { hasText: "Read the passage" }).click();
      await expect(studyLines(page).first()).toBeVisible();
      expect(await axeViolations(page), `${route} ${colorScheme}`).toEqual([]);
    }

    await page.goto("/jesus/words?study=mustard-seed");
    await expect(studyLines(page.locator(".jsu-word-door-saying")).first()).toBeVisible();
    expect(await axeViolations(page), `/jesus/words ${colorScheme}`).toEqual([]);

    await page.goto("/jesus/parables?story=good-samaritan");
    const walk = page.locator(".parable-walk");
    for (let step = 0; step < 3; step += 1) {
      await walk.locator(".parable-stop:visible .parable-stop-nav label", { hasText: "Next" }).click();
    }
    await expect(studyLines(walk).first()).toBeVisible();
    expect(await axeViolations(page), `/jesus/parables ${colorScheme}`).toEqual([]);
  });
}

test("a passage box's lines open the comparison and the word links on the title verse", async ({ page }) => {
  await page.goto("/apostles/stories/come-and-eat");
  await page.locator("summary", { hasText: "Read the passage" }).click();
  await studyLines(page).filter({ hasText: /^Compare translations of John 21:12, with the Greek/ }).click();
  await expect(page).toHaveURL(/\/scriptures\/polyglot\?.*book=JHN&chapter=21&verse=12/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Compare translations");
  await expect(page.getByText("Come and eat breakfast", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("durst ask him", { exact: false }).first()).toBeVisible();

  await page.goto("/apostles/stories/come-and-eat");
  await page.locator("summary", { hasText: "Read the passage" }).click();
  await studyLines(page).filter({ hasText: /^See the Greek words behind John 21:12/ }).click();
  await expect(page).toHaveURL(/JHN\/21\?t=web&study=word-bridge#v12$/);
  await expect(page.locator("#vp12 .scr-bridge")).toBeVisible();
});
