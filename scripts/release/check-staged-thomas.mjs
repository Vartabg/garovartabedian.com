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
const earlySourceLabel = figure => figure.originalReader ? "Read the 1891 scan" : figure.excerpt ? "Read the source" : "Read in the edition";

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
        const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }) }).filter({ hasText: figure.note ?? "" });
        await panel.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }).waitFor({ timeout: 30_000 });
        const panelText = await panel.innerText();
        verifyJamesPanel(panelText, await panel.getByRole("link", { name: earlySourceLabel(figure), exact: true }).getAttribute("href"), figure);
        if (!panelText.includes(figure.speaker)) throw new Error(`Staged Early speaker is missing ${figure.id}.`);
        if (figure.poetry && !(await panel.locator("p[style]").first().innerText()).includes("\n105 ")) throw new Error(`Staged poem line breaks are missing ${figure.id}.`);
        for (const id of figure.earlyComparisons ?? []) {
          const compared = earlyFigures.find(item => item.id === id);
          if (!compared) throw new Error(`Staged comparison is invalid: ${id}.`);
          const second = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${compared.work} · ${compared.locator} · outside the canon` }) }).filter({ hasText: compared.note ?? "" });
          verifyJamesPanel(await second.innerText(), await second.getByRole("link", { name: earlySourceLabel(compared), exact: true }).getAttribute("href"), compared);
          if (!(await second.innerText()).includes(compared.speaker)) throw new Error(`Staged comparison speaker missing: ${id}.`);
          if (compared.continuation) await verifyContinuationLink(second, compared.continuation, id);
        }
        for (const [partIndex, part] of figure.resolvedParts.entries()) {
          const name = partIndex === 0 ? earlySourceLabel(figure) : `Read part ${partIndex + 1} in the edition`;
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
        if (figure.original) {
          const originalLink = panel.getByRole("link", { name: "Read the uncorrected edition", exact: true });
          if (!figure.original.available) {
            if (await originalLink.count() || !panelText.includes("Uncorrected edition unavailable")) throw new Error(`Staged original reader status incorrect: ${figure.id}.`);
          } else {
            if (await originalLink.getAttribute("href") !== figure.original.href) throw new Error(`Staged original reader link missing: ${figure.id}.`);
            await page.goto(new URL(figure.original.href, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
            for (const [index, text] of figure.original.texts.entries()) {
              const reader = page.locator(`#p${figure.original.start + index}`);
              await reader.waitFor({ timeout: 30_000 });
              if ((await reader.locator("p[data-reading-fragment]").allTextContents()).join("") !== text) throw new Error(`Staged uncorrected reader missing: ${figure.id}.`);
            }
          }
        }
        if (figure.continuation) {
          // The first reader may have navigated away; check this link separately.
          if (figure.original?.available) {
            await page.goto(new URL(`/jesus/parables#parable-${figure.id}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
            await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
          }
          await verifyContinuationLink(panel, figure.continuation, figure.id);
          if (figure.continuation.available) {
            await page.goto(new URL(figure.continuation.href, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
            for (const [index, text] of figure.continuation.texts.entries()) {
              const reader = page.locator(`#p${figure.continuation.start + index}`);
              await reader.waitFor({ timeout: 30_000 });
              if ((await reader.locator("p[data-reading-fragment]").allTextContents()).join("") !== text) throw new Error(`Staged uncorrected continuation missing: ${figure.id}.`);
            }
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
      await verifyStagedAuditComparisons(page, origin, process.cwd(), earlyFigures);
      await verifyStagedEusebiusComparisons(page, origin, earlyFigures);
    } finally { await context.close(); }
  } finally { await browser.close(); }
}

async function verifyContinuationLink(panel, continuation, id) {
  const link = panel.getByRole("link", { name: "Read the uncorrected continuation", exact: true });
  if (!continuation.available) {
    if (await link.count() || !(await panel.innerText()).includes("Uncorrected continuation unavailable")) throw new Error(`Staged continuation status incorrect: ${id}.`);
  } else if (await link.count() !== 1 || await link.getAttribute("href") !== continuation.href) {
    throw new Error(`Staged continuation link missing: ${id}.`);
  }
}

const auditFiles = ["parables", "synoptic-figures", "john-figures", "thomas-parables", "james-parables", "early-figures"];
const auditNumbers = [3, 5, 6, 7, 10, 13, 16, 19, 24, 25, 28, 32, 36, 39, 40, 46, 48, 56, 60, 62, 70, 71, 72, 73, 74, 76, 77, 78, 79, 80, 84, 86, 87, 89, 90, 91, 92, 93, 94, 95, 101, 102, 106, 108, 112, 113];
const auditPlacementCounts = new Map([[13, 2], [24, 2], [28, 3], [39, 2], [40, 2], [71, 2], [76, 2]]);
const normalized = value => value.replace(/\s+/g, " ").trim();
const sameFields = (actual, expected) => actual && expected && Object.keys(actual).length === Object.keys(expected).length && Object.keys(expected).every(key => actual[key] === expected[key]);

// Independent expected ranges and text identities for the two continuation links.
const originalContinuations = {
  "hermas-tower-explanation": { edition: "shepherd-hermas", section: "vision-3-part-2", start: 1, end: 1, sha256: "f061d421367fbc3aebc9603323f48de0b6f722a1a12936ccb3da2e4806cdd69c" },
  "hermas-vineyard-servant-explanation": { edition: "shepherd-hermas", section: "another-parable-part-2", start: 1, end: 16, sha256: "7292491ca6cf5e34abef27737d473180c70da60b6964826ffd56f34c0d3e7258" },
};

export async function mapOriginalReader(source, catalog, root = process.cwd()) {
  let texts = [];
  let available = false;
  try {
    const records = catalog.filter(record => record?.id === source.edition);
    const sections = records.length === 1 && records[0].publicationStatus === "published"
      ? records[0].sections?.filter(section => section.id === source.section && section.kind === "primary-text") : [];
    if (sections?.length === 1) {
      const page = JSON.parse(await readFile(path.join(root, `content/early-library/readings/${source.edition}/${source.section}.json`), "utf8"));
      const blocks = Array.isArray(page.blocks) ? page.blocks.slice(source.start - 1, source.end) : [];
      if (page.id === source.section && page.kind === "primary-text" && blocks.length === source.end - source.start + 1 &&
          blocks.every(block => block.kind === "primary-text" && typeof block.text === "string" && block.text.trim()) &&
          (!source.sha256 || (page.chars === sections[0].chars && page.blocks.every(block => block.kind === "primary-text" && typeof block.text === "string" && block.text.trim()) &&
            page.chars === page.blocks.reduce((sum, block) => sum + block.text.length, 0) &&
            createHash("sha256").update(blocks.map(block => block.text).join("\n\n")).digest("hex") === source.sha256))) {
        texts = blocks.map(block => block.text);
        available = true;
      }
    }
  } catch { /* Each unavailable reader is independent of the excerpt and other readers. */ }
  return { ...source, available, texts, href: `/early/library/${source.edition}/${source.section}#p${source.start}` };
}

