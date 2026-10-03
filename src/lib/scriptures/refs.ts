import type { Canons, ParsedRef } from "./types";

const BOOK_ALIASES: Record<string, string> = {
  ge: "GEN",
  gen: "GEN",
  ex: "EXO",
  exod: "EXO",
  lev: "LEV",
  num: "NUM",
  deut: "DEU",
  dt: "DEU",
  josh: "JOS",
  judg: "JDG",
  ruth: "RUT",
  sam: "1SA",
  kg: "1KI",
  kgs: "1KI",
  chr: "1CH",
  chron: "1CH",
  ezra: "EZR",
  neh: "NEH",
  esth: "EST",
  ps: "PSA",
  psa: "PSA",
  psalm: "PSA",
  psalms: "PSA",
  prov: "PRO",
  eccl: "ECC",
  eccles: "ECC",
  song: "SNG",
  "song of solomon": "SNG",
  canticles: "SNG",
  isa: "ISA",
  jer: "JER",
  lam: "LAM",
  ezek: "EZK",
  dan: "DAN",
  hos: "HOS",
  obad: "OBA",
  mic: "MIC",
  nah: "NAM",
  hab: "HAB",
  zeph: "ZEP",
  hag: "HAG",
  zech: "ZEC",
  mal: "MAL",
  matt: "MAT",
  mt: "MAT",
  mk: "MRK",
  lk: "LUK",
  jn: "JHN",
  joh: "JHN",
  acts: "ACT",
  rom: "ROM",
  cor: "1CO",
  gal: "GAL",
  eph: "EPH",
  phil: "PHP",
  col: "COL",
  thess: "1TH",
  tim: "1TI",
  tit: "TIT",
  philem: "PHM",
  heb: "HEB",
  jas: "JAS",
  pet: "1PE",
  peter: "1PE",
  john: "JHN",
  jude: "JUD",
  rev: "REV",
  revelation: "REV",
  tob: "TOB",
  judith: "JDT",
  wis: "WIS",
  wisdom: "WIS",
  sir: "SIR",
  sirach: "SIR",
  bar: "BAR",
  baruch: "BAR",
  macc: "1MA",
  maccabees: "1MA",
  susanna: "SUS",
  bel: "BEL",
};

function normalizeBookName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function numberedAlias(alias: string): string | null {
  const match = alias.match(/^([1-4])\s*(.+)$/);
  if (!match) return null;

  const [, number, rest] = match;
  const base = BOOK_ALIASES[rest] ?? null;
  if (!base) return null;
  return `${number}${base.replace(/^[1-4]/, "")}`;
}

/** Parse "JHN 1:1-3" / "PSA 23:1" into a navigable target. */
export function parseRef(ref: string): ParsedRef | null {
  const m = ref.trim().match(/^([1-4]?[A-Z][A-Z0-9]{1,4})\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  return {
    book: m[1],
    chapter: Number(m[2]),
    verse: Number(m[3]),
    endVerse: m[4] ? Number(m[4]) : undefined,
    label: ref.trim(),
  };
}

/**
 * Parse the reference forms readers type into a search box, including full
 * book names and common abbreviations such as "John 3:16" and "1 Cor 13:4-7".
 */
export function parseScriptureQueryRef(
  query: string,
  canons: Canons,
): ParsedRef | null {
  const match = query
    .trim()
    .match(/^(.+?)\s+(\d+):(\d+)(?:\s*[-–—]\s*(\d+))?$/);
  if (!match) return null;

  const [, rawBook, rawChapter, rawVerse, rawEndVerse] = match;
  const alias = normalizeBookName(rawBook);
  const byName = Object.entries(canons.books).find(
    ([, meta]) => normalizeBookName(meta.name) === alias,
  )?.[0];
  const upperId = rawBook.replace(/\s+/g, "").toUpperCase();
  const book =
    (canons.books[upperId] ? upperId : null) ??
    byName ??
    BOOK_ALIASES[alias] ??
    numberedAlias(alias);
  if (!book || !canons.books[book]) return null;

  const chapter = Number(rawChapter);
  const verse = Number(rawVerse);
  const endVerse = rawEndVerse ? Number(rawEndVerse) : undefined;
  if (
    chapter < 1 ||
    chapter > canons.books[book].chapters ||
    verse < 1 ||
    (endVerse !== undefined && endVerse < verse)
  ) {
    return null;
  }

  const label = `${book} ${chapter}:${verse}${endVerse ? `-${endVerse}` : ""}`;
  return { book, chapter, verse, endVerse, label };
}
