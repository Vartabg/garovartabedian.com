import path from "node:path";
import { originalManifest } from "../original-availability";
import { dataContractError, readServerJson } from "@/lib/server-json";
import type {
  OriginalChapter,
  OriginalEditionId,
  OriginalLanguage,
} from "../types";
import { cachedJson, type JsonCache } from "./cache";
import { BOOK_ID_RE, safeIdentifier } from "./identifiers";

const ORIGINAL_DIR = path.join(process.cwd(), "public", "scriptures", "original");
const originalCache: JsonCache = new Map();

const ORIGINAL_EDITIONS = new Set<OriginalEditionId>(["oshb", "sblgnt", "lxx"]);
const ORIGINAL_LANGUAGES = new Set<OriginalLanguage>([
  "hebrew",
  "aramaic",
  "greek",
]);
const ANALYSIS_CONFIDENCE = new Set(["high", "medium", "low"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function originalChapterContractIssue(
  value: unknown,
  book: string,
  chapter: number,
): string | null {
  if (!isRecord(value)) return "chapter root must be an object";
  const expectedEdition = originalManifest.books[book];
  if (
    value.book !== book ||
    value.chapter !== chapter ||
    typeof value.bookName !== "string" ||
    !ORIGINAL_EDITIONS.has(value.edition as OriginalEditionId) ||
    value.edition !== expectedEdition ||
    value.direction !== (expectedEdition === "oshb" ? "rtl" : "ltr") ||
    !Array.isArray(value.verses)
  ) {
    return "book, chapter, edition, direction, or verses do not match the original-language manifest";
  }

  let previousVerse = 0;
  for (const verse of value.verses) {
    if (
      !isRecord(verse) ||
      !Number.isInteger(verse.number) ||
      (verse.number as number) <= previousVerse ||
      !Array.isArray(verse.languages) ||
      verse.languages.length === 0 ||
      verse.languages.some((language) => !ORIGINAL_LANGUAGES.has(language)) ||
      !Array.isArray(verse.words) ||
      (verse.sourceRefs !== undefined &&
        (!Array.isArray(verse.sourceRefs) ||
          verse.sourceRefs.some((reference) => typeof reference !== "string")))
    ) {
      return "verses must have ascending positive numbers, known languages, word arrays, and valid source references";
    }
    previousVerse = verse.number as number;

    for (const word of verse.words) {
      if (
        !isRecord(word) ||
        typeof word.text !== "string" ||
        typeof word.lemma !== "string" ||
        typeof word.morph !== "string" ||
        !optionalString(word.id) ||
        !optionalString(word.after) ||
        !optionalString(word.ketiv) ||
        !optionalString(word.pos) ||
        !optionalString(word.analysisSource) ||
        (word.analysisConfidence !== undefined &&
          !ANALYSIS_CONFIDENCE.has(String(word.analysisConfidence)))
      ) {
        return "word records must contain strings for text, lemma, morphology, and any source analysis fields";
      }
      if (
        expectedEdition === "lxx" &&
        (!word.pos || !word.analysisConfidence || !word.analysisSource)
      ) {
        return "lxx-morph words must retain part of speech, confidence, and analysis source";
      }
    }
  }
  return null;
}

export async function getOriginalChapter(
  book: string,
  chapter: number,
): Promise<OriginalChapter | null> {
  const safeBook = safeIdentifier(book, BOOK_ID_RE);
  if (
    !safeBook ||
    !originalManifest.books[safeBook] ||
    chapter > originalManifest.chapterCounts[safeBook] ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > 200
  ) {
    return null;
  }

  const filename = `${chapter}.json`;
  const file = path.join(ORIGINAL_DIR, safeBook, filename);
  const data = await cachedJson<unknown>(originalCache, file, () =>
    readServerJson<unknown>(ORIGINAL_DIR, [safeBook, filename], {
      required: true,
      label: `original-language chapter ${safeBook} ${chapter}`,
      repair: "npm run data:originals",
    }),
  );
  const contractIssue = originalChapterContractIssue(data, safeBook, chapter);
  if (contractIssue) {
    throw dataContractError(
      file,
      `original-language chapter ${safeBook} ${chapter}`,
      contractIssue,
      "npm run data:originals",
    );
  }
  return data as OriginalChapter;
}
