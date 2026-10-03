import path from "node:path";
import { dataContractError, readServerJsonObject } from "@/lib/server-json";
import type { BookBriefing } from "../types";
import { cachedJson, type JsonCache } from "./cache";
import { BOOK_ID_RE, safeIdentifier } from "./identifiers";

const BOOKS_DIR = path.join(process.cwd(), "public", "scriptures", "books");
const bookBriefingCache: JsonCache = new Map();

export async function getBookBriefing(book: string): Promise<BookBriefing | null> {
  const safeBook = safeIdentifier(book, BOOK_ID_RE);
  if (!safeBook) return null;

  const filename = `${safeBook}.json`;
  const file = path.join(BOOKS_DIR, filename);
  const data = await cachedJson<BookBriefing>(bookBriefingCache, file, () =>
    readServerJsonObject<BookBriefing>(BOOKS_DIR, [filename], {
      required: false,
      label: `book briefing ${safeBook}`,
    }),
  );
  if (data === undefined) return null;
  if (data.book !== safeBook) {
    throw dataContractError(
      file,
      `book briefing ${safeBook}`,
      "book does not match its path",
    );
  }
  return data;
}
