#!/usr/bin/env node
/**
 * Build the published Word Bridge for every book with an original text.
 *
 * Each verse starts from a draft: a Claude draft when one is committed under
 * drafts/, otherwise the free eBible Strong's tags (import-ebible.mjs). Every
 * draft is cleaned against the real verse (validateDraft) and every link is
 * checked against the dictionaries (checkLink). No model is called here; the
 * same sources always give the same output.
 *
 * Output is compact, because it covers the whole Bible: per chapter only the
 * links with their verdict codes; per book one small dictionary. The reader
 * already has the verse text and the original words, and rebuilds the rest
 * (src/lib/scriptures/word-bridge.ts).
 *
 *   npm run data:bridge
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KIND_CODES, STATUS_CODES } from "../../../src/lib/scriptures/bridge-verdicts.mjs";
import { CHECKER_VERSION, checkLink, validateDraft } from "./check.mjs";
import { ROOT, loadChapter } from "./chapter.mjs";
import { DRAFTS } from "./draft.mjs";
import { bookTags, draftFromTags } from "./import-ebible.mjs";
import { HEBREW_PREFIXES } from "./lexicon.mjs";

export const OUT = path.join(ROOT, "public", "scriptures", "bridge");
export const FORMAT = 2;

export const SOURCES = [
  "English: World English Bible (public domain). Free starting links: eBible.org's Strong's word tags.",
  "Greek: SBL Greek New Testament. Hebrew: Open Scriptures Hebrew Bible (CC BY 4.0).",
  "Dictionaries: Dodson Greek–English Lexicon (public domain); Strong's Hebrew Dictionary (1890, public domain), XML by the Open Scriptures Hebrew Bible Project (CC BY 4.0).",
];

/** Books the bridge can cover: an SBLGNT or OSHB original and a WEB text. */
export function bridgeBooks() {
  const dir = path.join(ROOT, "public", "scriptures", "original");
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(ROOT, "public", "scriptures", "text", "web", `${d.name}.json`)))
    .map((d) => d.name)
    .filter((book) => {
      const first = readdirSync(path.join(dir, book)).find((f) => /^\d+\.json$/.test(f));
      const edition = first && JSON.parse(readFileSync(path.join(dir, book, first), "utf8")).edition;
      return edition === "sblgnt" || edition === "oshb";
    })
    .sort();
}

function chaptersOf(book) {
  return readdirSync(path.join(ROOT, "public", "scriptures", "original", book))
    .filter((f) => /^\d+\.json$/.test(f))
    .map((f) => Number(f.slice(0, -5)))
    .sort((a, b) => a - b);
}

function claudeDrafts(book, chapter) {
  const file = path.join(DRAFTS, book, `${chapter}.json`);
  if (!existsSync(file)) return new Map();
  const draft = JSON.parse(readFileSync(file, "utf8"));
  return new Map(draft.verses.map((v) => [v.n, v.links]));
}

/** One link → [en, og, kind, status, code, arg?, note?] */
function compact(link, result) {
  const row = [link.en, link.og, KIND_CODES.indexOf(link.kind), STATUS_CODES.indexOf(result.status), result.code];
  if (result.arg || link.note) row.push(result.arg);
  if (link.note) row.push(link.note);
  return row;
}

export function buildBook(book) {
  const tags = bookTags(book);
  const dictionary = {};
  const stats = { verses: 0, words: 0, linked: 0, ok: 0, plain: 0, flag: 0 };
  const chapters = [];
  for (const n of chaptersOf(book)) {
    const chapter = loadChapter(book, n);
    const drafted = claudeDrafts(book, n);
    const verses = {};
    const sources = {};
    for (const verse of chapter.verses) {
      const real = { ...verse, lang: chapter.lang };
      const fromClaude = drafted.has(verse.n);
      const raw = fromClaude ? drafted.get(verse.n) : draftFromTags(verse, chapter.lang, tags.get(n)?.get(verse.n) ?? []);
      const source = fromClaude ? "c" : "e";
      const { links } = validateDraft(raw, real);
      verses[verse.n] = links.map((link) => {
        const result = checkLink(link, real, source);
        stats[result.status] += 1;
        if (link.kind === "link") stats.linked += link.en.length;
        return compact(link, result);
      });
      if (fromClaude) sources[verse.n] = "c";
      stats.verses += 1;
      stats.words += verse.english.filter((t) => t.w).length;
      for (const word of verse.original) {
        word.parts.forEach((part, j) => {
          const key = dictKey(chapter.lang, word.lemma, j);
          // Greek: [Strong's number, gloss]; Hebrew: [headword, gloss].
          if (key && part.dict && !dictionary[key]) {
            dictionary[key] = [chapter.lang === "greek" ? part.dict.strong : part.dict.word || part.lemma, part.dict.brief];
          }
        });
      }
    }
    chapters.push({ chapter: n, data: { format: FORMAT, checker: CHECKER_VERSION, sources, verses } });
  }
  return { book, dictionary, stats, chapters };
}

/**
 * Dictionary key the reader can recompute from the original word alone:
 * the SBLGNT lemma for Greek; for Hebrew, the OSHB prefix letter ("b") or
 * the Strong's number ("H7225") of that part of the word.
 */
export function dictKey(lang, lemma, part) {
  if (lang === "greek") return lemma;
  const raw = (lemma.split("/")[part] ?? "").trim();
  if (HEBREW_PREFIXES[raw]) return raw;
  const n = /\d+/.exec(raw)?.[0];
  return n ? `H${Number(n)}` : null;
}

export function buildAll(books = bridgeBooks()) {
  const index = { format: FORMAT, checker: CHECKER_VERSION, sources: SOURCES, books: {} };
  const out = [];
  for (const book of books) {
    const built = buildBook(book);
    index.books[book] = { chapters: built.chapters.map((c) => c.chapter), ...built.stats };
    out.push(built);
  }
  return { index, books: out };
}

function main() {
  const { index, books } = buildAll();
  rmSync(OUT, { recursive: true, force: true });
  for (const { book, dictionary, chapters } of books) {
    mkdirSync(path.join(OUT, book), { recursive: true });
    writeFileSync(path.join(OUT, book, "dictionary.json"), `${JSON.stringify(dictionary)}\n`);
    for (const { chapter, data } of chapters) writeFileSync(path.join(OUT, book, `${chapter}.json`), `${JSON.stringify(data)}\n`);
  }
  writeFileSync(path.join(OUT, "index.json"), `${JSON.stringify(index, null, 1)}\n`);
  let total = { words: 0, linked: 0, ok: 0, plain: 0, flag: 0 };
  for (const s of Object.values(index.books)) for (const k of Object.keys(total)) total[k] += s[k];
  console.log(
    `${Object.keys(index.books).length} books: ${total.words} English words, ${total.linked} linked; ` +
      `links ${total.ok} supported, ${total.flag} need review, ${total.plain} other`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
