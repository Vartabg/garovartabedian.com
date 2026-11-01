import { loadStaticJson } from "@/lib/staticJsonClient";
import { KIND_CODES, SOURCES, STATUS_CODES, explain, tokenize } from "./bridge-verdicts.mjs";
import { loadBook } from "./client";
import type { OriginalChapter } from "./types";

/**
 * The Word Bridge in the reader. The published files are compact
 * (scripts/scriptures/bridge/build.mjs): per chapter only each link's
 * indices and verdict code, per book one dictionary. This module rebuilds a
 * verse's full bridge from those plus the World English Bible text and the
 * original-language chapter the reader already loads.
 */

export type BridgeStatus = "ok" | "plain" | "flag";

export type BridgeLink = {
  /** English token indices. */
  en: number[];
  /** Original word refs: "4" (whole word) or "4.0" (one part of it). */
  og: string[];
  kind: "link" | "supplied" | "untranslated";
  note?: string;
  status: BridgeStatus;
  label: string;
  why: string;
};

export type BridgeWord = {
  t: string;
  lemma: string;
  morph: string;
  suffix?: string;
  parts: { lemma: string; morph?: string; dict?: string }[];
};

export type BridgeVerse = {
  n: number;
  english: string[];
  original: BridgeWord[];
  links: BridgeLink[];
  /** Where this verse's links came from, in words. */
  source: string;
};

export type BridgeChapter = {
  book: string;
  chapter: number;
  edition: "sblgnt" | "oshb";
  lang: "greek" | "hebrew";
  direction: "ltr" | "rtl";
  dictionary: Record<string, { headword: string; gloss: string }>;
};

export type BridgeIndex = {
  format: number;
  checker: number;
  sources: string[];
  books: Record<string, { chapters: number[]; words: number; linked: number; ok: number; plain: number; flag: number }>;
};

type RawLink = [number[], string[], number, number, string, string?, string?];
type RawChapter = { format: number; checker: number; sources: Record<string, "c" | "e">; verses: Record<string, RawLink[]> };

const fetchJson = <T>(path: string) => loadStaticJson<T>("/scriptures", path);
const TEXT_SIGNS = /[⸀⸁⸂⸃⸄⸅]/g;
const PREFIXES = new Set(["b", "c", "d", "k", "l", "m"]);

export const loadBridgeIndex = () => fetchJson<BridgeIndex>("bridge/index.json");

/** Which original word a ref points at ("4.0" → word 4). */
export const refWord = (ref: string) => Number(ref.split(".")[0]);

/** Hebrew dictionary key for one part of an OSHB lemma: "b" or "H7225". */
function hebrewKey(raw: string) {
  const p = raw.trim();
  if (PREFIXES.has(p)) return p;
  const n = /\d+/.exec(p)?.[0];
  return n ? `H${Number(n)}` : null;
}

export async function loadBridgeVerse(book: string, chapter: number, n: number) {
  const index = await loadBridgeIndex();
  if (!index?.books[book]?.chapters.includes(chapter)) return null;
  const [raw, dict, text, original] = await Promise.all([
    fetchJson<RawChapter>(`bridge/${book}/${chapter}.json`),
    fetchJson<Record<string, [string, string]>>(`bridge/${book}/dictionary.json`),
    loadBook("web", book),
    fetchJson<OriginalChapter>(`original/${book}/${chapter}.json`),
  ]);
  const rows = raw?.verses[String(n)];
  const verseText = text?.chapters[chapter - 1]?.[n - 1];
  const words = original?.verses.find((v) => v.number === n)?.words;
  if (!raw || !dict || !rows || !verseText || !words || !original) return null;
  if (original.edition !== "sblgnt" && original.edition !== "oshb") return null;

  const lang = original.edition === "sblgnt" ? "greek" : "hebrew";
  const dictionary: BridgeChapter["dictionary"] = {};
  const entry = (key: string | null) => {
    if (!key || !dict[key]) return undefined;
    const [head, gloss] = dict[key];
    // Greek entries carry their Strong's number; Hebrew ones their headword.
    const id = lang === "greek" ? head : PREFIXES.has(key) ? `prefix:${key}` : key;
    dictionary[id] ??= { headword: lang === "greek" ? key : head, gloss };
    return id;
  };

  const bridgeWords: BridgeWord[] = words.map((w) => {
    if (lang === "greek") {
      return { t: w.text.replace(TEXT_SIGNS, ""), lemma: w.lemma, morph: w.morph, parts: [{ lemma: w.lemma, morph: w.morph, dict: entry(w.lemma) }] };
    }
    const lemmas = w.lemma.split("/");
    const morphs = w.morph.replace(/^[HA]/, "").split("/");
    return {
      t: w.text,
      lemma: w.lemma,
      morph: w.morph,
      suffix: morphs.length > lemmas.length ? morphs.slice(lemmas.length).join("/") : undefined,
      parts: lemmas.map((p, i) => {
        const key = hebrewKey(p);
        const id = entry(key);
        return { lemma: (id && dictionary[id]?.headword) || p, morph: morphs[i], dict: id };
      }),
    };
  });

  const verse: BridgeVerse = {
    n,
    english: tokenize(verseText).map((t) => t.t),
    original: bridgeWords,
    links: rows.map(([en, og, k, s, code, arg, note]) => ({
      en,
      og,
      kind: KIND_CODES[k],
      status: STATUS_CODES[s],
      note: note || undefined,
      ...explain(code, arg),
    })),
    source: SOURCES[raw.sources[String(n)] ?? "e"],
  };
  const ch: BridgeChapter = { book, chapter, edition: original.edition, lang, direction: original.direction, dictionary };
  return { chapter: ch, verse };
}
