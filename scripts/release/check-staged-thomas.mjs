/** Read-only check of an on-demand reader in the verified staged deployment. */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { JSDOM } from "jsdom";
import { deploymentUrl, orgId, projectId } from "./production.mjs";
import { validateThomasParables } from "../../src/lib/jesus/thomas-parables-data.mjs";
import { routeStagedRequest } from "./staged-routing.mjs";
export { stagedRequestHeaders } from "./staged-routing.mjs";

const exec = promisify(execFile);

export function verifyThomasReader(html, number = 65, expected = "A [creditor] owned a vineyard") {
  const document = new JSDOM(html).window.document;
  const article = document.querySelector("article");
  const visible = (element) => {
    if (!element || element.closest('script, noscript, template, [hidden], [aria-hidden="true"], details:not([open])')) return false;
    for (let current = element; current; current = current.parentElement) {
      const style = document.defaultView.getComputedStyle(current);
      if (style.display === "none" || style.visibility === "hidden") return false;
    }
    return true;
  };
  const visibleText = (element) => {
    if (!visible(element)) return "";
    return [...element.childNodes].map((child) => {
      if (child.nodeType === 3) return child.textContent;
      if (child.nodeType === 1) return visibleText(child);
      return "";
    }).join("");
  };
  const heading = article?.querySelector("h2#reading-heading");
  const canon = article?.querySelector(".ew-canon-status");
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  const text = normalize([...(article?.querySelectorAll("[data-reading-fragment]") ?? [])]
    .map((element) => visibleText(element)).join("")).includes(normalize(expected));
  if (!visibleText(heading).startsWith(`Saying ${number}:`) ||
      !visibleText(canon).includes("Outside the canon.") || !text) {
    throw new Error("Staged Thomas reader is missing its visible saying, text, or canon label.");
  }
}

/**
 * API calls are GET-only; an existing bypass is held in memory and sent only to the verified deployment.
 * @param {string} url
 * @param {string} sha
 * @param {{ readJson?: (endpoint: string) => Promise<any>, request?: typeof fetch, sayings?: { number: number, expected: string }[], verifyComparison?: (origin: URL, bypass: string | undefined) => Promise<void> }} [options]
 */
