#!/usr/bin/env node
/**
 * Build chapter-level semantic neighbours — "chapters that carry this idea".
 *
 * The Treasury of Scripture Knowledge already links verses by a 19th-century
 * editor's judgement. This is a second, different witness at a coarser grain:
 * for every World English Bible chapter, the chapters whose overall wording
 * sits nearest in the same embedding space the reader's own search uses. It is
 * computed, not curated, and the page says so.
 *
 * No API and no model inference: the int8 chapter centroids written by
 * build-embeddings.mjs are the only vector input, so this is arithmetic over
 * data already committed to the repo.
 *
 * Why chapters and not verses. A verse-level version was built first and
 * rejected on its output. Sentence embeddings of short, formulaic verses rank
 * by sentence shape rather than content: John 1:1 ("the Word was God") matched
 * Acts 12:24 ("the word of God grew and multiplied") first, and every Psalm
 * matched every other Psalm on the superscription "A Psalm by David" at higher
 * similarity than any real echo. Removing the corpus's leading principal
 * directions and gating on shared distinctive vocabulary both failed to
 * separate the real echoes from the coincidences. Chapter centroids average
 * that noise away and produce checkable results — Leviticus 11 → Deuteronomy
 * 14, Mark 16 → Luke 24, Revelation 21 → Ezekiel 43 — so this ships at the
 * grain where the arithmetic is honest.
 *
 * Neighbour rules, in the order applied:
 *   - never itself, and never an immediately adjacent chapter of the same book
 *     (narrative continuation is not an echo)
 *   - at most SAME_BOOK_LIMIT neighbours from the source's own book, so a long
 *     book cannot crowd out every cross-book parallel
 *   - kept in descending cosine similarity, up to TOP_K, above MIN_SCORE
 *
 * Each neighbour also carries `xrefLinks`: how many times the cross-references
 * already connect a verse of the source chapter to a verse of that chapter.
 * Agreement is worth showing rather than hiding — it tells a reader when the
 * computed link and the curated one point the same way.
 *
 * Output: public/scriptures/neighbors/manifest.json (metadata + complete chapter snapshot)
 *
 * Usage:
 *   node scripts/scriptures/build-neighbors.mjs
 *   node scripts/scriptures/build-neighbors.mjs --books=LEV,MRK
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sha256, jsonBytes, readJson, readOptionalJson, selectedBooks, readObject,
  withIndexLock, publishManifest, verifyManifestRelease,
} from "./index-publication.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const XREF_DIR = path.join(ROOT, "public/scriptures/xref");

export const DIMS = 384;
/** Neighbours published per chapter. */
export const TOP_K = 6;
/**
 * Cosine floor. Chapter centroids sit high and close together — the whole
 * corpus is one genre in one translation — so this floor is about excluding
 * chapters with no distinctive neighbour at all rather than trimming a long
 * tail. Chapters below it publish nothing, which is the honest outcome.
 */
export const MIN_SCORE = 0.6;
/** Neighbours allowed from the source chapter's own book. */
export const SAME_BOOK_LIMIT = 2;

/** TSK targets are written "GEN 5:9-11"; only the book and chapter matter here. */
export function xrefChapterKey(target) {
  const match = /^([A-Z0-9]{3})\s+(\d+):/.exec(target.trim());
  return match ? `${match[1]} ${match[2]}` : null;
}

/**
 * How many times the cross-references link a verse of `book chapter` to a
 * verse of each other chapter. Built once per source book.
 */
