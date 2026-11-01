#!/usr/bin/env node
/**
 * Builds public/scriptures/doorways.json: everything the Scripture picker
 * needs to draw every book and chapter to length without loading any text.
 *
 * For each book: its name, the hosted translations that carry it, and the
 * number of verses in each chapter. Translations that divide a book
 * differently (Psalms 151, Greek Daniel, Joel 4) keep their own counts, so the
 * picker shows the chapters the chosen translation actually has.
 *
 * Run: node scripts/scriptures/build-doorways.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const DOORWAYS_PATH = "public/scriptures/doorways.json";

const readJson = (root, relative) =>
  JSON.parse(readFileSync(path.join(root, relative), "utf8"));

const chapterVerseCounts = (text) =>
  text.chapters.map((chapter) =>
    Array.isArray(chapter) ? chapter.length : (chapter?.verses?.length ?? 0),
  );

export function buildDoorways(root = ROOT) {
  const canons = readJson(root, "public/scriptures/canons.json");
  const books = {};

  for (const [id, meta] of Object.entries(canons.books)) {
    const byTranslation = {};
    for (const translation of meta.trans ?? []) {
      const relative = `public/scriptures/text/${translation}/${id}.json`;
      if (!existsSync(path.join(root, relative))) continue;
      byTranslation[translation] = chapterVerseCounts(readJson(root, relative));
    }
    const translations = Object.keys(byTranslation);
    if (!translations.length) throw new Error(`No hosted text for ${id}`);

    const verses = byTranslation[translations[0]];
    const differing = Object.fromEntries(
      translations
        .slice(1)
        .filter((t) => byTranslation[t].join() !== verses.join())
        .map((t) => [t, byTranslation[t]]),
    );
    books[id] = {
      name: meta.name,
      translations,
      verses,
      ...(Object.keys(differing).length ? { byTranslation: differing } : {}),
    };
  }

  return {
    schemaVersion: 1,
    traditions: canons.traditions.map((t) => ({ id: t.id, name: t.name, books: t.books })),
    translations: Object.fromEntries(
      Object.entries(canons.translations).map(([id, t]) => [id, t.name]),
    ),
    books,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = buildDoorways();
  writeFileSync(path.join(ROOT, DOORWAYS_PATH), `${JSON.stringify(data)}\n`);
  const chapters = Object.values(data.books).reduce((n, b) => n + b.verses.length, 0);
  console.log(`${DOORWAYS_PATH}: ${Object.keys(data.books).length} books, ${chapters} chapters`);
}