export async function checkStagedThomas(url, sha, { readJson = readVercelJson, request = fetch, sayings, verifyComparison } = {}) {
  const origin = new URL(deploymentUrl(url));
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid release commit.");
  const deployment = await readJson(`/v13/deployments/${origin.hostname}`);
  if (deployment.projectId !== projectId || deployment.url !== origin.hostname || deployment.readyState !== "READY" ||
      deployment.target !== "production" || deployment.meta?.githubCommitSha !== sha) {
    throw new Error("Staged reader target does not match the verified release.");
  }
  const project = await readJson(`/v9/projects/${projectId}`);
  if (project.id !== projectId) throw new Error("Staged reader project does not match.");
  const bypass = Object.entries(project.protectionBypass ?? {}).find(([, value]) => value?.scope === "automation-bypass")?.[0];
  const targets = sayings ?? await mappedSayings();
  // Bound concurrent cold requests while checking every linked on-demand reader.
  for (let i = 0; i < targets.length; i += 4) {
    await Promise.all(targets.slice(i, i + 4).map(async ({ number, expected }) => {
      const response = await request(new URL(`/early/library/gospel-thomas/saying-${number}`, origin), {
        headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Staged Thomas saying ${number} returned HTTP ${response.status}.`);
      try { verifyThomasReader(await response.text(), number, expected); }
      catch { throw new Error(`Staged Thomas saying ${number} is missing its visible text or canon label.`); }
    }));
  }
  if (verifyComparison) await verifyComparison(origin, bypass);
}

/** Reject empty, missing or mismatched visible Gospel passages. */
export function verifyLampGospelText(actual, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  if (actual.length !== 4 || expected.length !== 4) throw new Error("Staged lamp comparison is missing a Gospel passage.");
  for (let index = 0; index < expected.length; index++) {
    if (typeof expected[index] !== "string" || !expected[index].trim() ||
        typeof actual[index] !== "string" || !normalize(actual[index]).includes(normalize(expected[index]))) {
      throw new Error(`Staged lamp comparison is missing Gospel passage ${index + 1}.`);
    }
  }
}

/** Verify the hydrated lamp comparison on the staged deployment. */
export async function verifyStagedLamp(origin, bypass, { launch } = {}) {
  const source = JSON.parse(await readFile(path.join(process.cwd(), "content/early-library/readings/gospel-thomas/saying-33.json"), "utf8"));
  const paragraphs = source.blocks.filter((block) => block.kind === "primary-text").map((block) => block.text);
  if (!paragraphs.length || paragraphs.some((text) => typeof text !== "string" || !text.trim())) throw new Error("Invalid Thomas saying 33 source.");
  const chromium = launch ?? (await import("playwright")).chromium;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    try {
      await context.route("**/*", (route) => routeStagedRequest(route, origin, bypass));
      const page = await context.newPage();
      await page.goto(new URL("/jesus/parables#parable-synoptic-lamp", origin).href, { waitUntil: "networkidle", timeout: 30_000 });
      const entry = page.locator("#parable-synoptic-lamp");
      await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
      const canonical = entry.locator(".jsu-parable-account");
      await canonical.nth(3).waitFor({ timeout: 30_000 });
      if (await canonical.count() !== 4) throw new Error("Staged lamp comparison is missing a Gospel passage.");
      const expectedGospels = [];
      for (const [book, chapter, verse] of [["MAT", 5, 15], ["MRK", 4, 21], ["LUK", 8, 16], ["LUK", 11, 33]]) {
        const web = JSON.parse(await readFile(path.join(process.cwd(), `public/scriptures/text/web/${book}.json`), "utf8"));
        expectedGospels.push(web.chapters?.[chapter - 1]?.[verse - 1]);
      }
      verifyLampGospelText(await canonical.allInnerTexts(), expectedGospels);
      // Early writings wait in a fold below the Gospels.
      await entry.locator("details.jsu-parable-also > summary").click();
      const panel = entry.locator(".jsu-parable-thomas");
      await panel.getByRole("heading", { name: "Gospel of Thomas · Saying 33 · outside the canon" }).waitFor({ timeout: 30_000 });
      const text = (await panel.innerText()).replace(/\s+/g, " ");
      for (const paragraph of paragraphs) {
        if (!text.includes(paragraph.replace(/\s+/g, " "))) throw new Error("Staged lamp comparison is missing Thomas text.");
      }
      if (await panel.locator('a[href="/early/library/gospel-thomas/saying-33"]').count() !== 1) throw new Error("Staged lamp comparison is missing its reader link.");
      for (const story of await mappedJamesParagraphs()) {
        await page.goto(new URL(`/jesus/parables#parable-${story.id}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
        const entry = page.locator(`#parable-${story.id}`);
        await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
        const james = entry.locator(".jsu-parable-james");
        await james.getByRole("heading", { name: `Secret Book of James · ${story.locator} · outside the canon` }).waitFor({ timeout: 30_000 });
        verifyJamesPanel(await james.innerText(), await james.locator("a").getAttribute("href"), story);
        await page.goto(new URL(story.href, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
        if (!(await page.locator(".ew-canon-status").innerText()).includes("Outside the canon.")) throw new Error(`Staged James reader lacks a canon label for ${story.id}.`);
        for (const [index, text] of story.texts.entries()) {
          const reader = page.locator(`#p${story.paragraph + index}`);
          await reader.waitFor({ timeout: 30_000 });
          const fragments = await reader.locator("p[data-reading-fragment]").allTextContents();
          if (fragments.join("") !== text) throw new Error(`Staged James reader is missing ${story.id}.`);
        }
      }
      const earlyFigures = await mappedEarlyFigures();
      for (const figure of earlyFigures) {
        await page.goto(new URL(`/jesus/parables#parable-${figure.id}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
        const entry = page.locator(`#parable-${figure.id}`);
        await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
        const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }) });
        await panel.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }).waitFor({ timeout: 30_000 });
        const panelText = await panel.innerText();
        verifyJamesPanel(panelText, await panel.getByRole("link", { name: figure.excerpt ? "Read the source" : "Read in the edition", exact: true }).getAttribute("href"), figure);
        if (!panelText.includes(figure.speaker)) throw new Error(`Staged Early speaker is missing ${figure.id}.`);
        if (figure.poetry && !(await panel.locator("p[style]").first().innerText()).includes("\n105 ")) throw new Error(`Staged poem line breaks are missing ${figure.id}.`);
        for (const id of figure.earlyComparisons ?? []) {
          const compared = earlyFigures.find(item => item.id === id);
          if (!compared) throw new Error(`Staged comparison is invalid: ${id}.`);
          const second = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${compared.work} · ${compared.locator} · outside the canon` }) });
          verifyJamesPanel(await second.innerText(), await second.getByRole("link", { name: compared.excerpt ? "Read the source" : "Read in the edition", exact: true }).getAttribute("href"), compared);
          if (!(await second.innerText()).includes(compared.speaker)) throw new Error(`Staged comparison speaker missing: ${id}.`);
        }
        for (const [partIndex, part] of figure.resolvedParts.entries()) {
          const name = partIndex === 0 ? (figure.excerpt ? "Read the source" : "Read in the edition") : `Read part ${partIndex + 1} in the edition`;
          if (await panel.getByRole("link", { name, exact: true }).getAttribute("href") !== part.href) throw new Error(`Staged Early link is missing ${figure.id}.`);
          if (figure.excerpt) continue;
          await page.goto(new URL(part.href, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
          for (const [index, text] of part.texts.entries()) {
            const reader = page.locator(figure.legacy ? `#s${part.sectionIndex}-p${part.start + index}` : `#p${part.start + index}`);
            await reader.waitFor({ timeout: 30_000 });
            const fragments = await reader.locator("p[data-reading-fragment]").allTextContents();
            if (fragments.join("") !== text) throw new Error(`Staged Early reader is missing ${figure.id}.`);
          }
          if (partIndex < figure.resolvedParts.length - 1) {
            await page.goto(new URL(`/jesus/parables#parable-${figure.id}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
            await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
          }
        }
        if (figure.thomas?.length) {
          await page.goto(new URL(`/jesus/parables#parable-${figure.id}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
          for (const item of figure.thomas) {
            const compare = entry.locator(".jsu-parable-thomas");
            await compare.getByRole("heading", { name: `Gospel of Thomas · Saying ${item.saying} · outside the canon` }).waitFor({ timeout: 30_000 });
            const source = JSON.parse(await readFile(path.join(process.cwd(), `content/early-library/readings/gospel-thomas/saying-${item.saying}.json`), "utf8"));
            const displayed = (await compare.innerText()).replace(/\s+/g, " ");
            if (source.blocks.some(block => !displayed.includes(block.text.replace(/\s+/g, " ")))) throw new Error(`Staged Thomas comparison is missing ${item.saying}.`);
          }
        }
      }
      await verifyEarlyGospelComparisons(page, origin, earlyFigures);
    } finally { await context.close(); }
  } finally { await browser.close(); }
}

/** Verify the independent inventory against all corresponding staged Gospel and early panels. */
export async function verifyEarlyGospelComparisons(page, origin, figures, root = process.cwd()) {
  const inventory = JSON.parse(await readFile(path.join(root, "scripts/release/early-round3-comparisons.json"), "utf8"));
  const entries = (await Promise.all(["parables", "synoptic-figures", "john-figures"].map(async name => JSON.parse(await readFile(path.join(root, `public/jesus/${name}.json`), "utf8"))))).flat();
  const web = Object.fromEntries(await Promise.all(["MAT", "MRK", "LUK", "JHN"].map(async book => [book, JSON.parse(await readFile(path.join(root, `public/scriptures/text/web/${book}.json`), "utf8"))])));
  const normalize = value => value.replace(/\s+/g, " ").trim();
  if (!Array.isArray(inventory) || inventory.length !== 30 || new Set(inventory.map(item => item.id)).size !== inventory.length) throw new Error("Invalid Gospel comparison inventory.");
  for (const item of inventory) {
    const matches = entries.filter(entry => entry.id === item.id);
    if (matches.length !== 1 || !Array.isArray(item.refs) || !Array.isArray(item.figures) || !item.figures.length || JSON.stringify(matches[0].accounts.map(account => account.ref)) !== JSON.stringify(item.refs)) throw new Error(`Invalid Gospel comparison target: ${item.id}.`);
    if (item.explanations && JSON.stringify(matches[0].accounts.map(account => account.explanation)) !== JSON.stringify(item.explanations)) throw new Error(`Invalid Gospel explanations: ${item.id}.`);
    await page.goto(new URL(`/jesus/parables#parable-${item.id}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
    const entry = page.locator(`#parable-${item.id}`);
    await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
    const accounts = entry.locator(".jsu-parable-account");
    await accounts.nth(item.refs.length - 1).waitFor({ timeout: 30_000 });
    if (await accounts.count() !== item.refs.length) throw new Error(`Missing Gospel accounts: ${item.id}.`);
    await entry.locator("details.jsu-parable-also > summary").click();
    for (const [index, ref] of item.refs.entries()) {
      const actual = normalize(await accounts.nth(index).innerText());
      for (const selected of [ref, ...(item.explanations ? [item.explanations[index]] : [])]) {
        const m = /^([A-Z]{3}) (\d+):(\d+)(?:-(\d+))?$/.exec(selected);
        if (!m || !web[m[1]]) throw new Error(`Invalid Gospel reference: ${selected}.`);
        for (let verse = Number(m[3]); verse <= Number(m[4] ?? m[3]); verse++) {
          const text = web[m[1]].chapters?.[Number(m[2]) - 1]?.[verse - 1];
          if (typeof text !== "string" || !text.trim() || !actual.includes(normalize(text))) throw new Error(`Staged Gospel verse missing: ${item.id} ${m[1]} ${m[2]}:${verse}.`);
        }
      }
    }
    for (const id of item.figures) {
      const matching = figures.filter(figure => figure.id === id && [figure.related, ...(figure.relatedAlso ?? [])].includes(item.id));
      if (matching.length !== 1 || !matching[0].note) throw new Error(`Invalid early comparison: ${id} / ${item.id}.`);
      const figure = matching[0];
      const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }) });
      const actual = await panel.innerText();
      verifyJamesPanel(actual, await panel.getByRole("link", { name: figure.excerpt ? "Read the source" : "Read in the edition", exact: true }).getAttribute("href"), figure);
      if (!actual.includes(figure.speaker)) throw new Error(`Staged early speaker missing: ${id}.`);
    }
  }
}

export async function mappedEarlyFigures(root = process.cwd()) {
  const figures = JSON.parse(await readFile(path.join(root, "public/jesus/early-figures.json"), "utf8"));
  if (!Array.isArray(figures) || figures.length !== 102 || new Set(figures.map(f => f.id)).size !== 102) throw new Error("Invalid Early mappings.");
  const allowed = new Set(["2-clement/2-clem-5", "2-clement/2-clem-7", "2-clement/2-clem-8", "2-clement/2-clem-11", "2-clement/2-clem-12", "gospel-philip/becoming-christians", "gospel-philip/spiritual-growth", "gospel-philip/life-death-light-and-darkness", "gospel-philip/uprooting-evil", "gospel-truth/the-parable-of-the-sheep", "gospel-truth/the-parable-of-the-jars", "gospel-truth/the-parable-of-the-nightmares", "gospel-truth/the-gospel", "gospel-truth/doing-the-father-s-will", "shepherd-hermas/another-parable", "shepherd-hermas/vision-3", "shepherd-hermas/parables-which-he-spake-with-me", "shepherd-hermas/parable-6", "shepherd-hermas/parable-8", "shepherd-hermas/parable-8-part-2", "shepherd-hermas/parable-9", "shepherd-hermas/parable-9-part-2", "shepherd-hermas/parable-9-part-3", "shepherd-hermas/parable-9-part-4", "shepherd-hermas/mandate-5", "shepherd-hermas/mandate-11"]);
  for (const value of ["1-clement/1-clem-34", "1-clement/1-clem-36", "barnabas/barn-6", "barnabas/barn-7", "diognetus/diogn-10", "didache/did-9", "barnabas/barn-18", "barnabas/barn-19", "barnabas/barn-20", "1-clement/1-clem-23", "1-clement/1-clem-24", "1-clement/1-clem-37", "diognetus/diogn-6", "barnabas/barn-11", "barnabas/barn-16", "1-clement/1-clem-25", "1-clement/1-clem-26", "1-clement/1-clem-48", "diognetus/diogn-7", "diognetus/diogn-12", "1-clement/1-clem-13", "1-clement/1-clem-6", "1-clement/1-clem-7", "1-clement/1-clem-38", "barnabas/barn-12", "diognetus/diogn-9"]) allowed.add(value);
  for (const value of ["barnabas/barn-4", "barnabas/barn-5", "barnabas/barn-8", "barnabas/barn-9", "1-clement/1-clem-8", "1-clement/1-clem-12", "didache/did-10", "diognetus/diogn-5"]) allowed.add(value);
  const excerptUrls = { "acts-thomas-wedding-invitation": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-48": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-lost-sheep": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-58": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-heat-day": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-flock-wolves": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wolves-clothing": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-stolen-thoughts": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-10": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-birds": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wealth": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-ask": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-95": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-143": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-156": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bride-response": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-crowd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bitter-tree": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-yoke": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-seed": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-mygdonia-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-soldiers": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-tower": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-oil": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-bride": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-palace": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "eusebius-talents": "https://en.wikisource.org/wiki/Page:The_Apocryphal_New_Testament_(1924).djvu/41", "acts-thomas-hymn": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf" };
  for (const figure of figures) if (figure.earlyComparisons && (!Array.isArray(figure.earlyComparisons) || new Set(figure.earlyComparisons).size !== figure.earlyComparisons.length || figure.earlyComparisons.some(id => id === figure.id || !figures.some(item => item.id === id)))) throw new Error("Invalid Early comparison.");
  return Promise.all(figures.map(async figure => {
    if (!/^[a-z0-9-]+$/.test(figure.id) || !/^[a-f0-9]{64}$/.test(figure.sha256)) throw new Error("Invalid Early mapping.");
    const parts = figure.parts ?? [{ section: figure.section, start: figure.start, end: figure.end }];
    if (!Array.isArray(parts) || !parts.length || parts[0].section !== figure.section || parts[0].start !== figure.start || parts[0].end !== figure.end || parts[0].joinPrevious) throw new Error("Invalid Early parts.");
    const resolvedParts = [];
    for (const part of parts) {
      if (!Number.isSafeInteger(part.start) || !Number.isSafeInteger(part.end) || part.start < 1 || part.end < part.start) throw new Error("Invalid Early range.");
      let paragraphs, sectionIndex;
      if (figure.excerpt && Object.hasOwn(excerptUrls, figure.edition) && part.section === "excerpt" && part.start === 1 && part.end === 1 && !figure.legacy) {
        const source = JSON.parse(await readFile(path.join(root, `content/jesus/early-excerpts/${figure.edition}.json`), "utf8"));
        if (source.id !== figure.edition || !Array.isArray(source.blocks) || source.blocks.length !== 1 || source.blocks.some(block => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim())) throw new Error("Invalid excerpt source.");
        paragraphs = source.blocks.map(block => block.text);
      } else if (figure.legacy && figure.edition === "1-clement" && figure.legacyText === "1clement" && /^(?:s19|s45)$/.test(part.section)) {
        const source = JSON.parse(await readFile(path.join(root, "public/early/texts/1clement.json"), "utf8"));
        sectionIndex = Number(part.section.slice(1));
        const heading = sectionIndex === 19 ? "Chapter XX." : "Chapter XLVI.";
        if (source.id !== "1clement" || !source.sections?.[sectionIndex]?.heading?.startsWith(heading)) throw new Error("Invalid 1 Clement source.");
        paragraphs = source.sections[sectionIndex].paragraphs;
      } else if (figure.legacy && figure.edition === "barnabas" && /^(?:s5|s9)$/.test(part.section)) {
        const source = JSON.parse(await readFile(path.join(root, "public/early/texts/barnabas.json"), "utf8"));
        sectionIndex = Number(part.section.slice(1));
        const heading = sectionIndex === 5 ? "Chapter VI." : "Chapter X.";
        if (source.id !== "barnabas" || !source.sections?.[sectionIndex]?.heading?.startsWith(heading)) throw new Error("Invalid Barnabas source.");
        paragraphs = source.sections[sectionIndex].paragraphs;
      } else if (figure.legacy && figure.edition === "didache" && /^(?:s[1-6]|s13|s16)$/.test(part.section)) {
        const source = JSON.parse(await readFile(path.join(root, "public/early/texts/didache.json"), "utf8"));
        sectionIndex = Number(part.section.slice(1));
        const headings = ["", "Chapter I.", "Chapter II.", "Chapter III.", "Chapter IV.", "Chapter V.", "Chapter VI.", ...Array(6).fill(""), "Chapter XIII.", ...Array(2).fill(""), "Chapter XVI."];
        if (source.id !== "didache" || !source.sections?.[sectionIndex]?.heading?.startsWith(headings[sectionIndex])) throw new Error("Invalid Didache source.");
        paragraphs = source.sections[sectionIndex].paragraphs;
      } else if (figure.legacy && figure.edition === "epistula-apostolorum" && /^chapter-(32|43|44|45|47)$/.test(part.section)) {
        const source = JSON.parse(await readFile(path.join(root, "public/early/texts/epistula-apostolorum.json"), "utf8"));
        const matches = source.sections.map((section, index) => ({ section, index })).filter(({ section }) => section.heading === `Chapter ${part.section.slice(8)}`);
        if (source.id !== figure.edition || matches.length !== 1) throw new Error("Invalid Epistula source.");
        paragraphs = matches[0].section.paragraphs; sectionIndex = matches[0].index;
      } else {
        if (figure.legacy || !allowed.has(`${figure.edition}/${part.section}`)) throw new Error("Invalid Early mapping.");
        const source = JSON.parse(await readFile(path.join(root, `content/early-library/readings/${figure.edition}/${part.section}.json`), "utf8"));
        if (source.id !== part.section || source.kind !== "primary-text" || !Array.isArray(source.blocks) || source.blocks.some(block => block.kind !== "primary-text" || typeof block.text !== "string")) throw new Error("Invalid Early source.");
        paragraphs = source.blocks.map(block => block.text);
      }
      const texts = paragraphs.slice(part.start - 1, part.end);
      if (texts.length !== part.end - part.start + 1) throw new Error("Invalid Early range.");
      const href = figure.excerpt ? excerptUrls[figure.edition] : figure.legacy ? `/early/${figure.legacyText ?? figure.edition}#${part.section}` : `/early/library/${figure.edition}/${part.section}#p${part.start}`;
      resolvedParts.push({ ...part, sectionIndex, texts, href });
    }
    const texts = resolvedParts.flatMap(part => part.texts), text = texts.join("\n\n");
    if (createHash("sha256").update(text).digest("hex") !== figure.sha256) throw new Error(`Invalid Early source: ${figure.id}.`);
    return { ...figure, resolvedParts, texts, text, href: resolvedParts[0].href };
  }));
}

export function verifyJamesPanel(actual, href, story) {
  const normalize = value => value.replace(/\s+/g, " ").trim();
  if (typeof actual !== "string" || !normalize(actual).includes(normalize(story.text)) ||
      !actual.includes("outside the canon") || actual.includes("could not be loaded") || href !== story.href ||
      (story.note && !normalize(actual).includes(normalize(story.note)))) throw new Error(`Staged James comparison is missing ${story.id}.`);
}

export async function mappedJamesParagraphs(root = process.cwd()) {
  const stories = JSON.parse(await readFile(path.join(root, "public/jesus/james-parables.json"), "utf8"));
  if (!Array.isArray(stories) || stories.length !== 13 || new Set(stories.map(s => s.id)).size !== 13) throw new Error("Invalid James mappings.");
  return Promise.all(stories.map(async story => {
    const end = story.endParagraph ?? story.paragraph;
    if (!/^james-[a-z0-9-]+$/.test(story.id) || !["prophecies-and-parables", "know-yourselves", "being-filled", "the-cross-and-death", "be-saved", "few-have-found-the-kingdom", "final-words"].includes(story.section) ||
        !Number.isSafeInteger(story.paragraph) || story.paragraph < 1 || !Number.isSafeInteger(end) || end < story.paragraph || !/^[a-f0-9]{64}$/.test(story.sha256)) throw new Error("Invalid James mapping.");
    const page = JSON.parse(await readFile(path.join(root, `content/early-library/readings/secret-book-james/${story.section}.json`), "utf8"));
    const blocks = Array.isArray(page.blocks) ? page.blocks.slice(story.paragraph - 1, end) : [];
    const texts = blocks.map(block => block.text);
    const text = texts.join("\n\n");
    if (page.id !== story.section || page.kind !== "primary-text" || blocks.length !== end - story.paragraph + 1 ||
        blocks.some(block => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim()) || createHash("sha256").update(text).digest("hex") !== story.sha256) throw new Error(`Invalid James source: ${story.id}.`);
    return { ...story, text, texts, href: `/early/library/secret-book-james/${story.section}#p${story.paragraph}` };
  }));
}

export async function mappedSayings(root = process.cwd()) {
  const parables = JSON.parse(await readFile(path.join(root, "public/jesus/parables.json"), "utf8"));
  const figures = JSON.parse(await readFile(path.join(root, "public/jesus/synoptic-figures.json"), "utf8"));
  const stories = validateThomasParables(JSON.parse(await readFile(path.join(root, "public/jesus/thomas-parables.json"), "utf8")));
  const early = JSON.parse(await readFile(path.join(root, "public/jesus/early-figures.json"), "utf8"));
  const numbers = [...new Set([...parables.flatMap((entry) => (entry.thomas ?? []).map((item) => item.saying)), ...figures.flatMap((entry) => (entry.thomas ?? []).map((item) => item.saying)), ...stories.map((story) => story.saying), ...early.flatMap(figure => (figure.thomas ?? []).map(item => item.saying))])];
  if (!numbers.length || numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 114)) throw new Error("Invalid Thomas mapping.");
  return Promise.all(numbers.map(async (number) => {
    const page = JSON.parse(await readFile(path.join(root, `content/early-library/readings/gospel-thomas/saying-${number}.json`), "utf8"));
    if (page.id !== `saying-${number}` || page.kind !== "primary-text" ||
        !Array.isArray(page.blocks) || !page.blocks.length ||
        page.blocks.some((block) => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim()) ||
        page.chars !== page.blocks.reduce((sum, block) => sum + block.text.length, 0)) {
      throw new Error(`Invalid source for Thomas saying ${number}.`);
    }
    return { number, expected: page.blocks[0].text.slice(0, 35).trim() };
  }));
}

async function readVercelJson(endpoint) {
  // No response body is logged or persisted: project metadata may contain an existing secret.
  const { stdout } = await exec("npx", ["--yes", "vercel@65.0.0", "api", endpoint, "--scope", orgId, "--raw"], { maxBuffer: 4 * 1024 * 1024 });
  try { return JSON.parse(stdout); } catch { throw new Error("Vercel returned invalid project or deployment metadata."); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  checkStagedThomas(process.argv[2], process.argv[3], { verifyComparison: verifyStagedLamp }).then(() => {
    console.log("All mapped staged Thomas sayings are readable and labeled outside the canon.");
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
