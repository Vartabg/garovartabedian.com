import canonsData from "../../../public/scriptures/canons.json";
import doorwaysData from "../../../public/scriptures/doorways.json";
import { chapterVerses, type DoorwaysData } from "./doorways";
import type { Canons, TranslationId } from "./types";

const canons = canonsData as Canons;
const doorways = doorwaysData as DoorwaysData;
const KEYS = ["tradition", "book", "chapter", "verse", "translation"] as const;
const TOOLS = new Set(["polyglot", "dossier", "catena", "disputation", "diachronic", "graph", "resonance", "canons", "parallels", "topics", "search", "word-bridge"]);

export type StudyContext = {
  traditionId: string;
  bookId: string;
  chapter: number;
  verse?: number;
  translation: TranslationId;
};
export type StudySearchParams = Record<string, string | string[] | undefined> | URLSearchParams;
export type ParsedStudyContext = { context: StudyContext | null; error: string | null };

export function parseStudyContext(params: StudySearchParams): ParsedStudyContext {
  const values = Object.fromEntries(KEYS.map((key) => [key, params instanceof URLSearchParams ? params.getAll(key) : params[key]]));
  const present = KEYS.some((key) => Array.isArray(values[key]) ? values[key].length > 0 : values[key] !== undefined);
  if (!present) return { context: null, error: null };
  const invalid = () => ({ context: null, error: "This passage link is invalid or unavailable in the selected edition. Choose a passage in the reader and try again." });
  const single = (key: typeof KEYS[number]) => {
    const value = values[key];
    return Array.isArray(value) ? value.length === 1 ? value[0] : undefined : value;
  };
  if (KEYS.some((key) => Array.isArray(values[key]) && values[key].length > 1)) return invalid();
  const bookId = single("book")?.toUpperCase();
  const book = bookId ? canons.books[bookId] : null;
  if (!book || !bookId) return invalid();
  const traditionId = single("tradition") ?? canons.traditions.find((item) => item.books.includes(bookId))?.id;
  const tradition = canons.traditions.find((item) => item.id === traditionId);
  if (!tradition?.books.includes(bookId)) return invalid();
  const translation = (single("translation") ?? tradition.transPreference.find((id) => book.trans.includes(id)) ?? book.trans[0]) as TranslationId;
  if (!book.trans.includes(translation)) return invalid();
  const chapterValue = single("chapter") ?? "1", verseValue = single("verse") ?? "1";
  if (!/^[1-9]\d{0,3}$/.test(chapterValue) || !/^[1-9]\d{0,3}$/.test(verseValue)) return invalid();
  const chapter = Number(chapterValue), verse = Number(verseValue);
  const counts = chapterVerses(doorways, bookId, translation);
  if (!counts[chapter - 1] || verse > counts[chapter - 1]) return invalid();
  return { context: { traditionId: tradition.id, bookId, chapter, verse, translation }, error: null };
}

export function studyToolHref(path: string, context: StudyContext): string {
  if (!TOOLS.has(path.replace(/^\/scriptures\//, "")) || !path.startsWith("/scriptures/")) throw new Error("Unknown Scripture study tool");
  const params = new URLSearchParams({ tradition: context.traditionId, book: context.bookId,
    chapter: String(context.chapter), verse: String(context.verse ?? 1), translation: context.translation });
  if (!parseStudyContext(params).context) throw new Error("Invalid study context");
  return `${path}?${params}`;
}

export function studyReaderHref(context: StudyContext): string {
  // Validate the same small public metadata used by the picker; no book text
  // is imported into a client bundle to construct a link.
  studyToolHref("/scriptures/polyglot", context);
  return `/scriptures/${context.traditionId}/${context.bookId}/${context.chapter}?t=${context.translation}#v${context.verse ?? 1}`;
}

export function studyContextLabel(context: StudyContext): string {
  return `${canons.books[context.bookId]?.name ?? context.bookId} ${context.chapter}:${context.verse ?? 1} · ${canons.translations[context.translation]?.name ?? context.translation}`;
}
