/**
 * The Scripture picker's logic, kept free of React so every view (and the
 * tests) share one source: which section a book belongs to, how many
 * chapters and verses it has in the chosen translation, the map layout, and
 * the reference parser behind the Go-to box.
 *
 * Data: public/scriptures/doorways.json (scripts/scriptures/build-doorways.mjs).
 */

export type DoorwaysBook = {
  name: string;
  translations: string[];
  verses: number[];
  byTranslation?: Record<string, number[]>;
};

export type DoorwaysData = {
  schemaVersion: 1;
  traditions: { id: string; name: string; books: string[] }[];
  translations: Record<string, string>;
  books: Record<string, DoorwaysBook>;
};

export type SectionId =
  | "law"
  | "history"
  | "wisdom"
  | "prophets"
  | "twelve"
  | "enoch"
  | "gospels"
  | "acts"
  | "letters"
  | "revelation";

export type DoorwaysView = "shelf" | "contents" | "map" | "strip";
export const DOORWAYS_VIEWS: { id: DoorwaysView; label: string }[] = [
  { id: "shelf", label: "Shelf" },
  { id: "contents", label: "Contents" },
  { id: "map", label: "Map" },
  { id: "strip", label: "Strip" },
];

export const SECTIONS: Record<SectionId, { name: string; tab: string; testament: "OT" | "NT" }> = {
  law: { name: "Law", tab: "Law", testament: "OT" },
  history: { name: "History", tab: "History", testament: "OT" },
  wisdom: { name: "Wisdom and poetry", tab: "Wisdom", testament: "OT" },
  prophets: { name: "Prophets", tab: "Prophets", testament: "OT" },
  twelve: { name: "Minor prophets", tab: "Minor", testament: "OT" },
  enoch: { name: "Enoch and Jubilees", tab: "Enoch", testament: "OT" },
  gospels: { name: "Gospels", tab: "Gospels", testament: "NT" },
  acts: { name: "Acts", tab: "Acts", testament: "NT" },
  letters: { name: "Letters", tab: "Letters", testament: "NT" },
  revelation: { name: "Revelation", tab: "Rev.", testament: "NT" },
};

export const SECTION_ORDER: SectionId[] = [
  "law", "history", "wisdom", "prophets", "twelve", "enoch", "gospels", "acts", "letters", "revelation",
];

const SECTION_BOOKS: Record<SectionId, string[]> = {
  law: ["GEN", "EXO", "LEV", "NUM", "DEU"],
  history: [
    "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST",
    // Books outside the Protestant 66 are grouped by kind.
    "TOB", "JDT", "ESG", "1MA", "2MA", "3MA", "4MA", "1ES",
  ],
  wisdom: ["JOB", "PSA", "PRO", "ECC", "SNG", "WIS", "SIR", "PS2", "MAN"],
  prophets: ["ISA", "JER", "LAM", "EZK", "DAN", "BAR", "LJE", "SUS", "BEL", "DAG", "2ES"],
  twelve: ["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"],
  enoch: ["ENO", "JUB"],
  gospels: ["MAT", "MRK", "LUK", "JHN"],
  acts: ["ACT"],
  letters: [
    "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM",
    "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD",
  ],
  revelation: ["REV"],
};

const SECTION_OF = new Map<string, SectionId>(
  SECTION_ORDER.flatMap((section) => SECTION_BOOKS[section].map((id) => [id, section] as const)),
);

export function sectionOf(bookId: string): SectionId {
  return SECTION_OF.get(bookId) ?? "history";
}

export function traditionBooks(data: DoorwaysData, traditionId: string): string[] {
  return (data.traditions.find((t) => t.id === traditionId) ?? data.traditions[0]).books;
}

/** Books outside the Protestant 66 are marked, as on the site's own shelf. */
export function isBeyondProtestant(data: DoorwaysData, bookId: string): boolean {
  return !traditionBooks(data, "protestant").includes(bookId);
}

/** Every section present in a tradition, books in that tradition's own order. */
export function sectioned(data: DoorwaysData, traditionId: string): { section: SectionId; books: string[] }[] {
  const bySection = new Map<SectionId, string[]>();
  for (const id of traditionBooks(data, traditionId)) {
    const section = sectionOf(id);
    bySection.set(section, [...(bySection.get(section) ?? []), id]);
  }
  return SECTION_ORDER.filter((s) => bySection.has(s)).map((section) => ({
    section,
    books: bySection.get(section) ?? [],
  }));
}

