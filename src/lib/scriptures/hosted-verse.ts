import gen from "../../../public/scriptures/text/web/GEN.json";
import luk from "../../../public/scriptures/text/web/LUK.json";
import mat from "../../../public/scriptures/text/web/MAT.json";

type HostedBook = { chapters: string[][] };

const BOOKS = {
  GEN: gen as HostedBook,
  LUK: luk as HostedBook,
  MAT: mat as HostedBook,
};

/** One verse from the hosted World English Bible. Missing text is a data error. */
export function hostedWebVerse(book: keyof typeof BOOKS, chapter: number, verse: number): string {
  const text = BOOKS[book].chapters[chapter - 1]?.[verse - 1];
  if (!text) throw new Error(`${book} ${chapter}:${verse} is missing from the hosted World English Bible.`);
  return text;
}
