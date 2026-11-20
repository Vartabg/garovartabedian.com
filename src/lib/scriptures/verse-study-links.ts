import canonsData from "../../../public/scriptures/canons.json";
import { studyToolHref } from "./study-context";
import { hasUnverifiedStudyNumbering } from "./study-passage";
import type { Canons } from "./types";
import { wordBridgeHref } from "./word-bridge-url";

const canons = canonsData as Canons;

/** One line that opens a study tool on a single verse. */
export type VerseStudyLink = {
  id: "compare" | "words";
  href: string;
  label: string;
};

export type StudyVerse = { book: string; chapter: number; verse: number };

const TRADITION = "protestant";
const TRANSLATION = "web";

/**
 * The language of the hosted original text, for each book whose told stories
 * get the compare and words lines (the 14 path stories and the 13 others). A
 * verse in a book that is not listed here throws instead of printing a wrong
 * language.
 */
export const ORIGINAL_LANGUAGE: Readonly<Record<string, "Hebrew" | "Greek">> = {
  GEN: "Hebrew",
  EXO: "Hebrew",
  RUT: "Hebrew",
  "1SA": "Hebrew",
  "1KI": "Hebrew",
  "2KI": "Hebrew",
  JON: "Hebrew",
  MAT: "Greek",
  MRK: "Greek",
  LUK: "Greek",
  JHN: "Greek",
  ACT: "Greek",
};

/**
 * Compare translations of one verse, then see the original words behind it.
 * Books whose editions the site has not verified line up (Esther, Daniel, Joel,
 * Ezra) throw: the comparison shows a single edition for them.
 */
export function verseStudyLinks({ book, chapter, verse }: StudyVerse): VerseStudyLink[] {
  if (hasUnverifiedStudyNumbering(book)) throw new Error(`${book} has editions not verified to line up`);
  const language = ORIGINAL_LANGUAGE[book];
  if (!language) throw new Error(`No original language is listed for ${book}`);
  const name = canons.books[book]?.name;
  if (!name) throw new Error(`No book named ${book}`);
  const where = `${name} ${chapter}:${verse}`;
  return [
    {
      id: "compare",
      href: studyToolHref("/scriptures/polyglot", {
        traditionId: TRADITION,
        bookId: book,
        chapter,
        verse,
        translation: TRANSLATION,
      }),
      label: `Compare translations of ${where}, with the ${language}`,
    },
    {
      id: "words",
      href: wordBridgeHref(TRADITION, book, chapter, verse),
      label: `See the ${language} words behind ${where}`,
    },
  ];
}
