import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkStagedThomas, mapOriginalReader, mappedEarlyFigures, mappedSayings, stagedRequestHeaders, verifyLampGospelText, verifyThomasReader, validateGospelThomasAudit, mappedGospelThomasAudit, verifyAuditThomasPanel, ensureDisclosureOpen, validateLightfootSelections, validateEusebiusSelections } from "../scripts/release/check-staged-thomas.mjs";
import { projectId } from "../scripts/release/production.mjs";
import stories from "../public/jesus/thomas-parables.json";
import parables from "../public/jesus/parables.json";
import synoptic from "../public/jesus/synoptic-figures.json";
import john from "../public/jesus/john-figures.json";
import james from "../public/jesus/james-parables.json";
import audit from "./fixtures/parables-audit-gospel-thomas.json";
import eusebiusAudit from "./fixtures/parables-audit-eusebius.json";
import earlyFigures from "../public/jesus/early-figures.json";
import { routeStagedRequest } from "../scripts/release/staged-routing.mjs";

const sha = "a".repeat(40);
const url = "https://example-release.vercel.app";
const deployment = { projectId, url: "example-release.vercel.app", readyState: "READY", target: "production", meta: { githubCommitSha: sha } };
const html = '<article><h2 id="reading-heading">Saying 65: The Parable of the Sharecroppers</h2><p class="ew-canon-status">Outside the canon.</p><p data-reading-fragment="0">A [creditor] owned a vineyard</p></article>';
const sayings = [{ number: 65, expected: "A [creditor] owned a vineyard" }];

