import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildCharlesSupplement,
  loadCharlesBooks,
  publishCharlesSupplement,
  stageCharlesBooks,
  validateCharlesBook,
} from "../scripts/scriptures/charles-supplement.mjs";
import { BOOK_NAMES, CHARLES_BOOKS, TRADITIONS } from "../scripts/scriptures/canon-data.mjs";
import { renderScriptureSources } from "../scripts/scriptures/build-data.mjs";
import { parseScriptureQueryRef } from "../src/lib/scriptures/refs";
import { searchVersesFrom } from "../src/lib/scriptures/search";
import { traditionFor } from "../src/lib/scriptures/client";
import type { BookText, Canons, SearchMeta, SearchShard } from "../src/lib/scriptures/types";

const readJson = <T,>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;

test("published source notes retain Charles attribution and the other corpus records", () => {
  const sourceNotes = readFileSync("public/scriptures/SOURCES.md", "utf8");
  assert.equal(sourceNotes, renderScriptureSources());
  assert.match(sourceNotes, /Joshua Williams, Northwest Nazarene College/);
  assert.match(sourceNotes, /Oxford: Clarendon Press, 1913/);
  assert.match(sourceNotes, /## Nave's Topical Bible note/);
});

// Deliberately synthetic verses exercise indexing and publication independently
// of the separate source-transcription and verse-numbering audit.
const books = (): Record<string, BookText> => Object.fromEntries(
  Object.entries(CHARLES_BOOKS).map(([book, chapters]) => [book, {
    trans: "charles",
    book,
    name: BOOK_NAMES[book as keyof typeof BOOK_NAMES],
    chapters: Array.from({ length: chapters as number }, () =>
      book === "JUB" ? ["Mastêma observes the jubilees."] : ["Enoch sees the watchers."],
    ),
  }]),
);

function existingCatalog(): Canons {
  const catalog = readJson<Canons>("public/scriptures/canons.json");
  // Recreate the pre-Jubilees catalog even after generated fixtures are updated.
  catalog.bookOrder = catalog.bookOrder.filter((book) => book !== "JUB");
  delete catalog.books.JUB;
  for (const tradition of catalog.traditions) {
    tradition.books = tradition.books.filter((book) => book !== "JUB");
  }
  return catalog;
}

test("supplement catalog preserves existing search indices and places Jubilees only on its shelf", () => {
  const previous = existingCatalog();
  const before = structuredClone(previous);
  const bundle = buildCharlesSupplement(previous, { GEN: 1533 }, books());
  assert.deepEqual(previous, before, "building a supplement must not mutate live inputs");
  assert.deepEqual(bundle.canons.bookOrder.slice(0, before.bookOrder.length), before.bookOrder);
  assert.equal(bundle.canons.bookOrder.at(-1), "JUB");
  assert.deepEqual(bundle.canons.books.JUB, { name: "Jubilees", chapters: 50, trans: ["charles"] });
  assert.deepEqual(bundle.canons.books.ENO, { name: "1 Enoch", chapters: 108, trans: ["charles"] });
  assert.deepEqual(bundle.canons.traditions.filter((tradition: { books: string[] }) =>
    tradition.books.includes("JUB")).map((tradition: { id: string }) => tradition.id), ["ethiopian"]);
  assert.equal(bundle.shelf.GEN, 1533);
  assert.equal(bundle.shelf.ENO, 108);
  assert.equal(bundle.shelf.JUB, 50);
  assert.equal(traditionFor(bundle.canons, "JUB"), "ethiopian");
  assert.equal(parseScriptureQueryRef("Jubilees 50:1", bundle.canons)?.book, "JUB");
  assert.equal(parseScriptureQueryRef("Jubilees 51:1", bundle.canons), null);
  assert.ok(TRADITIONS.find((tradition) => tradition.id === "ethiopian")?.books.includes("JUB"));
});

test("every supplemental chapter is searchable with accented and unaccented terms", async () => {
  const bundle = buildCharlesSupplement(existingCatalog(), {}, books());
  const source = {
    canons: bundle.canons as Canons,
    meta: bundle.search.meta as SearchMeta,
    loadShard: async (shard: string) => ((bundle.search as Record<string, unknown>)[shard] ?? {}) as SearchShard,
  };
  for (const query of ["Mastema", "Mastêma"]) {
    const result = await searchVersesFrom(query, source);
    assert.equal(result.totalHits, 50);
    assert.ok(result.hits.every((hit) => hit.book === "JUB" && hit.verse === 1));
    assert.deepEqual(result.hits.map((hit) => hit.chapter), Array.from({ length: 50 }, (_, i) => i + 1));
  }
  const enoch = await searchVersesFrom("watchers", source);
  assert.equal(enoch.totalHits, 108);
  assert.ok(enoch.hits.every((hit) => hit.book === "ENO"));
});

test("missing chapters or empty verses cannot masquerade as a complete supplement", () => {
  const full = books();
  assert.throws(() => validateCharlesBook({ ...full.JUB, chapters: full.JUB.chapters.slice(0, 23) }, "JUB"), /complete 50-chapter/);
  const missingChapter = structuredClone(full.JUB);
  missingChapter.chapters[23] = [];
  assert.throws(() => validateCharlesBook(missingChapter, "JUB"), /24: missing or empty verses/);
  const missingVerse = structuredClone(full.JUB);
  missingVerse.chapters[49] = [" "];
  assert.throws(() => validateCharlesBook(missingVerse, "JUB"), /50: missing or empty verses/);
  assert.throws(() => validateCharlesBook({ ...full.JUB, trans: "web" }, "JUB"), /complete 50-chapter/);
  assert.throws(() => buildCharlesSupplement(existingCatalog(), {}, { JUB: full.JUB }), /Charles ENO/);
});

test("full-build staging preserves both ingested Charles files byte for byte", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "charles-staging-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const source = join(directory, "source");
  const target = join(directory, "staging");
  mkdirSync(join(source, "text/charles"), { recursive: true });
  const fixture = books();
  const originals = {
    ENO: Buffer.from(JSON.stringify({ ...fixture.ENO, sourceNote: "Preserve original metadata" }, null, "\t")),
    JUB: Buffer.from(`${JSON.stringify(fixture.JUB, null, 2)}\n`),
  };
  for (const [book, bytes] of Object.entries(originals)) {
    writeFileSync(join(source, `text/charles/${book}.json`), bytes);
  }

  const staged = stageCharlesBooks(source, target);
  assert.deepEqual(staged, loadCharlesBooks(source));
  for (const [book, bytes] of Object.entries(originals)) {
    assert.deepEqual(readFileSync(join(target, `text/charles/${book}.json`)), bytes);
    assert.deepEqual(readFileSync(join(source, `text/charles/${book}.json`)), bytes);
  }

  fixture.JUB.chapters.pop();
  writeFileSync(join(source, "text/charles/JUB.json"), JSON.stringify(fixture.JUB));
  const rejectedTarget = join(directory, "rejected");
  assert.throws(() => stageCharlesBooks(source, rejectedTarget), /complete 50-chapter/);
  assert.throws(() => readFileSync(join(rejectedTarget, "text/charles/ENO.json")), /ENOENT/);
});

