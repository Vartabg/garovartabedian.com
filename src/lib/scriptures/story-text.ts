import genesis from "../../../public/scriptures/text/web/GEN.json";
import type { ScriptureStory } from "./stories";

export type VerseSpan = {
  chapter: number;
  start: number;
  end: number;
};

type HostedBook = { chapters: string[][] };

const BOOKS: Record<ScriptureStory["book"], HostedBook> = {
  GEN: genesis as HostedBook,
};

export type StoryVerse = {
  chapter: number;
  verse: number;
  text: string;
};

export function chapterLength(book: ScriptureStory["book"], chapter: number): number {
  const hosted = BOOKS[book];
  const rows = hosted?.chapters[chapter - 1];
  if (!rows) throw new Error(`No hosted ${book} ${chapter}`);
  return rows.length;
}

export function readSpan(book: ScriptureStory["book"], span: VerseSpan): StoryVerse[] {
  const rows = BOOKS[book].chapters[span.chapter - 1];
  if (!rows || span.start < 1 || span.end > rows.length || span.start > span.end) {
    throw new Error(`Bad span ${book} ${span.chapter}:${span.start}-${span.end}`);
  }
  return rows.slice(span.start - 1, span.end).map((text, index) => ({
    chapter: span.chapter,
    verse: span.start + index,
    text,
  }));
}

export function passageHref(book: ScriptureStory["book"], chapter: number, verse = 1): string {
  return `/scriptures/protestant/${book}/${chapter}?t=web#v${verse}`;
}

export function spanLabel(span: VerseSpan, book: ScriptureStory["book"]): string {
  const whole = span.start === 1 && span.end === chapterLength(book, span.chapter);
  return whole ? `Genesis ${span.chapter}` : `Genesis ${span.chapter}:${span.start}–${span.end}`;
}
