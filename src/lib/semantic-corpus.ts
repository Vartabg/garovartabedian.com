/** Token-bounded passages, ranked by the strongest excerpt in each source section. */
import { rankRowsAsync, type RankingOptions, type RankedRow } from "./scriptures/semantic-ranking";
import { throwIfAborted, waitForShared } from "./scriptures/semantic-task";
import {
  SEMANTIC_DIMS, SEMANTIC_MODEL_ID, loadQueryEmbedder, rankRows, validateMatrix,
  type SemanticArtifact,
} from "./scriptures/semantic";

export type CorpusId = "words" | "early" | "afterlife" | "library";
export type CorpusProvenance = {
  parentId?: string;
  source?: { path: string; sha256: string; normalizedSha256: string };
  /** UTF-16 offsets in whitespace-normalized source text, end exclusive. */
  chunk?: { index: number; count: number; start: number; end: number; tokens: number; sha256: string };
};
export type WordsEntry = CorpusProvenance & { id: string; book: string; chapter: number; verse: number; label: string };
export type EarlyEntry = CorpusProvenance & { id: string; textId: string; section: number; label: string };
export type AfterlifeEntry = CorpusProvenance & {
  id: string; name: string; family: string; description: string; primaryDoctrine: string; label: string; href: string;
};
export type LibraryEntry = CorpusProvenance & {
  id: string; recordId: string; sectionId: string; label: string; edition: string; href: string;
};
export type CorpusEntry = WordsEntry | EarlyEntry | AfterlifeEntry | LibraryEntry;
export type CorpusIndex<E extends CorpusEntry = CorpusEntry> = {
  schemaVersion?: number;
  corpus: CorpusId;
  model: string;
  dims: number;
  quantization: string;
  generatedAt?: string;
  recipe?: unknown;
  entries: E[];
};
export type CorpusHit<E extends CorpusEntry = CorpusEntry> = {
  entry: E;
  /** Approximate cosine similarity, not a probability or historical claim. */
  score: number;
};

type CorpusDescriptor = { rows: SemanticArtifact; index: SemanticArtifact; parents: number; chunks: number };
export type CorporaManifest = {
  schemaVersion: number; model: string; dims: number; quantization: string;
  recipe: unknown; releaseId: string; generatedAt: string;
  corpora: Record<CorpusId, CorpusDescriptor>;
};
const CORPORA: CorpusId[] = ["words", "early", "afterlife", "library"];
// Keep in sync with CORPUS_SOURCE_PATH in scripts/site/corpus-sources.mjs.
const CORPUS_SOURCE_PATH = /^(?:public\/[a-zA-Z0-9/_-]+|content\/early-library\/readings\/[a-z0-9-]+\/[a-z0-9-]+)\.json$/;
const ROOT = "/semantic-corpora/";
const HASH = /^[a-f0-9]{64}$/;
// Matches CHUNK_RECIPE.maxTokens; changing this contract requires coordinated client compatibility.
const CORPUS_MAX_CHUNK_TOKENS = 384;
async function digest(bytes: Uint8Array): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes))),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function artifactUrl(artifact: SemanticArtifact, extension: "json" | "bin"): string {
  if (!artifact || !HASH.test(artifact.sha256) || artifact.path !== `objects/${artifact.sha256}.${extension}` ||
      !Number.isInteger(artifact.bytes) || artifact.bytes <= 0) throw new Error("Invalid corpus artifact");
  return ROOT + artifact.path;
}
function compatible(value: { model: string; dims: number; quantization: string }): boolean {
  return value.model === SEMANTIC_MODEL_ID && value.dims === SEMANTIC_DIMS && value.quantization === "int8-unit-127";
}
export async function validateCorporaManifest(manifest: CorporaManifest): Promise<void> {
  if (manifest.schemaVersion !== 1 || !compatible(manifest) || !manifest.corpora || !manifest.recipe) {
    throw new Error("Incompatible corpus manifest");
  }
  for (const id of CORPORA) {
    const value = manifest.corpora[id];
    if (!value || !Number.isInteger(value.parents) || value.parents <= 0 || !Number.isInteger(value.chunks) ||
        value.chunks < value.parents || value.rows?.bytes !== value.chunks * SEMANTIC_DIMS) throw new Error("Invalid corpus coverage");
    artifactUrl(value.rows, "bin"); artifactUrl(value.index, "json");
  }
  const payload: Partial<CorporaManifest> = { ...manifest };
  delete payload.releaseId; delete payload.generatedAt;
  if (await digest(new TextEncoder().encode(`${JSON.stringify(payload)}\n`)) !== manifest.releaseId) {
    throw new Error("Corpus manifest integrity failure");
  }
}
export function validateCorpusIndex(index: CorpusIndex, corpus: CorpusId, manifest: CorporaManifest): void {
  const descriptor = manifest.corpora[corpus];
  if (index.schemaVersion !== 2 || index.corpus !== corpus || !compatible(index) || !Array.isArray(index.entries) ||
      index.entries.length !== descriptor.chunks || JSON.stringify(index.recipe) !== JSON.stringify(manifest.recipe)) {
    throw new Error("Incompatible corpus index");
  }
  const seen = new Set<string>(), parents = new Map<string, { count: number; next: number; end: number; source: string }>();
  for (const entry of index.entries) {
    const chunk = entry.chunk, source = entry.source;
    if (!entry.parentId || !chunk || !source || seen.has(entry.id) ||
        entry.id !== `${entry.parentId}@${chunk.start}-${chunk.end}` ||
        !CORPUS_SOURCE_PATH.test(source.path) || !HASH.test(source.sha256) || !HASH.test(source.normalizedSha256) ||
        !HASH.test(chunk.sha256) || ![chunk.index, chunk.count, chunk.start, chunk.end, chunk.tokens].every(Number.isInteger) ||
        chunk.index < 0 || chunk.count <= chunk.index || chunk.start < 0 || chunk.end <= chunk.start || chunk.tokens < 1 || chunk.tokens > CORPUS_MAX_CHUNK_TOKENS) {
      throw new Error("Invalid corpus provenance");
    }
    const prior = parents.get(entry.parentId);
    if ((!prior && (chunk.index !== 0 || chunk.start !== 0)) || (prior &&
        (chunk.index !== prior.next || chunk.count !== prior.count || chunk.start > prior.end || chunk.end <= prior.end ||
          JSON.stringify(source) !== prior.source))) throw new Error("Invalid chunk coverage");
    parents.set(entry.parentId, { count: chunk.count, next: chunk.index + 1, end: chunk.end, source: JSON.stringify(source) });
    seen.add(entry.id);
  }
  if (parents.size !== descriptor.parents || [...parents.values()].some((value) => value.next !== value.count)) {
    throw new Error("Incomplete corpus coverage");
  }
}

