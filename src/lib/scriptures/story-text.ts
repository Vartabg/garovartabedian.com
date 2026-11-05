import genesis from "../../../public/scriptures/text/web/GEN.json";
import exodus from "../../../public/scriptures/text/web/EXO.json";
import ruth from "../../../public/scriptures/text/web/RUT.json";
import samuel from "../../../public/scriptures/text/web/1SA.json";
import kings from "../../../public/scriptures/text/web/1KI.json";
import esther from "../../../public/scriptures/text/web/EST.json";
import daniel from "../../../public/scriptures/text/web/DAN.json";
import jonah from "../../../public/scriptures/text/web/JON.json";
import luke from "../../../public/scriptures/text/web/LUK.json";
import type { ScriptureStory } from "./stories";

export type VerseSpan = {
  chapter: number;
  start: number;
  end: number;
};

type HostedBook = { chapters: string[][] };

const BOOKS: Record<ScriptureStory["book"], HostedBook> = {
  GEN: genesis as HostedBook,
  EXO: exodus as HostedBook,
  RUT: ruth as HostedBook,
  "1SA": samuel as HostedBook,
  "1KI": kings as HostedBook,
  EST: esther as HostedBook,
  DAN: daniel as HostedBook,
  JON: jonah as HostedBook,
  LUK: luke as HostedBook,
};

const BOOK_NAMES: Record<ScriptureStory["book"], string> = {
  GEN: "Genesis",
  EXO: "Exodus",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "1KI": "1 Kings",
  EST: "Esther",
  DAN: "Daniel",
  JON: "Jonah",
  LUK: "Luke",
};

export function bookName(book: ScriptureStory["book"]): string {
  return BOOK_NAMES[book];
}

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
  const name = bookName(book);
  return whole ? `${name} ${span.chapter}` : `${name} ${span.chapter}:${span.start}–${span.end}`;
}