export function xrefChapterCounts(book, xrefDir = XREF_DIR) {
  const file = path.join(xrefDir, `${book}.json`);
  if (!fs.existsSync(file)) return new Map();
  const { refs } = JSON.parse(fs.readFileSync(file, "utf8"));
  const counts = new Map();
  for (const [source, targets] of Object.entries(refs)) {
    const chapter = Number(source.split(":")[0]);
    if (!Number.isFinite(chapter)) continue;
    let perChapter = counts.get(chapter);
    if (!perChapter) counts.set(chapter, (perChapter = new Map()));
    for (const target of targets) {
      const key = xrefChapterKey(target);
      if (key) perChapter.set(key, (perChapter.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/** Rank every chapter centroid against one row; excludes are applied by caller. */
export function neighboursFor({ matrix, index, row, total, topK, minScore, sameBookLimit }) {
  const [book, chapter] = index[row];
  const scored = [];
  for (let other = 0; other < total; other++) {
    if (other === row) continue;
    const [otherBook, otherChapter] = index[other];
    if (otherBook === book && Math.abs(otherChapter - chapter) <= 1) continue;
    let dot = 0;
    const a = row * DIMS;
    const b = other * DIMS;
    for (let d = 0; d < DIMS; d++) dot += matrix[a + d] * matrix[b + d];
    if (dot < minScore) continue;
    scored.push({ book: otherBook, chapter: otherChapter, score: dot });
  }
  scored.sort((x, y) => y.score - x.score);

  const kept = [];
  let sameBook = 0;
  for (const candidate of scored) {
    if (candidate.book === book) {
      if (sameBook >= sameBookLimit) continue;
      sameBook += 1;
    }
    kept.push(candidate);
    if (kept.length >= topK) break;
  }
  return kept;
}

/** One JSON snapshot contains both metadata and all chapter records, even empty ones. */
export async function buildNeighbors({ root = ROOT, args = [], beforePublish } = {}) {
  const semanticDir = path.join(root, "public/scriptures/semantic");
  const xrefDir = path.join(root, "public/scriptures/xref");
  const dir = path.join(root, "public/scriptures/neighbors");
  const semanticPath = path.join(semanticDir, "manifest.json");
  const manifest = readJson(semanticPath);
  if (manifest.schemaVersion !== 2 || manifest.dims !== DIMS || manifest.quantization !== "int8-unit-127") {
    throw new Error("Run the full embedding build before rebuilding neighbours");
  }
  verifyManifestRelease(manifest);
  const index = manifest.chapterIndex;
  const books = [...new Set(index.map(([book]) => book))];
  const selected = selectedBooks(args, books);
  const bin = readObject(semanticDir, manifest.chapters);
  if (bin.length !== index.length * DIMS) throw new Error("Chapter matrix shape mismatch");
  const xrefHashes = () => Object.fromEntries(books.map((book) => {
    const file = path.join(xrefDir, `${book}.json`);
    return [book, fs.existsSync(file) ? sha256(fs.readFileSync(file)) : null];
  }));
  const dependencies = {
    semanticRelease: manifest.releaseId, chaptersHash: manifest.chapters.sha256,
    chapterIndexHash: sha256(jsonBytes(index)), xrefs: xrefHashes(),
    algorithm: "chapter-neighbors-v2", topK: TOP_K, minScore: MIN_SCORE, sameBookLimit: SAME_BOOK_LIMIT,
  };
  const inputHash = sha256(jsonBytes(dependencies));
  return withIndexLock(root, "neighbors", async () => {
    const previous = readOptionalJson(path.join(dir, "manifest.json"));
    if (selected) {
      const oldPayload = { ...previous };
      const releaseId = oldPayload.releaseId;
      delete oldPayload.releaseId; delete oldPayload.generatedAt;
      if (previous?.inputHash !== inputHash || releaseId !== sha256(jsonBytes(oldPayload)) ||
          index.some(([book, chapter]) => !previous.chapterRecords?.[`${book}.${chapter}`])) {
        throw new Error("Partial neighbour rebuild requires a complete snapshot with unchanged inputs. Run a full neighbour build.");
      }
    }
    const matrix = new Float32Array(bin.length);
    for (let i = 0; i < bin.length; i++) matrix[i] = bin.readInt8(i) / 127;
    const xrefs = new Map();
    const chapterRecords = {};
    for (let row = 0; row < index.length; row++) {
      const [book, chapter] = index[row];
      const key = `${book}.${chapter}`;
      if (selected && !selected.has(book)) {
        chapterRecords[key] = previous.chapterRecords[key];
        continue;
      }
      if (!xrefs.has(book)) xrefs.set(book, xrefChapterCounts(book, xrefDir));
      const counts = xrefs.get(book).get(chapter) ?? new Map();
      const neighbours = neighboursFor({ matrix, index, row, total: index.length,
        topK: TOP_K, minScore: MIN_SCORE, sameBookLimit: SAME_BOOK_LIMIT,
      }).map((n) => ({ ...n, score: Number(n.score.toFixed(3)), xrefLinks: counts.get(`${n.book} ${n.chapter}`) ?? 0 }));
      chapterRecords[key] = { book, chapter, neighbours };
    }
    const entries = Object.values(chapterRecords);
    const payload = {
      schemaVersion: 2, model: manifest.model, dims: DIMS, grain: "chapter", translation: manifest.translation,
      generatedBy: "scripts/scriptures/build-neighbors.mjs", inputHash, dependencies,
      topK: TOP_K, minScore: MIN_SCORE, sameBookLimit: SAME_BOOK_LIMIT,
      excludes: ["itself", "adjacent chapter of the same book"],
      chaptersIndexed: index.length,
      chaptersWithNeighbours: entries.filter((e) => e.neighbours.length).length,
      neighbours: entries.reduce((sum, e) => sum + e.neighbours.length, 0),
      neighboursAlsoCrossReferenced: entries.reduce((sum, e) => sum + e.neighbours.filter((n) => n.xrefLinks > 0).length, 0),
      chapterRecords,
    };
    await beforePublish?.();
    if (readJson(semanticPath).releaseId !== manifest.releaseId || JSON.stringify(xrefHashes()) !== JSON.stringify(dependencies.xrefs)) {
      throw new Error("Neighbour inputs changed during build; rerun");
    }
    const stamp = args.find((arg) => arg.startsWith("--generated-at="))?.slice(15);
    const result = publishManifest(dir, payload, previous, stamp);
    console.log(`Published ${result.chaptersIndexed} chapters, ${result.neighbours} neighbour links`);
    return result;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildNeighbors({ args: process.argv.slice(2) }).catch((error) => { console.error(error); process.exitCode = 1; });
}
