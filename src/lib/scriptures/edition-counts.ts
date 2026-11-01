import doorwaysData from "../../../public/scriptures/doorways.json";
import { chapterVerses, type DoorwaysData } from "./doorways";

const doorways = doorwaysData as DoorwaysData;

export type HostedEditionCount = {
  translation: string;
  name: string;
  chapters: number;
  /** Numbered verse positions; an edition can leave a position empty. */
  versePositions: number;
};

/** Counts come from hosted files through build-doorways, never canon maxima. */
export function hostedEditions(bookId: string): HostedEditionCount[] {
  const book = doorways.books[bookId];
  if (!book) return [];
  return book.translations.map(translation => {
    const verses = chapterVerses(doorways, bookId, translation);
    return {
      translation,
      name: doorways.translations[translation],
      chapters: verses.length,
      versePositions: verses.reduce((total, count) => total + count, 0),
    };
  });
}

/** Match the reader's preference order, including the hosted fallback edition. */
export function hostedBookEdition(bookId: string, preference: readonly string[]): HostedEditionCount | null {
  const editions = hostedEditions(bookId);
  return preference.map(translation => editions.find(edition => edition.translation === translation))
    .find(edition => edition !== undefined) ?? editions[0] ?? null;
}

export function hostedChapterSummary(editions: readonly HostedEditionCount[]): string {
  if (!editions.length) return "No hosted chapter count";
  const counts = editions.map(edition => edition.chapters);
  const min = Math.min(...counts), max = Math.max(...counts);
  return `${min === max ? min : `${min}–${max}`} hosted chapter${max === 1 ? "" : "s"}`;
}