test("targeted publication replaces only its catalog, shelf and index, and fails without changing live data", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "charles-supplement-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, "text/charles"), { recursive: true });
  mkdirSync(join(directory, "search/web"), { recursive: true });
  mkdirSync(join(directory, "search/charles"), { recursive: true });
  const fixture = books();
  for (const [book, text] of Object.entries(fixture)) {
    writeFileSync(join(directory, `text/charles/${book}.json`), JSON.stringify(text));
  }
  writeFileSync(join(directory, "canons.json"), JSON.stringify(existingCatalog()));
  writeFileSync(join(directory, "shelf.json"), JSON.stringify({ GEN: 1533 }));
  writeFileSync(join(directory, "search/web/ma.json"), '{"many":[[0,1,1]]}');
  writeFileSync(join(directory, "search/charles/stale.json"), '{"obsolete":[]}');
  const inputBytes = readFileSync(join(directory, "text/charles/ENO.json"), "utf8");

  // Targeted publication validates both supplements before its catalog can publish.
  assert.deepEqual(loadCharlesBooks(directory), fixture);
  const published = publishCharlesSupplement(directory);
  assert.deepEqual(readJson(join(directory, "canons.json")), published.canons);
  assert.deepEqual(readJson(join(directory, "shelf.json")), published.shelf);
  assert.equal(readFileSync(join(directory, "text/charles/ENO.json"), "utf8"), inputBytes);
  assert.equal(readFileSync(join(directory, "search/web/ma.json"), "utf8"), '{"many":[[0,1,1]]}');
  assert.throws(() => readFileSync(join(directory, "search/charles/stale.json")), /ENOENT/);
  assert.deepEqual(publishCharlesSupplement(directory), published, "targeted publication is idempotent");

  const liveCatalog = readFileSync(join(directory, "canons.json"), "utf8");
  const liveIndex = readFileSync(join(directory, "search/charles/ma.json"), "utf8");
  fixture.JUB.chapters[35] = [];
  writeFileSync(join(directory, "text/charles/JUB.json"), JSON.stringify(fixture.JUB));
  assert.throws(() => publishCharlesSupplement(directory), /36: missing or empty verses/);
  assert.equal(readFileSync(join(directory, "canons.json"), "utf8"), liveCatalog);
  assert.equal(readFileSync(join(directory, "search/charles/ma.json"), "utf8"), liveIndex);
});