/** Check the independent source audit against the data, before checking a deployment. */
export function validateGospelThomasAudit(fixture, collections) {
  if (!Array.isArray(fixture?.gospel_candidates) || fixture.gospel_candidates.length !== 55 ||
      new Set(fixture.gospel_candidates.map(item => item.id)).size !== 55 ||
      !Array.isArray(fixture.thomas_candidates) || fixture.thomas_candidates.length !== auditNumbers.length ||
      JSON.stringify(fixture.thomas_candidates.map(item => Number(item.candidate.replace(/^Thomas /, ""))).sort((a, b) => a - b)) !== JSON.stringify(auditNumbers)) {
    throw new Error("Invalid Gospel/Thomas audit inventory.");
  }
  for (const item of fixture.gospel_candidates) {
    const entries = collections[item.file];
    const matches = Array.isArray(entries) ? entries.filter(entry => entry.id === item.id) : [];
    if (matches.length !== 1 || !Array.isArray(matches[0].accounts) || !Array.isArray(item.accounts) ||
        matches[0].accounts.length !== item.accounts.length || !item.accounts.every((account, index) => sameFields(matches[0].accounts[index], account)) ||
        (item.speaker && item.speaker !== "Jesus by context" && matches[0].speaker !== item.speaker) ||
        (item.note && matches[0].note !== item.note)) throw new Error(`Invalid Gospel audit target: ${item.id}.`);
  }
  for (const item of fixture.thomas_candidates) {
    const number = Number(item.candidate.replace(/^Thomas /, ""));
    if (!Array.isArray(item.placements) || item.placements.length !== (auditPlacementCounts.get(number) ?? 1) ||
        new Set(item.placements.map(placement => `${placement.file}:${placement.id}`)).size !== item.placements.length ||
        item.reader !== `/early/library/gospel-thomas/saying-${number}` ||
        item.source !== `content/early-library/readings/gospel-thomas/saying-${number}.json`) throw new Error(`Invalid Thomas audit source: ${number}.`);
    for (const placement of item.placements) {
      const entries = collections[placement.file];
      const matches = Array.isArray(entries) ? entries.filter(entry => entry.id === placement.id) : [];
      if (matches.length !== 1) throw new Error(`Missing Thomas placement: ${placement.id} / ${number}.`);
      const entry = matches[0];
      const mapped = placement.role === "standalone" ? (entry.saying === number ? entry : null) :
        (entry.thomas ?? []).filter(link => link.saying === number);
      const link = Array.isArray(mapped) ? (mapped.length === 1 ? mapped[0] : null) : mapped;
      if (!link || (placement.note != null && link.note !== placement.note)) throw new Error(`Invalid Thomas placement or note: ${placement.id} / ${number}.`);
    }
  }
  if (!Array.isArray(fixture.james_early_comparisons) || fixture.james_early_comparisons.length !== 1) throw new Error("Invalid James early comparison inventory.");
  for (const item of fixture.james_early_comparisons) {
    const james = collections["public/jesus/james-parables.json"]?.filter(entry => entry.id === item.james_id) ?? [];
    const early = collections["public/jesus/early-figures.json"]?.filter(entry => entry.id === item.early_id) ?? [];
    if (james.length !== 1 || james[0].note !== item.james_note ||
        !Array.isArray(james[0].earlyComparisons) || james[0].earlyComparisons.filter(id => id === item.early_id).length !== 1 ||
        early.length !== 1 || ["work", "locator", "speaker", "translator", "note", "edition", "section", "start", "end", "sha256"].some(key => early[0][key] !== item[key])) {
      throw new Error(`Invalid James early comparison: ${item.james_id} / ${item.early_id}.`);
    }
  }
  if (!Array.isArray(fixture.early_relationships) || fixture.early_relationships.length !== 10) throw new Error("Invalid early relationship inventory.");
  for (const item of fixture.early_relationships) {
    const matches = collections["public/jesus/early-figures.json"]?.filter(entry => entry.id === item.id) ?? [];
    const actual = matches[0];
    if (matches.length !== 1 || actual.note !== item.note ||
        (item.kind === "gospel" && ![actual.related, ...(actual.relatedAlso ?? [])].includes(item.target)) ||
        (item.kind === "early" && !(actual.earlyComparisons ?? []).includes(item.target)) ||
        !["gospel", "early"].includes(item.kind)) throw new Error(`Invalid early relationship: ${item.id} / ${item.target}.`);
  }
  return fixture;
}

export async function mappedGospelThomasAudit(root = process.cwd()) {
  const fixture = JSON.parse(await readFile(path.join(root, "tests/fixtures/parables-audit-gospel-thomas.json"), "utf8"));
  const collections = Object.fromEntries(await Promise.all(auditFiles.map(async name => [
    `public/jesus/${name}.json`, JSON.parse(await readFile(path.join(root, `public/jesus/${name}.json`), "utf8")),
  ])));
  return validateGospelThomasAudit(fixture, collections);
}

/** Check the full source paragraphs, link, note, number and outside-canon label. */
export function thomasSpeakerLabel(number) {
  if (number === 74) return "Speaker not named in this saying";
  if (number === 13) return "Jesus, Peter, Matthew and Thomas in dialogue";
  if (number === 21) return "Mary and Jesus in dialogue";
  if ([6, 20, 22, 24, 43, 60, 113].includes(number)) return "Jesus and the disciples in dialogue";
  if (number === 72) return "A person and Jesus in dialogue";
  if (number === 79) return "A woman and Jesus in dialogue";
  if ([91, 104].includes(number)) return "Jesus and unnamed questioners in dialogue";
  return "Attributed to Jesus in this writing";
}

export function verifyAuditThomasPanel(actual, href, number, paragraphs, note) {
  if (typeof actual !== "string" || !actual.includes(`Gospel of Thomas · Saying ${number} · outside the canon`) || !actual.includes(thomasSpeakerLabel(number)) ||
      href !== `/early/library/gospel-thomas/saying-${number}` || !Array.isArray(paragraphs) || !paragraphs.length ||
      paragraphs.some(text => typeof text !== "string" || !text.trim() || !normalized(actual).includes(normalized(text))) ||
      (note && !normalized(actual).includes(normalized(note))) || actual.includes("could not be loaded")) {
    throw new Error(`Staged Thomas audit panel is missing saying ${number}, source, link, or note.`);
  }
}

