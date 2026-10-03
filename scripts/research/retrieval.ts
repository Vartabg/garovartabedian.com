import fs from "node:fs";
import path from "node:path";
import { contentWords, buildVerseIndex, matchQuotation } from "../early/build-allusions.mjs";
import { encoderRecipe, loadCorpusEmbedder, DIMS } from "../site/build-corpus-embeddings.mjs";
import { prepareBook } from "../scriptures/build-embeddings.mjs";
import { readObject, verifyManifestRelease } from "../scriptures/index-publication.mjs";
import { collectCorpora } from "../site/corpus-sources.mjs";
import { validateCorporaManifest, validateCorpusIndex, type CorporaManifest, type CorpusIndex } from "../../src/lib/semantic-corpus";
import type { SemanticManifest } from "../../src/lib/scriptures/semantic";
import type { Canons } from "../../src/lib/scriptures/types";
import { parseScriptureQueryRef } from "../../src/lib/scriptures/refs";
import type { TextBlock, SourceSpec, Unit } from "./types";
import { ROOT, LOCAL, fingerprint, hash, readJson, writeJson } from "./storage";
import { loadSource } from "./sources";

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
type Vector = number[];
export function fuseRanks(lexical: number[], semantic: number[], limit = 20): number[] {
  const scores = new Map<number, number>();
  for (const rank of [lexical, semantic]) rank.forEach((id, i) => scores.set(id, (scores.get(id) ?? 0) + 1 / (60 + i + 1)));
  return [...scores].sort(([a, x], [b, y]) => y - x || a - b).slice(0, limit).map(([id]) => id);
}
/** Reuse only vectors whose recipe, artifact bytes, references and source fingerprints agree. */
async function publishedVectors(targets: TextBlock[], root: string): Promise<Map<string, Vector>> {
  const map = new Map<string, Vector>(), encoder = encoderRecipe(root);
  const put = (text: string, bytes: Uint8Array, row: number) => {
    const data = new Int8Array(bytes.buffer, bytes.byteOffset + row * DIMS, DIMS);
    map.set(hash(normalize(text)), Array.from(data, n => n / 127));
  };
  const books = new Set(targets.filter(b => b.source.kind === "scripture" && (b.source.translation ?? "web") === "web").map(b => b.source.kind === "scripture" ? b.source.book : ""));
  if (books.size) {
    const dir = path.join(root, "public/scriptures/semantic");
    const manifest = readJson<SemanticManifest & { recipe: Parameters<typeof prepareBook>[2] }>(path.join(dir, "manifest.json"));
    verifyManifestRelease(manifest);
    if (manifest.model !== encoder.model || manifest.dims !== DIMS || JSON.stringify(manifest.recipe.modelFiles) !== JSON.stringify(encoder.modelFiles)) throw new Error("Scripture embedding recipe mismatch");
    for (const book of books) {
      const descriptor = manifest.books?.[book] as NonNullable<SemanticManifest["books"]>[string] & { fingerprint: string };
      if (!descriptor) continue;
      const input = prepareBook(root, book, manifest.recipe);
      if (input.fingerprint !== descriptor.fingerprint) throw new Error(`Stale Scripture embeddings: ${book}`);
      const bytes = readObject(dir, descriptor.rows);
      const refs = JSON.parse(readObject(dir, descriptor.refs).toString()).refs as [number, number][];
      if (bytes.length !== refs.length * DIMS || JSON.stringify(refs) !== JSON.stringify(input.refs)) throw new Error("Invalid Scripture vector rows");
      const source = readJson<{ chapters: string[][] }>(path.join(root, "public/scriptures/text/web", `${book}.json`));
      refs.forEach(([c, v], i) => put(source.chapters[c - 1][v - 1], bytes, i));
    }
  }
  if (targets.some(b => b.source.kind === "early")) {
    const dir = path.join(root, "public/semantic-corpora");
    const manifest = readJson<CorporaManifest & { corpora: { early: { fingerprint: string } } }>(path.join(dir, "manifest.json"));
    await validateCorporaManifest(manifest);
    const collection = collectCorpora(root).early;
    // Publication hashes use ordered JSON with a final newline, not this tool's canonical hash.
    if (hash(JSON.stringify({ corpus: "early", recipe: manifest.recipe, collection }) + "\n") !== manifest.corpora.early.fingerprint) throw new Error("Stale early-writing embeddings");
    const index = JSON.parse(readObject(dir, manifest.corpora.early.index).toString()) as CorpusIndex;
    validateCorpusIndex(index, "early", manifest);
    const recipe = manifest.recipe as { encoder: unknown };
    if (JSON.stringify(recipe.encoder) !== JSON.stringify(encoder)) throw new Error("Early-writing embedding recipe mismatch");
    const bytes = readObject(dir, manifest.corpora.early.rows);
    const parents = new Map<string, string>(collection.entries.map((e: { id: string; text: string }) => [e.id, e.text]));
    index.entries.forEach((e, i) => {
      const text = parents.get(e.parentId!);
      if (!text || !e.chunk) throw new Error("Missing early-writing vector source");
      put(text.slice(e.chunk.start, e.chunk.end), bytes, i);
    });
  }
  return map;
}

