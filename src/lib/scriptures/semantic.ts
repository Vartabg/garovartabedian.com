/**
 * Semantic ("by meaning") search — the vector counterpart to the exact-word
 * concordance. The corpus was embedded at build time by
 * scripts/scriptures/build-embeddings.mjs with the same open model the browser
 * downloads here, so query and verses share one vector space. Every verified
 * WEB book is scanned; chapter centroids no longer exclude candidate books.
 * No server, no API, no generated answer — every hit opens the hosted text.
 */

import { recoveringEmbedder, workerTransport, type QueryEmbedder } from "./semantic-worker";
import { inlineEmbedder } from "./inline-embedder";
import { rankRows, rankRowsAsync, validateMatrix, type RankedRow } from "./semantic-ranking";
import { throwIfAborted, waitForShared } from "./semantic-task";
export { rankRows, scoreRow, validateMatrix } from "./semantic-ranking";
import type { VerseHit } from "./types";

export { SEMANTIC_DIMS, SEMANTIC_MODEL_ID } from "./semantic-model";
import {
  SEMANTIC_DIMS,
  SEMANTIC_MODEL_ID,
} from "./semantic-model";
/** Historical narrowing, retained only for reproducible diagnostics. */
const TOP_CHAPTERS = 48;
const MAX_BOOKS = 14;
const MAX_HITS = 40;

export type SemanticArtifact = { path: string; sha256: string; bytes: number };

export type SemanticManifest = {
  schemaVersion?: number;
  releaseId?: string;
  chapters?: SemanticArtifact;
  books?: Record<string, { rows: SemanticArtifact; refs: SemanticArtifact }>;
  model: string;
  dims: number;
  quantization: string;
  translation: "web";
  generatedAt: string;
  /** [book, chapter] per chapter-centroid row in chapters.bin. */
  chapterIndex: [string, number][];
  verseCounts: Record<string, number>;
};

export type SemanticHit = VerseHit & {
  /** Cosine similarity of query and verse embeddings, 0..1-ish. */
  score: number;
};

export type SemanticResult = {
  hits: SemanticHit[];
  model: string;
  /** Books whose verse shards were actually scanned. */
  scannedBooks: string[];
};

/** The previous narrowing policy remains available for diagnostic comparisons. */
export function semanticCandidateBooks(query: Float32Array | number[], manifest: SemanticManifest, chapters: Int8Array, policy: "full" | "narrow" = "full"): string[] {
  validateMatrix(query, chapters, manifest.dims, manifest.chapterIndex.length);
  if (policy === "full") return Object.keys(manifest.books ?? manifest.verseCounts);
  return candidateBooks(rankRows(query, chapters, manifest.dims, TOP_CHAPTERS), manifest);
}

function candidateBooks(topChapters: RankedRow[], manifest: SemanticManifest): string[] {
  const books: string[] = [];
  for (const { row } of topChapters) {
    const book = manifest.chapterIndex[row][0];
    if (!books.includes(book)) books.push(book);
    if (books.length >= MAX_BOOKS) break;
  }
  return books;
}

const binCache = new Map<string, Promise<Int8Array>>();

