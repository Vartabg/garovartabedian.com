#!/usr/bin/env node
/**
 * Site facts for the Engineer lens: how many build scripts, generated files
 * and tests the repository holds, and which browser specs name each kind of
 * page. Everything is counted from the file system, so the committed snapshot
 * is a pure function of the repository: a stale copy fails
 * tests/site-xray.test.ts, and the release's generated-source check fails on
 * the regenerated diff.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathOnly, xrayFamilyFor } from "../../src/lib/site/xray-families.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SITE_XRAY_PATH = path.join(ROOT, "public/meta/site-xray.json");

// Only plain words, digits and light punctuation leave the builder. No slash
// (file names are basenames), no hex run, no URL, no home directory.
const PUBLIC_STRING = /^[A-Za-z0-9][A-Za-z0-9 .,:()'-]{0,79}$/;

export function assertPublicString(value, where) {
  if (
    typeof value !== "string" ||
    !PUBLIC_STRING.test(value) ||
    /[0-9a-f]{7,}/i.test(value) ||
    /http/i.test(value) ||
    value.includes("/")
  ) {
    throw new Error(`Refusing to publish ${where}: ${JSON.stringify(value)}`);
  }
  return value;
}

function walk(directory, keep) {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walk(target, keep));
    else if (entry.isFile() && keep(entry.name)) found.push(target);
  }
  return found.sort();
}

const files = (directory, keep) => walk(path.join(ROOT, directory), keep);
const top = (directory, keep) =>
  fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true })
    .filter((entry) => entry.isFile() && keep(entry.name))
    .map((entry) => path.join(ROOT, directory, entry.name))
    .sort();

/** Literal paths a spec navigates to or asserts on, such as "/scriptures/protestant/MRK/4". */
export function literalPaths(source) {
  const paths = new Set();
  for (const match of source.matchAll(/["'`](\/[^"'`\s]*)["'`]/g)) paths.add(pathOnly(match[1]));
  return [...paths];
}

/** The eight worlds with a home page: generated files under public/<id>, scripts under scripts/<id>. */
export const WORLD_IDS = ["scriptures", "jesus", "apostles", "early", "church", "word", "angels", "evidence"];

function countIn(directory, keep) {
  return fs.existsSync(path.join(ROOT, directory)) ? files(directory, keep).length : 0;
}

export function collectSiteXray() {
  const specs = top("tests/e2e", (name) => name.endsWith(".spec.ts"));
  const routeTests = {};
  for (const spec of specs) {
    const families = new Set();
    for (const literal of literalPaths(fs.readFileSync(spec, "utf8"))) {
      const family = xrayFamilyFor(literal);
      if (family) families.add(family.id);
    }
    for (const id of families) (routeTests[id] ??= []).push(path.basename(spec));
  }
  const sorted = Object.fromEntries(
    Object.keys(routeTests).sort().map((id) => [assertPublicString(id, "a page kind"), routeTests[id].sort().map((name) => assertPublicString(name, "a spec name"))]),
  );
  return {
    schemaVersion: 1,
    counts: {
      buildScripts: files("scripts", (name) => /^build-.*\.(?:mjs|ts)$/.test(name)).length,
      publicJson: files("public", (name) => name.endsWith(".json")).length,
      unitTestFiles: top("tests", (name) => /\.test\.tsx?$/.test(name)).length,
      browserSpecs: specs.length,
      smokeChecks: top("scripts/smoke", (name) => name.endsWith(".test.mjs")).length,
    },
    routeTests: sorted,
    worlds: Object.fromEntries(
      WORLD_IDS.map((id) => [id, {
        publicJson: countIn(path.join("public", id), (name) => name.endsWith(".json")),
        scripts: countIn(path.join("scripts", id), (name) => /\.(?:mjs|js|ts|py|sh)$/.test(name)),
      }]),
    ),
  };
}

export function writeSiteXray() {
  const snapshot = collectSiteXray();
  fs.mkdirSync(path.dirname(SITE_XRAY_PATH), { recursive: true });
  fs.writeFileSync(SITE_XRAY_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return snapshot;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const snapshot = writeSiteXray();
  console.log(
    `Site x-ray: ${snapshot.counts.buildScripts} build scripts, ${snapshot.counts.publicJson} public JSON files, ${snapshot.counts.browserSpecs} browser specs`,
  );
  console.log(path.relative(ROOT, SITE_XRAY_PATH));
}
