/**
 * One chapter as the Word Bridge sees it: the World English Bible verse split
 * into English tokens, and the original-language words (SBLGNT Greek or OSHB
 * Hebrew) split into their parts, each part carrying its dictionary entry.
 * Both the drafting prompt and the checked build read chapters from here, so
 * the indices the model links are the indices the checker verifies.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lookupGreek, lookupHebrew } from "./lexicon.mjs";
import { tokenize } from "../../../src/lib/scriptures/bridge-verdicts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, "..", "..", "..");
const SCRIPTURES = path.join(ROOT, "public", "scriptures");

/** Critical-text signs in the SBLGNT that are not part of the word. */
const TEXT_SIGNS = /[⸀⸁⸂⸃⸄⸅]/g;

export { tokenize };

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Split an original word into parts with dictionary entries. */
function parts(word, edition) {
  if (edition === "sblgnt") {
    const dict = lookupGreek(word.lemma);
    return { parts: [{ lemma: word.lemma, morph: word.morph, dict }], suffix: null };
  }
  // OSHB: "b/7225" with morph "HR/Ncfsa"; a trailing pronoun suffix ("/Sp1cs")
  // has a morph segment but no lemma.
  const lemmas = word.lemma.split("/");
  const morphs = word.morph.replace(/^[HA]/, "").split("/");
  const list = lemmas.map((lemma, i) => {
    const dict = lookupHebrew(lemma);
    return { lemma: dict?.word || lemma, morph: morphs[i] ?? "", dict };
  });
  const suffix = morphs.length > lemmas.length ? morphs.slice(lemmas.length).join("/") : null;
  return { parts: list, suffix };
}

export function loadChapter(book, chapter) {
  const web = readJson(path.join(SCRIPTURES, "text", "web", `${book}.json`));
  const original = readJson(path.join(SCRIPTURES, "original", book, `${chapter}.json`));
  const english = web.chapters[chapter - 1] ?? [];
  const verses = original.verses
    .map((v) => {
      const text = english[v.number - 1];
      if (!text) return null;
      return {
        n: v.number,
        english: tokenize(text),
        original: v.words.map((w) => ({
          t: w.text.replace(TEXT_SIGNS, ""),
          lemma: w.lemma,
          morph: w.morph,
          ...parts(w, original.edition),
        })),
      };
    })
    .filter(Boolean);
  return {
    book,
    chapter,
    edition: original.edition,
    lang: original.edition === "sblgnt" ? "greek" : "hebrew",
    direction: original.direction,
    verses,
  };
}