export async function vectorsFor(blocks: TextBlock[], root = ROOT, cache = path.join(LOCAL, "embeddings")) {
  const published = await publishedVectors(blocks, root);
  const recipe = encoderRecipe(root), vectors: Vector[] = [];
  let embed: Awaited<ReturnType<typeof loadCorpusEmbedder>> | undefined;
  let reused = 0;
  try {
    for (const block of blocks) {
      const text = normalize(block.text), known = published.get(hash(text));
      if (known) { vectors.push(known); reused++; continue; }
      const key = fingerprint({ recipe, text }), file = path.join(cache, `${key}.json`);
      let vector: Vector | undefined;
      if (fs.existsSync(file)) {
        try {
          const data = readJson<{ key: string; vector: Vector }>(file);
          if (data.key === key && validVector(data.vector)) vector = data.vector;
        } catch { /* Rebuild invalid local cache entries. */ }
      }
      if (!vector) {
        embed ??= await loadCorpusEmbedder(root);
        const result = await embed([text], { pooling: "mean", normalize: true });
        try { vector = Array.from(result.data) as number[]; } finally { result.dispose?.(); }
        if (!validVector(vector)) throw new Error("Invalid local embedding");
        writeJson(file, { key, vector });
      }
      vectors.push(vector);
    }
  } finally { await embed?.dispose(); }
  return { vectors, reused };
}
function validVector(v: unknown): v is Vector { return Array.isArray(v) && v.length === DIMS && v.every(n => typeof n === "number" && Number.isFinite(n)) && Math.abs(Math.hypot(...v) - 1) < 0.1; }

