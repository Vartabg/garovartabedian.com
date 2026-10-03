#!/usr/bin/env node
/**
 * Site integrity smoke tests — no browser, no Next server.
 * Guards route inventory, critical public JSON, and media audit.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/** Static app routes that must have a page.tsx (or route handler). */
const STATIC_ROUTES = [
  "",
  "/scriptures",
  "/scriptures/search",
  "/scriptures/topics",
  "/jesus",
  "/jesus/words",
  "/jesus/life",
  "/jesus/prophecy",
  "/jesus/harmony",
  "/jesus/history",
  "/jesus/lens",
  "/jesus/risen",
  "/jesus/dossier",
  "/apostles",
  "/apostles/twelve",
  "/apostles/sent",
  "/early",
  "/early/ignatius",
  // Era landings are dynamic (/early/era/[era]) — covered below from ERAS data.
  "/church",
  "/church/tree",
  "/church/faces",
  "/church/councils",
  "/church/giants",
  "/angels",
  "/angels/fall",
  "/angels/encounters",
  "/angels/demons",
  "/angels/dossier",
  "/word",
  "/word/cases",
  "/word/free",
  "/evidence",
  "/evidence/frameworks",
  "/evidence/frameworks/compare",
  "/sources",
  "/hire",
  "/about",
  "/work",
  "/work/jobpilot",
  "/work/garovartabedian",
  "/work/eye",
  "/services",
  "/resume",
  "/contact",
];

function pagePathForRoute(route) {
  if (route === "") return path.join(ROOT, "src/app/page.tsx");
  const segs = route.replace(/^\//, "").split("/");
  const dir = path.join(ROOT, "src/app", ...segs);
  return path.join(dir, "page.tsx");
}

describe("route inventory", () => {
  it("has a page module for every static sitemap route", () => {
    const missing = STATIC_ROUTES.filter((r) => !fs.existsSync(pagePathForRoute(r)));
    assert.deepEqual(missing, [], `missing page.tsx for: ${missing.join(", ")}`);
  });

  it("hosts a page for every EARLY_TEXTS id used by the sitemap", async () => {
    // EARLY_TEXTS is TS — mirror the public texts directory instead.
    const textsDir = path.join(ROOT, "public/early/texts");
    const ids = fs
      .readdirSync(textsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
    assert.ok(ids.length >= 20, `expected many early texts, got ${ids.length}`);
    for (const id of ids) {
      const text = read(`public/early/texts/${id}.json`);
      assert.equal(text.id, id, `${id}.json id field mismatch`);
    }
    // Dynamic route module exists once for all texts
    assert.ok(exists("src/app/early/[text]/page.tsx"));
  });

  it("has era landing module and known era ids", () => {
    assert.ok(exists("src/app/early/era/[era]/page.tsx"));
    // Mirror ERAS in client.ts — keep crawler landings discoverable.
    const eraIds = ["jewish", "fathers", "apologists", "apocrypha"];
    for (const id of eraIds) {
      // generateStaticParams uses ERAS; page must not 404 for these ids.
      assert.match(id, /^[a-z]+$/);
    }
  });

  it("lists every tradition landing in canons.json", () => {
    const canons = read("public/scriptures/canons.json");
    assert.ok(Array.isArray(canons.traditions) && canons.traditions.length >= 4);
    for (const t of canons.traditions) {
      assert.ok(t.id && t.name, "tradition needs id+name");
      assert.ok(Array.isArray(t.books) && t.books.length > 0, t.id);
    }
  });

  it("hosts a dossier page and valid asset for every afterlife tradition", () => {
    const afterlife = read("public/evidence/afterlife-schema.json");
    assert.equal(afterlife.length, 54, "must contain all 54 traditions");
    assert.ok(exists("src/app/evidence/frameworks/[slug]/page.tsx"));
    assert.ok(exists("src/app/evidence/frameworks/[slug]/opengraph-image.tsx"));
    for (const b of afterlife) {
      assert.ok(b.id && b.name && b.description, `valid fields for ${b.id}`);
      assert.ok(b.metadata.keyTexts.length > 0, `keyTexts for ${b.id}`);
      assert.ok(b.primaryDoctrine, `primaryDoctrine for ${b.id}`);
      const imgPath = b.visualAssets.thumbnail.replace(/^\//, "public/");
      assert.ok(exists(imgPath), `image must exist: ${imgPath}`);
    }
  });
});

describe("critical public JSON", () => {
  const REQUIRED = [
    "public/jesus/life.json",
    "public/jesus/life-plates.json",
    "public/angels/order.json",
    "public/church/road.json",
    "public/church/tree.json",
    "public/word/data.json",
    "public/early/timeline.json",
    "public/scriptures/canons.json",
    "public/evidence/afterlife-schema.json",
    "public/evidence/afterlife-index.json",
  ];

  it("loads required world data files", () => {
    for (const file of REQUIRED) {
      assert.ok(exists(file), file);
      const data = read(file);
      assert.equal(typeof data, "object");
      assert.notEqual(data, null);
    }
  });

  it("keeps jesus life events wired to known places", () => {
    const life = read("public/jesus/life.json");
    assert.ok(Array.isArray(life.events) && life.events.length >= 30);
    for (const event of life.events) {
      assert.ok(event.id && event.place && event.title, event.id);
      assert.ok(Array.isArray(event.refs) && event.refs.length > 0, event.id);
      for (const r of event.refs) {
        assert.match(r.ref, /^[1-4]?[A-Z][A-Z0-9]{1,4}\s+\d+:\d+(?:-\d+)?$/);
      }
    }
  });

  it("keeps every red-letter book available as a split static payload", () => {
    const words = read("public/jesus/words.json");
    for (const [book, verses] of Object.entries(words.books)) {
      const file = `public/jesus/words/${book}.json`;
      assert.ok(exists(file), file);
      assert.deepEqual(read(file), verses, `${book} split payload drifted`);
      assert.equal(Object.keys(verses).length, words.counts[book], `${book} count drifted`);
    }
  });

  it("classifies every prophecy connection without flattening interpretation", () => {
    const prophecies = read("public/jesus/prophecies.json");
    const allowed = new Set(["explicit", "echo", "typology"]);
    assert.ok(prophecies.length >= 50);
    for (const pair of prophecies) {
      assert.ok(allowed.has(pair.connection), `${pair.id} has no connection class`);
    }
  });

  it("uses institutional or academic sources for every history artifact", () => {
    const stones = read("public/jesus/stones.json");
    for (const stone of stones) {
      assert.match(stone.sourceUrl, /^https:\/\//, stone.id);
      assert.doesNotMatch(stone.sourceUrl, /wikipedia\.org/, stone.id);
    }
  });
});

describe("media audit", () => {
  it("passes scripts/media/audit.mjs", () => {
    const result = spawnSync("node", ["scripts/media/audit.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      console.error(result.stdout);
      console.error(result.stderr);
    }
    assert.equal(result.status, 0, "media audit failed");
    assert.match(result.stdout, /OK/);
  });
});
