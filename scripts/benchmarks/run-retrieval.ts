/** Run: node --import tsx scripts/benchmarks/run-retrieval.ts [--out=/absolute/report.json] */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { collectCorpora } from "../site/corpus-sources.mjs";
import { encoderRecipe, loadCorpusEmbedder, embedInputs, DIMS } from "../site/build-corpus-embeddings.mjs";
import { readJson, readObject, sha256, jsonBytes, verifyManifestRelease, atomicWrite } from "../scriptures/index-publication.mjs";
import { prepareBook } from "../scriptures/build-embeddings.mjs";
import { rankRows, semanticCandidateBooks, type SemanticManifest } from "../../src/lib/scriptures/semantic";
import { rankCorpusRows, validateCorpusIndex, validateCorporaManifest, type CorporaManifest, type CorpusIndex } from "../../src/lib/semantic-corpus";
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export type RetrievalCase = {
  id: string; corpus: "early" | "web"; kind: "paraphrase" | "exact-tail"; query: string; target: string; targetTokens?: number;
  source: { path: string; sha256: string; quote: string; normalizedSha256?: string; start?: number; end?: number };
};
/** This suite has three supported groups; unknown cases must not silently become misses. */
export function validateCaseKinds(cases: RetrievalCase[]) {
  for (const c of cases) {
    if (!c || (c.corpus !== "early" && c.corpus !== "web") ||
        (c.kind !== "paraphrase" && !(c.corpus === "early" && c.kind === "exact-tail"))) {
      throw new Error(`Unsupported evaluation corpus/kind: ${c?.id ?? "unknown"}`);
    }
  }
}
export function metrics(ranks: (number | null)[]) {
  const hits = (k: number) => ranks.filter((rank) => rank !== null && rank <= k).length;
  return { cases: ranks.length, hitAt1: hits(1), hitAt5: hits(5), hitAt10: hits(10),
    mrrAt10: ranks.length ? ranks.reduce<number>((sum, rank) => sum + (rank !== null && rank <= 10 ? 1 / rank : 0), 0) / ranks.length : 0 };
}
const int8 = (bytes: Buffer) => new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
export async function runRetrieval(root = ROOT) {
  const casePath = path.join(root, "scripts/benchmarks/retrieval-cases.json");
  const caseBytes = fs.readFileSync(casePath), suite = JSON.parse(caseBytes.toString());
  const cases = suite.cases as RetrievalCase[];
  validateCaseKinds(cases);
  const collection = collectCorpora(root).early;
  const parents = new Map<string, { text: string; sourcePath: string }>(collection.entries.map((e: {id: string; text: string; sourcePath: string}) => [e.id, e]));
  if (new Set(cases.map((c) => c.id)).size !== cases.length) throw new Error("Duplicate evaluation case");
  for (const c of cases) {
    if (sha256(fs.readFileSync(path.join(root, c.source.path))) !== c.source.sha256) throw new Error(`Stale case source: ${c.id}`);
    if (c.corpus === "early") {
      const e = parents.get(c.target);
      if (!e || e.sourcePath !== c.source.path || sha256(e.text) !== c.source.normalizedSha256 ||
          e.text.slice(c.source.start, c.source.end) !== c.source.quote ||
          (c.kind === "exact-tail" && c.query !== c.source.quote)) throw new Error(`Invalid early target: ${c.id}`);
    } else {
      const [book, ref] = c.target.split(" "), [chapter, verse] = ref.split(":").map(Number);
      if (c.source.path !== `public/scriptures/text/web/${book}.json` ||
          readJson(path.join(root, c.source.path)).chapters[chapter - 1]?.[verse - 1] !== c.source.quote) throw new Error(`Invalid WEB target: ${c.id}`);
    }
  }
  const corpusDir = path.join(root, "public/semantic-corpora"), scriptureDir = path.join(root, "public/scriptures/semantic");
  const manifest = readJson(path.join(corpusDir, "manifest.json"));
  await validateCorporaManifest(manifest as CorporaManifest);
  const index = JSON.parse(readObject(corpusDir, manifest.corpora.early.index).toString()) as CorpusIndex;
  validateCorpusIndex(index, "early", manifest);
  const encoder = encoderRecipe(root);
  if (JSON.stringify(encoder) !== JSON.stringify(manifest.recipe.encoder) ||
      sha256(jsonBytes({corpus: "early", recipe: manifest.recipe, collection})) !== manifest.corpora.early.fingerprint) throw new Error("Stale corpus recipe or sources");
  const chunkRows = int8(readObject(corpusDir, manifest.corpora.early.rows));
  const scripture = readJson(path.join(scriptureDir, "manifest.json"));
  verifyManifestRelease(scripture);
  if (JSON.stringify(encoder.modelFiles) !== JSON.stringify(scripture.recipe.modelFiles) || encoder.dtype !== scripture.recipe.dtype) throw new Error("Mismatched Scripture encoder");
  const chapters = int8(readObject(scriptureDir, scripture.chapters));
  const scriptureBooks = Object.keys(scripture.books);
  const allRefs: { id: string; book: string }[] = [], bookBytes = new Map<string, number>();
  const allRows = new Int8Array(Object.values<number>(scripture.verseCounts).reduce((sum, count) => sum + count, 0) * DIMS);
  let offset = 0;
  for (const book of scriptureBooks) {
    const input = prepareBook(root, book, scripture.recipe), artifacts = scripture.books[book];
    if (input.fingerprint !== artifacts.fingerprint) throw new Error(`Stale WEB index: ${book}`);
    const rows = readObject(scriptureDir, artifacts.rows), refs = JSON.parse(readObject(scriptureDir, artifacts.refs).toString()).refs as [number, number][];
    if (JSON.stringify(refs) !== JSON.stringify(input.refs) || rows.length !== refs.length * DIMS) throw new Error(`Invalid WEB rows: ${book}`);
    allRows.set(int8(rows), offset); offset += rows.length;
    refs.forEach(([chapter, verse]) => allRefs.push({id: `${book} ${chapter}:${verse}`, book}));
    bookBytes.set(book, artifacts.rows.bytes + artifacts.refs.bytes);
  }
  if (offset !== allRows.length) throw new Error("Scripture verse counts do not match indexed rows");
  const startLoad = performance.now(), embed = await loadCorpusEmbedder(root);
  const modelLoadMs = performance.now() - startLoad;
  try {
    const cacheDir = path.join(root, ".cache/scripture-index-builds/benchmark");
    const baselineFingerprint = sha256(jsonBytes({encoder, collection, preprocessing: "whole-section-truncation-v1"}));
    const cacheFile = path.join(cacheDir, `${baselineFingerprint}.bin`), cacheHash = `${cacheFile}.sha256`;
    let baselineBytes: Buffer;
    const baselineStart = performance.now();
    const baselineCacheHit = fs.existsSync(cacheFile) && fs.existsSync(cacheHash) &&
      sha256(fs.readFileSync(cacheFile)) === fs.readFileSync(cacheHash, "utf8").trim() &&
      fs.statSync(cacheFile).size === collection.entries.length * DIMS;
    if (baselineCacheHit) baselineBytes = fs.readFileSync(cacheFile);
    else {
      baselineBytes = await embedInputs(embed, collection.entries.map((e: {text: string}) => e.text));
      atomicWrite(cacheFile, baselineBytes); atomicWrite(cacheHash, Buffer.from(sha256(baselineBytes)));
    }
    const baselineMs = performance.now() - baselineStart;
    const baselineRows = int8(baselineBytes);
    const results = [];
    for (const c of cases) {
      const queryStart = performance.now();
      const output = await embed([c.query], {pooling: "mean", normalize: true});
      const query = Float32Array.from(output.data); output.dispose?.();
      if (query.length !== DIMS || !query.every(Number.isFinite)) throw new Error("Invalid query vector");
      const queryMs = performance.now() - queryStart;
      const started = performance.now();
      const ranked = (ids: string[]) => { const i = ids.indexOf(c.target); return i < 0 ? null : i + 1; };
      if (c.corpus === "early") {
        const baseline = rankRows(query, baselineRows, DIMS, collection.entries.length).map(({row}) => collection.entries[row].id);
        const chunks = rankCorpusRows(query, index, chunkRows, collection.entries.length);
        const ids = chunks.map(({row}) => index.entries[row].parentId!);
        const winning = chunks.find(({row}) => index.entries[row].parentId === c.target);
        results.push({...c, ranks: {wholeSection: ranked(baseline), chunked: ranked(ids)},
          top5: {wholeSection: baseline.slice(0,5), chunked: ids.slice(0,5)},
          targetWinningChunk: winning ? index.entries[winning.row].chunk : null, queryMs, rankingMs: performance.now() - started});
      } else {
        const books = semanticCandidateBooks(query, scripture as SemanticManifest, chapters);
        const exhaustive = rankRows(query, allRows, DIMS, allRefs.length);
        // Top ten is identical to production's per-book top-40 then global top-40.
        const funnel = exhaustive.filter(({row}) => books.includes(allRefs[row].book)).slice(0,40);
        const exhaustiveIds = exhaustive.map(({row}) => allRefs[row].id), funnelIds = funnel.map(({row}) => allRefs[row].id);
        results.push({...c, ranks: {exhaustive: ranked(exhaustiveIds), funnel: ranked(funnelIds)},
          top5: {exhaustive: exhaustiveIds.slice(0,5), funnel: funnelIds.slice(0,5)},
          candidateBooks: books, candidateArtifactBytes: books.reduce((sum, book) => sum + bookBytes.get(book)!, 0),
          targetBookScanned: books.includes(c.target.split(" ")[0]), queryMs, rankingMs: performance.now() - started});
      }
    }
    const groups: Record<string, unknown> = {};
    for (const [label, selected, variants] of [
      ["earlyParaphrase", results.filter(c=>c.corpus === "early" && c.kind === "paraphrase"), ["wholeSection", "chunked"]],
      ["earlyExactTail", results.filter(c=>c.corpus === "early" && c.kind === "exact-tail"), ["wholeSection", "chunked"]],
      ["webParaphrase", results.filter(c=>c.corpus === "web"), ["funnel", "exhaustive"]],
    ] as const) groups[label] = Object.fromEntries(variants.map(variant=>[variant, metrics(selected.map(c => (c.ranks as Partial<Record<string, number | null>>)[variant] ?? null))]));
    return {schemaVersion: 1, generatedAt: new Date().toISOString(), suiteVersion: suite.version, authorship: suite.authorship,
      limitations: [...suite.limitations, "Human relevance review remains pending for this development set; implementation review does not validate relevance judgments.",
        "CPU timings are observations from one local run; rankingMs for WEB includes an exhaustive scan used to compare candidate strategies, not production funnel latency.",
        "Known-target hit rates and MRR are not precision, recall, theological correctness, or evidence of historical influence."],
      provenance: {casesSha256: sha256(caseBytes), corpusRelease: manifest.releaseId, scriptureRelease: scripture.releaseId,
        baselineRowsSha256: sha256(baselineBytes), baselineFingerprint, encoder,
        runnerSha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))),
        implementationSources: ["src/lib/scriptures/semantic.ts", "src/lib/semantic-corpus.ts", "scripts/site/corpus-sources.mjs", "scripts/site/token-chunks.mjs", "scripts/site/build-corpus-embeddings.mjs", "scripts/scriptures/index-publication.mjs"].map(file=>({path:file,sha256:sha256(fs.readFileSync(path.join(root,file)))})),
        baseCommit: execFileSync("git", ["rev-parse", "HEAD"], {cwd:root,encoding:"utf8"}).trim()},
      runtime: {node: process.version, platform: process.platform, arch: process.arch, osRelease: os.release(),
        cpu: os.cpus()[0]?.model, inference: "q8 CPU", modelLoadMs, baselineMs, baselineCacheHit},
      coverage: {early: manifest.corpora.early, words: manifest.corpora.words, afterlife: manifest.corpora.afterlife,
        scriptureBooks: scriptureBooks.length, scriptureVerses: allRefs.length, exhaustiveArtifactBytes: [...bookBytes.values()].reduce((sum,b)=>sum+b,0)},
      groups, results};
  } finally { await embed.dispose(); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runRetrieval().then(report => {
    const out = process.argv.find(arg => arg.startsWith("--out="))?.slice(6) ?? path.join(ROOT, "docs/research/retrieval-benchmark-v1.json");
    atomicWrite(out, Buffer.from(JSON.stringify(report, null, 2) + "\n"));
    console.log(JSON.stringify(report.groups, null, 2));
    console.log(`Report: ${out}`);
  }).catch(error => {console.error(error); process.exitCode = 1;});
}
