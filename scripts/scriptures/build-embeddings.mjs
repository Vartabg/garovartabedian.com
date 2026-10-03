#!/usr/bin/env node
/**
 * Build WEB verse vectors with the vendored browser model (q8, mean, normalized).
 * Usage: node scripts/scriptures/build-embeddings.mjs [--books=GEN,JHN] [--force]
 * Immutable, hashed shards are published by replacing manifest.json last.
 * A subset build preserves every unselected book after verifying its provenance.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sha256, jsonBytes, readJson, readOptionalJson, selectedBooks,
  withIndexLock, writeObject, readObject, publishManifest,
} from "./index-publication.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const DIMS = 384;
const BATCH = 48;

export function modelRecipe(root) {
  const modelFiles = ["config.json", "tokenizer.json", "tokenizer_config.json", "onnx/model_quantized.onnx"];
  return {
    model: MODEL_ID, dims: DIMS, dtype: "q8", pooling: "mean", normalize: true,
    preprocessing: "web-nonempty-trim-v1", quantization: "int8-unit-127",
    centroid: "mean-of-quantized-verses-normalized-v1",
    transformers: readJson(path.join(root, "package-lock.json")).packages["node_modules/@huggingface/transformers"].version,
    modelFiles: modelFiles.map((file) => ({
      path: file, sha256: sha256(fs.readFileSync(path.join(root, "public/models", MODEL_ID, file))),
    })),
  };
}

export function prepareBook(root, book, recipe) {
  const bytes = fs.readFileSync(path.join(root, "public/scriptures/text/web", `${book}.json`));
  const text = JSON.parse(bytes);
  if (text.book !== book || text.trans !== "web") throw new Error(`Wrong source identity: ${book}`);
  const refs = [], verses = [];
  for (const [c, chapter] of text.chapters.entries()) {
    for (const [v, verse] of chapter.entries()) {
      if (verse?.trim()) {
        refs.push([c + 1, v + 1]);
        verses.push(verse.trim());
      }
    }
  }
  if (!refs.length) throw new Error(`No verses in ${book}`);
  const sourceHash = sha256(bytes);
  const refsHash = sha256(jsonBytes(refs));
  return { book, refs, verses, sourceHash, refsHash,
    fingerprint: sha256(jsonBytes({ sourceHash, refsHash, recipe })),
  };
}

function quantize(values) {
  return Int8Array.from(values, (x) => Math.max(-127, Math.min(127, Math.round(x * 127))));
}

/** Fresh and cached builds both use quantized verse rows, including Buffer offsets. */
export function chapterCentroids(refs, bytes, dims = DIMS) {
  const rows = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (rows.length !== refs.length * dims) throw new Error("Verse matrix shape mismatch");
  const sums = new Map();
  refs.forEach(([chapter], row) => {
    if (!sums.has(chapter)) sums.set(chapter, new Float64Array(dims));
    const sum = sums.get(chapter);
    for (let d = 0; d < dims; d++) sum[d] += rows[row * dims + d];
  });
  return [...sums].map(([chapter, sum]) => {
    const norm = Math.hypot(...sum);
    if (!norm) throw new Error(`Zero centroid for chapter ${chapter}`);
    return [chapter, quantize(sum.map((x) => x / norm))];
  });
}

function cachedBook(dir, prior, input) {
  if (prior?.fingerprint !== input.fingerprint) return null;
  try {
    const rows = readObject(dir, prior.rows);
    const refs = JSON.parse(readObject(dir, prior.refs));
    if (rows.length !== input.refs.length * DIMS || refs.book !== input.book ||
        JSON.stringify(refs.refs) !== JSON.stringify(input.refs)) return null;
    return rows;
  } catch { return null; }
}

async function localEmbedder(root) {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = path.join(root, "public/models/");
  return pipeline("feature-extraction", MODEL_ID, { dtype: "q8", device: "cpu" });
}

