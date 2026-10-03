import originalManifestData from "../../../public/scriptures/original/manifest.json";
import type { OriginalManifest, TranslationId } from "./types";

/** Manifest and availability for verse-aligned reader underlays. */
export const originalManifest = originalManifestData as OriginalManifest;

function hasOriginalBook(book: string, translation?: TranslationId): boolean {
  const edition = originalManifest.books[book];
  if (!edition) return false;
  if (edition !== "lxx") return true;
  const aligned = originalManifest.readerTranslations?.[book];
  return Boolean(aligned?.length && (!translation || aligned.includes(translation)));
}

export function hasOriginalChapter(
  book: string,
  chapter: number,
  translation?: TranslationId,
): boolean {
  return (
    hasOriginalBook(book, translation) &&
    Number.isInteger(chapter) &&
    chapter >= 1 &&
    chapter <= originalManifest.chapterCounts[book]
  );
}
