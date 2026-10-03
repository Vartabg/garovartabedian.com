#!/usr/bin/env node
/** Reindex the audited Charles texts without downloading or rewriting eBible data. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishStagedEntriesSync } from '../lib/atomic-publication.mjs';
import { BOOK_NAMES, CHARLES_BOOKS, STOPWORDS, TRADITIONS, TRANSLATIONS } from './canon-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/scriptures');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

export function validateCharlesBook(text, book) {
  const chapterCount = CHARLES_BOOKS[book];
  if (!chapterCount || text?.book !== book || text.trans !== 'charles' ||
      text.name !== BOOK_NAMES[book] || !Array.isArray(text.chapters) ||
      text.chapters.length !== chapterCount) {
    throw new Error(`Charles ${book}: expected the complete ${chapterCount ?? 'known'}-chapter book`);
  }
  for (const [index, verses] of text.chapters.entries()) {
    if (!Array.isArray(verses) || !verses.length ||
        verses.some((verse) => typeof verse !== 'string' || !verse.trim())) {
      throw new Error(`Charles ${book} ${index + 1}: missing or empty verses`);
    }
  }
  return text;
}

function loadCharlesSources(scripturesRoot) {
  return Object.keys(CHARLES_BOOKS).map((book) => {
    const bytes = fs.readFileSync(path.join(scripturesRoot, 'text/charles', `${book}.json`));
    return { book, bytes, text: validateCharlesBook(JSON.parse(bytes.toString('utf8')), book) };
  });
}

export function loadCharlesBooks(scripturesRoot = ROOT) {
  return Object.fromEntries(loadCharlesSources(scripturesRoot).map(({ book, text }) => [book, text]));
}

/** Preserve the independently ingested sources, including canonical formatting. */
export function stageCharlesBooks(scripturesRoot, stagingRoot) {
  const sources = loadCharlesSources(scripturesRoot);
  const target = path.join(stagingRoot, 'text/charles');
  fs.mkdirSync(target, { recursive: true });
  for (const { book, bytes } of sources) {
    fs.writeFileSync(path.join(target, `${book}.json`), bytes);
  }
  return Object.fromEntries(sources.map(({ book, text }) => [book, text]));
}

/** Match the reader's accent-insensitive concordance without changing the text. */
export function* charlesSearchTokens(text) {
  const normalized = text.normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/[‘’ʼ]/g, "'");
  for (const raw of normalized.match(/[a-z0-9']+/g) ?? []) {
    const token = raw.replace(/'/g, '');
    if (token && !/^\d+$/.test(token)) yield token;
  }
}

export function buildCharlesSearch(books, bookOrder) {
  const stopwords = new Set(STOPWORDS);
  const shards = {};
  for (const book of Object.keys(CHARLES_BOOKS)) {
    const text = validateCharlesBook(books[book], book);
    const bookIndex = bookOrder.indexOf(book);
    if (bookIndex < 0) throw new Error(`Charles ${book}: missing from the global book order`);
    text.chapters.forEach((chapter, chapterIndex) => {
      chapter.forEach((verse, verseIndex) => {
        for (const token of new Set(charlesSearchTokens(verse))) {
          if (stopwords.has(token)) continue;
          const shard = token.slice(0, 2);
          shards[shard] ??= {};
          if (!Object.hasOwn(shards[shard], token)) shards[shard][token] = [];
          shards[shard][token].push([bookIndex, chapterIndex + 1, verseIndex + 1]);
        }
      });
    });
  }
  return { ...shards, meta: { trans: 'charles', stopwords: STOPWORDS, shardScheme: 'first2' } };
}

export function buildCharlesSupplement(canons, shelf, books) {
  // Existing posting tuples refer to bookOrder positions: only append, never
  // reorder the unrelated corpus while publishing a supplemental edition.
  const nextCanons = structuredClone(canons);
  const nextShelf = { ...shelf };
  for (const book of Object.keys(CHARLES_BOOKS)) {
    const text = validateCharlesBook(books[book], book);
    if (!nextCanons.bookOrder.includes(book)) nextCanons.bookOrder.push(book);
    nextCanons.books[book] = { name: BOOK_NAMES[book], chapters: text.chapters.length, trans: ['charles'] };
    nextShelf[book] = text.chapters.reduce((total, verses) => total + verses.length, 0);
  }
  nextCanons.translations.charles = TRANSLATIONS.charles;
  const ethiopian = nextCanons.traditions.find((tradition) => tradition.id === 'ethiopian');
  const canonicalShelf = TRADITIONS.find((tradition) => tradition.id === 'ethiopian');
  if (!ethiopian) throw new Error('Charles books require the Ethiopian shelf');
  ethiopian.books = canonicalShelf.books.filter((book) => nextCanons.books[book]);
  ethiopian.editorial = canonicalShelf.editorial;
  return { canons: nextCanons, shelf: nextShelf, search: buildCharlesSearch(books, nextCanons.bookOrder) };
}

export function publishCharlesSupplement(scripturesRoot = ROOT) {
  // Read and validate every source before creating or changing published data.
  const books = loadCharlesBooks(scripturesRoot);
  const bundle = buildCharlesSupplement(
    readJson(path.join(scripturesRoot, 'canons.json')),
    readJson(path.join(scripturesRoot, 'shelf.json')),
    books,
  );
  const staging = fs.mkdtempSync(path.join(scripturesRoot, '.charles-build-'));
  try {
    fs.mkdirSync(path.join(staging, 'search/charles'), { recursive: true });
    fs.writeFileSync(path.join(staging, 'canons.json'), JSON.stringify(bundle.canons));
    fs.writeFileSync(path.join(staging, 'shelf.json'), JSON.stringify(bundle.shelf));
    for (const [shard, data] of Object.entries(bundle.search)) {
      fs.writeFileSync(path.join(staging, 'search/charles', `${shard}.json`), JSON.stringify(data));
    }
    publishStagedEntriesSync(staging, scripturesRoot, ['canons.json', 'shelf.json', 'search/charles'], {
      label: 'charles-supplement',
    });
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
  return bundle;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const bundle = publishCharlesSupplement();
  console.log(`Charles supplement: ${Object.keys(CHARLES_BOOKS).length} books, ${Object.keys(bundle.search).length - 1} search shards`);
}
