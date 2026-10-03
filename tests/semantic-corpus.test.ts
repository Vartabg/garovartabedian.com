import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import { EARLY_TEXTS } from "../src/lib/early/client";
import type { EarlyText } from "../src/lib/early/types";

const ROOT = path.join(import.meta.dirname, "..");
const DIMS = 384;

type Index = {
  corpus: string;
  model: string;
  dims: number;
  quantization: string;
  generatedAt: string;
  entries: Record<string, unknown>[];
};

const read = (relative: string) => readFileSync(path.join(ROOT, relative));
const readIndex = (relative: string) => JSON.parse(read(relative).toString("utf8")) as Index;

const canons = canonsData as { books: Record<string, { name: string; chapters: number }> };

const manifest = JSON.parse(read("public/semantic-corpora/manifest.json").toString());
const CORPORA = ["words", "early", "afterlife", "library"].map(id => ({
  id, json: `public/semantic-corpora/${manifest.corpora[id].index.path}`,
  bin: `public/semantic-corpora/${manifest.corpora[id].rows.path}`,
}));
const corpusIndex = (id: string) => readIndex(CORPORA.find(c => c.id === id)!.json);

test("each corpus shard has exactly one row per entry", () => {
  for (const corpus of CORPORA) {
    const index = readIndex(corpus.json);
    const bytes = read(corpus.bin).length;
    assert.equal(index.dims, DIMS);
    assert.equal(
      bytes,
      index.entries.length * DIMS,
      `${corpus.id}: ${bytes} bytes for ${index.entries.length} entries`,
    );
    assert.equal(index.quantization, "int8-unit-127");
  }
});

test("every corpus uses the same model as the scripture index", () => {
  const scripture = JSON.parse(
    read("public/scriptures/semantic/manifest.json").toString("utf8"),
  ) as { model: string; dims: number };
  for (const corpus of CORPORA) {
    const index = readIndex(corpus.json);
    assert.equal(
      index.model,
      scripture.model,
      `${corpus.id} would need a second model download`,
    );
    assert.equal(index.dims, scripture.dims);
  }
});

test("the shipped index carries no passage text", () => {
  // The rooms already hold the wording. Shipping it again in the index would
  // double the download for nothing, so the build strips it — and this is the
  // check that keeps it stripped.
  for (const corpus of CORPORA) {
    const index = readIndex(corpus.json);
    for (const entry of index.entries) {
      assert.ok(!("text" in entry), `${corpus.id} entry still carries its text`);
    }
  }
});

test("every words entry points at a real verse of a real book", () => {
  const index = corpusIndex("words");
  assert.ok(index.entries.length > 2000, `only ${index.entries.length} sayings indexed`);
  const seen = new Set<string>();
  for (const entry of index.entries as {
    id: string;
    book: string;
    chapter: number;
    verse: number;
    label: string;
  }[]) {
    const meta = canons.books[entry.book];
    assert.ok(meta, `unknown book ${entry.book}`);
    assert.ok(
      entry.chapter >= 1 && entry.chapter <= meta.chapters,
      `${entry.id} is outside ${entry.book}`,
    );
    assert.ok(entry.verse >= 1, `${entry.id} has no verse`);
    assert.ok(entry.label.startsWith(meta.name), `${entry.id} is mislabelled`);
    assert.ok(!seen.has(entry.id), `${entry.id} appears twice`);
    seen.add(entry.id);

    // The room links straight into the reader, so a stale index would produce
    // links to verses that are not there.
    const source = JSON.parse(
      read(`public/jesus/words/${entry.book}.json`).toString("utf8"),
    ) as Record<string, string>;
    assert.ok(
      source[`${entry.chapter}:${entry.verse}`],
      `${entry.id} is not in the hosted words data`,
    );
  }
});

test("every early entry points at a real section of a hosted text", () => {
  const index = corpusIndex("early");
  const ids = new Set(EARLY_TEXTS.map((t) => t.id));
  for (const entry of index.entries as {
    id: string;
    textId: string;
    section: number;
    label: string;
  }[]) {
    assert.ok(ids.has(entry.textId), `unknown text ${entry.textId}`);
    const source = JSON.parse(
      read(`public/early/texts/${entry.textId}.json`).toString("utf8"),
    ) as EarlyText;
    assert.ok(
      source.sections[entry.section],
      `${entry.id} points past the end of ${entry.textId}`,
    );
  }
});

test("every afterlife entry points at a real belief system in the atlas", () => {
  const index = corpusIndex("afterlife");
  const schema = JSON.parse(read("public/evidence/afterlife-schema.json").toString("utf8")) as { id: string }[];
  const ids = new Set(schema.map((s) => s.id));
  assert.equal(new Set(index.entries.map(e => e.parentId)).size, 54);
  for (const entry of index.entries as { id: string; parentId: string; name: string; href: string }[]) {
    assert.ok(ids.has(entry.parentId), `unknown afterlife tradition ${entry.id}`);
    assert.ok(entry.href.startsWith("/evidence/frameworks/"), `invalid href ${entry.href}`);
  }
});

test("every library entry points at translated text in an expanded edition", () => {
  const index = corpusIndex("library");
  const parents = new Set(index.entries.map((entry) => (entry as { parentId: string }).parentId));
  assert.equal(parents.size, 4773);
  for (const entry of index.entries as { href: string; recordId: string; sectionId: string; source: { path: string } }[]) {
    assert.equal(entry.href, `/early/library/${entry.recordId}/${entry.sectionId}`);
    assert.equal(existsSync(path.join(ROOT, entry.source.path)), true);
  }
});

test("sampled quantized vectors stay close to unit length", () => {
  // The ranking code treats a dot product as cosine similarity. That is only
  // true while the rows stay normalised, and a quantisation change that broke
  // it would silently produce scores nobody could interpret.
  for (const corpus of CORPORA) {
    const index = readIndex(corpus.json);
    const bin = read(corpus.bin);
    for (let row = 0; row < index.entries.length; row += 97) {
      let norm = 0;
      for (let d = 0; d < DIMS; d++) {
        const value = bin.readInt8(row * DIMS + d) / 127;
        norm += value * value;
      }
      assert.ok(
        Math.abs(Math.sqrt(norm) - 1) < 0.02,
        `${corpus.id} row ${row} has norm ${Math.sqrt(norm).toFixed(3)}`,
      );
    }
  }
});
