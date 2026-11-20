import { verseStudyLinks, type VerseStudyLink } from "../scriptures/verse-study-links";
import { WORD_STUDIES } from "./word-studies";

/**
 * Each saying's compare and words lines, keyed by saying id and built on the
 * server from the saying's anchor verse, so the client page receives only
 * these strings and none of the scripture data behind them.
 */
export function sayingStudyLinks(): Record<string, VerseStudyLink[]> {
  return Object.fromEntries(
    WORD_STUDIES.map((study) => [
      study.id,
      verseStudyLinks({ book: study.anchor.book, chapter: study.anchor.chapter, verse: study.anchor.verse }),
    ]),
  );
}
