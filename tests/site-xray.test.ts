import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import snapshot from "../public/meta/site-xray.json";
import { assertPublicString, collectSiteXray, literalPaths } from "../scripts/site/build-site-xray.mjs";
import { xrayFamilyFor } from "../src/lib/site/xray-families.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walkBuildScripts(directory: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walkBuildScripts(target));
    else if (entry.isFile() && /^build-.*\.(?:mjs|ts)$/.test(entry.name)) found.push(target);
  }
  return found.sort();
}

test("the public site x-ray snapshot matches the repository", () => {
  // prebuild regenerates the file and the release's generated-source check
  // fails on any diff, so the committed copy must already be current.
  assert.deepEqual(snapshot, collectSiteXray());
  assert.ok(snapshot.counts.publicJson > 1000);
  assert.ok(snapshot.counts.browserSpecs > 10);
  assert.ok(snapshot.routeTests.chapter.includes("scripture-study.spec.ts"));
  assert.ok(snapshot.routeTests.home.length > 0);
  assert.deepEqual(Object.keys(snapshot.worlds), ["scriptures", "jesus", "apostles", "early", "church", "word", "angels", "evidence"]);
  assert.ok(snapshot.worlds.scriptures.publicJson > 1000);
  assert.equal(snapshot.worlds.word.scripts, 0);
});

test("archived scripts under scripts/archive are excluded from active build script counts", () => {
  const allBuildScripts = walkBuildScripts(path.join(ROOT, "scripts"));
  const archivedBuildScripts = walkBuildScripts(path.join(ROOT, "scripts", "archive"));
  assert.ok(archivedBuildScripts.length >= 1, "expected at least one archived build-*.mjs script");
  assert.equal(
    collectSiteXray().counts.buildScripts,
    allBuildScripts.length - archivedBuildScripts.length,
  );
});

test("nothing private can leave the site x-ray builder", () => {
  assert.equal(assertPublicString("scripture-study.spec.ts", "a spec name"), "scripture-study.spec.ts");
  assert.throws(() => assertPublicString("/Users/x/site", "a path"), /Refusing/);
  assert.throws(() => assertPublicString("deadbeefcafe1234", "a hash"), /Refusing/);
  assert.throws(() => assertPublicString("https://example.com", "a url"), /Refusing/);
  assert.throws(() => assertPublicString("tests/e2e/a.spec.ts", "a relative path"), /Refusing/);
});

test("page kinds match paths the way the specs and the client both need", () => {
  assert.equal(xrayFamilyFor("/scriptures/protestant/MRK/4")?.id, "chapter");
  assert.equal(xrayFamilyFor("/scriptures/protestant/JHN/3?t=web&study=word-bridge#v16")?.id, "chapter");
  assert.equal(xrayFamilyFor("/scriptures/protestant/MRK")?.id, "book");
  assert.equal(xrayFamilyFor("/scriptures/word-bridge")?.id, "scriptures");
  assert.equal(xrayFamilyFor("/")?.id, "home");
  assert.equal(xrayFamilyFor("/work/garovartabedian")?.id, "work");
  assert.equal(xrayFamilyFor("/nowhere"), null);
  // The home page is matched only by an exact "/" literal, never by "/" inside a longer path.
  assert.deepEqual(literalPaths('await page.goto("/"); page.locator(\'a[href="/scriptures/polyglot"]\')'), ["/", "/scriptures/polyglot"]);
});
