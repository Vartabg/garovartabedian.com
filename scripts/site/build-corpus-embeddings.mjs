#!/usr/bin/env node
/** Token-bounded corpus indexes, published together through one verified manifest. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { modelRecipe, MODEL_ID, DIMS } from "../scriptures/build-embeddings.mjs";
import {
  sha256, jsonBytes, readOptionalJson, readObject, writeObject,
  publishManifest, verifyManifestRelease, withIndexLock,
} from "../scriptures/index-publication.mjs";
import { collectCorpora, CORPUS_SOURCE_PATH } from "./corpus-sources.mjs";
import { chunkText } from "./token-chunks.mjs";
export { collectWords, collectEarly, collectAfterlife, collectLibrary } from "./corpus-sources.mjs";
export { MODEL_ID, DIMS };
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const CORPORA = ["words", "early", "afterlife", "library"];
export const CHUNK_RECIPE = { version: "utf16-word-boundaries-v1", maxTokens: 384, overlapTokens: 48, specialTokens: 2, normalization: "whitespace-fold-v1" };

export function encoderRecipe(root) {
  const { model, dims, dtype, pooling, normalize, transformers, modelFiles } = modelRecipe(root);
  return { model, dims, dtype, pooling, normalize, transformers, modelFiles };
}
export async function loadCorpusTokenizer(root = ROOT) {
  const { env, AutoTokenizer } = await import("@huggingface/transformers");
  env.allowRemoteModels = false; env.allowLocalModels = true;
  env.localModelPath = path.join(root, "public/models/");
  return AutoTokenizer.from_pretrained(MODEL_ID);
}
export async function loadCorpusEmbedder(root = ROOT) {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowRemoteModels = false; env.allowLocalModels = true;
  env.localModelPath = path.join(root, "public/models/");
  return pipeline("feature-extraction", MODEL_ID, { dtype: "q8", device: "cpu" });
}
export function selectCorpora(args) {
  const options = args.filter((arg) => arg === "--corpus" || arg.startsWith("--corpus="));
  if (!options.length) return new Set(CORPORA);
  if (options.length !== 1) throw new Error("Specify --corpus once");
  const raw = options[0] === "--corpus" ? args[args.indexOf(options[0]) + 1] : options[0].slice(9);
  const names = (raw ?? "").split(",");
  if (new Set(names).size !== names.length || names.some((id) => !CORPORA.includes(id))) throw new Error("Invalid corpus selection");
  return new Set(names);
}
export function prepareCorpus(corpus, collection, tokenizer) {
  const inputs = [], entries = [];
  let maxParentTokens = 0, oversizedParents = 0;
  const sourceHashes = new Map(collection.sources.map((source) => [source.path, source.sha256]));
  const ids = new Set();
  for (const parent of collection.entries) {
    if (!parent.text || ids.has(parent.id)) throw new Error(`Empty or duplicate parent: ${parent.id}`);
    if (!CORPUS_SOURCE_PATH.test(parent.sourcePath) || !/^[a-f0-9]{64}$/.test(sourceHashes.get(parent.sourcePath) ?? "")) {
      throw new Error(`Missing source provenance: ${parent.id}`);
    }
    ids.add(parent.id);
    const tokens = tokenizer.encode(parent.text).length;
    maxParentTokens = Math.max(maxParentTokens, tokens);
    if (tokens > tokenizer.model_max_length) oversizedParents++;
    const chunks = chunkText(parent.text, (text) => tokenizer.encode(text).length, CHUNK_RECIPE);
    chunks.forEach((chunk, index) => {
      const metadata = { ...parent }; delete metadata.text; delete metadata.sourcePath;
      inputs.push(chunk.text);
      entries.push({ ...metadata, id: `${parent.id}@${chunk.start}-${chunk.end}`, parentId: parent.id,
        source: { path: parent.sourcePath, sha256: sourceHashes.get(parent.sourcePath), normalizedSha256: sha256(parent.text) },
        chunk: { index, count: chunks.length, start: chunk.start, end: chunk.end, tokens: chunk.tokens, sha256: sha256(chunk.text) },
      });
    });
  }
  return { inputs, entries, coverage: { parents: ids.size, chunks: entries.length, oversizedParents, maxParentTokens,
    maxChunkTokens: Math.max(0, ...entries.map((entry) => entry.chunk.tokens)) } };
}
export async function embedInputs(embed, inputs) {
  const rows = new Int8Array(inputs.length * DIMS);
  for (let start = 0; start < inputs.length; start += 48) {
    const batch = inputs.slice(start, start + 48);
    const output = await embed(batch, { pooling: "mean", normalize: true });
    try {
      if (output.data.length !== batch.length * DIMS || !output.data.every(Number.isFinite)) throw new Error("Invalid corpus inference output");
      for (let row = 0; row < batch.length; row++) {
        if (Math.abs(Math.hypot(...output.data.subarray(row * DIMS, (row + 1) * DIMS)) - 1) > 0.02) throw new Error("Non-unit corpus vector");
      }
      rows.set(Int8Array.from(output.data, (value) => Math.max(-127, Math.min(127, Math.round(value * 127)))), start * DIMS);
    } finally { output.dispose?.(); }
  }
  return Buffer.from(rows.buffer);
}
export async function buildCorpora({ root = ROOT, args = [], collect = collectCorpora, tokenizer, embed, encoder, beforePublish } = {}) {
  const selected = selectCorpora(args);
  const dir = path.join(root, "public/semantic-corpora");
  const localEncoder = encoder === undefined;
  encoder ??= encoderRecipe(root);
  tokenizer ??= await loadCorpusTokenizer(root);
  if (!Number.isInteger(tokenizer.model_max_length) || tokenizer.model_max_length < CHUNK_RECIPE.maxTokens) throw new Error("Chunk budget exceeds encoder input limit");
  const recipe = { encoder, chunking: CHUNK_RECIPE, aggregation: "best-chunk-per-parent-v1" };
  const collections = collect(root);
  const fingerprint = (id, collection) => sha256(jsonBytes({ corpus: id, recipe, collection }));
  return withIndexLock(root, "corpora", async () => {
    let previous;
    try { previous = readOptionalJson(path.join(dir, "manifest.json")); if (previous) verifyManifestRelease(previous); } catch { previous = null; }
    const prepared = {}, cached = {};
    for (const id of CORPORA) {
      prepared[id] = prepareCorpus(id, collections[id], tokenizer);
      const prior = previous?.corpora?.[id];
      if (prior?.fingerprint === fingerprint(id, collections[id])) {
        try {
          const rows = readObject(dir, prior.rows);
          const index = JSON.parse(readObject(dir, prior.index));
          if (index.schemaVersion === 2 && index.corpus === id && index.model === MODEL_ID && index.dims === DIMS &&
              index.quantization === "int8-unit-127" && JSON.stringify(index.recipe) === JSON.stringify(recipe) &&
              JSON.stringify(index.sources) === JSON.stringify(collections[id].sources) &&
              JSON.stringify(index.coverage) === JSON.stringify(prepared[id].coverage) &&
              Object.entries(prepared[id].coverage).every(([key, value]) => prior[key] === value) &&
              rows.length === prepared[id].entries.length * DIMS && JSON.stringify(index.entries) === JSON.stringify(prepared[id].entries)) cached[id] = prior;
        } catch { /* Selected corpora can be rebuilt; unselected corpora fail below. */ }
      }
      if (!selected.has(id) && !cached[id]) throw new Error(`Cannot preserve ${id}; run a full corpus build`);
    }
    const corpora = {}; let ownEmbedder;
    try {
      for (const id of CORPORA) {
        if (cached[id] && !(args.includes("--force") && selected.has(id))) { corpora[id] = cached[id]; continue; }
        if (!embed) embed = ownEmbedder = await loadCorpusEmbedder(root);
        const { inputs, entries, coverage } = prepared[id];
        if (!entries.length) throw new Error(`Empty corpus: ${id}`);
        const rows = writeObject(dir, await embedInputs(embed, inputs), "bin");
        const index = writeObject(dir, jsonBytes({ schemaVersion: 2, corpus: id, model: MODEL_ID, dims: DIMS,
          quantization: "int8-unit-127", recipe, sources: collections[id].sources, coverage, entries }), "json");
        corpora[id] = { fingerprint: fingerprint(id, collections[id]), rows, index, ...coverage };
        console.log(`${id}: ${coverage.parents} sources, ${coverage.chunks} chunks, max ${coverage.maxChunkTokens} tokens`);
      }
      await beforePublish?.();
      const latest = collect(root);
      if (CORPORA.some((id) => fingerprint(id, latest[id]) !== fingerprint(id, collections[id])) ||
          (localEncoder && JSON.stringify(encoderRecipe(root)) !== JSON.stringify(encoder))) throw new Error("Corpus sources or model changed during build");
      return publishManifest(dir, { schemaVersion: 1, model: MODEL_ID, dims: DIMS, quantization: "int8-unit-127",
        generatedBy: "scripts/site/build-corpus-embeddings.mjs", recipe, corpora }, previous,
      args.find((arg) => arg.startsWith("--generated-at="))?.slice(15));
    } finally { await ownEmbedder?.dispose?.(); }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildCorpora({ args: process.argv.slice(2) }).catch((error) => { console.error(error); process.exitCode = 1; });
}
