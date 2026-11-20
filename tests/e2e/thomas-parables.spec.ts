import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import parables from "../../public/jesus/parables.json";
import synopticFigures from "../../public/jesus/synoptic-figures.json";
import thomasStories from "../../public/jesus/thomas-parables.json";
import jamesStories from "../../public/jesus/james-parables.json";

test("keyboard opens a parable, then its early writings, and follows its Thomas saying", async ({ page }) => {
  await page.goto("/jesus/parables");
  // The early writings fold is closed until asked for.
  await expect(page.locator("#parable-thomas-empty-jar")).toBeHidden();
  const button = page.locator("#parable-wicked-tenants button");
  await expect(button).toContainText("Matthew · Mark · Luke + 4 early writings");
  await expect(button).toBeEnabled();
  await button.focus();
  await page.keyboard.press("Enter");
  const panel = page.locator("#parable-wicked-tenants-text");
  await expect(panel.locator(".jsu-parable-account")).toHaveCount(3);
  const also = panel.locator("details.jsu-parable-also > summary");
  await expect(also).toContainText("Gospel of Thomas");
  await expect(panel.locator(".jsu-parable-thomas").first()).toBeHidden();
  for (let i = 0; i < 80 && !(await also.evaluate((element) => element === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(also).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(panel.getByRole("heading", { name: "Gospel of Thomas · Saying 65 · outside the canon" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Gospel of Thomas · Saying 66 · outside the canon" })).toBeVisible();
  await expect(panel.locator(".jsu-parable-thomas")).toHaveCount(2);
  await expect(panel.locator(".jsu-parable-thomas").first()).toContainText("A [creditor] owned a vineyard");
  const link = panel.getByRole("link", { name: "Saying 65", exact: true });
  await expect(link).toHaveCSS("text-decoration-line", "underline");
  for (let i = 0; i < 80 && !(await link.evaluate((element) => element === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/early\/library\/gospel-thomas\/saying-65$/);
  await expect(page.getByRole("heading", { name: /Saying 65:/ })).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("readers can follow the Thomas links", async ({ page }) => {
    await page.goto("/jesus/parables");
    const fallback = page.locator("#thomas-no-script").locator("..");
    await expect(fallback.getByRole("heading", { name: "Gospel of Thomas · outside the canon" })).toBeVisible();
    await fallback.getByRole("link", { name: "Saying 64", exact: true }).click();
    await expect(page).toHaveURL(/\/early\/library\/gospel-thomas\/saying-64$/);
    await expect(page.getByRole("heading", { name: /Saying 64:/ })).toBeVisible();
  });
  test("each Thomas-only story has a working reader link", async ({ page }) => {
    for (const story of thomasStories) {
      await page.goto("/jesus/parables");
      const fallback = page.locator("#thomas-no-script").locator("..");
      const group = fallback.getByRole("heading", { name: story.title, exact: true }).locator("..");
      await group.getByRole("link", { name: `Saying ${story.saying}`, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/early/library/gospel-thomas/saying-${story.saying}$`));
      await expect(page.getByRole("heading", { name: new RegExp(`Saying ${story.saying}:`) })).toBeVisible();
    }
  });
  test("James passages remain readable without JavaScript", async ({ page }) => {
    test.setTimeout(120_000);
    for (const story of jamesStories) {
      await page.goto("/jesus/parables");
      const fallback = page.locator("#james-no-script").locator("..");
      await fallback.getByRole("link", { name: `${story.title} · ${story.locator}` }).click();
      await expect(page).toHaveURL(new RegExp(`/early/library/secret-book-james/${story.section}#p${story.paragraph}$`));
      await expect(page.locator(".ew-canon-status")).toContainText("Outside the canon");
      await expect(page.locator(`#p${story.paragraph}`)).toBeVisible();
    }
  });
  test("early excerpts retain source links without JavaScript", async ({ page }) => {
    await page.goto("/jesus/parables");
    const fallback = page.locator("#early-figures-no-script").locator("..");
    await expect(fallback.getByRole("link", { name: /The Hymn of the Pearl/ })).toHaveAttribute("href", "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf");
    await expect(fallback.getByRole("link", { name: /A report of three servants/ })).toHaveAttribute("href", "https://en.wikisource.org/wiki/Page:The_Apocryphal_New_Testament_(1924).djvu/41");
    await expect(fallback.getByRole("link", { name: /The two ways of life and death.*part 6/ })).toHaveAttribute("href", "/early/didache#s6");
  });
});

test("Thomas-only stories open from hashes and show every source paragraph in order", async ({ page }) => {
  for (const story of thomasStories) {
    await page.goto(`/jesus/parables#parable-${story.id}`);
    const entry = page.locator(`#parable-${story.id}`);
    const button = entry.locator(".jsu-pair-head");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const panel = entry.locator(".jsu-parable-thomas");
    await expect(panel.getByRole("heading", { name: `Gospel of Thomas · Saying ${story.saying} · outside the canon` })).toBeVisible();
    await expect(entry.locator(".jsu-parable-account")).toHaveCount(0);
    const section = JSON.parse(readFileSync(`content/early-library/readings/gospel-thomas/saying-${story.saying}.json`, "utf8"));
    const paragraphs = section.blocks.filter((block: { kind: string }) => block.kind === "primary-text").map((block: { text: string }) => block.text);
    await expect(panel.locator(":scope > p").nth(0)).toContainText("Mark M. Mattison");
    await expect(panel.locator(":scope > p").nth(1)).toContainText(`Saying ${story.saying}`);
    for (let i = 0; i < paragraphs.length; i++) await expect(panel.locator(":scope > p").nth(i + 2)).toHaveText(paragraphs[i]);
    if (story.saying === 21) await expect(panel).toContainText("thief saying and a harvest image");
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
  }
});

test("Find opens a Thomas-only story in the room", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await dialog.getByRole("searchbox", { name: "Find" }).fill("empty jar");
  const result = dialog.getByRole("option").filter({ hasText: "The empty jar" }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/jesus\/parables(?:\?[^#]*)?#parable-thomas-empty-jar$/);
  await expect(page.locator("#parable-thomas-empty-jar .jsu-pair-head")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#parable-thomas-empty-jar .jsu-parable-thomas")).toContainText("jar of flour");
});

test("Find opens another Thomas story while already in the room", async ({ page }) => {
  await page.goto("/jesus/parables#parable-thomas-children-in-field");
  await expect(page.locator("#parable-thomas-children-in-field .jsu-pair-head")).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await dialog.getByRole("searchbox", { name: "Find" }).fill("empty jar");
  await dialog.getByRole("option").filter({ hasText: "The empty jar" }).first().click();
  await expect(page).toHaveURL(/#parable-thomas-empty-jar$/);
  await expect(page.locator("#parable-thomas-empty-jar .jsu-pair-head")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#parable-thomas-children-in-field .jsu-pair-head")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#parable-thomas-empty-jar .jsu-parable-thomas")).toContainText("jar of flour");
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  const search = page.getByRole("dialog", { name: "Find" }).getByRole("searchbox", { name: "Find" });
  await search.fill("assassin");
  await expect(page.getByRole("dialog", { name: "Find" }).getByRole("option").filter({ hasText: "The assassin" }).first()).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/#parable-thomas-assassin$/);
  await expect(page.locator("#parable-thomas-assassin .jsu-pair-head")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#parable-thomas-empty-jar .jsu-pair-head")).toHaveAttribute("aria-expanded", "false");
});

test("the lamp comparison shows every Gospel passage and Thomas 33", async ({ page }) => {
  await page.goto("/jesus/parables#parable-synoptic-lamp");
  const entry = page.locator("#parable-synoptic-lamp");
  await expect(entry.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  await expect(entry.locator(".jsu-parable-account")).toHaveCount(4);
  await entry.locator("details.jsu-parable-also > summary").click();
  const thomas = entry.locator(".jsu-parable-thomas");
  await expect(thomas.getByRole("heading", { name: "Gospel of Thomas · Saying 33 · outside the canon" })).toBeVisible();
  const section = JSON.parse(readFileSync("content/early-library/readings/gospel-thomas/saying-33.json", "utf8"));
  for (const block of section.blocks) if (block.kind === "primary-text") await expect(thomas).toContainText(block.text);
  await expect(thomas.getByRole("link", { name: "Saying 33" })).toHaveAttribute("href", "/early/library/gospel-thomas/saying-33");
});

test("James passages open beside related Gospel text and link to their exact reader paragraphs", async ({ page }) => {
  test.setTimeout(120_000);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    for (const story of jamesStories) {
      await page.goto(`/jesus/parables#parable-${story.id}`);
      const entry = page.locator(`#parable-${story.id}`);
      await expect(entry.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
      const panel = entry.locator(".jsu-parable-james");
      await expect(panel.getByRole("heading", { name: `Secret Book of James · ${story.locator} · outside the canon` })).toBeVisible();
      const section = JSON.parse(readFileSync(`content/early-library/readings/secret-book-james/${story.section}.json`, "utf8"));
      const end = "endParagraph" in story ? story.endParagraph : story.paragraph;
      const blocks = section.blocks.slice(story.paragraph - 1, end);
      for (const block of blocks) await expect(panel).toContainText(block.text);
      const href = `/early/library/secret-book-james/${story.section}#p${story.paragraph}`;
      await expect(panel.getByRole("link", { name: "Read in the edition" })).toHaveAttribute("href", href);
      await panel.getByRole("link", { name: "Read in the edition" }).click();
      await expect(page.locator(".ew-canon-status")).toContainText("Outside the canon");
      for (const [index, block] of blocks.entries()) {
        const fragments = await page.locator(`#p${story.paragraph + index} p[data-reading-fragment]`).allTextContents();
        expect(fragments.join("")).toBe(block.text);
      }
    }
    await page.goto("/jesus/parables#parable-sower");
    await expect(page.locator("#parable-sower .jsu-parable-account")).toHaveCount(3);
    await expect(page.locator("#parable-sower .jsu-parable-james")).toContainText("stories differ");
  }
});

// This runs in the release browser gate before upload. A bad or missing source
// must not silently ship a prerendered "unavailable" panel.
test("every mapped comparison contains its complete hosted text", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/jesus/parables");
  const groups = page.getByRole("navigation", { name: "Parable groups" });
  for (const parable of [...parables, ...synopticFigures]) {
    if (!("thomas" in parable) || !parable.thomas) continue;
    // One group shows at a time; choose the entry's group before opening it.
    const group = parable.kind === "story" ? /^Stories/ : parable.kind === "saying" ? /^Short sayings/ : /^More in Matthew/;
    await groups.getByRole("button", { name: group }).click();
    const entry = page.locator(`#parable-${parable.id}`);
    await entry.locator(".jsu-pair-head").click();
    await entry.locator("details.jsu-parable-also > summary").click();
    const panels = entry.locator(".jsu-parable-thomas");
    await expect(panels).toHaveCount(parable.thomas.length);
    for (let i = 0; i < parable.thomas.length; i++) {
      const { saying } = parable.thomas[i];
      const section = JSON.parse(readFileSync(`content/early-library/readings/gospel-thomas/saying-${saying}.json`, "utf8"));
      await expect(panels.nth(i).getByRole("heading", { name: `Gospel of Thomas · Saying ${saying} · outside the canon` })).toBeVisible();
      await expect(panels.nth(i)).not.toContainText("could not be loaded here");
      for (const block of section.blocks) {
        if (block.kind === "primary-text") await expect(panels.nth(i)).toContainText(block.text);
      }
    }
  }
});

test("comparison panels fit phone and desktop, in light and dark", async ({ page }) => {
  test.setTimeout(90_000);
  for (const [width, colorScheme] of [[390, "light"], [390, "dark"], [1280, "light"], [1280, "dark"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/jesus/parables#parable-wicked-tenants");
    const grid = page.locator("#parable-wicked-tenants-text > .jsu-parable-accounts");
    await expect(grid.locator(".jsu-parable-account")).toHaveCount(3);
    const columns = await grid.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    assertGrid(columns, width);
    const also = page.locator("#parable-wicked-tenants details.jsu-parable-also");
    await also.locator("summary").click();
    await expect(also.locator(".jsu-parable-thomas")).toHaveCount(2);
    for (const panel of await also.locator(".jsu-parable-thomas").all()) {
      const bounds = await panel.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeLessThanOrEqual(width);
    }
    for (const item of thomasStories) {
      await page.goto(`/jesus/parables#parable-${item.id}`);
      const story = page.locator(`#parable-${item.id} .jsu-parable-thomas`);
      await expect(story.getByRole("heading", { name: `Gospel of Thomas · Saying ${item.saying} · outside the canon` })).toBeVisible();
      const section = JSON.parse(readFileSync(`content/early-library/readings/gospel-thomas/saying-${item.saying}.json`, "utf8"));
      const paragraphs = section.blocks.filter((block: { kind: string }) => block.kind === "primary-text").map((block: { text: string }) => block.text);
      for (let i = 0; i < paragraphs.length; i++) await expect(story.locator(":scope > p").nth(i + 2)).toHaveText(paragraphs[i]);
      const bounds = await story.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeLessThanOrEqual(width);
    }
  }
});

function assertGrid(columns: number, width: number) {
  if (width < 500) expect(columns).toBe(1);
  else expect(columns).toBeGreaterThan(1);
}

test("other early passages show their speakers and link to every selected source", async ({ page }) => {
  test.setTimeout(360_000);
  const figures = JSON.parse(readFileSync("public/jesus/early-figures.json", "utf8"));
  const legacy = JSON.parse(readFileSync("public/early/texts/epistula-apostolorum.json", "utf8"));
  const didache = JSON.parse(readFileSync("public/early/texts/didache.json", "utf8"));
  const barnabas = JSON.parse(readFileSync("public/early/texts/barnabas.json", "utf8"));
  const clement = JSON.parse(readFileSync("public/early/texts/1clement.json", "utf8"));
  const external: Record<string, string> = { "lightfoot-barnabas-goats-thorns": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-thorns-heart": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-sheep-lamb": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-two-peoples": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-aaron-rod": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-pillars": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-dust-smoke": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-wisdom-fruit": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-pasture-prayer": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-yoke-sacrifice": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-fast-light": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-beast-covenant": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-sheep-sun": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-vessel-body": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "acts-thomas-groom-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-creditor": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-youth-light": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-desert-temple": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-oil-121": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-open-treasury": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-prayer-opening": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-four-one": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-mother-houses": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-good-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-spirit-return": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-hidden-mother": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-dwelling-places": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-eagle-dream": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-life-loan": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bread-life": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-crown": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wedding-invitation": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-48": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-lost-sheep": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-58": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-heat-day": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-flock-wolves": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wolves-clothing": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-stolen-thoughts": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-10": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-birds": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wealth": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-ask": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-95": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-143": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-156": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bride-response": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-crowd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bitter-tree": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-yoke": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-seed": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-mygdonia-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-soldiers": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-tower": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-oil": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-bride": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-palace": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "eusebius-talents": "https://en.wikisource.org/wiki/Page:The_Apocryphal_New_Testament_(1924).djvu/41", "acts-thomas-hymn": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf" };
  const lightfootAudit = JSON.parse(readFileSync("tests/fixtures/parables-audit-lightfoot.json", "utf8"));
  const eusebiusAudit = JSON.parse(readFileSync("tests/fixtures/parables-audit-eusebius.json", "utf8"));
  for (const item of lightfootAudit.selections.filter((item: { excerpt: string | null }) => item.excerpt)) {
    const edition = item.excerpt.split("/").pop().replace(/\.json$/, "");
    external[edition] = item.scanUrl;
  }
  for (const item of eusebiusAudit.selections) external[item.id] = item.scanUrl;
  const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    for (const figure of figures) {
      await page.goto(`/jesus/parables#parable-${figure.id}`);
      const entry = page.locator(`#parable-${figure.id}`);
      await expect(entry.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
      const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }) });
      await expect(panel).toContainText("outside the canon");
      await expect(panel).toContainText(figure.speaker);
      const parts = figure.parts ?? [{ section: figure.section, start: figure.start, end: figure.end }];
      const expected: string[] = [];
      const resolved = parts.map((part: { section: string; start: number; end: number }) => {
        const index = (["didache", "barnabas"].includes(figure.edition) || figure.legacyText === "1clement") && figure.legacy ? Number(part.section.slice(1)) : legacy.sections.findIndex((s: { heading: string }) => s.heading === `Chapter ${part.section.slice(8)}`);
        const blocks = figure.excerpt ? JSON.parse(readFileSync(`content/jesus/early-excerpts/${figure.edition}.json`, "utf8")).blocks.map((b: { text: string }) => b.text) : figure.legacy ? (figure.edition === "didache" ? didache : figure.edition === "barnabas" ? barnabas : figure.legacyText === "1clement" ? clement : legacy).sections[index].paragraphs : JSON.parse(readFileSync(`content/early-library/readings/${figure.edition}/${part.section}.json`, "utf8")).blocks.map((b: { text: string }) => b.text);
        const href = figure.excerpt ? external[figure.edition] : figure.legacy ? `/early/${figure.legacyText ?? figure.edition}#${part.section}` : `/early/library/${figure.edition}/${part.section}#p${part.start}`;
        expected.push(...blocks.slice(part.start - 1, part.end));
        return { ...part, index, blocks, href };
      });
      expect(normalize(await panel.innerText())).toContain(normalize(expected.join("\n\n")));
      if (figure.poetry) expect(await panel.locator("p[style]").innerText()).toContain("\n105 ");
      for (const id of figure.earlyComparisons ?? []) {
        const comparison = figures.find((item: {id: string}) => item.id === id);
        await expect(entry.getByRole("heading", { name: `${comparison.work} · ${comparison.locator} · outside the canon` })).toBeVisible();
        await expect(entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${comparison.work} · ${comparison.locator} · outside the canon` }) })).toContainText(comparison.speaker);
      }
      for (const comparison of figure.thomas ?? []) {
        const source = JSON.parse(readFileSync(`content/early-library/readings/gospel-thomas/saying-${comparison.saying}.json`, "utf8"));
        const panel = entry.locator(".jsu-parable-thomas").filter({ has: page.getByRole("heading", { name: `Gospel of Thomas · Saying ${comparison.saying} · outside the canon` }) });
        await expect(panel).toHaveCount(1);
        for (const block of source.blocks) await expect(panel).toContainText(block.text);
        if (comparison.note) await expect(panel).toContainText(comparison.note);
        await expect(panel.getByRole("link", { name: `Saying ${comparison.saying}`, exact: true })).toHaveAttribute("href", `/early/library/gospel-thomas/saying-${comparison.saying}`);
      }
      for (const [index, part] of resolved.entries()) {
        const link = panel.getByRole("link", { name: index ? `Read part ${index + 1} in the edition` : figure.originalReader ? "Read the 1891 scan" : figure.excerpt ? "Read the source" : "Read in the edition", exact: true });
        await expect(link).toHaveAttribute("href", part.href);
        if (figure.originalReader) await expect(panel.getByRole("link", { name: "Read the uncorrected edition", exact: true })).toHaveAttribute("href", `/early/library/${figure.originalReader.edition}/${figure.originalReader.section}#p${figure.originalReader.start}`);
        if (figure.excerpt) continue;
        await link.click();
        await expect(page.locator(figure.legacy ? `#s${part.index}-p${part.start}` : `#p${part.start}`)).toBeVisible();
        const sourceTexts = await page.evaluate(({ legacy: isLegacy, start, end, sectionIndex }) => Array.from({ length: end - start + 1 }, (_, i) => {
          const id = isLegacy ? `s${sectionIndex}-p${start + i}` : `p${start + i}`;
          const element = document.getElementById(id);
          return element ? Array.from(element.querySelectorAll("p[data-reading-fragment]"), node => node.textContent ?? "").join("") : null;
        }), { legacy: Boolean(figure.legacy), start: part.start, end: part.end, sectionIndex: part.index });
        expect(sourceTexts).toEqual(part.blocks.slice(part.start - 1, part.end));
        if (index < resolved.length - 1) {
          await page.goto(`/jesus/parables#parable-${figure.id}`);
          await expect(entry.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
        }
      }
    }
  }
});

test("Theophany passages preserve speakers and partial comparisons in light and dark", async ({ page }) => {
  test.setTimeout(90_000);
  const figures = JSON.parse(readFileSync("public/jesus/early-figures.json", "utf8"));
  for (const [width, colorScheme] of [[390, "light"], [390, "dark"], [1280, "light"], [1280, "dark"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    for (const [target, id, phrase] of [
      ["lost-sheep", "eusebius-lee-audit-shepherd-lost-sheep", /sheep.*strayed/i],
      ["synoptic-peter-rock-keys", "eusebius-lee-audit-rock-keys-5", /keys.*kingdom/i],
    ] as const) {
      await page.goto(`/jesus/parables#parable-${target}`);
      const entry = page.locator(`#parable-${target}`);
      await expect(entry.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
      await entry.locator("details.jsu-parable-also > summary").click();
      const figure = figures.find((item: { id: string }) => item.id === id);
      expect(figure).toBeTruthy();
      const panel = entry.locator(".jsu-parable-early").filter({ hasText: figure.note });
      await expect(panel.getByRole("heading")).toContainText("outside the canon");
      await expect(panel).toContainText(figure.speaker);
      await expect(panel).toContainText(figure.note);
      await expect(panel).toContainText(phrase);
      await expect(panel.getByRole("link", { name: "Read the source", exact: true })).toHaveAttribute("href", /eusebiusbishopof00euse\.pdf#page=\d+$/);
      const bounds = await panel.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeLessThanOrEqual(width);
    }
  }
});

test("collection overview shows the Gospel coverage and searches across groups", async ({ page }) => {
  await page.goto("/jesus/parables");
  const overview = page.locator("#parables-overview");
  const summary = overview.getByRole("table", { name: "Entries in each group with an account in each Gospel" });
  await expect(summary.getByRole("row", { name: /Stories · 31/ })).toContainText("17");
  const groups = page.getByRole("navigation", { name: "Parable groups" });
  await expect(groups.getByRole("button", { name: "Stories 31" })).toHaveAttribute("aria-pressed", "true");
  const searchArea = page.locator("#parables-search");
  const search = page.getByRole("searchbox", { name: "Search all groups" });
  await search.fill("Matthew 13:3");
  await expect(searchArea.getByRole("link", { name: "The sower", exact: true })).toBeVisible();
  await expect(searchArea.getByRole("row", { name: /The sower/ })).toContainText("Matthew: account in this room");
  await expect(searchArea.getByRole("row", { name: /The sower/ })).toContainText("John: no account in this room");
  await expect(searchArea.getByRole("link", { name: "The ten virgins", exact: true })).toHaveCount(0);
  // While searching, the results stand in for the group lists.
  await expect(page.locator("#parables-stories")).toBeHidden();
  await expect(groups.getByRole("button", { name: "Stories 31" })).toHaveAttribute("aria-pressed", "false");
  await search.fill("Matthew 13:6");
  await expect(searchArea.getByRole("row", { name: /The sower/ })).toContainText("Account: Matthew 13:3-9");
  await search.fill("Matthew 13:6—8 sower");
  await expect(searchArea.getByRole("link", { name: "The sower", exact: true })).toBeVisible();
  await search.fill("Matthew 13:3 virgins");
  await expect(searchArea.getByText("No entries found. Try another title, reference or writing.")).toBeVisible();
  await search.fill("Thomas 1");
  await expect(searchArea.getByRole("link", { name: "The sower", exact: true })).toHaveCount(0);
  await search.fill("Thomas 64");
  await expect(searchArea.getByRole("row", { name: /The wedding banquet and the great supper/ })).toContainText("Related: Gospel of Thomas, Saying 64");
  await search.fill("Eusebius lost sheep");
  const work = searchArea.locator("details").filter({ has: page.locator("summary", { hasText: "Eusebius, Theophany" }) });
  await expect(work.locator("summary")).toContainText("outside the canon");
  await expect(work.getByRole("link", { name: "The shepherd seeks the lost sheep" })).toBeVisible();
  await search.fill("zzzxxyyqq");
  await expect(searchArea.getByText("No entries found. Try another title, reference or writing.")).toBeVisible();
  await search.fill("");
  await expect(groups.getByRole("button", { name: "Stories 31" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#parables-stories")).toBeVisible();
});

test("one group shows at a time, and an open entry steps through its group and closes to its row", async ({ page }) => {
  await page.goto("/jesus/parables");
  const groups = page.getByRole("navigation", { name: "Parable groups" });
  await expect(page.locator("#parables-stories")).toBeVisible();
  await expect(page.locator("#parables-john-figures")).toBeHidden();
  await groups.getByRole("button", { name: /^Figures in John/ }).click();
  await expect(page.locator("#parables-john-figures")).toBeVisible();
  await expect(page.locator("#parables-stories")).toBeHidden();
  await groups.getByRole("button", { name: /^Early writings/ }).click();
  const writings = page.getByRole("group", { name: "Choose a writing" });
  await expect(writings.getByRole("button", { name: /^Gospel of Thomas/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#parable-thomas-empty-jar")).toBeVisible();
  await writings.getByRole("button", { name: /^Acts of Thomas/ }).click();
  await expect(page.locator("#parable-thomas-empty-jar")).toBeHidden();
  await groups.getByRole("button", { name: "Stories 31" }).click();

  const sower = page.locator("#parable-sower");
  await sower.getByRole("button").first().click();
  const step = sower.getByRole("navigation", { name: "Move through Stories" });
  await expect(step).toContainText("2 of 31 · Stories");
  await step.getByRole("button", { name: "Next: The weeds among the wheat" }).click();
  const weeds = page.locator("#parable-weeds-among-wheat");
  await expect(weeds.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  await expect(weeds.getByRole("button").first()).toBeFocused();
  await expect(sower.getByRole("button").first()).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/#parable-weeds-among-wheat$/);
  await weeds.getByRole("button", { name: "Close" }).click();
  await expect(weeds.getByRole("button").first()).toHaveAttribute("aria-expanded", "false");
  await expect(weeds.getByRole("button").first()).toBeFocused();
});

test("search results and addresses open entries in their own group", async ({ page }) => {
  await page.goto("/jesus/parables");
  const search = page.getByRole("searchbox", { name: "Search all groups" });
  await expect(search).toBeEnabled();
  await search.fill("sower");
  const sowerLink = page.locator("#parables-search").getByRole("link", { name: "The sower", exact: true });
  await sowerLink.focus();
  await page.keyboard.press("Enter");
  const sower = page.locator("#parable-sower");
  await expect(sower.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  await expect(sower.getByRole("button").first()).toBeFocused();
  await expect(search).toHaveValue("");
  await search.fill("Eusebius lost sheep");
  await page.locator("#parables-search").getByRole("link", { name: "The shepherd seeks the lost sheep" }).click();
  const early = page.locator("#parable-eusebius-lee-audit-shepherd-lost-sheep");
  await expect(early.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  await expect(early.getByRole("heading", { name: /outside the canon/ })).toBeVisible();
  await expect(page.getByRole("group", { name: "Choose a writing" }).getByRole("button", { name: /^Eusebius, Theophany/ })).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await expect(page).toHaveURL(/#parable-sower$/);
  await expect(sower.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  await page.goForward();
  await expect(early.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  await expect(early.getByRole("button").first()).toBeFocused();
});

test("collection overview reflows at narrow widths and enlarged text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/jesus/parables");
    const overview = page.locator("#parables-overview");
    await expect(page.getByRole("searchbox", { name: "Search all groups" })).toBeEnabled();
    const region = overview.getByRole("region", { name: "Gospel coverage by group" });
    expect(await region.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(await region.evaluate((node) => node.clientWidth));
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await expect(region.getByText("Scroll across to see all Gospel columns.")).toBeVisible();
    expect(await overview.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(await overview.evaluate((node) => node.clientWidth));
    expect(await region.evaluate((node) => node.scrollWidth)).toBeGreaterThan(await region.evaluate((node) => node.clientWidth));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
