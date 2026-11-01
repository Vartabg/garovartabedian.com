/**
 * The Word Bridge check: does the evidence support each drafted link?
 *
 * A model drafts which English words translate which Hebrew or Greek words.
 * This module decides, without any model, whether each link is supported:
 * by the dictionary meaning of the original word, or by grammar the original
 * word carries (a Greek verb's ending carries its subject; a Hebrew pronoun
 * suffix carries "my" or "his"; a genitive noun carries "of"). Anything else
 * is flagged for a person to review. Pure functions; no I/O.
 */

import { explain } from "../../../src/lib/scriptures/bridge-verdicts.mjs";

export const CHECKER_VERSION = 2;

/** A verdict: its status, its code and argument (published), and its words. */
const verdict = (status, code, arg = "") => ({ status, code, arg, ...explain(code, arg) });

const IRREGULAR = {
  was: "be", were: "be", is: "be", am: "be", are: "be", been: "be", being: "be", art: "be",
  gave: "give", given: "give", went: "go", gone: "go", came: "come", said: "say", saith: "say",
  saw: "see", seen: "see", took: "take", taken: "take", made: "make", knew: "know", known: "know",
  spoke: "speak", spoken: "speak", wrote: "write", written: "write", began: "begin", begun: "begin",
  born: "bear", bore: "bear", begotten: "beget", heard: "hear", sent: "send", told: "tell",
  found: "find", brought: "bring", thought: "think", stood: "stand", sat: "sit", ate: "eat",
  died: "die", dead: "die", men: "man", women: "woman", children: "child", feet: "foot",
  him: "he", his: "he", whoever: "who", whom: "who", whose: "who", heavens: "heaven",
};
// Gloss noise only: "I" in "I love", "a" in "a word", Strong's "×" marks.
const STOP = new Set(["i", "a", "an", "x", "or"]);
const SUBJECTS = new Set(["i", "you", "he", "she", "it", "we", "they", "thou", "ye"]);
const POSSESSIVE_OBJECT = new Set([
  "me", "my", "mine", "him", "his", "her", "hers", "us", "our", "ours", "them", "their", "theirs",
  "you", "your", "yours", "it", "its", "thee", "thy", "thine", "himself", "herself", "themselves",
  "myself", "yourself", "ourselves",
]);
const AUXILIARIES = new Set([
  "will", "shall", "should", "would", "may", "might", "must", "have", "has", "had", "did", "do",
  "does", "let", "be", "is", "am", "are", "was", "were", "been", "being", "can", "could",
]);
const CASE_WORDS = new Set(["of", "to", "for", "from", "by", "with", "in", "on", "at"]);
const INDEFINITE = new Set(["a", "an"]);

/**
 * Small words that turn up incidentally in long definitions ("... in which
 * the clouds move"). They count only when the dictionary gives them as one
 * of its own short glosses ("in, on, among"; "the"; "and, even, also").
 */
const FUNCTION_WORDS = new Set([
  "in", "on", "at", "of", "to", "for", "from", "by", "with", "into", "upon", "the", "and", "but",
  "or", "so", "that", "as", "this", "these", "those", "which", "who", "what", "then", "there",
]);
export function shortGlosses(...texts) {
  const set = new Set();
  for (const item of texts.join(";").split(/[,;()]/)) {
    const words = item.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length && words.length <= 3) words.forEach((w) => set.add(w.replace(/[^a-z]/g, "")));
  }
  return set;
}

