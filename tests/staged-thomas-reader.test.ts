import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkStagedThomas, mappedEarlyFigures, mappedSayings, stagedRequestHeaders, verifyLampGospelText, verifyThomasReader } from "../scripts/release/check-staged-thomas.mjs";
import { projectId } from "../scripts/release/production.mjs";
import stories from "../public/jesus/thomas-parables.json";
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

test("staged reader targets include every Thomas-only story, including 97", async () => {
  const targets = await mappedSayings();
  for (const number of [4, 21, 26, 31, 33, 43, 45, 97, 98, 104]) assert.ok(targets.some((target: { number: number }) => target.number === number));
  assert.ok(targets.some((target: { number: number }) => target.number === 22));
  assert.equal(new Set(targets.map((target: { number: number }) => target.number)).size, 30);
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
    await put("public/jesus/thomas-parables.json", stories.filter(story => story.saying !== 97));
    await assert.rejects(mappedSayings(root), /Invalid Thomas-only/);
    await put("public/jesus/thomas-parables.json", stories);
    for (const number of [21, 33, 98]) {
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
