#!/usr/bin/env node
/**
 * build-shelf.mjs — verse counts per book, for the Shelf visualization.
 * Reads the already-built text JSONs (public/scriptures/text/{trans}/{BOOK}.json)
 * and writes public/scriptures/shelf.json as { BOOK: verseCount } using the
 * maximum count across translations (versification differs slightly).
 * Idempotent; run after build-data.mjs whenever the corpus changes.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const textDir = join(root, "public", "scriptures", "text");

const counts = {};
for (const trans of readdirSync(textDir)) {
  const dir = join(textDir, trans);
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
    const n = data.chapters.reduce(
      (sum, ch) => sum + ch.filter((v) => v && v.trim()).length,
      0,
    );
    const id = data.book;
    counts[id] = Math.max(counts[id] ?? 0, n);
  }
}

const out = join(root, "public", "scriptures", "shelf.json");
writeFileSync(out, JSON.stringify(counts));
const books = Object.keys(counts).length;
const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`shelf.json: ${books} books, ${total} verses`);