/** Check every audited account and every requested placement in the hydrated room. */
export async function verifyStagedAuditComparisons(page, origin, root = process.cwd(), earlyFigures) {
  const fixture = await mappedGospelThomasAudit(root);
  const web = Object.fromEntries(await Promise.all(["MAT", "MRK", "LUK", "JHN"].map(async book =>
    [book, JSON.parse(await readFile(path.join(root, `public/scriptures/text/web/${book}.json`), "utf8"))])));
  const sources = new Map();
  for (const item of fixture.thomas_candidates) {
    const number = Number(item.candidate.replace(/^Thomas /, ""));
    const source = JSON.parse(await readFile(path.join(root, item.source), "utf8"));
    if (source.id !== `saying-${number}` || source.kind !== "primary-text" || !Array.isArray(source.blocks) || !source.blocks.length ||
        source.blocks.some(block => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim()) ||
        source.chars !== source.blocks.reduce((sum, block) => sum + block.text.length, 0)) throw new Error(`Invalid Thomas audit source: ${number}.`);
    sources.set(number, source.blocks.map(block => block.text));
  }
  const openEntry = async id => {
    await page.goto(new URL(`/jesus/parables#parable-${id}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
    const entry = page.locator(`#parable-${id}`);
    await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
    return entry;
  };
  const verifyPanel = async (entry, number, note) => {
    const panel = entry.locator(".jsu-parable-thomas").filter({ has: page.getByRole("heading", { name: `Gospel of Thomas · Saying ${number} · outside the canon` }) });
    if (await panel.count() !== 1) throw new Error(`Missing staged Thomas placement ${number}.`);
    verifyAuditThomasPanel(await panel.innerText(), await panel.locator("a").first().getAttribute("href"), number, sources.get(number), note);
  };
  for (const item of fixture.gospel_candidates) {
    const entry = await openEntry(item.id);
    const accounts = entry.locator(".jsu-parable-account");
    await accounts.nth(item.accounts.length - 1).waitFor({ timeout: 30_000 });
    if (await accounts.count() !== item.accounts.length) throw new Error(`Missing Gospel audit accounts: ${item.id}.`);
    if (item.note && !normalized(await entry.innerText()).includes(normalized(item.note))) throw new Error(`Missing Gospel audit note: ${item.id}.`);
    for (const [index, account] of item.accounts.entries()) {
      const panel = accounts.nth(index), actual = normalized(await panel.innerText());
      if (item.speaker && item.speaker !== "Jesus by context" && !actual.includes(item.speaker)) throw new Error(`Missing Gospel audit speaker: ${item.id}.`);
      for (const kind of ["setting", "ref", "explanation", "called"]) {
        const ref = account[kind]; if (!ref) continue;
        const match = /^([A-Z]{3}) (\d+):(\d+)(?:-(\d+))?$/.exec(ref);
        if (!match || !web[match[1]]) throw new Error(`Invalid Gospel audit reference: ${ref}.`);
        const href = `/scriptures/protestant/${match[1]}/${match[2]}#v${match[3]}`;
        if (!await panel.locator(`a[href="${href}"]`).count()) throw new Error(`Missing Gospel audit link: ${item.id} ${ref}.`);
        if (kind === "called") continue;
        for (let verse = Number(match[3]); verse <= Number(match[4] ?? match[3]); verse++) {
          const text = web[match[1]].chapters?.[Number(match[2]) - 1]?.[verse - 1];
          if (!text || !actual.includes(normalized(text))) throw new Error(`Missing Gospel audit verse: ${item.id} ${match[1]} ${match[2]}:${verse}.`);
        }
      }
    }
    const expected = fixture.thomas_candidates.flatMap(candidate => candidate.placements
      .filter(placement => placement.id === item.id && placement.role === "comparison")
      .map(placement => ({ number: Number(candidate.candidate.replace(/^Thomas /, "")), note: placement.note })));
    if (expected.length) {
      await entry.locator("details.jsu-parable-also > summary").click();
      for (const placement of expected) await verifyPanel(entry, placement.number, placement.note);
    }
  }
  for (const candidate of fixture.thomas_candidates) {
    const number = Number(candidate.candidate.replace(/^Thomas /, ""));
    for (const placement of candidate.placements.filter(value => value.role !== "comparison")) {
      const entry = await openEntry(placement.id);
      await verifyPanel(entry, number, placement.note);
    }
  }
  for (const item of fixture.james_early_comparisons) {
    const source = JSON.parse(await readFile(path.join(root, `content/early-library/readings/${item.edition}/${item.section}.json`), "utf8"));
    const blocks = Array.isArray(source.blocks) ? source.blocks.slice(item.start - 1, item.end) : [];
    const texts = blocks.map(block => block.text);
    if (source.id !== item.section || source.kind !== "primary-text" || blocks.length !== item.end - item.start + 1 ||
        blocks.some(block => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim()) ||
        createHash("sha256").update(texts.join("\n\n")).digest("hex") !== item.sha256) throw new Error(`Invalid James early comparison source: ${item.early_id}.`);
    const entry = await openEntry(item.james_id);
    const jamesPanel = entry.locator(".jsu-parable-james");
    if (!normalized(await jamesPanel.innerText()).includes(normalized(item.james_note))) throw new Error(`Missing James comparison note: ${item.james_id}.`);
    const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${item.work} · ${item.locator} · outside the canon` }) });
    if (await panel.count() !== 1) throw new Error(`Missing James early panel: ${item.early_id}.`);
    const actual = await panel.innerText();
    verifyJamesPanel(actual, await panel.getByRole("link", { name: "Read in the edition", exact: true }).getAttribute("href"), { id: item.early_id, href: item.reader, text: texts.join("\n\n"), note: item.note });
    if (!actual.includes(item.speaker) || !actual.includes(item.translator)) throw new Error(`Missing James early attribution: ${item.early_id}.`);
  }
  const early = earlyFigures ?? await mappedEarlyFigures(root);
  for (const relation of fixture.early_relationships) {
    const primary = early.find(figure => figure.id === relation.id);
    const displayed = relation.kind === "gospel" ? primary : early.find(figure => figure.id === relation.target);
    if (!primary || !displayed) throw new Error(`Missing staged early relationship: ${relation.id}.`);
    const entry = await openEntry(relation.kind === "gospel" ? relation.target : relation.id);
    if (relation.kind === "gospel") await entry.locator("details.jsu-parable-also > summary").click();
    const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${displayed.work} · ${displayed.locator} · outside the canon` }) }).filter({ hasText: displayed.note ?? "" });
    if (await panel.count() !== 1) throw new Error(`Missing staged early relationship panel: ${relation.id} / ${relation.target}.`);
    const actual = await panel.innerText();
    verifyJamesPanel(actual, await panel.getByRole("link", { name: earlySourceLabel(displayed), exact: true }).getAttribute("href"), displayed);
    if (!actual.includes(displayed.speaker)) throw new Error(`Missing staged early relationship speaker: ${displayed.id}.`);
    if (relation.kind === "early" && !normalized(await entry.innerText()).includes(normalized(relation.note))) throw new Error(`Missing staged early relationship note: ${relation.id}.`);
  }
}

/** Do not close an already-open comparison when consecutive checks share a target. */
export async function ensureDisclosureOpen(disclosure) {
  if (await disclosure.getAttribute("open") === null) await disclosure.locator("summary").click();
}

/** Verify each independently sourced Eusebius placement beside its Gospel passage. */
export async function verifyStagedEusebiusComparisons(page, origin, figures, root = process.cwd()) {
  const expected = await validateEusebiusSelections(figures, root);
  for (const item of expected) {
    const figure = figures.find(entry => entry.id === item.id);
    for (const target of item.related) {
      await page.goto(new URL(`/jesus/parables#parable-${target}`, origin).href, { waitUntil: "networkidle", timeout: 30_000 });
      const entry = page.locator(`#parable-${target}`);
      await entry.locator('button[aria-expanded="true"]').waitFor({ timeout: 30_000 });
      await ensureDisclosureOpen(entry.locator("details.jsu-parable-also"));
      const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }) }).filter({ hasText: figure.note ?? "" });
      if (await panel.count() !== 1) throw new Error(`Missing staged Eusebius placement: ${item.id} / ${target}.`);
      const actual = await panel.innerText();
      verifyJamesPanel(actual, await panel.getByRole("link", { name: "Read the source", exact: true }).getAttribute("href"), figure);
      if (!actual.includes(item.speaker) || !normalized(actual).includes(normalized(item.displayedNote))) throw new Error(`Missing staged Eusebius note or speaker: ${item.id}.`);
    }
  }
}

