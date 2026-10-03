/**
 * The reverse index from a hosted chapter into the Angels & Demons world —
 * kept apart from ./server so the chapter reader pulls only this file into
 * its server bundle, not the whole world's data.
 */
import chapterIndexJson from "../../../public/angels/chapter-index.json";
import type { ChapterIndexData, UnseenChapter } from "./types";

const index = chapterIndexJson as ChapterIndexData;

/** Records and vocabulary for one chapter, or null when the world never touches it. */
export function getUnseenForChapter(book: string, chapter: number): UnseenChapter | null {
  return index.chapters[`${book}/${chapter}`] ?? null;
}
