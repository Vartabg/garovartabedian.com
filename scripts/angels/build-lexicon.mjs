#!/usr/bin/env node
/**
 * Build the vocabulary of the unseen from the hosted original-language text.
 *
 * public/angels/lexicon.json
 *   For every term in lexicon-terms.mjs: how many times its lemma occurs in
 *   the hosted Hebrew (OSHB), Greek New Testament (SBLGNT), and Greek Old
 *   Testament (Rahlfs + lxx-morph), and in which chapters and verses. Nothing
 *   here is written by a model or a person except the seed's short notes; the
 *   counts and the occurrences are the tagged text, read once.
 *
 * public/angels/chapter-index.json
 *   The reverse map: for every hosted chapter, which Angels & Demons records
 *   (order bands, named ones, enemy titles, demons, fall fragments,
 *   encounters, teachings) cite it, and which lexicon terms occur in it. The
 *   chapter reader uses it to point back into the world.
 *
 * Both files are committed. tests/angels-lexicon.test.ts regenerates them in
 * memory and fails if the committed copy has drifted, so a change to the seed
 * or to the hosted text cannot leave a stale lexicon on the site.
 *
 * Usage: node scripts/angels/build-lexicon.mjs   (npm run data:angels-lexicon)
 */
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LEXICON_GROUPS, LEXICON_TERMS } from "./lexicon-terms.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(SCRIPT_DIR, "../..");
const ORIGINAL = path.join(ROOT, "public/scriptures/original");
const ANGELS = path.join(ROOT, "public/angels");
export const LEXICON_PATH = path.join(ANGELS, "lexicon.json");
export const CHAPTER_INDEX_PATH = path.join(ANGELS, "chapter-index.json");

/** A lemma occurrence must sit within this many tokens of its phrase partner. */
const PHRASE_WINDOW = 2;
const EDITIONS_FOR_LANG = { hebrew: new Set(["oshb"]), greek: new Set(["sblgnt", "lxx"]) };

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const writeJsonAtomically = (file, value) => {
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, file);
};

/**
 * OSHB tags prefixes with slashes ("c/b/8147", "l/8163 c") and homographs
 * with a letter ("8314 b"). The core is the last segment, letter kept: the
 * letter is what separates a seraph from a fiery serpent.
 */
export const lemmaCore = (lemma, edition) =>
  edition === "oshb" ? String(lemma ?? "").split("/").pop() : String(lemma ?? "");

/** Count a term's occurrences in one verse's lemma cores; returns the matched indices. */
export function matchTerm(term, cores) {
  const hits = [];
  if (term.phrase) {
    const [head, partner] = term.phrase;
    cores.forEach((core, index) => {
      if (core !== head) return;
      for (let j = Math.max(0, index - PHRASE_WINDOW); j <= Math.min(cores.length - 1, index + PHRASE_WINDOW); j++) {
        if (j !== index && cores[j] === partner) {
          hits.push(index);
          return;
        }
      }
    });
    return hits;
  }
  const wanted = new Set(term.lemmas);
  cores.forEach((core, index) => {
    if (wanted.has(core)) hits.push(index);
  });
  return hits;
}

function validateSeed() {
  const ids = new Set();
  const groupIds = new Set(LEXICON_GROUPS.map((group) => group.id));
  for (const term of LEXICON_TERMS) {
    if (ids.has(term.id)) throw new Error(`lexicon seed: duplicate term id ${term.id}`);
    ids.add(term.id);
    if (!groupIds.has(term.group)) throw new Error(`lexicon seed: ${term.id} names unknown group ${term.group}`);
    if (!EDITIONS_FOR_LANG[term.lang]) throw new Error(`lexicon seed: ${term.id} has unknown lang ${term.lang}`);
    if (term.phrase ? term.phrase.length !== 2 : term.lemmas.length === 0) {
      throw new Error(`lexicon seed: ${term.id} must name lemmas or a two-lemma phrase`);
    }
  }
  for (const term of LEXICON_TERMS) {
    if (term.pair === undefined) continue;
    const pair = LEXICON_TERMS.find((candidate) => candidate.id === term.pair);
    if (!pair) throw new Error(`lexicon seed: ${term.id} pairs with unknown term ${term.pair}`);
    if (pair.pair !== term.id) throw new Error(`lexicon seed: ${term.id} ↔ ${term.pair} is not symmetric`);
    if (pair.lang === term.lang) throw new Error(`lexicon seed: ${term.id} ↔ ${term.pair} must cross languages`);
  }
}

