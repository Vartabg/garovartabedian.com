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
  await expect(button).toContainText("Matthew · Mark · Luke + 2 early writings");
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
    const button = entry.getByRole("button");
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
  await expect(page.locator("#parable-thomas-empty-jar button")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#parable-thomas-empty-jar .jsu-parable-thomas")).toContainText("jar of flour");
});

test("Find opens another Thomas story while already in the room", async ({ page }) => {
  await page.goto("/jesus/parables#parable-thomas-children-in-field");
  await expect(page.locator("#parable-thomas-children-in-field button")).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  const dialog = page.getByRole("dialog", { name: "Find" });
  await dialog.getByRole("searchbox", { name: "Find" }).fill("empty jar");
  await dialog.getByRole("option").filter({ hasText: "The empty jar" }).first().click();
  await expect(page).toHaveURL(/#parable-thomas-empty-jar$/);
  await expect(page.locator("#parable-thomas-empty-jar button")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#parable-thomas-children-in-field button")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#parable-thomas-empty-jar .jsu-parable-thomas")).toContainText("jar of flour");
  await page.getByRole("navigation", { name: "Primary site navigation" }).getByRole("button", { name: "Find" }).click();
  const search = page.getByRole("dialog", { name: "Find" }).getByRole("searchbox", { name: "Find" });
  await search.fill("assassin");
  await expect(page.getByRole("dialog", { name: "Find" }).getByRole("option").filter({ hasText: "The assassin" }).first()).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/#parable-thomas-assassin$/);
  await expect(page.locator("#parable-thomas-assassin button")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#parable-thomas-empty-jar button")).toHaveAttribute("aria-expanded", "false");
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
  for (const parable of [...parables, ...synopticFigures]) {
    if (!("thomas" in parable) || !parable.thomas) continue;
    const entry = page.locator(`#parable-${parable.id}`);
    await entry.getByRole("button").first().click();
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
  test.setTimeout(180_000);
  const figures = JSON.parse(readFileSync("public/jesus/early-figures.json", "utf8"));
  const legacy = JSON.parse(readFileSync("public/early/texts/epistula-apostolorum.json", "utf8"));
  const didache = JSON.parse(readFileSync("public/early/texts/didache.json", "utf8"));
  const barnabas = JSON.parse(readFileSync("public/early/texts/barnabas.json", "utf8"));
  const clement = JSON.parse(readFileSync("public/early/texts/1clement.json", "utf8"));
  const external: Record<string, string> = { "acts-thomas-wedding-invitation": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-48": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-lost-sheep": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-58": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-heat-day": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-flock-wolves": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wolves-clothing": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-stolen-thoughts": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-10": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-birds": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wealth": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-ask": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-95": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-143": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-156": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bride-response": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-crowd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bitter-tree": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-yoke": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-seed": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-mygdonia-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-soldiers": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-tower": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-oil": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-bride": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-palace": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "eusebius-talents": "https://en.wikisource.org/wiki/Page:The_Apocryphal_New_Testament_(1924).djvu/41", "acts-thomas-hymn": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf" };
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
      if (figure.thomas?.length) await expect(entry.locator(".jsu-parable-thomas")).toContainText("When you make the two into one");
      for (const [index, part] of resolved.entries()) {
        const link = panel.getByRole("link", { name: index ? `Read part ${index + 1} in the edition` : figure.excerpt ? "Read the source" : "Read in the edition", exact: true });
        await expect(link).toHaveAttribute("href", part.href);
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