/** Word-form stems for matching an English word against a dictionary gloss. */
export function stems(word) {
  const w = String(word).toLowerCase().replace(/[’']s$/, "").replace(/[^a-z]/g, "");
  if (!w) return [];
  const out = new Set([w, IRREGULAR[w] ?? w]);
  for (const [suffix, add] of [
    ["ies", "y"], ["ing", ""], ["ing", "e"], ["ed", ""], ["ed", "e"], ["d", ""], ["es", ""],
    ["s", ""], ["eth", ""], ["est", ""],
  ]) {
    if (w.length > suffix.length + 2 && w.endsWith(suffix)) out.add(w.slice(0, -suffix.length) + add);
  }
  return [...out];
}

/** Every stem of every word in a dictionary entry. */
export function glossStems(...texts) {
  const set = new Set();
  for (const raw of texts.join(" ").split(/[^A-Za-z]+/)) {
    if (!raw || STOP.has(raw.toLowerCase())) continue;
    for (const s of stems(raw)) set.add(s);
  }
  return set;
}

/** What grammar an original word carries, from its morphology code. */
export function grammar(lang, word, part) {
  if (lang === "greek") {
    const [pos = "", fields = ""] = (word.morph ?? "").split(" ");
    const mood = fields[3];
    return {
      verb: pos === "V-",
      finite: pos === "V-" && ["I", "S", "O", "D"].includes(mood),
      noun: ["N-", "A-", "RP", "RA", "RR", "RD", "RI", "RX"].includes(pos) || pos.startsWith("N"),
      oblique: ["G", "D"].includes(fields[4]),
      suffix: false,
    };
  }
  const m = part?.morph ?? "";
  return {
    verb: m.startsWith("V"),
    // Hebrew finite forms carry person (e.g. Vqp3ms).
    finite: /^V.[pqiwhjv]\d/.test(m) || /^V.[pqiwhjv][123]/.test(m),
    noun: m.startsWith("N") || m.startsWith("A") || m.startsWith("P"),
    oblique: false,
    suffix: Boolean(word.suffix && /^S/.test(word.suffix)),
  };
}

const unrepresented = (dict) => /unrepresented in english/i.test(`${dict?.brief ?? ""} ${dict?.long ?? ""}`);

/**
 * Check one link.
 * @param {{en:number[], og:string[], kind:"link"|"supplied"|"untranslated", confidence?:string, gap?:boolean}} link
 * @param {{lang:"greek"|"hebrew", english:{w:string}[], original:{parts:any[], suffix?:string, morph:string}[]}} verse
 * @param {string} [source] "e" for the free eBible tags, "c" for a Claude draft
 * @returns {{status:"ok"|"plain"|"flag", code:string, arg:string, label:string, why:string}}
 */
export function checkLink(link, verse, source = "c") {
  if (link.gap && link.kind === "supplied") {
    // An untagged word in the free tags is unknown, not wrong.
    return source === "e" ? verdict("plain", "untagged") : verdict("flag", "gap");
  }
  if (link.kind === "supplied") return verdict("plain", "supplied");
  const refs = link.og.map((ref) => {
    const [w, p] = ref.split(".").map(Number);
    const word = verse.original[w];
    const whole = Number.isNaN(p) || p === undefined;
    const partList = whole ? word.parts : [word.parts[p]];
    return { word, parts: partList };
  });
  if (link.kind === "untranslated") {
    if (refs.some((r) => r.parts.some((p) => unrepresented(p?.dict)))) return verdict("ok", "untranslated-dict");
    return verdict("plain", link.gap ? "untranslated-gap" : "untranslated");
  }

  const words = link.en.map((i) => verse.english[i]?.w ?? "").filter(Boolean);
  const entries = refs.flatMap((r) => r.parts.map((p) => `${p?.dict?.brief ?? ""} ${p?.dict?.long ?? ""}`));
  const gloss = glossStems(...entries);
  const short = shortGlosses(...refs.flatMap((r) => r.parts.map((p) => p?.dict?.brief ?? "")));
  const hit = words.find((w) =>
    FUNCTION_WORDS.has(w.toLowerCase()) ? short.has(w.toLowerCase()) : stems(w).some((s) => gloss.has(s)),
  );
  const uncertain = link.confidence === "low";

  if (hit && !uncertain) return verdict("ok", "dict", hit);

  // Grammar the original carries can explain function words.
  const g = refs.flatMap((r) => r.parts.map((p) => grammar(verse.lang, r.word, p)));
  const any = (key) => g.some((x) => x[key]);
  const explained = (w) => {
    const lw = w.toLowerCase();
    if (SUBJECTS.has(lw) && any("finite")) return "subject";
    if (POSSESSIVE_OBJECT.has(lw) && any("suffix")) return "suffix";
    if (AUXILIARIES.has(lw) && any("verb")) return "aux";
    if (CASE_WORDS.has(lw) && any("oblique")) return "case";
    if (INDEFINITE.has(lw) && any("noun")) return "article";
    return null;
  };
  const reasons = words.map(explained);
  const content = words.filter((w, i) => !reasons[i]);

  if (!uncertain && (hit || (words.length && content.length === 0))) {
    return verdict("ok", `grammar:${reasons.find(Boolean)}`);
  }
  if (uncertain) return verdict("flag", "uncertain");
  return verdict("flag", "nomatch", content.join("|"));
}

/**
 * Clean a drafted verse against the real verse: drop out-of-range indices,
 * keep each English word in one link only, and add explicit gaps for words
 * the draft left unlinked. Returns the cleaned links and what was fixed.
 */
export function validateDraft(draftLinks, verse) {
  const problems = [];
  const usedEnglish = new Set();
  const coveredOriginal = new Set();
  const links = [];
  for (const raw of draftLinks ?? []) {
    const kind = ["link", "supplied", "untranslated"].includes(raw.kind) ? raw.kind : "link";
    const en = (raw.en ?? []).filter((i) => {
      const ok = Number.isInteger(i) && i >= 0 && i < verse.english.length && verse.english[i].w && !usedEnglish.has(i);
      if (!ok) problems.push(`dropped English index ${i}`);
      return ok;
    });
    const og = (raw.og ?? []).map(String).filter((ref) => {
      const [w, p] = ref.split(".").map(Number);
      const word = verse.original[w];
      const ok = Boolean(word) && (Number.isNaN(p) || p === undefined || (p >= 0 && p < word.parts.length));
      if (!ok) problems.push(`dropped original ref ${ref}`);
      return ok;
    });
    if (kind === "link" && (!en.length || !og.length)) {
      if (en.length) links.push({ en, og: [], kind: "supplied", note: raw.note ?? "", confidence: "low" });
      else if (og.length) links.push({ en: [], og, kind: "untranslated", note: raw.note ?? "", confidence: "low" });
      problems.push("link missing a side");
    } else if (kind === "supplied" && !en.length) {
      problems.push("empty supplied link");
      continue;
    } else if (kind === "untranslated" && !og.length) {
      problems.push("empty untranslated link");
      continue;
    } else {
      links.push({
        en: kind === "untranslated" ? [] : en,
        og: kind === "supplied" ? [] : og,
        kind,
        note: raw.note ?? "",
        confidence: raw.confidence === "low" ? "low" : "high",
      });
    }
    en.forEach((i) => usedEnglish.add(i));
    og.forEach((ref) => coveredOriginal.add(Number(ref.split(".")[0])));
  }
  verse.english.forEach((tok, i) => {
    if (tok.w && !usedEnglish.has(i)) {
      links.push({ en: [i], og: [], kind: "supplied", note: "", confidence: "low", gap: true });
      problems.push(`English word ${i} unlinked`);
    }
  });
  verse.original.forEach((_, i) => {
    if (!coveredOriginal.has(i)) {
      links.push({ en: [], og: [String(i)], kind: "untranslated", note: "", confidence: "low", gap: true });
      problems.push(`original word ${i} unlinked`);
    }
  });
  return { links, problems };
}