/** Verify the independent inventory against all corresponding staged Gospel and early panels. */
export async function verifyEarlyGospelComparisons(page, origin, figures, root = process.cwd()) {
  const inventory = JSON.parse(await readFile(path.join(root, "scripts/release/early-round3-comparisons.json"), "utf8"));
  const entries = (await Promise.all(["parables", "synoptic-figures", "john-figures"].map(async name => JSON.parse(await readFile(path.join(root, `public/jesus/${name}.json`), "utf8"))))).flat();
  const web = Object.fromEntries(await Promise.all(["MAT", "MRK", "LUK", "JHN"].map(async book => [book, JSON.parse(await readFile(path.join(root, `public/scriptures/text/web/${book}.json`), "utf8"))])));
  const normalize = value => value.replace(/\s+/g, " ").trim();
  if (!Array.isArray(inventory) || inventory.length !== 42 || new Set(inventory.map(item => item.id)).size !== inventory.length) throw new Error("Invalid Gospel comparison inventory.");
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
      const panel = entry.locator(".jsu-parable-early").filter({ has: page.getByRole("heading", { name: `${figure.work} · ${figure.locator} · outside the canon` }) }).filter({ hasText: figure.note ?? "" });
      const actual = await panel.innerText();
      verifyJamesPanel(actual, await panel.getByRole("link", { name: earlySourceLabel(figure), exact: true }).getAttribute("href"), figure);
      if (figure.original?.available && await panel.getByRole("link", { name: "Read the uncorrected edition", exact: true }).getAttribute("href") !== figure.original.href) throw new Error(`Staged original reader link missing: ${id}.`);
      if (figure.original && !figure.original.available && (!actual.includes("Uncorrected edition unavailable") || await panel.getByRole("link", { name: "Read the uncorrected edition", exact: true }).count())) throw new Error(`Staged original reader status incorrect: ${id}.`);
      if (!actual.includes(figure.speaker)) throw new Error(`Staged early speaker missing: ${id}.`);
    }
  }
}

const eusebiusScanUrls = {
  "eusebius-lee-audit-lyre-warrior-city": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=174",
  "eusebius-lee-audit-philosopher-mind": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=174",
  "eusebius-lee-audit-watering-husbandman": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=180",
  "eusebius-lee-audit-fountain-mind-messenger": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=182",
  "eusebius-lee-audit-ship-soul-body": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=184",
  "eusebius-lee-audit-body-divided": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=186",
  "eusebius-lee-audit-lyre-world": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=188",
  "eusebius-lee-audit-body-one-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=189",
  "eusebius-lee-audit-one-sun-word": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=189",
  "eusebius-lee-audit-one-modeller": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=192",
  "eusebius-lee-audit-sun-fire-many-effects": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=193",
  "eusebius-lee-audit-word-world-lyre": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=194",
  "eusebius-lee-audit-imperial-city-heavens": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=196",
  "eusebius-lee-audit-imperial-city-ranks": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=198",
  "eusebius-lee-audit-imperial-city-application": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=200",
  "eusebius-lee-audit-heart-tablets": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=200",
  "eusebius-lee-audit-earth-rational-seed": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=203",
  "eusebius-lee-audit-sower-harvest-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=205",
  "eusebius-lee-audit-birth-nurture": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=222",
  "eusebius-lee-audit-difficult-birth": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=223",
  "eusebius-lee-audit-birth-two-outcomes": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=223",
  "eusebius-lee-audit-seed-cultivated-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=226",
  "eusebius-lee-audit-infant-adult-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=227",
  "eusebius-lee-audit-body-wild-beast": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=230",
  "eusebius-lee-audit-seed-future-fruit": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=232",
  "eusebius-lee-audit-wickedness-nets": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=234",
  "eusebius-lee-audit-world-storm": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=248",
  "eusebius-lee-audit-plato-shipmaster": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=261",
  "eusebius-lee-audit-plato-storm": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=269",
  "eusebius-lee-audit-plato-chariot": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=270",
  "eusebius-lee-audit-maker-made": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=278",
  "eusebius-lee-audit-philosophers-war-giants": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=278",
  "eusebius-lee-audit-philosophers-war": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=280",
  "eusebius-lee-audit-physicians-consulted": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=282",
  "eusebius-lee-audit-soul-healing": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=284",
  "eusebius-lee-audit-sun-clay": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=287",
  "eusebius-lee-audit-pythian-oracle": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=299",
  "eusebius-lee-audit-tree-fruit": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=302",
  "eusebius-lee-audit-storm-peace": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=304",
  "eusebius-lee-audit-shepherd-lost-sheep": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=313",
  "eusebius-lee-audit-shepherd-physician-care": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=314",
  "eusebius-lee-audit-discipline-calamities": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=316",
  "eusebius-lee-audit-discipline-bridle": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=316",
  "eusebius-lee-audit-seed-herbs-fountain": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=321",
  "eusebius-lee-audit-punishment-rains": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=323",
  "eusebius-lee-audit-father-gifts-seed": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=323",
  "eusebius-lee-audit-war-engine": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=325",
  "eusebius-lee-audit-stream-and-family": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=326",
  "eusebius-lee-audit-world-family": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=327",
  "eusebius-lee-audit-swords-ploughshares": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=327",
  "eusebius-lee-audit-sun-rational-light": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=331",
  "eusebius-lee-audit-flock-evil-beasts": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=331",
  "eusebius-lee-audit-food-of-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=338",
  "eusebius-lee-audit-eye-and-yoke": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=338",
  "eusebius-lee-audit-mind-rock-fruit": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=339",
  "eusebius-lee-audit-church-rock-3": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=339",
  "eusebius-lee-audit-fishers-3": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=340",
  "eusebius-lee-audit-armor-righteousness": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=340",
  "eusebius-lee-audit-word-sown": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=341",
  "eusebius-lee-audit-sun-doctrine": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=342",
  "eusebius-lee-audit-king-interpreter": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=345",
  "eusebius-lee-audit-sun-rays": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=347",
  "eusebius-lee-audit-musician-lyre": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=347",
  "eusebius-lee-audit-lyre-sunlight": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=349",
  "eusebius-lee-audit-seed-tablets": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=351",
  "eusebius-lee-audit-healing-souls-bodies": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=352",
  "eusebius-lee-audit-good-shepherd-wheat-3": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=354",
  "eusebius-lee-audit-wilderness-wild-beasts": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=358",
  "eusebius-lee-audit-strong-man": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=361",
  "eusebius-lee-audit-lamb-flock": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=363",
  "eusebius-lee-audit-death-ruler": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=367",
  "eusebius-lee-audit-death-theatre": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=369",
  "eusebius-lee-audit-body-instrument": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=375",
  "eusebius-lee-audit-parent-child": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=379",
  "eusebius-lee-audit-east-west-feast": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=381",
  "eusebius-lee-audit-east-west-feast-luke": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=384",
  "eusebius-lee-audit-fishers-gospels": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=385",
  "eusebius-lee-audit-fishers-net": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=387",
  "eusebius-lee-audit-fishers-catch-life": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=388",
  "eusebius-lee-audit-light-city-lamp": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=390",
  "eusebius-lee-audit-city-lamp-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=391",
  "eusebius-lee-audit-light-and-housetops": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=392",
  "eusebius-lee-audit-church-rock-4": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=400",
  "eusebius-lee-audit-division-sword": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=402",
  "eusebius-lee-audit-isaiah-vineyard-reading": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=406",
  "eusebius-lee-audit-vineyard-tenants": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=406",
  "eusebius-lee-audit-cornerstone-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=407",
  "eusebius-lee-audit-vineyard-feast-comparison": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=409",
  "eusebius-lee-audit-feast-servants": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=410",
  "eusebius-lee-audit-feast-invitations": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=412",
  "eusebius-lee-audit-vipers-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=413",
  "eusebius-lee-audit-hen-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=415",
  "eusebius-lee-audit-good-shepherd-4": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=428",
  "eusebius-lee-audit-shepherd-wolves": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=430",
  "eusebius-lee-audit-wheat-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=431",
  "eusebius-lee-audit-harvest-and-fields": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=432",
  "eusebius-lee-audit-winnowing-floor": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=432",
  "eusebius-lee-audit-net-fishers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=437",
  "eusebius-lee-audit-wolves-trees": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=437",
  "eusebius-lee-audit-sheep-wolves-voice": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=439",
  "eusebius-lee-audit-teacher-hidden": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=440",
  "eusebius-lee-audit-hidden-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=441",
  "eusebius-lee-audit-harvest-after-sower": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=444",
  "eusebius-lee-audit-coming-lightning": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=448",
  "eusebius-lee-audit-lightning-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=450",
  "eusebius-lee-audit-teachers-and-pupils": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=462",
  "eusebius-lee-audit-crafts-teachers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=466",
  "eusebius-lee-audit-moses-accusation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=487",
  "eusebius-lee-audit-rock-keys-5": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=494",
  "eusebius-lee-audit-soul-body": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=185",
  "eusebius-lee-audit-seed-coat": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=231",
  "eusebius-lee-audit-physician-remedies": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=322",
  "eusebius-lee-house-ship-city": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=171",
  "eusebius-lee-architect-house": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=173",
  "eusebius-lee-imperial-city": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=195",
  "eusebius-lee-birth-life": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=222",
  "eusebius-lee-seed-corruption": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=232",
  "eusebius-lee-physician-souls": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=315",
  "eusebius-lee-shepherd-physician": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=323",
  "eusebius-lee-vessel-fire": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=362",
  "eusebius-lee-vineyard-isaiah": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=406",
  "eusebius-lee-vineyard-explanation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=407",
  "eusebius-lee-wedding-feast": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=409",
  "eusebius-lee-marriage-feast-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=410",
  "eusebius-lee-serpents-vipers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=413",
  "eusebius-lee-hen-chickens": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=415",
  "eusebius-lee-grain-wheat": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=431",
  "eusebius-lee-family-persecution": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=435",
  "eusebius-lee-net": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=436",
  "eusebius-lee-sower-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=444",
  "eusebius-lee-weeds-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=447",
  "eusebius-lee-fishers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=502",
  "eusebius-lee-sower-quotation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=443",
  "eusebius-lee-sower-explanation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=443",
  "eusebius-lee-weeds-quotation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=445",
  "eusebius-lee-weeds-explanation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=446",
  "eusebius-lee-vineyard-quotation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=405",
  "eusebius-lee-wedding-garment": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=413"
};

