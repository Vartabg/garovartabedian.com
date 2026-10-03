import narrationManifest from "../../../public/scriptures/audio/manifest.json";
import type { TranslationId } from "./types";

export type ChapterNarration = {
  translation: TranslationId;
  book: string;
  chapter: number;
  src: string;
  narrator: {
    id: string;
    name: string;
    description: string;
  };
};

type NarrationManifest = {
  narrator: ChapterNarration["narrator"];
  chapters: Array<Omit<ChapterNarration, "narrator">>;
};

const manifest = narrationManifest as NarrationManifest;

/** Return authored narration when this exact translation and chapter exists. */
export function getChapterNarration(
  translation: TranslationId,
  book: string,
  chapter: number,
): ChapterNarration | null {
  const match = manifest.chapters.find(
    (item) =>
      item.translation === translation &&
      item.book === book &&
      item.chapter === chapter,
  );
  return match ? { ...match, narrator: manifest.narrator } : null;
}