export async function corpusSources(corpus: "scripture-web" | "early", root = ROOT): Promise<SourceSpec[]> {
  const dir = path.join(root, corpus === "scripture-web" ? "public/scriptures/text/web" : "public/early/texts");
  return fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort().map(f => corpus === "scripture-web" ? { kind: "scripture", book: f.slice(0, -5), translation: "web" } : { kind: "early", id: f.slice(0, -5) });
}
export function explicitSpecs(text: string, root = ROOT): SourceSpec[] {
  const canons = readJson<Canons>(path.join(root, "public/scriptures/canons.json"));
  const names = Object.entries(canons.books).flatMap(([id, b]) => [[id, id], [b.name, id], ...(id === "PSA" ? [["Psalm", id], ["Psalms", id]] : [])]);
  const found = new Map<string, SourceSpec>();
  for (const [name, book] of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const m of text.matchAll(new RegExp(`\\b${escaped}\\s+(\\d{1,3})(?::(\\d{1,3})(?:[-–](\\d{1,3}))?)?\\b`, "gi"))) {
      if (text[m.index! + m[0].length] === ":") throw new Error("Cross-chapter or malformed explicit reference; supply separate chapter selectors");
      const spec: SourceSpec = { kind: "scripture", book, chapter: Number(m[1]), ...(m[2] ? { verse: Number(m[2]), endVerse: Number(m[3] ?? m[2]) } : {}) };
      found.set(fingerprint(spec), spec);
    }
  }
  // Try overlapping word boundaries so prose prefixes do not hide a reference.
  // The site's parser supplies its established abbreviations and numbered aliases.
  for (const m of text.matchAll(/(?=(\b[1-4]?\s?[A-Za-z][A-Za-z. ]{1,35}\s+\d{1,3}:\d{1,3}(?:\s*[-–—]\s*\d{1,3})?))/g)) {
    const ref = parseScriptureQueryRef(m[1], canons);
    if (ref) {
      if (text[m.index! + m[1].length] === ":") throw new Error("Cross-chapter or malformed explicit reference; supply separate chapter selectors");
      const spec: SourceSpec = { kind: "scripture", book: ref.book, chapter: ref.chapter, verse: ref.verse, endVerse: ref.endVerse ?? ref.verse };
      found.set(fingerprint(spec), spec);
    }
  }
  return [...found.values()];
}
export async function discover(left: TextBlock[], targets: TextBlock[], root = ROOT) {
  const issues: string[] = [];
  const { vectors, reused } = await vectorsFor([...left, ...targets], root);
  const words = targets.map(b => new Set<string>(contentWords(b.text))), df = new Map<string, number>();
  words.forEach(set => set.forEach(w => df.set(w, (df.get(w) ?? 0) + 1)));
  const baseline = buildVerseIndex();
  const units: Unit[] = [];
  const baselineFindings: { leftId: string; match: ReturnType<typeof matchQuotation> }[] = [];
  let explicitPairs = 0;
  for (const [l, source] of left.entries()) {
    const query = new Set<string>(contentWords(source.text));
    const lexical = words.map((set, i) => ({ i, score: [...query].reduce((sum, w) => sum + (set.has(w) ? Math.log(1 + targets.length / (df.get(w) ?? 1)) : 0), 0) / Math.sqrt(Math.max(1, set.size)) })).sort((a, b) => b.score - a.score || a.i - b.i).filter(x => x.score > 0).map(x => x.i);
    const semantic = targets.map((_, i) => ({ i, score: vectors[l].reduce((sum, n, j) => sum + n * vectors[left.length + i][j], 0) })).sort((a, b) => b.score - a.score || a.i - b.i).map(x => x.i);
    const selected = new Map(fuseRanks(lexical, semantic).map(i => [targets[i].id, { block: targets[i], explicit: false }]));
    for (const spec of explicitSpecs(source.text, root)) {
      try { for (const block of await loadSource(spec, root)) selected.set(block.id, { block, explicit: true }); }
      catch { issues.push(`Unresolved explicit reference in ${source.title}: ${JSON.stringify(spec)}`); }
    }
    const match = matchQuotation(baseline, source.text);
    baselineFindings.push({ leftId: source.id, match });
    for (const { block, explicit } of selected.values()) {
      if (block.id === source.id) continue;
      if (explicit) explicitPairs++;
      const baselineMatch = !!match && block.source.kind === "scripture" && block.source.book === match.book && Number(block.pointer[1]) + 1 === match.chapter && Number(block.pointer[2]) + 1 >= match.verse && Number(block.pointer[2]) + 1 <= (match.endVerse ?? match.verse);
      units.push({ id: fingerprint({ left: source.id, right: block.id }), task: "relationship", left: source, right: block, explicit, baselineMatch });
    }
  }
  return { units, issues, explicitPairs, reused, baselineFindings };
}
