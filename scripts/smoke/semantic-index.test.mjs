#!/usr/bin/env node
/**
 * Semantic index integrity — guards the static embedding artifacts that
 * scripts/scriptures/build-embeddings.mjs writes and the browser ranks.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { readObject, sha256, jsonBytes } from "../scriptures/index-publication.mjs";
import { modelRecipe, prepareBook, chapterCentroids } from "../scriptures/build-embeddings.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SEMANTIC = path.join(ROOT, "public/scriptures/semantic");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

describe("semantic embedding index", () => {
  const manifest = readJson(path.join(SEMANTIC, "manifest.json"));

  it("declares the model contract the client depends on", () => {
    assert.equal(manifest.schemaVersion, 2);
    assert.deepEqual(manifest.recipe, modelRecipe(ROOT));
    const payload = { ...manifest };
    const releaseId = payload.releaseId;
    delete payload.releaseId; delete payload.generatedAt;
    assert.equal(releaseId, sha256(jsonBytes(payload)));
    assert.equal(manifest.model, "Xenova/all-MiniLM-L6-v2");
    assert.equal(manifest.dims, 384);
    assert.equal(manifest.quantization, "int8-unit-127");
    assert.equal(manifest.translation, "web");
  });

  it("covers every WEB book, chapter, and non-empty verse", () => {
    const canons = readJson(path.join(ROOT, "public/scriptures/canons.json"));
    const webBooks = canons.bookOrder.filter((b) =>
      canons.books[b]?.trans.includes("web"),
    );
    assert.deepEqual(
      Object.keys(manifest.verseCounts).sort(),
      [...webBooks].sort(),
    );

    for (const book of webBooks) {
      const text = readJson(
        path.join(ROOT, `public/scriptures/text/web/${book}.json`),
      );
      const nonEmpty = text.chapters.reduce(
        (sum, ch) => sum + ch.filter((v) => v && v.trim()).length,
        0,
      );
      assert.equal(
        manifest.verseCounts[book],
        nonEmpty,
        `${book} verse count matches the hosted text`,
      );
    }
  });

  it("chapter centroid matrix matches the chapter index", () => {
    const size = readObject(SEMANTIC, manifest.chapters).length;
    assert.equal(size, manifest.chapterIndex.length * manifest.dims);
  });

  it("every verse shard matches its ref sidecar and verse count", () => {
    for (const [book, count] of Object.entries(manifest.verseCounts)) {
      const bytes = readObject(SEMANTIC, manifest.books[book].rows);
      const bin = bytes.length;
      assert.equal(bin, count * manifest.dims, `${book}.bin row count`);
      const refs = JSON.parse(readObject(SEMANTIC, manifest.books[book].refs)).refs;
      const input = prepareBook(ROOT, book, manifest.recipe);
      assert.equal(manifest.books[book].fingerprint, input.fingerprint);
      assert.deepEqual(refs, input.refs);
      const centroids = chapterCentroids(refs, bytes);
      const chapters = readObject(SEMANTIC, manifest.chapters);
      for (const [chapter, vector] of centroids) {
        const row = manifest.chapterIndex.findIndex(([b, c]) => b === book && c === chapter);
        assert.ok(row >= 0);
        assert.deepEqual(chapters.subarray(row * manifest.dims, (row + 1) * manifest.dims), Buffer.from(vector));
      }
      assert.equal(refs.length, count, `${book}.json ref count`);
      for (const [chapter, verse] of refs) {
        assert.ok(chapter >= 1 && verse >= 1, `${book} refs are 1-based`);
      }
    }
  });
});
