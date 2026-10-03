import path from "node:path";
import { dataContractError, readServerJson } from "@/lib/server-json";
import type { BookText, TranslationId } from "../types";
import { cachedJson, type JsonCache } from "./cache";
import { canons } from "./canons";
import { BOOK_ID_RE, safeIdentifier } from "./identifiers";

const TEXT_DIR = path.join(process.cwd(), "public", "scriptures", "text");
const textCache: JsonCache = new Map();

export async function getBookText(
  translation: TranslationId,
  book: string,
): Promise<BookText | null> {
  const safeBook = safeIdentifier(book, BOOK_ID_RE);
  if (!safeBook || !canons.books[safeBook]?.trans.includes(translation)) return null;

  const filename = `${safeBook}.json`;
  const file = path.join(TEXT_DIR, translation, filename);
  const data = await cachedJson<BookText>(textCache, file, () =>
    readServerJson<BookText>(TEXT_DIR, [translation, filename], {
      required: true,
      label: `${translation.toUpperCase()} text for ${safeBook}`,
      repair: "node scripts/scriptures/build-data.mjs",
    }),
  );
  if (
    !data ||
    data.book !== safeBook ||
    data.trans !== translation ||
    !Array.isArray(data.chapters)
  ) {
    throw dataContractError(
      file,
      `${translation.toUpperCase()} text for ${safeBook}`,
      "book, translation, or chapters do not match the canon entry",
      "node scripts/scriptures/build-data.mjs",
    );
  }
  return data;
}