/** Injected inference supports deterministic, offline publication failure tests. */
export async function buildEmbeddings({ root = ROOT, args = [], embed, recipe, beforePublish } = {}) {
  const dir = path.join(root, "public/scriptures/semantic");
  const canonsFile = path.join(root, "public/scriptures/canons.json");
  const canons = readJson(canonsFile);
  const canonsHash = sha256(fs.readFileSync(canonsFile));
  const books = canons.bookOrder.filter((book) => canons.books[book]?.trans.includes("web"));
  const selected = selectedBooks(args, books);
  if (!books.length) throw new Error("No WEB books available");
  const checkLocalModel = recipe === undefined;
  recipe ??= modelRecipe(root);
  const inputs = books.map((book) => prepareBook(root, book, recipe));
  return withIndexLock(root, "semantic", async () => {
    const previous = readOptionalJson(path.join(dir, "manifest.json"));
    const cached = new Map(inputs.map((input) => [input.book, cachedBook(dir, previous?.books?.[input.book], input)]));
    // Check all unselected dependencies BEFORE inference or artifact writes.
    for (const input of inputs) {
      if (selected && !selected.has(input.book) && !cached.get(input.book)) {
        throw new Error(`Cannot preserve ${input.book}: missing, stale or corrupt provenance. Run a full embedding build.`);
      }
    }
    const chapterIndex = [], centroids = [], verseCounts = {}, artifacts = {};
    let ownEmbedder;
    try {
      for (const input of inputs) {
        const shouldForce = args.includes("--force") && (!selected || selected.has(input.book));
        let rows = shouldForce ? null : cached.get(input.book);
        if (!rows) {
          if (!embed) embed = ownEmbedder = await localEmbedder(root);
          const matrix = new Int8Array(input.refs.length * DIMS);
          for (let start = 0; start < input.verses.length; start += BATCH) {
            const batch = input.verses.slice(start, start + BATCH);
            const result = await embed(batch, { pooling: "mean", normalize: true });
            try {
              if (result.data.length !== batch.length * DIMS || !result.data.every(Number.isFinite)) {
                throw new Error(`Invalid inference output for ${input.book}`);
              }
              for (let row = 0; row < batch.length; row++) {
                const vector = result.data.subarray(row * DIMS, (row + 1) * DIMS);
                const norm = Math.hypot(...vector);
                if (Math.abs(norm - 1) > 0.02) throw new Error(`Non-unit vector for ${input.book}`);
              }
              matrix.set(quantize(result.data), start * DIMS);
            } finally { result.dispose?.(); }
          }
          rows = Buffer.from(matrix.buffer, matrix.byteOffset, matrix.byteLength);
          console.log(`${input.book}: embedded ${input.refs.length} verses`);
        }
        const rowArtifact = writeObject(dir, rows, "bin");
        const refArtifact = writeObject(dir, jsonBytes({ book: input.book, refs: input.refs }), "json");
        artifacts[input.book] = {
          fingerprint: input.fingerprint, sourceHash: input.sourceHash, refsHash: input.refsHash,
          rows: rowArtifact, refs: refArtifact,
        };
        verseCounts[input.book] = input.refs.length;
        for (const [chapter, centroid] of chapterCentroids(input.refs, rows)) {
          chapterIndex.push([input.book, chapter]);
          centroids.push(Buffer.from(centroid));
        }
      }
      const chapters = writeObject(dir, Buffer.concat(centroids), "bin");
      const payload = {
        schemaVersion: 2, model: MODEL_ID, dims: DIMS, quantization: "int8-unit-127", translation: "web",
        generatedBy: "scripts/scriptures/build-embeddings.mjs", recipe,
        chapterIndex, verseCounts, chapters, books: artifacts,
      };
      await beforePublish?.();
      // Sources can change during a long inference run. Never publish stale bindings.
      for (const input of inputs) {
        if (prepareBook(root, input.book, recipe).fingerprint !== input.fingerprint) throw new Error(`Source changed during build: ${input.book}; rerun`);
      }
      if (sha256(fs.readFileSync(canonsFile)) !== canonsHash ||
          (checkLocalModel && JSON.stringify(modelRecipe(root)) !== JSON.stringify(recipe))) {
        throw new Error("Canon or model configuration changed during build; rerun");
      }
      const manifest = publishManifest(dir, payload, previous);
      console.log(`Published ${books.length} books, ${chapterIndex.length} chapters, ${Object.values(verseCounts).reduce((a, b) => a + b, 0)} verses`);
      return manifest;
    } finally { await ownEmbedder?.dispose?.(); }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildEmbeddings({ args: process.argv.slice(2) }).catch((error) => { console.error(error); process.exitCode = 1; });
}
