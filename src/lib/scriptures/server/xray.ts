import path from "node:path";
import { readServerJsonObject } from "@/lib/server-json";
import type { UnseenChapter } from "@/lib/angels/types";
import { STATUS_CODES } from "../bridge-verdicts.mjs";
import { isTemplateGuide } from "../guide-template";
import type { ChapterGuide, ChapterNeighbours, TranslationId, XrefFile } from "../types";
import type { ChapterXray } from "../xray-types";
import { cachedJson, type JsonCache } from "./cache";
import { BOOK_ID_RE, safeIdentifier } from "./identifiers";
import { getOriginalChapter } from "./originals";

const XREF_DIR = path.join(process.cwd(), "public", "scriptures", "xref");
const BRIDGE_DIR = path.join(process.cwd(), "public", "scriptures", "bridge");
const GUIDES_DIR = path.join(process.cwd(), "public", "scriptures", "guides");
const bookCache: JsonCache = new Map();

/** The published Word Bridge chapter (src/lib/scriptures/word-bridge.ts RawChapter). */
type RawBridgeChapter = { format: number; checker: number; sources: Record<string, "c" | "e">; verses: Record<string, unknown[][]> };
type BridgeIndex = { books: Record<string, { words: number; linked: number; ok: number; plain: number; flag: number }> };
type ReviewedGuide = ChapterGuide & { reviewStatus?: string; reviewedAt?: string; reviewer?: string };

/** Cross-reference links leaving one chapter: verses with any, and links in all. */
export function summarizeXref(file: XrefFile | undefined, chapter: number): ChapterXray["xref"] {
  if (!file?.refs) return { verses: 0, links: 0 };
  const prefix = `${chapter}:`;
  let verses = 0;
  let links = 0;
  for (const [key, targets] of Object.entries(file.refs)) {
    if (!key.startsWith(prefix) || !Array.isArray(targets)) continue;
    verses += 1;
    links += targets.length;
  }
  return { verses, links };
}

/** Per-link verdicts (RawLink[2] indexes STATUS_CODES) and per-verse drafting source. */
export function summarizeBridge(raw: RawBridgeChapter | undefined, book: BridgeIndex["books"][string] | undefined): ChapterXray["bridge"] {
  if (!raw?.verses) return null;
  const counts = { ok: 0, plain: 0, flag: 0 };
  let links = 0;
  const drafted = { ai: 0, ebible: 0, none: 0 };
  const verses = Object.keys(raw.verses);
  for (const verse of verses) {
    for (const link of raw.verses[verse] ?? []) {
      links += 1;
      const status = STATUS_CODES[typeof link[2] === "number" ? link[2] : -1];
      if (status) counts[status] += 1;
    }
    const source = raw.sources?.[verse];
    if (source === "c") drafted.ai += 1;
    else if (source === "e") drafted.ebible += 1;
    else drafted.none += 1;
  }
  return {
    verses: verses.length,
    links,
    ...counts,
    drafted,
    book: book ? { words: book.words, linked: book.linked, ok: book.ok, plain: book.plain, flag: book.flag } : null,
  };
}

export async function getChapterXray(input: {
  bookId: string;
  chapter: number;
  translation: TranslationId;
  verses: string[] | null;
  originalTranslations: readonly TranslationId[];
  guide: ChapterGuide | null;
  neighbours: ChapterNeighbours | null;
  unseen: UnseenChapter | null;
}): Promise<ChapterXray> {
  const { chapter } = input;
  const safeBook = safeIdentifier(input.bookId, BOOK_ID_RE);
  const empty: ChapterXray = {
    text: { translation: input.translation, verses: 0, emptySlots: 0 },
    original: null,
    bridge: null,
    xref: { verses: 0, links: 0 },
    neighbours: null,
    guide: { kind: "none" },
    unseen: { entries: 0, terms: 0 },
  };
  if (!safeBook || !Number.isInteger(chapter) || chapter < 1 || chapter > 200) return empty;

  const chapterFile = `${chapter}.json`;
  const [xrefFile, bridgeIndex, bridgeChapter, original] = await Promise.all([
    cachedJson<XrefFile>(bookCache, path.join(XREF_DIR, `${safeBook}.json`), () =>
      readServerJsonObject<XrefFile>(XREF_DIR, [`${safeBook}.json`], { required: false, label: `cross-references ${safeBook}`, repair: "npm run data:graph" }),
    ),
    cachedJson<BridgeIndex>(bookCache, path.join(BRIDGE_DIR, "index.json"), () =>
      readServerJsonObject<BridgeIndex>(BRIDGE_DIR, ["index.json"], { required: false, label: "Word Bridge index", repair: "npm run data:bridge" }),
    ),
    readServerJsonObject<RawBridgeChapter>(BRIDGE_DIR, [safeBook, chapterFile], { required: false, label: `Word Bridge ${safeBook} ${chapter}`, repair: "npm run data:bridge" }),
    input.originalTranslations.length > 0 ? getOriginalChapter(safeBook, chapter) : Promise.resolve(null),
  ]);

  let guide: ChapterXray["guide"];
  if (input.guide) {
    const reviewed = input.guide as ReviewedGuide;
    guide = {
      kind: "published",
      questions: Array.isArray(input.guide.questions) ? input.guide.questions.length : 0,
      status: reviewed.reviewStatus ?? null,
      reviewedOn: reviewed.reviewedAt ?? null,
      reviewer: reviewed.reviewer ?? null,
    };
  } else {
    // getChapterGuide returns null for both a missing file and a batch-template file.
    const rawGuide = await readServerJsonObject<object>(GUIDES_DIR, [safeBook, chapterFile], { required: false, label: `chapter guide ${safeBook} ${chapter}`, repair: "npm run data:guides" });
    guide = rawGuide === undefined ? { kind: "none" } : isTemplateGuide(rawGuide) ? { kind: "template" } : { kind: "none" };
  }

  const top = input.neighbours?.neighbours[0];
  return {
    text: {
      translation: input.translation,
      verses: input.verses?.length ?? 0,
      emptySlots: input.verses?.filter((verse) => !verse || !verse.trim()).length ?? 0,
    },
    original: original ? { edition: original.edition, verses: original.verses.length } : null,
    bridge: summarizeBridge(bridgeChapter, bridgeIndex?.books?.[safeBook]),
    xref: summarizeXref(xrefFile, chapter),
    neighbours: input.neighbours
      ? { count: input.neighbours.neighbours.length, top: top ? { book: top.book, chapter: top.chapter, shared: top.xrefLinks } : null }
      : null,
    guide,
    unseen: { entries: input.unseen?.entries.length ?? 0, terms: input.unseen?.terms.length ?? 0 },
  };
}