// Independently checked against Euler's 1891 Lightfoot scan and /tmp/lightfoot-candidate-map.json.
const lightfootSelections = [
  {"id": "second-clement-two-masters-ages", "edition": "2-clement", "parts": [{"section": "2-clem-6", "start": 1, "end": 5}], "sha256": "717040a9367b27c6bfe8c0b19500627df0bb98d271acd517dfb8e38dbe0a1c60"},
  {"id": "second-clement-small-great", "edition": "2-clement", "parts": [{"section": "2-clem-8", "start": 4, "end": 6}], "sha256": "ede54403d91939f87699c2acf30256f38bfa7f79791ab33f4797bc37d574c5f5", "excerpt": "content/jesus/early-excerpts/lightfoot-second-clement-small-great.json", "excerptFileSha256": "e4cc704836bf02bad49d3f049ae694634f2aaf382eee47cbb4cc6dad35fc7c9b"},
  {"id": "second-clement-temple-physician", "edition": "2-clement", "parts": [{"section": "2-clem-9", "start": 3, "end": 8}], "sha256": "c6af057858e090f8ed5ef7d882c952ff755fec2341ffa57790bb051b21c03641"},
  {"id": "second-clement-house-robbers", "edition": "2-clement", "parts": [{"section": "2-clem-14", "start": 1, "end": 1}], "sha256": "614335b0b8a3242dda2fb8b7151a49da520e800fc34faee32e471df56f9ae11f", "excerpt": "content/jesus/early-excerpts/lightfoot-second-clement-house-robbers.json", "excerptFileSha256": "6dc7783a042560cc6e252cf90c31de26184d57f42d128a43d4716ea041d83885"},
  {"id": "second-clement-darkness-sight", "edition": "2-clement", "parts": [{"section": "2-clem-1", "start": 6, "end": 6}], "sha256": "10028eaf4a8717311029622079aef00f8f84e07263dceb33c1e75aeb5c91e0a1"},
  {"id": "second-clement-barren", "edition": "2-clement", "parts": [{"section": "2-clem-2", "start": 1, "end": 3}], "sha256": "1ac02a0794c33308ec037e6a97736ba04130d0e2874a934013b57df8a95a187e", "excerpt": "content/jesus/early-excerpts/lightfoot-second-clement-barren.json", "excerptFileSha256": "98ffde35d341509e97da85df53e16b32415796eaa1ad45a2f8d656c38c017e98"},
  {"id": "second-clement-lips-heart", "edition": "2-clement", "parts": [{"section": "2-clem-3", "start": 4, "end": 5}], "sha256": "026170ad3777c8a55f56b1ea72ff123702e5fead17d7eb3a3890946e0f34e23b", "excerpt": "content/jesus/early-excerpts/lightfoot-second-clement-lips-heart.json", "excerptFileSha256": "709c530c39d886b559123f9231824d12e49a9cf50b9f051a4120b03529d676bb"},
  {"id": "second-clement-burning-day", "edition": "2-clement", "parts": [{"section": "2-clem-16", "start": 3, "end": 3}], "sha256": "df62eb8b0f3bde78f09e51f8a53dbc9bb8e3cb7cc3479a2ec565ff672ab5dac7"},
  {"id": "second-clement-immortal-fruit", "edition": "2-clement", "parts": [{"section": "2-clem-19", "start": 3, "end": 3}], "sha256": "af7bce5be6c230033c6c187898d15044968e6e85a17f3dc656b1c83697118d3c"},
  {"id": "second-clement-waiting-fruit", "edition": "2-clement", "parts": [{"section": "2-clem-20", "start": 2, "end": 4}], "sha256": "a4ee268f07d1b06a2b9f4d0d08285b04754e4e9cb8409a350e785f53314464f0", "excerpt": "content/jesus/early-excerpts/lightfoot-second-clement-waiting-fruit.json", "excerptFileSha256": "a91d65eb9dc2893629db7616f5ffb80fcdd4261eb0db03c538a4588f19b92976"},
  {"id": "hermas-tower-explanation", "edition": "shepherd-hermas", "parts": [{"section": "vision-3", "start": 22, "end": 43}, {"section": "vision-3-part-2", "start": 1, "end": 1}], "sha256": "006a69339bb4340e7a2cb5072ee46a7374dd43d2acb3ae02e3ae7a6d8d1979a4", "excerpt": "content/jesus/early-excerpts/lightfoot-hermas-tower-explanation.json", "excerptFileSha256": "3b6948a938fd5e6649769c7978bc55521f6724efd6521b0b0184fe9669e72b50"},
  {"id": "hermas-seven-women", "edition": "shepherd-hermas", "parts": [{"section": "vision-3-part-2", "start": 3, "end": 10}], "sha256": "52a11d97e05117005193b539cc6e20d2e3c16169a8ae0f2943c1bb76dd962cc5"},
  {"id": "hermas-three-forms", "edition": "shepherd-hermas", "parts": [{"section": "vision-3-part-2", "start": 33, "end": 43}], "sha256": "f4a147643f0c6e01eab58b35fd2abbbef211b7c3a950ba64c17ef3b38ac3bba9", "excerpt": "content/jesus/early-excerpts/lightfoot-hermas-three-forms.json", "excerptFileSha256": "5d6378aed893efdd448b8ec32d9baf78f843afd6afb0f1ac0af8fe8daf0632de"},
  {"id": "hermas-beast-colors", "edition": "shepherd-hermas", "parts": [{"section": "vision-4", "start": 5, "end": 22}], "sha256": "aa162a51d1f7e7c0a19ac5ef7a7dfcced178b00e14edee753b9bbb33e4f4065e", "excerpt": "content/jesus/early-excerpts/lightfoot-hermas-beast-colors.json", "excerptFileSha256": "3d0b6a93d6ec531be2e1fe7ace6f673d892ce5cecfa79837d07f02a14c8faf61"},
  {"id": "hermas-two-paths", "edition": "shepherd-hermas", "parts": [{"section": "mandate-6", "start": 1, "end": 4}], "sha256": "ee4c573dca9f0473ab914866e4418341e43fa8f2a4b2807e1355dfa94e4da91f", "excerpt": "content/jesus/early-excerpts/lightfoot-hermas-two-paths.json", "excerptFileSha256": "1d890a34c6b2248b188f00ee013d2eb7399a244c44b2358e314bb2c2e6bd344a"},
  {"id": "hermas-neglected-vineyard", "edition": "shepherd-hermas", "parts": [{"section": "mandate-10", "start": 3, "end": 6}], "sha256": "61c9ec0a23c1def0d73ce92f6ebcbafba4a8972985c169ca5b75025c15dc562c"},
  {"id": "hermas-vinegar-wine", "edition": "shepherd-hermas", "parts": [{"section": "mandate-10", "start": 15, "end": 15}], "sha256": "6a279ee014fe9f7517f2ee20a67400e414c9b946b47eebd294b93a38ab4c232c"},
  {"id": "hermas-empty-vessels", "edition": "shepherd-hermas", "parts": [{"section": "mandate-11", "start": 13, "end": 16}], "sha256": "0ba8b9c33fd26481cbdc7f2c2c42dcb7ea87b2b9b80bc93ebd68ab710d80cde3", "excerpt": "content/jesus/early-excerpts/lightfoot-hermas-empty-vessels.json", "excerptFileSha256": "56b9e018b339387bc7c98ccd03fc14c23c16f25bb2d8bea5c49e4788d75d532c"},
  {"id": "hermas-wine-jars-temptation", "edition": "shepherd-hermas", "parts": [{"section": "mandate-12", "start": 23, "end": 25}], "sha256": "f455c967d82a7258298a4ae862dccc7a76899c58b868abc92c93cb798fe89c2c"},
  {"id": "hermas-vineyard-servant-explanation", "edition": "shepherd-hermas", "parts": [{"section": "another-parable", "start": 38, "end": 48}, {"section": "another-parable-part-2", "start": 1, "end": 16}], "sha256": "1faa2161d386429dc48e1a55d45def0b9aa30d3994a95f3d57e0b0bb594af737", "excerpt": "content/jesus/early-excerpts/lightfoot-hermas-vineyard-servant-explanation.json", "excerptFileSha256": "78f2f9ac8eabc9546c47d18a06511cdffbc57aa94a28b0193b1d40d9c2fd45fd"},
  {"id": "hermas-smith-discourse", "edition": "shepherd-hermas", "parts": [{"section": "vision-1", "start": 15, "end": 15}], "sha256": "02a2eb5741a72994670372f83924d2ed05c56d5848586b3a338b134256d9f1e6"},
  {"id": "hermas-spirits-vessel", "edition": "shepherd-hermas", "parts": [{"section": "mandate-5", "start": 7, "end": 14}], "sha256": "757d243b37f1707ed8fd1d2bbf4a1227daf45b09ca1cc32d688ebae0a381bb64"},
  {"id": "hermas-clean-house", "edition": "shepherd-hermas", "parts": [{"section": "parable-10", "start": 8, "end": 12}], "sha256": "776fa0fb14b0956e3b2740b86c684a4d59b262739cc0f5b3d676f5c6638c26ff", "excerpt": "content/jesus/early-excerpts/lightfoot-hermas-clean-house.json", "excerptFileSha256": "53d279a0742ed5d99a5ab966a315d7f25067a5078413cd16c0f59d7daad0fb42"}
];
const lightfootScan = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf";