test("staged checks reject invalid, duplicate and self-referential comparisons", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "staged-early-"));
  try {
    const file = path.join(root, "public/jesus/early-figures.json");
    await mkdir(path.dirname(file), { recursive: true });
    for (const refs of [["missing"], ["didache-two-ways"], ["barnabas-two-ways", "barnabas-two-ways"]]) {
      const figures = structuredClone(earlyFigures);
      const item = figures.find(figure => figure.id === "didache-two-ways")!;
      item.earlyComparisons = refs;
      await writeFile(file, JSON.stringify(figures));
      await assert.rejects(mappedEarlyFigures(root), /Invalid Early comparison/);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("staged mapping rejects mismatched original readers and withholds duplicate catalog entries", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "staged-original-"));
  const put = async (relative: string, value: unknown) => {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(value));
  };
  const link = async (relative: string) => {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await symlink(path.join(process.cwd(), relative), target);
  };
  try {
    await Promise.all([link("content/early-library/readings"), link("content/jesus/early-excerpts"), link("public/early/texts"), link("src/lib/jesus/lightfoot-original-readers.json"), link("tests/fixtures/parables-audit-eusebius.json")]);
    const catalog = JSON.parse(await readFile("content/early-library/catalog.json", "utf8"));
    const published = catalog.find((item: { id: string }) => item.id === "1-clement");
    catalog.unshift({ ...published, publicationStatus: "deferred" });
    await put("content/early-library/catalog.json", catalog);
    await put("public/jesus/early-figures.json", earlyFigures);
    const mapped = await mappedEarlyFigures(root);
    assert.equal(mapped.find((item: { id: string }) => item.id === "first-clement-pillars").original.available, false);
    const wrong = structuredClone(earlyFigures);
    const item = wrong.find(figure => figure.id === "first-clement-pillars")!;
    item.originalReader!.section = "1-clem-6";
    await put("public/jesus/early-figures.json", wrong);
    await assert.rejects(mappedEarlyFigures(root), /Invalid original reader/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("staged reader targets include every Thomas-only story, including 97", async () => {
  const targets = await mappedSayings();
  for (const number of [4, 21, 26, 31, 33, 43, 45, 97, 98, 104]) assert.ok(targets.some((target: { number: number }) => target.number === number));
  assert.ok(targets.some((target: { number: number }) => target.number === 22));
  const numbers = targets.map((target: { number: number }) => target.number);
  assert.equal(new Set(numbers).size, numbers.length);
  for (const item of audit.thomas_candidates) assert.ok(numbers.includes(Number(item.candidate.split(" ")[1])), item.candidate);
  for (const item of james.flatMap(story => story.thomas ?? [])) assert.ok(numbers.includes(item.saying), `James Thomas ${item.saying}`);
});

test("staged targets reject an omitted story and missing 97 source", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "staged-thomas-"));
  const put = async (relative: string, value: unknown) => {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(value));
  };
  try {
    await put("public/jesus/parables.json", []);
    await put("public/jesus/early-figures.json", []);
    await put("public/jesus/synoptic-figures.json", [{ thomas: [{ saying: 33 }] }]);
    await put("public/jesus/john-figures.json", []);
    await put("public/jesus/james-parables.json", []);
    await put("public/jesus/thomas-parables.json", stories.filter(story => story.saying !== 97));
    await assert.rejects(mappedSayings(root), /Invalid Thomas/);
    await put("public/jesus/thomas-parables.json", stories);
    for (const number of new Set([33, ...stories.filter(story => story.saying !== 97).map(story => story.saying)])) {
      await put(`content/early-library/readings/gospel-thomas/saying-${number}.json`, {
        id: `saying-${number}`, kind: "primary-text", chars: 4, blocks: [{ kind: "primary-text", text: "text" }],
      });
    }
    await assert.rejects(mappedSayings(root), /saying-97\.json/);
    await put("content/early-library/readings/gospel-thomas/saying-97.json", { id: "saying-97", kind: "primary-text", chars: 4, blocks: [{ kind: "primary-text", text: "text" }] });
    await rm(path.join(root, "content/early-library/readings/gospel-thomas/saying-33.json"));
    await assert.rejects(mappedSayings(root), /saying-33\.json/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("the independent audit rejects omitted, renumbered and partially noted matches", async () => {
  await mappedGospelThomasAudit();
  const collections = {
    "public/jesus/parables.json": parables,
    "public/jesus/synoptic-figures.json": synoptic,
    "public/jesus/john-figures.json": john,
    "public/jesus/thomas-parables.json": stories,
    "public/jesus/james-parables.json": james,
    "public/jesus/early-figures.json": earlyFigures,
  };
  for (const change of ["missing", "number", "partial-note"] as const) {
    const copy = structuredClone(collections);
    const target = copy["public/jesus/synoptic-figures.json"].find(item => item.id === "synoptic-keys-entry")!;
    assert.ok(target.thomas);
    if (change === "missing") target.thomas = target.thomas.filter(item => item.saying !== 39);
    if (change === "number") target.thomas.find(item => item.saying === 39)!.saying = 38;
    if (change === "partial-note") target.thomas.find(item => item.saying === 39)!.note = "The keys and blocked entry";
    assert.throws(() => validateGospelThomasAudit(audit, copy), /Invalid Thomas placement or note/);
  }
  const copy = structuredClone(collections);
  (copy["public/jesus/parables.json"].find(item => item.id === "sower")!.accounts[0] as { explanation?: string }).explanation = "MAT 13:18-22";
  assert.throws(() => validateGospelThomasAudit(audit, copy), /Invalid Gospel audit target: sower/);
  const incomplete = structuredClone(audit);
  incomplete.thomas_candidates.pop();
  assert.throws(() => validateGospelThomasAudit(incomplete, collections), /Invalid Gospel\/Thomas audit inventory/);
  const missingPlacement = structuredClone(audit);
  missingPlacement.thomas_candidates.find(item => item.candidate === "Thomas 28")!.placements.pop();
  assert.throws(() => validateGospelThomasAudit(missingPlacement, collections), /Invalid Thomas audit source: 28/);
  const missingJames = structuredClone(collections);
  const fullness = missingJames["public/jesus/james-parables.json"].find(item => item.id === "james-fullness-sobriety")! as { note?: string };
  fullness.note = "The Gospel of Truth uses drunkenness.";
  assert.throws(() => validateGospelThomasAudit(audit, missingJames), /Invalid James early comparison/);
  const missingEarly = structuredClone(collections);
  const hermas = missingEarly["public/jesus/early-figures.json"].find(item => item.id === "hermas-wine-jars-temptation")!;
  hermas.earlyComparisons = [];
  assert.throws(() => validateGospelThomasAudit(audit, missingEarly), /Invalid early relationship: hermas-wine-jars-temptation/);
  for (const [id, wrong] of [["second-clement-temple-physician", "synoptic-physician"], ["second-clement-lips-heart", "what-defiles"]]) {
    const changed = structuredClone(collections);
    (changed["public/jesus/early-figures.json"].find(item => item.id === id)! as { related?: string }).related = wrong;
    assert.throws(() => validateGospelThomasAudit(audit, changed), new RegExp(`Invalid early relationship: ${id}`));
  }
  for (const id of ["hermas-tower", "hermas-tower-explanation", "hermas-vineyard-servant", "hermas-vineyard-servant-explanation"]) {
    const changed = structuredClone(collections);
    changed["public/jesus/early-figures.json"].find(item => item.id === id)!.earlyComparisons = [];
    assert.throws(() => validateGospelThomasAudit(audit, changed), new RegExp(`Invalid early relationship: ${id}`));
  }
});

test("staged continuation mapping rejects changed text and remains independent of the first reader", async () => {
  const catalog = JSON.parse(await readFile("content/early-library/catalog.json", "utf8"));
  const root = await mkdtemp(path.join(tmpdir(), "staged-continuation-"));
  try {
    for (const [section, end, sha256] of [
      ["vision-3-part-2", 1, "f061d421367fbc3aebc9603323f48de0b6f722a1a12936ccb3da2e4806cdd69c"],
      ["another-parable-part-2", 16, "7292491ca6cf5e34abef27737d473180c70da60b6964826ffd56f34c0d3e7258"],
    ] as const) {
      const source = { edition: "shepherd-hermas", section, start: 1, end, sha256 };
      const target = path.join(root, `content/early-library/readings/shepherd-hermas/${section}.json`);
      await mkdir(path.dirname(target), { recursive: true });
      const page = JSON.parse(await readFile(`content/early-library/readings/shepherd-hermas/${section}.json`, "utf8"));
      await writeFile(target, JSON.stringify(page));
      const good = await mapOriginalReader(source, catalog, root);
      assert.equal(good.available, true);
      assert.equal(good.texts.length, end);
      assert.equal(good.href, `/early/library/shepherd-hermas/${section}#p1`);
      page.blocks[0].text = page.blocks[0].text.replace(/\S/, "X");
      await writeFile(target, JSON.stringify(page));
      assert.equal((await mapOriginalReader(source, catalog, root)).available, false);
      const unpublished = structuredClone(catalog);
      unpublished.find((item: { id: string }) => item.id === "shepherd-hermas").publicationStatus = "deferred";
      assert.equal((await mapOriginalReader(source, unpublished, root)).available, false);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("all 23 Lightfoot selections match their independently pinned ranges and corrected originals", async () => {
  assert.equal(await validateLightfootSelections(earlyFigures), 23);
  const missing = structuredClone(earlyFigures).filter(item => item.id !== "hermas-seven-women");
  await assert.rejects(validateLightfootSelections(missing), /Invalid Lightfoot selection: hermas-seven-women/);
  const wrongReader = structuredClone(earlyFigures);
  wrongReader.find(item => item.id === "second-clement-small-great")!.originalReader!.end = 5;
  await assert.rejects(validateLightfootSelections(wrongReader), /Invalid Lightfoot original reader: second-clement-small-great/);
  const wrongRange = structuredClone(earlyFigures);
  wrongRange.find(item => item.id === "second-clement-two-masters-ages")!.end = 4;
  await assert.rejects(validateLightfootSelections(wrongRange), /Invalid Lightfoot range: second-clement-two-masters-ages/);
  const root = await mkdtemp(path.join(tmpdir(), "staged-lightfoot-"));
  try {
    for (const relative of ["src/lib/jesus/lightfoot-original-readers.json", "content/early-library/readings"]) {
      const destination = path.join(root, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await symlink(path.join(process.cwd(), relative), destination);
    }
    const excerpt = path.join(root, "content/jesus/early-excerpts/lightfoot-second-clement-small-great.json");
    await mkdir(path.dirname(excerpt), { recursive: true });
    await writeFile(excerpt, "{}");
    await assert.rejects(validateLightfootSelections(earlyFigures, root), /Invalid Lightfoot excerpt file: second-clement-small-great/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("all 138 Eusebius excerpts preserve scan links, speaker, notes, sources and Gospel placements", async () => {
  assert.equal((await validateEusebiusSelections(earlyFigures)).length, 138);
  const missing = structuredClone(earlyFigures).filter(item => item.id !== "eusebius-lee-net");
  await assert.rejects(validateEusebiusSelections(missing), /Invalid Eusebius mapping: eusebius-lee-net/);
  const wrongNote = structuredClone(earlyFigures);
  (wrongNote.find(item => item.id === "eusebius-lee-net")! as { note?: string }).note = "A net.";
  await assert.rejects(validateEusebiusSelections(wrongNote), /Invalid Eusebius mapping: eusebius-lee-net/);
  const wrongTarget = structuredClone(earlyFigures);
  (wrongTarget.find(item => item.id === "eusebius-lee-serpents-vipers")! as { related?: string }).related = "net";
  await assert.rejects(validateEusebiusSelections(wrongTarget), /Invalid Eusebius mapping: eusebius-lee-serpents-vipers/);
  const root = await mkdtemp(path.join(tmpdir(), "staged-eusebius-"));
  try {
    const fixture = structuredClone(eusebiusAudit);
    fixture.selections[0].scanUrl += "0";
    const file = path.join(root, "tests/fixtures/parables-audit-eusebius.json");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(fixture));
    await assert.rejects(validateEusebiusSelections(earlyFigures, root), /Invalid Eusebius mapping: eusebius-lee-house-ship-city/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("staged Thomas audit panel requires the full source, correct link and complete note", () => {
  const content = "Gospel of Thomas · Saying 39 · outside the canon Attributed to Jesus in this writing Keys and blocked entry. A separate serpents-and-doves saying.";
  const paragraphs = ["Keys and blocked entry."];
  const note = "A separate serpents-and-doves saying.";
  const href = "/early/library/gospel-thomas/saying-39";
  assert.doesNotThrow(() => verifyAuditThomasPanel(content, href, 39, paragraphs, note));
  assert.throws(() => verifyAuditThomasPanel(content, href, 40, paragraphs, note), /missing saying/);
  assert.throws(() => verifyAuditThomasPanel(content.replace("Attributed to Jesus in this writing", "An unnamed speaker"), href, 39, paragraphs, note), /missing saying/);
  assert.throws(() => verifyAuditThomasPanel(content, href, 39, ["Keys and blocked entry. Missing."], note), /missing saying/);
  assert.throws(() => verifyAuditThomasPanel(content.replace(note, "A separate saying."), href, 39, paragraphs, note), /missing saying/);
  assert.throws(() => verifyAuditThomasPanel(content, "/early/library/gospel-thomas/saying-40", 39, paragraphs, note), /missing saying/);
});

test("James comparisons contribute reader targets even when no Gospel or early figure links them", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "staged-james-thomas-"));
  const put = async (relative: string, value: unknown) => {
    const file = path.join(root, relative); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(value));
  };
  try {
    for (const file of ["parables", "synoptic-figures", "john-figures", "early-figures"]) await put(`public/jesus/${file}.json`, []);
    await put("public/jesus/thomas-parables.json", stories);
    await put("public/jesus/james-parables.json", [{ thomas: [{ saying: 13 }, { saying: 28 }] }]);
    for (const number of new Set([13, 28, ...stories.map(story => story.saying)])) await put(`content/early-library/readings/gospel-thomas/saying-${number}.json`, {
      id: `saying-${number}`, kind: "primary-text", chars: 4, blocks: [{ kind: "primary-text", text: "text" }],
    });
    const result = await mappedSayings(root);
    assert.ok(result.some((item: { number: number }) => item.number === 13));
    assert.ok(result.some((item: { number: number }) => item.number === 28));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("staged browser requests never send the bypass outside the verified origin", () => {
  const origin = new URL(url);
  assert.deepEqual(stagedRequestHeaders(`${url}/jesus/parables`, origin, { accept: "text/html" }, "secret"), { accept: "text/html", "x-vercel-protection-bypass": "secret" });
  assert.equal(stagedRequestHeaders("https://other.example/", origin, {}, "secret"), null);
  assert.equal(stagedRequestHeaders(`${url}.other.example/`, origin, {}, "secret"), null);
});

test("a transport failure is aborted without exposing the bypass", async () => {
  let aborted = false;
  await routeStagedRequest({
    request: () => ({ url: () => `${url}/`, headers: () => ({}) }),
    fetch: async () => { throw new Error("dummy-bypass in headers"); },
    abort: async () => { aborted = true; },
  }, new URL(url), "dummy-bypass");
  assert.equal(aborted, true);
});

test("the staged Gospel check rejects missing and empty texts", () => {
  const expected = ["Matthew text", "Mark text", "Luke eight", "Luke eleven"];
  assert.doesNotThrow(() => verifyLampGospelText(expected, expected));
  assert.throws(() => verifyLampGospelText(["Matthew text", "Mark text", "", "Luke eleven"], expected), /missing Gospel passage 3/);
  assert.throws(() => verifyLampGospelText(expected.slice(0, 3), expected), /missing a Gospel passage/);
});

test("a failed staged comparison blocks the release check", async () => {
  await assert.rejects(checkStagedThomas(url, sha, {
    sayings,
    readJson: async (endpoint: string) => endpoint.startsWith("/v13/") ? deployment : { id: projectId },
    request: async () => new Response(html, { status: 200 }),
    verifyComparison: async () => { throw new Error("lamp comparison failed"); },
  }), /lamp comparison failed/);
});

test("the staged probe uses only read-only lookups and an existing bypass in a request header", async () => {
  const calls: string[] = [];
  await checkStagedThomas(url, sha, {
    sayings,
    readJson: async (endpoint: string) => {
      calls.push(endpoint);
      return endpoint.startsWith("/v13/") ? deployment : { id: projectId, protectionBypass: { "existing-test-secret": { scope: "automation-bypass" } } };
    },
    request: async (target: RequestInfo | URL, options?: RequestInit) => {
      assert.equal(String(target), `${url}/early/library/gospel-thomas/saying-65`);
      assert.equal(options?.redirect, "manual");
      assert.deepEqual(options?.headers, { "x-vercel-protection-bypass": "existing-test-secret" });
      return new Response(html, { status: 200 });
    },
  });
  assert.deepEqual(calls, [`/v13/deployments/example-release.vercel.app`, `/v9/projects/${projectId}`]);
});

test("a mismatched deployment, missing access, or unsafe URL fails before exposing a bypass", async () => {
  let requests = 0;
  const request = async () => { requests++; return new Response("not authorized", { status: 302 }); };
  await assert.rejects(checkStagedThomas(url, sha, { sayings, readJson: async () => ({ ...deployment, projectId: "other" }), request }), /target does not match/);
  assert.equal(requests, 0);
  await assert.rejects(checkStagedThomas("https://example.com", sha, { sayings, readJson: async () => deployment, request }), /invalid deployment URL/);
  assert.equal(requests, 0);
  await assert.rejects(checkStagedThomas(url, sha, { sayings, readJson: async (endpoint: string) => endpoint.startsWith("/v13/") ? deployment : { id: projectId }, request }), /HTTP 302/);
  assert.equal(requests, 1);
});

test("any missing mapped reader fails the staged check", async () => {
  const targets = [sayings[0], { number: 66, expected: "stone the builders rejected" }];
  await assert.rejects(checkStagedThomas(url, sha, {
    sayings: targets,
    readJson: async (endpoint: string) => endpoint.startsWith("/v13/") ? deployment : { id: projectId },
    request: async (target: RequestInfo | URL) => new Response(String(target).endsWith("saying-65") ? html : "missing", { status: 200 }),
  }), /saying 66 is missing/);
});

test("only visible reader elements count; comments, scripts and hidden content do not", () => {
  assert.doesNotThrow(() => verifyThomasReader(html));
  assert.doesNotThrow(() => verifyThomasReader(html.replace("A [creditor] owned a vineyard", 'A [creditor]</p><p data-reading-fragment="1"> owned a vineyard')));
  for (const bad of ["", `<article><!-- ${html} --></article>`, `<article><script>${html}</script></article>`,
    html.replace("Saying 65:", "Saying 64:"), html.replace("Outside the canon.", ""), html.replace("A [creditor] owned a vineyard", ""),
    html.replace("A [creditor] owned a vineyard", "<span hidden>A [creditor] owned a vineyard</span>"),
    html.replace("A [creditor] owned a vineyard", "<script>A [creditor] owned a vineyard</script>"),
    html.replace("Outside the canon.", "<span hidden>Outside the canon.</span>"),
    html.replace("Saying 65:", "<span hidden>Saying 65:</span>"),
    html.replace('<p data-reading-fragment="0">', '<p data-reading-fragment="0" style="display:none">')]) {
    assert.throws(() => verifyThomasReader(bad), /missing its visible/);
  }
});


test("repeated staged checks leave an already-open comparison open", async () => {
  let open = false;
  let clicks = 0;
  const disclosure = {
    getAttribute: async (name: string) => name === "open" && open ? "" : null,
    locator: (selector: string) => ({ click: async () => { assert.equal(selector, "summary"); open = !open; clicks++; } }),
  };
  await ensureDisclosureOpen(disclosure);
  assert.equal(open, true);
  await ensureDisclosureOpen(disclosure);
  assert.equal(open, true);
  assert.equal(clicks, 1);
});
