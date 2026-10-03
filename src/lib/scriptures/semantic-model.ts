/**
 * Dependency-free constants shared by the main thread (semantic.ts) and the
 * query-embedding worker (embedder.worker.ts). The worker previously imported
 * these from semantic.ts — a main-thread module that itself dynamically
 * imports @huggingface/transformers — which made the worker chunk and the page
 * chunk depend on each other ("circular dependency between chunks" at build,
 * and un-hashable chunks in the browser cache). Keep this module import-free.
 */
export const SEMANTIC_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const SEMANTIC_DIMS = 384;

/**
 * Cache-generation segment for the self-hosted AI runtime assets. The URLs the
 * browser sees (/models/v1/…, /ort/v1/…) are rewritten to the on-disk files,
 * so the version bump is the only move needed to invalidate every browser and
 * CDN cache atomically when the model or the onnxruntime WASM is upgraded.
 * Bump when changing SEMANTIC_MODEL_ID or the @huggingface/transformers
 * dependency major — never otherwise.
 */
export const SEMANTIC_ASSETS_VERSION = "v1";
export const SEMANTIC_MODEL_PATH = `/models/${SEMANTIC_ASSETS_VERSION}/`;
export const SEMANTIC_WASM_PATH = `/ort/${SEMANTIC_ASSETS_VERSION}/`;

/** Model plus WASM bytes, rounded up; corpus shards are additional. */
export const SEMANTIC_DOWNLOAD_NOTICE =
  "The first meaning search downloads about 47 MB of model and runtime files, plus search data. Your browser can cache them for later visits.";
