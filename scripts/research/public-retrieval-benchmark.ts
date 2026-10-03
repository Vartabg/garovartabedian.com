/** Diagnostic public-search runner. No assessment client, credentials or remote model. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateCases, type SearchCase } from "./search-benchmark";
import { searchVersesFrom, type SearchDataSource } from "../../src/lib/scriptures/search";
import { searchRelatedPassagesFrom } from "../../src/lib/scriptures/related";
import { semanticCandidateBooks, type SemanticManifest } from "../../src/lib/scriptures/semantic";
import { rankRows } from "../../src/lib/scriptures/semantic-ranking";
import type { BookText, Canons, NaveIndex, NaveTopicFile, SearchMeta, SearchShard } from "../../src/lib/scriptures/types";
import { encoderRecipe, loadCorpusEmbedder } from "../site/build-corpus-embeddings.mjs";
import { prepareBook } from "../scriptures/build-embeddings.mjs";
import { readObject, verifyManifestRelease } from "../scriptures/index-publication.mjs";
import { searchExpansion } from "../../src/lib/scriptures/search-expansion";

const json = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8"));
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const root = process.cwd();
const out = path.join(root, ".research/search-benchmark/public");
const reported = ["light of the world", "love your enemies", "do not be afraid", "God will not abandon me", "not peace but a sword", "Should I hate my enemies?", "quantum computing", "I feel isolated and need a friend"];

export function publicDiagnosticCases(cases: SearchCase[]) {
  validateCases(cases);
  const development = cases.filter(c => c.split === "development" && c.request.scope === "scripture").map(c => ({ id: c.id, query: c.request.query, family: c.family, origin: "development" }));
  return [...development, ...reported.map((query, i) => ({ id: `reported-${i + 1}`, query, family: "reported diagnostic", origin: "reported" }))];
}

export async function collectPublicDiagnostics(name: string) {
  if (!/^[a-z0-9-]{1,40}$/.test(name)) throw new Error("Choose a simple diagnostic name.");
  const cases = json<{ cases: SearchCase[] }>("scripts/research/search-pilot/queries.json").cases;
  const queries = publicDiagnosticCases(cases);
  const base = path.join(root, "public/scriptures");
  const canons = json<Canons>(path.join(base, "canons.json"));
  const books = new Map<string, BookText>();
  const loadBook = async (book: string) => {
    if (!books.has(book)) books.set(book, json<BookText>(path.join(base, "text/web", `${book}.json`)));
    return books.get(book)!;
  };
  const source: SearchDataSource & { loadBook: typeof loadBook } = {
    canons, meta: json<SearchMeta>(path.join(base, "search/web/meta.json")), loadBook,
    loadShard: async shard => {
      const file = path.join(base, "search/web", `${shard}.json`);
      return fs.existsSync(file) ? json<SearchShard>(file) : {};
    },
  };
  const topics = { canons, index: json<NaveIndex>(path.join(base, "nave/index.json")), stopwords: source.meta.stopwords, loadShard: async (section: string) => json<NaveTopicFile>(path.join(base, "nave", `${section}.json`)) };
  const directory = path.join(base, "semantic");
  const manifest = json<SemanticManifest & { recipe: Parameters<typeof prepareBook>[2]; books: Record<string, { rows: { path: string; sha256: string; bytes: number }; refs: { path: string; sha256: string; bytes: number }; fingerprint: string }> }>(path.join(directory, "manifest.json"));
  verifyManifestRelease(manifest);
  const recipe = encoderRecipe(root);
  if (manifest.model !== recipe.model || manifest.dims !== recipe.dims || JSON.stringify(manifest.recipe.modelFiles) !== JSON.stringify(recipe.modelFiles)) throw new Error("Encoder does not match indexed editions.");
  const matrices = new Map<string, { rows: Int8Array; refs: [number, number][] }>();
  for (const [book, artifacts] of Object.entries(manifest.books)) {
    const prepared = prepareBook(root, book, manifest.recipe);
    if (prepared.fingerprint !== artifacts.fingerprint) throw new Error(`Stale source: ${book}`);
    const rows = new Int8Array(readObject(directory, artifacts.rows));
    const refs = JSON.parse(readObject(directory, artifacts.refs).toString()).refs as [number, number][];
    if (JSON.stringify(refs) !== JSON.stringify(prepared.refs) || rows.length !== refs.length * manifest.dims) throw new Error(`Invalid references: ${book}`);
    matrices.set(book, { rows, refs });
  }
  const chapters = new Int8Array(readObject(directory, manifest.chapters!));
  const cache = path.join(out, "embeddings"); fs.mkdirSync(cache, { recursive: true });
  let model: Awaited<ReturnType<typeof loadCorpusEmbedder>> | undefined;
  async function embed(query: string): Promise<number[]> {
    const file = path.join(cache, `${hash(JSON.stringify({ recipe, query }))}.json`);
    if (fs.existsSync(file)) {
      const vector = json<number[]>(file);
      if (vector.length !== manifest.dims || !vector.every(Number.isFinite)) throw new Error("Invalid cached query vector.");
      return vector;
    }
    model ??= await loadCorpusEmbedder(root);
    const tensor = await model([query], { pooling: "mean", normalize: true });
    try {
      const vector = Array.from(tensor.data) as number[];
      if (vector.length !== manifest.dims || !vector.every(Number.isFinite)) throw new Error("Invalid local query vector.");
      fs.writeFileSync(file, JSON.stringify(vector));
      return vector;
    } finally { tensor.dispose?.(); }
  }
  const observations = [];
  try {
    for (const query of queries) {
      const start = performance.now();
      const words = await searchVersesFrom(query.query, source);
      const related = await searchRelatedPassagesFrom(query.query, topics);
      const vector = await embed(query.query);
      const full = [...matrices].flatMap(([book, { rows, refs }]) => rankRows(vector, rows, manifest.dims, 40).map(row => ({ book, chapter: refs[row.row][0], verse: refs[row.row][1], score: row.score })) ).sort((a, b) => b.score - a.score);
      const narrowBooks = semanticCandidateBooks(vector, manifest, chapters, "narrow");
      const diverseBooks = [...new Set(rankRows(vector, chapters, manifest.dims, manifest.chapterIndex.length).map(row => manifest.chapterIndex[row.row][0]))].slice(0, 28);
      const expansion = searchExpansion(query.query);
      const expandedVector = expansion.query ? await embed(expansion.query) : null;
      const expanded = expandedVector ? [...matrices].flatMap(([book, { rows, refs }]) => rankRows(expandedVector, rows, manifest.dims, 40).map(row => ({ book, chapter: refs[row.row][0], verse: refs[row.row][1], score: row.score })) ).sort((a, b) => b.score - a.score).slice(0, 40) : [];
      const semantic = (selected: string[]) => {
        const hits = full.filter(h => selected.includes(h.book)).slice(0, 40);
        const target = new Set(full.slice(0, 20).map(h => `${h.book}:${h.chapter}:${h.verse}`));
        return { scannedBooks: selected, bytes: selected.reduce((n, b) => n + manifest.books[b].rows.bytes + manifest.books[b].refs.bytes, 0), fullVectorTop20Overlap: hits.slice(0, 20).filter(h => target.has(`${h.book}:${h.chapter}:${h.verse}`)).length, hits };
      };
      observations.push({ ...query, milliseconds: performance.now() - start, words, related, expansion: { ...expansion, hits: expanded }, semantic: { legacyNarrow: semantic(narrowBooks), diverse28: semantic(diverseBooks), full: semantic([...matrices.keys()]) } });
      console.log(`${query.id}: ${words.totalHits} word hits; ${narrowBooks.length}/81 books in legacy meaning search`);
    }
  } finally { await model?.dispose(); }
  const report = {
    schemaVersion: 1, name, date: new Date().toISOString(), revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    implementationHash: hash(["src/lib/scriptures/search.ts", "src/lib/scriptures/search-wording.ts", "src/lib/scriptures/search-expansion.ts", "src/lib/scriptures/related.ts", "src/lib/scriptures/semantic.ts"].map(file => fs.readFileSync(file, "utf8")).join("\n")),
    manifestHash: hash(JSON.stringify(cases)), semanticRelease: manifest.releaseId,
    providerOperations: 0, acceptedLabels: 0, qualityEstablished: false,
    scope: "Public WEB wording, Nave KJV topics and WEB vectors. Development Scripture cases plus reported diagnostics; no held-out quality evaluation. Vector overlap measures narrowing loss, not human relevance.",
    exposedHeldOutGroups: [...new Set(cases.filter(c => c.split === "held-out" && reported.includes(c.request.query)).map(c => c.group))],
    observations,
  };
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  console.log(`Saved ${observations.length} unadjudicated observations to ${file}`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) collectPublicDiagnostics(process.argv[2] ?? "diagnostic").catch(error => { console.error(error.message); process.exitCode = 1; });