/** Preserve the 23 selected source ranges and the 12 corrected files independently of the Early total. */
export async function validateLightfootSelections(figures, root = process.cwd()) {
  const originals = JSON.parse(await readFile(path.join(root, "src/lib/jesus/lightfoot-original-readers.json"), "utf8"));
  for (const expected of lightfootSelections) {
    const matches = figures.filter(figure => figure.id === expected.id);
    if (matches.length !== 1 || matches[0].sha256 !== expected.sha256) throw new Error(`Invalid Lightfoot selection: ${expected.id}.`);
    const figure = matches[0];
    let paragraphs;
    if (expected.excerpt) {
      const first = expected.parts[0];
      const original = { edition: expected.edition, ...first };
      if (!figure.excerpt || figure.edition !== `lightfoot-${expected.id}` || figure.section !== "excerpt" ||
          figure.start !== 1 || figure.end !== 1 || !sameFields(figure.originalReader, original) ||
          !sameFields(originals[expected.id], original)) throw new Error(`Invalid Lightfoot original reader: ${expected.id}.`);
      const bytes = await readFile(path.join(root, expected.excerpt));
      if (createHash("sha256").update(bytes).digest("hex") !== expected.excerptFileSha256) throw new Error(`Invalid Lightfoot excerpt file: ${expected.id}.`);
      const source = JSON.parse(bytes.toString("utf8"));
      if (source.id !== figure.edition || !Array.isArray(source.blocks) || source.blocks.length !== 1 ||
          source.blocks[0].kind !== "primary-text" || typeof source.blocks[0].text !== "string" || !source.blocks[0].text.trim()) throw new Error(`Invalid Lightfoot excerpt: ${expected.id}.`);
      paragraphs = source.blocks.map(block => block.text);
    } else {
      const parts = figure.parts ?? [{ section: figure.section, start: figure.start, end: figure.end }];
      if (figure.excerpt || figure.legacy || figure.edition !== expected.edition || parts.length !== expected.parts.length ||
          !parts.every((part, index) => sameFields(part, expected.parts[index]))) throw new Error(`Invalid Lightfoot range: ${expected.id}.`);
      paragraphs = [];
      for (const part of expected.parts) {
        const page = JSON.parse(await readFile(path.join(root, `content/early-library/readings/${expected.edition}/${part.section}.json`), "utf8"));
        const blocks = Array.isArray(page.blocks) ? page.blocks.slice(part.start - 1, part.end) : [];
        if (page.id !== part.section || page.kind !== "primary-text" || blocks.length !== part.end - part.start + 1 ||
            blocks.some(block => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim())) throw new Error(`Invalid Lightfoot hosted source: ${expected.id}.`);
        paragraphs.push(...blocks.map(block => block.text));
      }
    }
    if (createHash("sha256").update(paragraphs.join("\n\n")).digest("hex") !== expected.sha256) throw new Error(`Invalid Lightfoot text hash: ${expected.id}.`);
  }
  return lightfootSelections.length;
}

