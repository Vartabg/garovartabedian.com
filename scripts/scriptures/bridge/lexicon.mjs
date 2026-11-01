/**
 * The two dictionaries the Word Bridge checks against, loaded from the pinned
 * copies in scripts/scriptures/sources/word-bridge-lexicons (see its manifest).
 *
 * - Greek: Dodson Greek–English Lexicon (public domain). Headwords are Beta
 *   Code; SBLGNT lemmas are Unicode. Both reduce to the same bare letters.
 * - Hebrew: Strong's Hebrew Dictionary (1890, public domain), XML by the Open
 *   Scriptures Hebrew Bible Project (CC BY 4.0). OSHB lemmas are Strong's
 *   numbers with one-letter prefixes ("b/7225" is בְּ + H7225).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LEXICON_DIR = path.join(HERE, "..", "sources", "word-bridge-lexicons");

const GREEK_TO_BETA = Object.fromEntries(
  [..."αβγδεζηθικλμνξοπρστυφχψω"].map((ch, i) => [ch, "abgdezhqiklmncoprstufxyw"[i]]),
);

/** Unicode Greek → bare Beta Code letters (no accents, breathings, case). */
export function bareGreek(text) {
  return [...text.normalize("NFD").toLowerCase()]
    .filter((ch) => !/\p{M}/u.test(ch))
    .map((ch) => (ch === "ς" ? "σ" : ch))
    .map((ch) => GREEK_TO_BETA[ch] ?? "")
    .join("");
}

function parseTsv(line) {
  return line.split("\t").map((cell) => cell.replace(/^"|"$/g, ""));
}

let greek;
/** Map of bare headword letters → { strong, brief, long } (first entry wins). */
export function greekLexicon() {
  if (greek) return greek;
  greek = new Map();
  const lines = readFileSync(path.join(LEXICON_DIR, "dodson.csv"), "utf8").split(/\r?\n/);
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [strong, , headword, brief, long] = parseTsv(line);
    const key = headword.split(",")[0].toLowerCase().replace(/[^a-z]/g, "");
    if (key && !greek.has(key)) greek.set(key, { strong: `G${Number(strong)}`, brief, long });
  }
  return greek;
}

/** Dodson entry for an SBLGNT lemma such as "λόγος" or "οὕτω(ς)". */
export function lookupGreek(lemma) {
  const lex = greekLexicon();
  for (const form of [lemma, lemma.replace("(ς)", "ς"), lemma.replace("(ς)", "")]) {
    const entry = lex.get(bareGreek(form));
    if (entry) return entry;
  }
  return null;
}

const clean = (xml) =>
  xml
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

let hebrew;
/** Map of "H7225" → { strong, word, brief, long }. */
export function hebrewLexicon() {
  if (hebrew) return hebrew;
  hebrew = new Map();
  const xml = readFileSync(path.join(LEXICON_DIR, "HebrewStrong.xml"), "utf8");
  for (const m of xml.matchAll(/<entry id="(H\d+)">([\s\S]*?)<\/entry>/g)) {
    const body = m[2];
    const word = /<w [^>]*>([^<]*)<\/w>/.exec(body)?.[1] ?? "";
    const meaning = /<meaning>([\s\S]*?)<\/meaning>/.exec(body)?.[1] ?? "";
    const usage = /<usage>([\s\S]*?)<\/usage>/.exec(body)?.[1] ?? "";
    hebrew.set(m[1], { strong: m[1], word, brief: clean(meaning), long: clean(usage) });
  }
  return hebrew;
}

/** OSHB one-letter prefixes: grammar, not dictionary headwords. */
export const HEBREW_PREFIXES = {
  b: { word: "בְּ", brief: "in, at, with, by (the preposition beth)" },
  c: { word: "וְ", brief: "and (the conjunction waw)" },
  d: { word: "הַ", brief: "the (the definite article)" },
  k: { word: "כְּ", brief: "like, as (the preposition kaph)" },
  l: { word: "לְ", brief: "to, for (the preposition lamed)" },
  m: { word: "מִ", brief: "from (the preposition mem)" },
};

/** One OSHB lemma part ("b", "7225", "1254 a") → its dictionary entry. */
export function lookupHebrew(part) {
  const p = part.trim();
  if (HEBREW_PREFIXES[p]) return { strong: "prefix", ...HEBREW_PREFIXES[p] };
  const n = /\d+/.exec(p)?.[0];
  return n ? (hebrewLexicon().get(`H${Number(n)}`) ?? null) : null;
}