/** The translation a link should open: the reader's choice when it carries the book. */
export function translationFor(data: DoorwaysData, bookId: string, chosen: string): string {
  const book = data.books[bookId];
  return book.translations.includes(chosen) ? chosen : book.translations[0];
}

/** Verses in each chapter, as the translation that will open divides the book. */
export function chapterVerses(data: DoorwaysData, bookId: string, chosen: string): number[] {
  const book = data.books[bookId];
  return book.byTranslation?.[translationFor(data, bookId, chosen)] ?? book.verses;
}

export function bookVerses(data: DoorwaysData, bookId: string, chosen: string): number {
  return chapterVerses(data, bookId, chosen).reduce((sum, v) => sum + v, 0);
}

/** Translations that carry at least one book of a tradition. */
export function translationsFor(data: DoorwaysData, traditionId: string): string[] {
  const books = traditionBooks(data, traditionId);
  return Object.keys(data.translations).filter((t) =>
    books.some((id) => data.books[id].translations.includes(t)),
  );
}

export function readerHref(
  traditionId: string,
  bookId: string,
  chapter: number,
  translation: string,
  verse?: number | null,
): string {
  return `/scriptures/${traditionId}/${bookId}/${chapter}?t=${translation}${verse ? `#v${verse}` : ""}`;
}

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Ordered strip treemap: items fill horizontal strips in their given order,
 * each strip grown while it keeps tiles closest to square. Order is kept so
 * Genesis stays first, unlike a size-sorted treemap.
 */
export function stripLayout<T extends { value: number }>(
  items: T[],
  x: number,
  y: number,
  w: number,
  h: number,
): (T & Rect)[] {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const k = (w * h) / total;
  const out: (T & Rect)[] = [];
  let top = y;
  let row: T[] = [];
  const ratio = (r: T[]) => {
    const area = r.reduce((sum, item) => sum + item.value * k, 0);
    const height = area / w;
    return r.reduce((sum, item) => {
      const width = (item.value * k) / height;
      return sum + Math.max(width / height, height / width);
    }, 0) / r.length;
  };
  const flush = (r: T[]) => {
    const area = r.reduce((sum, item) => sum + item.value * k, 0);
    const height = area / w;
    let left = x;
    for (const item of r) {
      const width = (item.value * k) / height;
      out.push({ ...item, x: left, y: top, w: width, h: height });
      left += width;
    }
    top += height;
  };
  for (const item of items) {
    if (!row.length) {
      row.push(item);
    } else if (ratio([...row, item]) <= ratio(row)) {
      row.push(item);
    } else {
      flush(row);
      row = [item];
    }
  }
  if (row.length) flush(row);
  return out;
}