/** Keep one manifest generation for the lifetime of a loader. Failed requests remain retryable. */
export function createCorpusLoader(fetcher: typeof fetch = (...args) => fetch(...args)) {
  let manifestPromise: Promise<CorporaManifest> | undefined;
  const indexes = new Map<CorpusId, Promise<CorpusIndex>>();
  const matrices = new Map<CorpusId, Promise<Int8Array>>();
  const manifest = () => manifestPromise ??= fetcher(`${ROOT}manifest.json`).then(async (response) => {
    if (!response.ok) throw new Error(`corpus manifest: ${response.status}`);
    const value = await response.json() as CorporaManifest;
    await validateCorporaManifest(value);
    return value;
  }).catch((error) => { manifestPromise = undefined; throw error; });
  async function artifact(value: SemanticArtifact, extension: "json" | "bin") {
    const response = await fetcher(artifactUrl(value, extension));
    if (!response.ok) throw new Error(`corpus artifact: ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length !== value.bytes || await digest(bytes) !== value.sha256) throw new Error("Corpus artifact integrity failure; retry");
    return bytes;
  }
  function loadIndex<E extends CorpusEntry>(corpus: CorpusId): Promise<CorpusIndex<E>> {
    let pending = indexes.get(corpus);
    if (!pending) {
      pending = manifest().then(async (release) => {
        const bytes = await artifact(release.corpora[corpus].index, "json");
        const index = JSON.parse(new TextDecoder().decode(bytes)) as CorpusIndex;
        validateCorpusIndex(index, corpus, release);
        return index;
      }).catch((error) => { indexes.delete(corpus); throw error; });
      indexes.set(corpus, pending);
    }
    return pending as Promise<CorpusIndex<E>>;
  }
  function loadRows(corpus: CorpusId): Promise<Int8Array> {
    let pending = matrices.get(corpus);
    if (!pending) {
      pending = manifest().then(async (release) => {
        const bytes = await artifact(release.corpora[corpus].rows, "bin");
        return new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      }).catch((error) => { matrices.delete(corpus); throw error; });
      matrices.set(corpus, pending);
    }
    return pending;
  }
  return { loadIndex, loadRows };
}
const loader = createCorpusLoader();
export const loadCorpusIndex = loader.loadIndex;
export const loadCorpusRows = loader.loadRows;

/** Deduplicate source parents before taking top-k so long sections cannot fill the result list. */
export function rankCorpusRows(query: Float32Array | number[], index: CorpusIndex, rows: Int8Array, limit: number) {
  validateMatrix(query, rows, index.dims, index.entries.length);
  if (!Number.isInteger(limit) || limit < 0) throw new Error("Invalid result limit");
  return distinctParents(rankRows(query, rows, index.dims, index.entries.length), index, limit);
}

function distinctParents(ranked: RankedRow[], index: CorpusIndex, limit: number) {
  const seen = new Set<string>();
  return ranked.filter(({ row }) => {
    const parent = index.entries[row].parentId ?? index.entries[row].id;
    if (seen.has(parent)) return false;
    seen.add(parent); return true;
  }).slice(0, limit);
}

export async function rankCorpusRowsAsync(query: Float32Array | number[], index: CorpusIndex, rows: Int8Array,
  limit: number, options: RankingOptions = {}) {
  throwIfAborted(options.signal);
  validateMatrix(query, rows, index.dims, index.entries.length);
  if (!Number.isInteger(limit) || limit < 0) throw new Error("Invalid result limit");
  if (limit === 0) return [];
  return distinctParents(await rankRowsAsync(query, rows, index.dims, index.entries.length, options), index, limit);
}

export async function searchCorpus<E extends CorpusEntry>(
  corpus: CorpusId,
  query: string,
  {
    limit = 12,
    minScore = 0.15,
    onProgress,
    signal,
  }: { limit?: number; minScore?: number; onProgress?: (status: string) => void; signal?: AbortSignal } = {},
): Promise<{ hits: CorpusHit<E>[]; model: string }> {
  throwIfAborted(signal);
  const progress = (status: string) => { if (!signal?.aborted) onProgress?.(status); };
  const [index, embedder] = await waitForShared(Promise.all([
    loadCorpusIndex<E>(corpus),
    loadQueryEmbedder(),
  ]), signal);
  throwIfAborted(signal);
  progress("Ranking passages…");
  const [queryVec, rows] = await waitForShared(Promise.all([
    embedder([query], {signal, onProgress: progress}),
    loadCorpusRows(corpus),
  ]), signal);

  return {
    model: index.model,
    hits: (await rankCorpusRowsAsync(queryVec, index, rows, limit, {signal}))
      .filter((row) => row.score >= minScore && index.entries[row.row])
      .map((row) => ({ entry: index.entries[row.row], score: row.score })),
  };
}

export type UnifiedSearchHit =
  | { type: "words"; hit: CorpusHit<WordsEntry> }
  | { type: "early"; hit: CorpusHit<EarlyEntry> }
  | { type: "afterlife"; hit: CorpusHit<AfterlifeEntry> };

export type UnifiedSearchResult = {
  model: string;
  words: CorpusHit<WordsEntry>[];
  early: CorpusHit<EarlyEntry>[];
  afterlife: CorpusHit<AfterlifeEntry>[];
  allByRelevance: UnifiedSearchHit[];
};

export async function searchUnifiedCorpora(
  query: string,
  {
    limitPerCorpus = 6,
    minScore = 0.15,
    onProgress,
    signal,
  }: {
    limitPerCorpus?: number;
    minScore?: number;
    onProgress?: (status: string) => void;
    signal?: AbortSignal;
  } = {},
): Promise<UnifiedSearchResult> {
  throwIfAborted(signal);
  const progress = (status: string) => { if (!signal?.aborted) onProgress?.(status); };
  const [embedder, wordsIdx, earlyIdx, afterlifeIdx] = await waitForShared(Promise.all([
    loadQueryEmbedder(),
    loadCorpusIndex<WordsEntry>("words"),
    loadCorpusIndex<EarlyEntry>("early"),
    loadCorpusIndex<AfterlifeEntry>("afterlife"),
  ]), signal);

  throwIfAborted(signal);
  progress("Ranking across all library horizons…");

  const [queryVec, wordsRows, earlyRows, afterlifeRows] = await waitForShared(Promise.all([
    embedder([query], {signal, onProgress: progress}),
    loadCorpusRows("words"),
    loadCorpusRows("early"),
    loadCorpusRows("afterlife"),
  ]), signal);
  const ranking = {signal, budget: {started: performance.now()}};

  const wordsHits = (await rankCorpusRowsAsync(queryVec, wordsIdx, wordsRows, limitPerCorpus, ranking))
    .filter((r) => r.score >= minScore && wordsIdx.entries[r.row])
    .map((r) => ({ entry: wordsIdx.entries[r.row], score: r.score }));

  const earlyHits = (await rankCorpusRowsAsync(queryVec, earlyIdx, earlyRows, limitPerCorpus, ranking))
    .filter((r) => r.score >= minScore && earlyIdx.entries[r.row])
    .map((r) => ({ entry: earlyIdx.entries[r.row], score: r.score }));

  const afterlifeHits = (await rankCorpusRowsAsync(queryVec, afterlifeIdx, afterlifeRows, limitPerCorpus, ranking))
    .filter((r) => r.score >= minScore && afterlifeIdx.entries[r.row])
    .map((r) => ({ entry: afterlifeIdx.entries[r.row], score: r.score }));

  const all: UnifiedSearchHit[] = [
    ...wordsHits.map((h) => ({ type: "words" as const, hit: h })),
    ...earlyHits.map((h) => ({ type: "early" as const, hit: h })),
    ...afterlifeHits.map((h) => ({ type: "afterlife" as const, hit: h })),
  ];
  all.sort((a, b) => b.hit.score - a.hit.score);

  return {
    model: wordsIdx.model,
    words: wordsHits,
    early: earlyHits,
    afterlife: afterlifeHits,
    allByRelevance: all,
  };
}