export function loadBin(path: string): Promise<Int8Array> {
  let hit = binCache.get(path);
  if (!hit) {
    hit = fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`${path}: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => new Int8Array(buffer))
      .catch((error) => {
        binCache.delete(path);
        throw error;
      });
    binCache.set(path, hit);
  }
  return hit;
}

const SEMANTIC_ROOT = "/scriptures/semantic/";
export function semanticArtifactUrl(artifact: SemanticArtifact): string {
  if (!artifact || !/^objects\/[a-f0-9]{64}\.(bin|json)$/.test(artifact.path) ||
      !/^[a-f0-9]{64}$/.test(artifact.sha256) || !Number.isInteger(artifact.bytes) || artifact.bytes < 0 ||
      !artifact.path.includes(artifact.sha256)) throw new Error("Invalid semantic artifact");
  return SEMANTIC_ROOT + artifact.path;
}

export async function loadSemanticArtifact(artifact: SemanticArtifact): Promise<Int8Array> {
  const url = semanticArtifactUrl(artifact);
  const rows = await loadBin(url);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(rows))),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (rows.length !== artifact.bytes || hash !== artifact.sha256) {
    binCache.delete(url);
    throw new Error("Semantic artifact integrity failure; reload and retry");
  }
  return rows;
}

export function validateSemanticManifest(manifest: SemanticManifest): void {
  if (manifest.schemaVersion !== 2 || manifest.model !== SEMANTIC_MODEL_ID || manifest.dims !== SEMANTIC_DIMS ||
      manifest.quantization !== "int8-unit-127" || manifest.translation !== "web" ||
      !manifest.chapters || !manifest.books || !Array.isArray(manifest.chapterIndex)) {
    throw new Error("Incompatible semantic index; reload and retry");
  }
  semanticArtifactUrl(manifest.chapters);
  if (manifest.chapters.bytes !== manifest.chapterIndex.length * manifest.dims) throw new Error("Invalid chapter matrix size");
  const seen = new Set<string>();
  for (const [book, chapter] of manifest.chapterIndex) {
    const key = `${book}:${chapter}`;
    if (!/^[A-Z0-9]{3}$/.test(book) || !Number.isInteger(chapter) || chapter < 1 || seen.has(key) || !manifest.books[book]) {
      throw new Error("Invalid chapter index");
    }
    seen.add(key);
  }
  if (Object.keys(manifest.books).length !== Object.keys(manifest.verseCounts).length) throw new Error("Book coverage mismatch");
  for (const [book, artifacts] of Object.entries(manifest.books)) {
    semanticArtifactUrl(artifacts.rows);
    semanticArtifactUrl(artifacts.refs);
    const count = manifest.verseCounts[book];
    if (!Number.isInteger(count) || count <= 0 || artifacts.rows.bytes !== count * manifest.dims ||
        !manifest.chapterIndex.some(([id]) => id === book)) throw new Error("Invalid verse matrix size");
  }
}

/** Detect accidental metadata/row-order edits without a matching release binding. */
export async function verifySemanticManifestRelease(manifest: SemanticManifest): Promise<void> {
  const payload: Partial<SemanticManifest> = { ...manifest };
  delete payload.releaseId; delete payload.generatedAt;
  const bytes = new TextEncoder().encode(`${JSON.stringify(payload)}\n`);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (hash !== manifest.releaseId) throw new Error("Semantic manifest integrity failure");
}

let manifestPromise: Promise<SemanticManifest> | null = null;
export function loadSemanticManifest(): Promise<SemanticManifest> {
  manifestPromise ??= fetch(`${SEMANTIC_ROOT}manifest.json`).then(async (res) => {
    if (!res.ok) throw new Error(`semantic manifest: ${res.status}`);
    const manifest = await res.json() as SemanticManifest;
    validateSemanticManifest(manifest);
    await verifySemanticManifestRelease(manifest);
    return manifest;
  }).catch((error) => { manifestPromise = null; throw error; });
  return manifestPromise;
}

export async function loadSemanticChapterRows(manifest: SemanticManifest): Promise<Int8Array> {
  if (!manifest.chapters) throw new Error("Missing chapter artifact");
  const rows = await loadSemanticArtifact(manifest.chapters);
  if (rows.length !== manifest.chapterIndex.length * manifest.dims) throw new Error("Chapter coverage mismatch");
  return rows;
}

export async function loadSemanticBook(manifest: SemanticManifest, book: string) {
  const artifacts = manifest.books?.[book];
  if (!artifacts) throw new Error(`Missing semantic book: ${book}`);
  const [rows, refBytes] = await Promise.all([loadSemanticArtifact(artifacts.rows), loadSemanticArtifact(artifacts.refs)]);
  const refFile = JSON.parse(new TextDecoder().decode(refBytes)) as { book: string; refs: [number, number][] };
  if (refFile.book !== book || !Array.isArray(refFile.refs) || refFile.refs.length !== manifest.verseCounts[book] ||
      rows.length !== refFile.refs.length * manifest.dims) throw new Error("Verse references do not match vector rows");
  const chapters = new Set(manifest.chapterIndex.filter(([id]) => id === book).map(([, chapter]) => chapter));
  let lastChapter = 0, lastVerse = 0;
  for (const [chapter, verse] of refFile.refs) {
    if (!Number.isInteger(chapter) || !Number.isInteger(verse) || verse < 1 || !chapters.has(chapter) ||
        chapter < lastChapter || (chapter === lastChapter && verse <= lastVerse)) throw new Error("Invalid verse reference order");
    lastChapter = chapter; lastVerse = verse;
  }
  return { rows, refs: refFile.refs };
}

type Embedder = QueryEmbedder;
let embedderPromise: Promise<Embedder> | null = null;

/**
 * Lazily download the model (~23 MB, once; the browser caches it) and return
 * a query embedder. Runs fully in the browser via onnxruntime WASM. Model and
 * WASM runtime are self-hosted under /models/ and /ort/ — the site's strict
 * CSP allows only its own assets, and this keeps it that way.
 *
 * The work happens in a Web Worker. Inference is heavy enough that running it
 * on the main thread froze the tab on a phone for the whole download and again
 * for every query. If the worker cannot start at all — an old browser, a
 * blocked blob: URL — this falls back to the main thread, because a page that
 * stutters is better than a feature that is simply missing.
 */
export function loadQueryEmbedder(): Promise<Embedder> {
  embedderPromise ??= Promise.resolve(recoveringEmbedder(
    async () => {
      if (typeof Worker === "undefined") throw new Error("No worker support");
      return workerTransport(new Worker(new URL("./embedder.worker.ts", import.meta.url), { type: "module" }));
    },
    async () => inlineEmbedder(),
  ));
  return embedderPromise;
}

export async function searchSemantic(
  query: string,
  onProgress?: (status: string) => void,
  { signal }: { signal?: AbortSignal } = {},
): Promise<SemanticResult> {
  throwIfAborted(signal);
  const progress = (status: string) => { if (!signal?.aborted) onProgress?.(status); };
  const [manifest, embedder] = await waitForShared(Promise.all([
    loadSemanticManifest(), loadQueryEmbedder(),
  ]), signal);
  throwIfAborted(signal);
  progress("Preparing your query...");
  const queryVec = await waitForShared(embedder([query], { signal, onProgress: progress }), signal);
  const ranking = { signal, budget: { started: performance.now() } };
  const books = Object.keys(manifest.books!);
  throwIfAborted(signal);
  progress(`Searching all ${books.length} indexed WEB books...`);
  // Fetch shared artifacts together, then rank with one shared time budget.
  const loaded = await waitForShared(Promise.all(books.map(book => loadSemanticBook(manifest, book))), signal);
  const hits: SemanticHit[] = [];
  for (let i = 0; i < books.length; i++) {
    throwIfAborted(signal);
    const { rows, refs } = loaded[i];
    for (const { row, score } of await rankRowsAsync(queryVec, rows, manifest.dims, MAX_HITS, ranking)) {
      const [chapter, verse] = refs[row];
      hits.push({ book: books[i], chapter, verse, matched: 0, score });
    }
  }
  throwIfAborted(signal);
  hits.sort((a, b) => b.score - a.score);
  return { hits: hits.slice(0, MAX_HITS), model: manifest.model, scannedBooks: books };
}