/** Validate the 1843 Syriac-to-English excerpts and their exact per-page scan links. */
export async function validateEusebiusSelections(figures, root = process.cwd()) {
  const fixture = JSON.parse(await readFile(path.join(root, "tests/fixtures/parables-audit-eusebius.json"), "utf8"));
  if (!Array.isArray(fixture.selections) || fixture.selections.length !== 138 ||
      new Set(fixture.selections.map(item => item.id)).size !== 138 ||
      Object.keys(eusebiusScanUrls).some(id => !fixture.selections.some(item => item.id === id))) throw new Error("Invalid Eusebius selection inventory.");
  for (const expected of fixture.selections) {
    const matches = figures.filter(figure => figure.id === expected.id);
    const figure = matches[0];
    if (matches.length !== 1 || !figure.excerpt || figure.edition !== expected.id || figure.section !== "excerpt" ||
        figure.start !== 1 || figure.end !== 1 || figure.work !== "Eusebius, Theophany" ||
        figure.translator !== "Samuel Lee · 1843 translation from Syriac" || figure.speaker !== expected.speaker ||
        figure.note !== expected.displayedNote || figure.sha256 !== expected.sha256 ||
        JSON.stringify([figure.related, ...(figure.relatedAlso ?? [])].filter(Boolean)) !== JSON.stringify(expected.related) ||
        expected.path !== `content/jesus/early-excerpts/${expected.id}.json` || expected.scanUrl !== eusebiusScanUrls[expected.id]) {
      throw new Error(`Invalid Eusebius mapping: ${expected.id}.`);
    }
    const source = JSON.parse(await readFile(path.join(root, expected.path), "utf8"));
    if (source.id !== expected.id || !Array.isArray(source.blocks) || source.blocks.length !== 1 ||
        source.blocks[0].kind !== "primary-text" || typeof source.blocks[0].text !== "string" || !source.blocks[0].text.trim() ||
        createHash("sha256").update(source.blocks[0].text).digest("hex") !== expected.sha256) throw new Error(`Invalid Eusebius source: ${expected.id}.`);
  }
  return fixture.selections;
}