const ALIASES: Record<string, string> = {
  jn: "JHN", jhn: "JHN", joh: "JHN", mt: "MAT", matt: "MAT", mk: "MRK", mrk: "MRK", lk: "LUK", luk: "LUK",
  ps: "PSA", psa: "PSA", psalm: "PSA", pss: "PSA", gn: "GEN", ge: "GEN", ex: "EXO", exo: "EXO", lv: "LEV",
  nm: "NUM", dt: "DEU", deut: "DEU", josh: "JOS", judg: "JDG", jdg: "JDG", ru: "RUT", "1sam": "1SA",
  "2sam": "2SA", "1sm": "1SA", "2sm": "2SA", "1kgs": "1KI", "2kgs": "2KI", "1chr": "1CH", "2chr": "2CH",
  neh: "NEH", est: "EST", jb: "JOB", prv: "PRO", prov: "PRO", ecc: "ECC", eccl: "ECC", qoh: "ECC",
  song: "SNG", sos: "SNG", cant: "SNG", is: "ISA", isa: "ISA", jer: "JER", lam: "LAM", ezek: "EZK",
  ezk: "EZK", dan: "DAN", dn: "DAN", hos: "HOS", jl: "JOL", am: "AMO", ob: "OBA", obad: "OBA", jon: "JON",
  jnh: "JON", mic: "MIC", nah: "NAM", hab: "HAB", zeph: "ZEP", hag: "HAG", zech: "ZEC", mal: "MAL",
  ac: "ACT", rom: "ROM", ro: "ROM", "1cor": "1CO", "2cor": "2CO", "1co": "1CO", "2co": "2CO", gal: "GAL",
  eph: "EPH", phil: "PHP", php: "PHP", col: "COL", "1thess": "1TH", "2thess": "2TH", "1th": "1TH",
  "2th": "2TH", "1tim": "1TI", "2tim": "2TI", tit: "TIT", phlm: "PHM", philem: "PHM", phm: "PHM",
  heb: "HEB", jas: "JAS", jm: "JAS", "1pet": "1PE", "2pet": "2PE", "1pt": "1PE", "2pt": "2PE",
  "1jn": "1JN", "2jn": "2JN", "3jn": "3JN", jud: "JUD", rev: "REV", rv: "REV", tob: "TOB", jdt: "JDT",
  wis: "WIS", sir: "SIR", ecclus: "SIR", bar: "BAR", "1macc": "1MA", "2macc": "2MA", "1ma": "1MA", "2ma": "2MA",
};

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function inOrder(needle: string, haystack: string): boolean {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return false;
}

export function parseReference(query: string): { book: string; chapter: number | null; verse: number | null } | null {
  const match = query.trim().match(/^([1-4]?\s*[a-zA-Z][a-zA-Z .]*?)\.?\s*(\d+)?(?:\s*[:.]\s*(\d+))?\s*$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: match[2] ? Number(match[2]) : null,
    verse: match[3] ? Number(match[3]) : null,
  };
}

/** Books of a tradition whose name or common abbreviation matches what was typed. */
export function findBooks(data: DoorwaysData, traditionId: string, typed: string): string[] {
  const needle = squash(typed);
  if (!needle) return [];
  const ids = traditionBooks(data, traditionId);
  const out: string[] = [];
  const alias = ALIASES[needle];
  if (alias && ids.includes(alias)) out.push(alias);
  for (const id of ids) {
    if (!out.includes(id) && squash(data.books[id].name).startsWith(needle)) out.push(id);
  }
  if (out.length < 3) {
    for (const id of ids) {
      const name = squash(data.books[id].name);
      if (!out.includes(id) && name[0] === needle[0] && inOrder(needle, name)) out.push(id);
    }
  }
  return out.slice(0, 6);
}

export type ReferenceSuggestion =
  | { kind: "reference"; bookId: string; chapter: number | null; verse: number | null; label: string; detail: string }
  | { kind: "search"; query: string; label: string; detail: string };

/** References first; then, for anything typed, a plain word search of the text. */
export function suggestReferences(
  data: DoorwaysData,
  traditionId: string,
  translation: string,
  query: string,
): ReferenceSuggestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const parsed = parseReference(trimmed);
  const references: ReferenceSuggestion[] = parsed
    ? findBooks(data, traditionId, parsed.book).map((bookId) => {
        const verses = chapterVerses(data, bookId, translation);
        const name = data.books[bookId].name;
        const chapters = verses.length;
        const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;
        if (parsed.chapter && parsed.chapter > chapters) {
          return { kind: "reference", bookId, chapter: null, verse: null, label: name, detail: `has ${plural(chapters, "chapter")}` };
        }
        const chapter = parsed.chapter ?? (chapters === 1 ? 1 : null);
        const verse = chapter && parsed.verse ? Math.min(parsed.verse, verses[chapter - 1]) : null;
        return {
          kind: "reference",
          bookId,
          chapter,
          verse,
          label: `${name}${parsed.chapter ? ` ${chapter}${verse ? `:${verse}` : ""}` : ""}`,
          detail: chapter && parsed.chapter ? plural(verses[chapter - 1], "verse") : plural(chapters, "chapter"),
        };
      })
    : [];
  const search: ReferenceSuggestion = {
    kind: "search",
    query: trimmed,
    label: `Search the text for “${trimmed}”`,
    detail: "Words and phrases",
  };
  return trimmed.length >= 2 ? [...references, search] : references;
}
