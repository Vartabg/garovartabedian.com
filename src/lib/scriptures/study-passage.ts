import canonsData from "../../../public/scriptures/canons.json";
import type { DossierPrimaryVerse } from "../site/notebooklm";
import { alignPolyglotVerses } from "./polyglot";
import type { StudyContext } from "./study-context";
import type { BookText, Canons, OriginalChapter, TranslationId } from "./types";

const canons = canonsData as Canons;
// These hosted books have edition-specific divisions or additional material.
// Until a passage mapping is verified, equal numeric references are insufficient.
const UNVERIFIED_NUMBERING_BOOKS = new Set(["JOL", "EZR", "EST", "DAN"]);
export const UNVERIFIED_NUMBERING_NOTE = "Hosted editions of this book have different divisions or additional material. Cross-edition correspondence has not been verified for this passage. Only your selected edition is shown; other witnesses and reception links are omitted.";
export const hasUnverifiedStudyNumbering = (bookId: string) => UNVERIFIED_NUMBERING_BOOKS.has(bookId);
const HISTORIC_PSALM_LOCATIONS: Partial<Record<number, { chapter: number; leadingItems: number }>> = {
  22: { chapter: 21, leadingItems: 1 },
  110: { chapter: 109, leadingItems: 0 },
};

export const hasVerifiedHistoricPsalmNumbering = (chapter: number) => Boolean(HISTORIC_PSALM_LOCATIONS[chapter]);

export function selectHistoricPsalmVerses(chapters: string[][] | undefined, book: string, hebrewChapter: number): string[] | null {
  const location = book === "PSA" ? HISTORIC_PSALM_LOCATIONS[hebrewChapter] : undefined;
  const verses = chapters?.[(location?.chapter ?? hebrewChapter) - 1] ?? null;
  return verses && location?.leadingItems ? verses.slice(location.leadingItems) : verses;
}

export async function loadStudyPassage(context: StudyContext, loaders: {
  book: (translation: TranslationId, book: string) => Promise<BookText | null>;
  original: (book: string, chapter: number) => Promise<OriginalChapter | null>;
}, endVerse = context.verse ?? 1) {
  let chapter = context.chapter, verse = context.verse ?? 1, lastVerse = Math.min(endVerse, verse + 6);
  let selectedOnly = context.translation === "charles";
  let note = "Your starting passage stays available while you explore the tools below.";
  const historic = context.translation === "brenton" || context.translation === "drb";
  if (context.bookId === "PSA" && historic) {
    const match = Object.entries(HISTORIC_PSALM_LOCATIONS).find(([, location]) => location?.chapter === chapter);
    if (match && verse > match[1]!.leadingItems) {
      chapter = Number(match[0]);
      verse -= match[1]!.leadingItems;
      lastVerse -= match[1]!.leadingItems;
      note = `The comparison uses Hebrew Psalm ${chapter}:${verse}. Your selected edition's Psalm ${context.chapter}:${context.verse ?? 1} remains the return passage.`;
    } else {
      selectedOnly = true;
      note = "This Psalm numbering has no verified cross-edition mapping here. Only your selected edition is shown; other witnesses and reception links are omitted.";
    }
  }
  if (hasUnverifiedStudyNumbering(context.bookId)) {
    selectedOnly = true;
    note = UNVERIFIED_NUMBERING_NOTE;
  }
  if (context.translation === "charles") note = "Your Charles translation is shown above and included in the dossier. This comparison has no aligned original-language or other translation witnesses for it.";
  const translations = selectedOnly ? [context.translation] : [...new Set<TranslationId>(["brenton", "drb", "kjv", "web", context.translation])];
  const entries = await Promise.all(translations.map(async (id) => [id, await loaders.book(id, context.bookId).catch(() => null)] as const));
  const books = Object.fromEntries(entries) as Partial<Record<TranslationId, BookText | null>>;
  const sourceText = books[context.translation]?.chapters[context.chapter - 1]?.[(context.verse ?? 1) - 1]?.trim();
  if (!sourceText) throw new Error("The requested verse has no hosted text in the selected edition.");
  const original = selectedOnly ? null : await loaders.original(context.bookId, chapter);
  const hideHistoric = context.bookId === "PSA" && !historic && !hasVerifiedHistoricPsalmNumbering(chapter);
  if (hideHistoric) note = "Your selected passage uses Hebrew Psalm numbering. Brenton and Douay-Rheims are omitted here because their corresponding passage has not been verified.";
  const english = (id: "brenton" | "drb" | "kjv" | "web") => {
    if (selectedOnly) return context.translation === id ? books[id]?.chapters[chapter - 1] ?? null : null;
    if (id === "brenton" || id === "drb") return hideHistoric ? null : selectHistoricPsalmVerses(books[id]?.chapters, context.bookId, chapter);
    return books[id]?.chapters[chapter - 1] ?? null;
  };
  const aligned = alignPolyglotVerses({ originalChapter: original,
    brentonVerses: english("brenton"), drbVerses: english("drb"),
    kjvVerses: english("kjv"), webVerses: english("web"), startVerse: verse, endVerse: lastVerse });
  const name = canons.books[context.bookId].name;
  const target = `${name} ${chapter}:${verse}`;
  const primaryVerses: DossierPrimaryVerse[] = context.translation === "charles" ?
    (books.charles?.chapters[context.chapter - 1] ?? []).slice(verse - 1, lastVerse).flatMap((text, index) => text.trim() ? [{
      ref: `${name} ${context.chapter}:${verse + index}`,
      additional: [{ label: canons.translations.charles.name, text }],
    }] : []) : aligned.map((row) => ({
    ref: `${name} ${chapter}:${row.number}`,
    original: row.originalVerse?.words.map((word) => word.text).join(" "),
    brenton: row.brentonText ?? undefined, drb: row.drbText ?? undefined,
    kjv: row.kjvText ?? undefined, web: row.webText ?? undefined,
  }));
  return { context, sourceText, note, chapter, verse, aligned, primaryVerses, target,
    includeReception: !selectedOnly };
}