export async function mappedEarlyFigures(root = process.cwd()) {
  const figures = JSON.parse(await readFile(path.join(root, "public/jesus/early-figures.json"), "utf8"));
  if (!Array.isArray(figures) || new Set(figures.map(f => f.id)).size !== figures.length) throw new Error("Invalid Early mappings.");
  for (const figure of figures) if (figure.earlyComparisons && (!Array.isArray(figure.earlyComparisons) || new Set(figure.earlyComparisons).size !== figure.earlyComparisons.length || figure.earlyComparisons.some(id => id === figure.id || !figures.some(item => item.id === id)))) throw new Error("Invalid Early comparison.");
  if (figures.length !== 350) throw new Error("Invalid Early mappings: expected the finalized 350-entry inventory.");
  await validateLightfootSelections(figures, root);
  await validateEusebiusSelections(figures, root);
  const allowed = new Set(["2-clement/2-clem-5", "2-clement/2-clem-7", "2-clement/2-clem-8", "2-clement/2-clem-11", "2-clement/2-clem-12", "gospel-philip/becoming-christians", "gospel-philip/spiritual-growth", "gospel-philip/life-death-light-and-darkness", "gospel-philip/uprooting-evil", "gospel-truth/the-parable-of-the-sheep", "gospel-truth/the-parable-of-the-jars", "gospel-truth/the-parable-of-the-nightmares", "gospel-truth/the-gospel", "gospel-truth/doing-the-father-s-will", "shepherd-hermas/another-parable", "shepherd-hermas/vision-3", "shepherd-hermas/parables-which-he-spake-with-me", "shepherd-hermas/parable-6", "shepherd-hermas/parable-8", "shepherd-hermas/parable-8-part-2", "shepherd-hermas/parable-9", "shepherd-hermas/parable-9-part-2", "shepherd-hermas/parable-9-part-3", "shepherd-hermas/parable-9-part-4", "shepherd-hermas/mandate-5", "shepherd-hermas/mandate-11"]);
  for (const value of ["1-clement/1-clem-34", "1-clement/1-clem-36", "barnabas/barn-6", "barnabas/barn-7", "diognetus/diogn-10", "didache/did-9", "barnabas/barn-18", "barnabas/barn-19", "barnabas/barn-20", "1-clement/1-clem-23", "1-clement/1-clem-24", "1-clement/1-clem-37", "diognetus/diogn-6", "barnabas/barn-11", "barnabas/barn-16", "1-clement/1-clem-25", "1-clement/1-clem-26", "1-clement/1-clem-48", "diognetus/diogn-7", "diognetus/diogn-12", "1-clement/1-clem-13", "1-clement/1-clem-6", "1-clement/1-clem-7", "1-clement/1-clem-38", "barnabas/barn-12", "diognetus/diogn-9"]) allowed.add(value);
  for (const value of ["barnabas/barn-4", "barnabas/barn-5", "barnabas/barn-8", "barnabas/barn-9", "1-clement/1-clem-8", "1-clement/1-clem-12", "didache/did-10", "diognetus/diogn-5"]) allowed.add(value);
  for (const value of ["1-clement/1-clem-11", "1-clement/1-clem-15", "1-clement/1-clem-16", "1-clement/1-clem-30", "1-clement/1-clem-43", "1-clement/1-clem-56", "barnabas/barn-13", "barnabas/barn-14", "barnabas/barn-16", "diognetus/diogn-7"]) allowed.add(value);
  for (const value of ["1-clement/1-clem-10", "1-clement/1-clem-14", "1-clement/1-clem-17", "1-clement/1-clem-18", "1-clement/1-clem-2", "1-clement/1-clem-21", "1-clement/1-clem-27", "1-clement/1-clem-29", "1-clement/1-clem-3", "1-clement/1-clem-32", "1-clement/1-clem-35", "1-clement/1-clem-39", "1-clement/1-clem-44", "1-clement/1-clem-49", "1-clement/1-clem-5", "1-clement/1-clem-50", "1-clement/1-clem-51", "1-clement/1-clem-52", "1-clement/1-clem-53", "1-clement/1-clem-54", "1-clement/1-clem-57", "1-clement/1-clem-59", "barnabas/barn-15", "barnabas/barn-2", "barnabas/barn-21", "barnabas/barn-3", "diognetus/diogn-11", "diognetus/diogn-2"]) allowed.add(value);
  for (const value of ["gospel-philip/becoming-christians", "gospel-philip/spiritual-growth", "gospel-philip/baptism-chrism-eucharist-bridal-chamber", "gospel-philip/uprooting-evil", "gospel-philip/conclusion", "gospel-philip/the-rulers", "gospel-philip/the-resurrection", "gospel-philip/father-son-and-holy-spirit", "gospel-philip/humans-and-animals", "gospel-philip/adam-eve-and-the-bridal-chamber", "gospel-philip/overcoming-the-world", "gospel-philip/seeing-jesus", "gospel-philip/the-mystery-of-marriage", "gospel-truth/restoring-what-was-needed", "gospel-truth/the-father-s-paradise", "gospel-truth/the-book-of-the-living", "gospel-truth/the-return-to-unity", "gospel-truth/error-and-forgetfulness"]) allowed.add(value);
  for (const value of []) allowed.add(value);
  for (const value of ["2-clement/2-clem-1", "2-clement/2-clem-16", "2-clement/2-clem-19", "2-clement/2-clem-6", "2-clement/2-clem-9", "shepherd-hermas/mandate-10", "shepherd-hermas/mandate-12", "shepherd-hermas/mandate-5", "shepherd-hermas/vision-1", "shepherd-hermas/vision-3-part-2"]) allowed.add(value);
  const excerptUrls = { "lightfoot-barnabas-goats-thorns": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-thorns-heart": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-sheep-lamb": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-two-peoples": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-aaron-rod": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-pillars": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-dust-smoke": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-wisdom-fruit": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-first-clement-pasture-prayer": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-yoke-sacrifice": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-fast-light": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-beast-covenant": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-sheep-sun": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "lightfoot-barnabas-vessel-body": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf", "acts-thomas-groom-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-creditor": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-youth-light": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-desert-temple": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-oil-121": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-open-treasury": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-prayer-opening": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-four-one": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-mother-houses": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-good-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-spirit-return": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-hidden-mother": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-dwelling-places": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-eagle-dream": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-life-loan": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bread-life": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-crown": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wedding-invitation": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-48": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-lost-sheep": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-old-new-58": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-heat-day": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-flock-wolves": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wolves-clothing": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-stolen-thoughts": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-10": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-birds": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-wealth": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-ask": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-95": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-143": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-physician-156": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bride-response": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-crowd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-bitter-tree": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-yoke": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-seed": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-mygdonia-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-soldiers": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-tower": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-oil": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",  "acts-thomas-bride": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-palace": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "acts-thomas-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf", "eusebius-talents": "https://en.wikisource.org/wiki/Page:The_Apocryphal_New_Testament_(1924).djvu/41", "acts-thomas-hymn": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf" };
  for (const edition of ["lightfoot-second-clement-small-great", "lightfoot-second-clement-house-robbers", "lightfoot-second-clement-barren", "lightfoot-second-clement-lips-heart", "lightfoot-second-clement-waiting-fruit", "lightfoot-hermas-tower-explanation", "lightfoot-hermas-three-forms", "lightfoot-hermas-beast-colors", "lightfoot-hermas-two-paths", "lightfoot-hermas-empty-vessels", "lightfoot-hermas-vineyard-servant-explanation", "lightfoot-hermas-clean-house"]) excerptUrls[edition] = lightfootScan;
  excerptUrls["lightfoot-second-clement-small-great"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=105";
  excerptUrls["lightfoot-second-clement-house-robbers"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=107";
  excerptUrls["lightfoot-second-clement-barren"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=102";
  excerptUrls["lightfoot-second-clement-lips-heart"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=103";
  excerptUrls["lightfoot-second-clement-waiting-fruit"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=110";
  excerptUrls["lightfoot-hermas-tower-explanation"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=428";
  excerptUrls["lightfoot-hermas-three-forms"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=433";
  excerptUrls["lightfoot-hermas-beast-colors"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=435";
  excerptUrls["lightfoot-hermas-two-paths"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=444";
  excerptUrls["lightfoot-hermas-empty-vessels"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=451";
  excerptUrls["lightfoot-hermas-vineyard-servant-explanation"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=461";
  excerptUrls["lightfoot-hermas-clean-house"] = "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=498";
  Object.assign(excerptUrls, eusebiusScanUrls);
  const originals = JSON.parse(await readFile(path.join(root, "src/lib/jesus/lightfoot-original-readers.json"), "utf8"));
  const catalog = JSON.parse(await readFile(path.join(root, "content/early-library/catalog.json"), "utf8"));
  if (!Array.isArray(catalog)) throw new Error("Invalid Early catalog.");
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
      } else if (figure.legacy && figure.edition === "epistula-apostolorum" && /^chapter-(24|31|32|43|44|45|47|49)$/.test(part.section)) {
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
    let original, continuation;
    if (figure.originalReader) {
      const source = figure.originalReader;
      const expected = originals[figure.id];
      if (!figure.excerpt || figure.edition !== `lightfoot-${figure.id}` || !expected || ["edition", "section", "start", "end"].some(key => source[key] !== expected[key])) throw new Error("Invalid original reader.");
      original = await mapOriginalReader(source, catalog, root);
      if (Object.hasOwn(originalContinuations, figure.id)) continuation = await mapOriginalReader(originalContinuations[figure.id], catalog, root);
    } else if (figure.edition.startsWith("lightfoot-")) throw new Error("Missing original reader.");
    return { ...figure, resolvedParts, texts, text, href: resolvedParts[0].href, original, continuation };
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
  if (!Array.isArray(stories) || stories.length !== 14 || new Set(stories.map(s => s.id)).size !== 14) throw new Error("Invalid James mappings.");
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
  const john = JSON.parse(await readFile(path.join(root, "public/jesus/john-figures.json"), "utf8"));
  const stories = validateThomasParables(JSON.parse(await readFile(path.join(root, "public/jesus/thomas-parables.json"), "utf8")));
  const early = JSON.parse(await readFile(path.join(root, "public/jesus/early-figures.json"), "utf8"));
  const james = JSON.parse(await readFile(path.join(root, "public/jesus/james-parables.json"), "utf8"));
  const numbers = [...new Set([...parables.flatMap((entry) => (entry.thomas ?? []).map((item) => item.saying)), ...figures.flatMap((entry) => (entry.thomas ?? []).map((item) => item.saying)), ...john.flatMap((entry) => (entry.thomas ?? []).map((item) => item.saying)), ...stories.map((story) => story.saying), ...early.flatMap(figure => (figure.thomas ?? []).map(item => item.saying)), ...james.flatMap(story => (story.thomas ?? []).map(item => item.saying))])];
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
