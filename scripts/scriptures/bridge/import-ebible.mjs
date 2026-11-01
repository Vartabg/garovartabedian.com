/**
 * The free starting point for every verse: eBible.org's World English Bible
 * USFM, where many English words carry a Strong's number ("this word
 * translates Hebrew/Greek word #…"). The tags are machine alignments and are
 * often wrong, so they are only drafts: build.mjs runs each one through the
 * same checker as any AI draft, and shows only what the dictionaries support.
 *
 * Reads the pinned zip in scripts/scriptures/sources/ebible-web-usfm (see its
 * manifest) with the system `unzip`; nothing is downloaded at build time.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lookupGreek } from "./lexicon.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const EBIBLE_ZIP = path.join(HERE, "..", "sources", "ebible-web-usfm", "eng-web_usfm.zip");

let entries;
function bookEntries() {
  if (entries) return entries;
  entries = new Map();
  const names = execFileSync("unzip", ["-Z1", EBIBLE_ZIP], { encoding: "utf8" }).split("\n");
  for (const name of names) {
    const m = /^\d+-([0-9A-Z]{3})eng-web\.usfm$/.exec(name.trim());
    if (m) entries.set(m[1], name.trim());
  }
  return entries;
}

const TAG = "⟦"; // ⟦
const END = "⟧"; // ⟧
const bare = (token) => /[\p{L}\p{N}][\p{L}\p{N}’'-]*[\p{L}\p{N}]|[\p{L}\p{N}]/u.exec(token)?.[0] ?? "";
const normalStrong = (code) => {
  const m = /^([GH])0*(\d+)/.exec(code.trim());
  return m ? `${m[1]}${m[2]}` : null;
};

/** One verse's USFM → [{ w, strong }] in reading order. */
export function parseVerse(usfm) {
  const text = usfm
    .replace(/\\f\s[\s\S]*?\\f\*/g, " ")
    .replace(/\\x\s[\s\S]*?\\x\*/g, " ")
    .replace(/\\\+?w ([^|\\]+?)\|strong="([^"]+)"\\\+?w\*/g, (_, words, strong) =>
      words
        .trim()
        .split(/\s+/)
        .map((w) => `${w}${TAG}${strong}${END}`)
        .join(" "),
    )
    .replace(/\\\+?[a-z]+\d*\*?/g, " ");
  return text
    .split(/\s+/)
    .map((token) => {
      const m = new RegExp(`${TAG}([^${END}]+)${END}`).exec(token);
      return { w: bare(token.replace(new RegExp(`${TAG}[^${END}]*${END}`, "g"), "")), strong: m ? normalStrong(m[1]) : null };
    })
    .filter((t) => t.w);
}

const cache = new Map();
/** Map of chapter → verse → tagged words, for one book. */
export function bookTags(book) {
  if (cache.has(book)) return cache.get(book);
  const name = bookEntries().get(book);
  const chapters = new Map();
  if (name) {
    const usfm = execFileSync("unzip", ["-p", EBIBLE_ZIP, name], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    let chapter = 0;
    for (const piece of usfm.split(/(?=\\c \d+)|(?=\\v \d+)/)) {
      const c = /^\\c (\d+)/.exec(piece);
      if (c) {
        chapter = Number(c[1]);
        chapters.set(chapter, new Map());
        continue;
      }
      const v = /^\\v (\d+)(?:-\d+)?\s([\s\S]*)$/.exec(piece);
      if (v && chapter) chapters.get(chapter).set(Number(v[1]), parseVerse(v[2]));
    }
  }
  cache.set(book, chapters);
  return chapters;
}

/** Strong's numbers each original word carries ("b/7225" → ["H7225"]). */
function strongsOf(word, lang) {
  if (lang === "greek") {
    const s = lookupGreek(word.lemma)?.strong;
    return s ? [s] : [];
  }
  return word.lemma
    .split("/")
    .map((p) => /\d+/.exec(p)?.[0])
    .filter(Boolean)
    .map((n) => `H${Number(n)}`);
}

/**
 * Draft links for one verse from its eBible tags.
 * @param {{english:{w:string}[], original:any[]}} verse  from loadChapter
 * @param {"greek"|"hebrew"} lang
 * @param {{w:string, strong:string|null}[]} tags
 */
export function draftFromTags(verse, lang, tags) {
  // 1. Align eBible's words with the site's World English Bible words. The
  //    texts are the same translation; a short lookahead absorbs any drift.
  const strongFor = new Map();
  let j = 0;
  verse.english.forEach((tok, i) => {
    if (!tok.w) return;
    const want = tok.w.toLowerCase();
    for (let k = j; k < Math.min(tags.length, j + 4); k++) {
      if (tags[k].w.toLowerCase() === want) {
        if (tags[k].strong) strongFor.set(i, tags[k].strong);
        j = k + 1;
        return;
      }
    }
  });

  // 2. Point each tagged English word at the original word with that number,
  //    preferring an unused one in about the same place in the verse.
  const carriers = verse.original.map((w) => strongsOf(w, lang));
  const used = new Set();
  const englishCount = Math.max(1, verse.english.length - 1);
  const originalCount = Math.max(1, verse.original.length - 1);
  const target = new Map();
  for (const [i, strong] of strongFor) {
    const candidates = carriers.map((list, o) => (list.includes(strong) ? o : -1)).filter((o) => o >= 0);
    if (!candidates.length) continue;
    const where = i / englishCount;
    candidates.sort((a, b) => (used.has(a) - used.has(b)) || Math.abs(a / originalCount - where) - Math.abs(b / originalCount - where));
    target.set(i, candidates[0]);
    used.add(candidates[0]);
  }

  // 3. Neighbouring English words on the same original word form one link.
  const links = [];
  for (const i of [...target.keys()].sort((a, b) => a - b)) {
    const o = target.get(i);
    const last = links.at(-1);
    if (last && last.og[0] === String(o) && last.en.at(-1) === i - 1) last.en.push(i);
    else links.push({ en: [i], og: [String(o)], kind: "link", note: "", confidence: "high" });
  }
  return links;
}