/** Canonical book order, so occurrence lists read front to back. */
function bookOrder() {
  const canons = readJson(path.join(ROOT, "public/scriptures/canons.json"));
  return new Map(Object.keys(canons.books).map((book, index) => [book, index]));
}

/**
 * Read every hosted original-language chapter once and count each term.
 * Returns the lexicon document (without writing it).
 */
export function buildLexicon() {
  validateSeed();
  const manifest = readJson(path.join(ORIGINAL, "manifest.json"));
  const order = bookOrder();
  const perTerm = new Map(LEXICON_TERMS.map((term) => [term.id, new Map()]));

  for (const [book, edition] of Object.entries(manifest.books)) {
    const dir = path.join(ORIGINAL, book);
    if (!existsSync(dir)) continue;
    const terms = LEXICON_TERMS.filter((term) => EDITIONS_FOR_LANG[term.lang].has(edition));
    if (terms.length === 0) continue;
    for (const file of readdirSync(dir)) {
      if (!/^\d+\.json$/.test(file)) continue;
      const chapter = readJson(path.join(dir, file));
      chapter.verses.forEach((verse, verseIndex) => {
        const cores = verse.words.map((word) => lemmaCore(word.lemma, edition));
        for (const term of terms) {
          const hits = matchTerm(term, cores);
          if (hits.length === 0) continue;
          const key = `${book}/${chapter.chapter}`;
          const chapters = perTerm.get(term.id);
          const entry = chapters.get(key) ?? { book, chapter: chapter.chapter, edition, verses: [], count: 0 };
          const verseNumber = verse.verse ?? verseIndex + 1;
          if (!entry.verses.includes(verseNumber)) entry.verses.push(verseNumber);
          entry.count += hits.length;
          chapters.set(key, entry);
        }
      });
    }
  }

  const terms = LEXICON_TERMS.map((term) => {
    const chapters = [...perTerm.get(term.id).values()].sort(
      (a, b) => (order.get(a.book) ?? 999) - (order.get(b.book) ?? 999) || a.chapter - b.chapter,
    );
    for (const entry of chapters) entry.verses.sort((a, b) => a - b);
    const tokens = chapters.reduce((sum, entry) => sum + entry.count, 0);
    if (tokens === 0) {
      throw new Error(`lexicon: ${term.id} (${term.headword}) does not occur in the hosted ${term.lang} text`);
    }
    return {
      ...term,
      tokens,
      books: new Set(chapters.map((entry) => entry.book)).size,
      chapters,
    };
  });

  const chapterKeys = new Set(terms.flatMap((term) => term.chapters.map((c) => `${c.book}/${c.chapter}`)));
  return {
    source: {
      originals: "public/scriptures/original",
      snapshot: manifest.generatedAt,
      editions: [...new Set(Object.values(manifest.books))].sort(),
      method:
        "Each term is a lemma exactly as the hosted morphology tags it; counts are token occurrences in the hosted text, read once at build. Phrases count a head lemma with its partner within two tokens.",
    },
    groups: LEXICON_GROUPS,
    terms,
    totals: {
      terms: terms.length,
      tokens: terms.reduce((sum, term) => sum + term.tokens, 0),
      chapters: chapterKeys.size,
    },
  };
}

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const encounterSlug = (ref) => `enc-${ref.replace(/[^A-Za-z0-9]+/g, "-")}`;
const chapterKeyOf = (ref) => {
  const match = /^([1-4]?[A-Z][A-Z0-9]{1,4})\s+(\d+):/.exec(String(ref).trim());
  return match ? `${match[1]}/${Number(match[2])}` : null;
};

/** The order rooms are listed in when a chapter is cited by several. */
const ROOM_ORDER = ["The order", "The named ones", "The names he goes by", "The fall", "The encounters", "The demons", "What the text teaches"];

/**
 * Every Angels & Demons record that cites a chapter, plus the lexicon terms
 * that occur in it. Returns the index document (without writing it).
 */
export function buildChapterIndex(lexicon = buildLexicon()) {
  const order = readJson(path.join(ANGELS, "order.json"));
  const demons = readJson(path.join(ANGELS, "demons.json"));
  const fall = readJson(path.join(ANGELS, "fall.json"));
  const encounters = readJson(path.join(ANGELS, "encounters.json"));
  const teaching = readJson(path.join(ANGELS, "teaching.json"));

  const records = [];
  const add = (refs, record) => {
    for (const ref of refs) {
      const key = ref && chapterKeyOf(ref);
      if (key) records.push({ key, ...record });
    }
  };
  for (const band of order.bands) {
    add(band.refs, { kind: "order", label: band.name, room: "The order", href: `/angels#band-${band.id}` });
  }
  for (const named of order.named) {
    add([named.quoteRef, ...named.refs], { kind: "named", label: named.name, room: "The named ones", href: `/angels#${slug(named.name)}` });
  }
  for (const title of order.enemyNames) {
    add([title.ref], { kind: "title", label: title.title.split(" — ")[0], room: "The names he goes by", href: "/angels#enemy-titles" });
  }
  for (const demon of demons.demons) {
    add([demon.quoteRef, ...demon.refs], { kind: "demon", label: demon.name, room: "The demons", href: `/angels/demons#${demon.id}` });
  }
  for (const step of fall.steps) {
    add([step.ref, step.second?.ref], { kind: "fall", label: step.title, room: "The fall", href: `/angels/fall#${step.id}` });
  }
  for (const appearance of encounters.appeared) {
    add([appearance.ref], { kind: "encounter", label: appearance.event, room: "The encounters", href: `/angels/encounters#${encounterSlug(appearance.ref)}` });
  }
  for (const exorcism of encounters.castOut) {
    add([exorcism.ref, ...exorcism.parallels], { kind: "exorcism", label: exorcism.event, room: "The encounters", href: `/angels/encounters#${encounterSlug(exorcism.ref)}` });
  }
  for (const entry of teaching.entries) {
    add([entry.ref], { kind: "teaching", label: entry.title, room: "What the text teaches", href: `/angels#${entry.id}` });
  }

  const index = new Map();
  const ensure = (key) => {
    if (!index.has(key)) index.set(key, { entries: [], terms: [] });
    return index.get(key);
  };
  for (const { key, ...record } of records) {
    const chapter = ensure(key);
    if (!chapter.entries.some((existing) => existing.href === record.href)) chapter.entries.push(record);
  }
  for (const term of lexicon.terms) {
    for (const occurrence of term.chapters) {
      ensure(`${occurrence.book}/${occurrence.chapter}`).terms.push({
        id: term.id,
        headword: term.headword,
        lang: term.lang,
        count: occurrence.count,
      });
    }
  }

  const bookRank = bookOrder();
  const sortedKeys = [...index.keys()].sort((a, b) => {
    const [ab, ac] = a.split("/");
    const [bb, bc] = b.split("/");
    return (bookRank.get(ab) ?? 999) - (bookRank.get(bb) ?? 999) || Number(ac) - Number(bc);
  });
  const chapters = {};
  for (const key of sortedKeys) {
    const chapter = index.get(key);
    chapter.entries.sort((a, b) => ROOM_ORDER.indexOf(a.room) - ROOM_ORDER.indexOf(b.room) || a.label.localeCompare(b.label));
    chapter.terms.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
    chapters[key] = chapter;
  }
  return {
    source: {
      records: ["order.json", "demons.json", "fall.json", "encounters.json", "teaching.json"],
      lexicon: "lexicon.json",
    },
    totals: {
      chapters: sortedKeys.length,
      withRecords: sortedKeys.filter((key) => chapters[key].entries.length > 0).length,
      withTerms: sortedKeys.filter((key) => chapters[key].terms.length > 0).length,
    },
    chapters,
  };
}

function main() {
  const lexicon = buildLexicon();
  const chapterIndex = buildChapterIndex(lexicon);
  writeJsonAtomically(LEXICON_PATH, lexicon);
  writeJsonAtomically(CHAPTER_INDEX_PATH, chapterIndex);
  console.log(
    `Angels lexicon: ${lexicon.totals.terms} terms, ${lexicon.totals.tokens} occurrences across ${lexicon.totals.chapters} chapters → public/angels/lexicon.json`,
  );
  console.log(
    `Chapter index: ${chapterIndex.totals.chapters} chapters (${chapterIndex.totals.withRecords} cited by records, ${chapterIndex.totals.withTerms} with vocabulary) → public/angels/chapter-index.json`,
  );
  for (const term of lexicon.terms) {
    console.log(`  ${String(term.tokens).padStart(4)} × ${term.headword} (${term.transliteration}) in ${term.chapters.length} chapters`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
