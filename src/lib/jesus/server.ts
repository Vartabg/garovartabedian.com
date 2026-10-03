/**
 * Server-side Jesus room data. Static imports so first paint has content —
 * no client useEffect spinner for the index payloads.
 */

import artJson from "../../../public/jesus/art.json";
import christianWitnessesJson from "../../../public/jesus/christian-witnesses.json";
import historyJson from "../../../public/jesus/history.json";
import lensJson from "../../../public/jesus/lens-texts.json";
import perspectivesJson from "../../../public/jesus/perspectives.json";
import lifeJson from "../../../public/jesus/life.json";
import lifePlatesJson from "../../../public/jesus/life-plates.json";
import propheciesJson from "../../../public/jesus/prophecies.json";
import risenJson from "../../../public/jesus/risen.json";
import stonesJson from "../../../public/jesus/stones.json";
import stonesPlatesJson from "../../../public/jesus/stones-plates.json";
import wordsJson from "../../../public/jesus/words.json";
import essaysJson from "../../../public/jesus/essays.json";
import historySourcesJson from "../../../public/jesus/history-sources.json";
import synopticPericopesJson from "../../../public/jesus/synoptic-pericopes.json";
import type { SynopticPericope } from "./synoptic-diff";
import type {
  ArtWork,
  ChristianWitness,
  HistoryItem,
  JesusEssay,
  JesusHistorySource,
  JesusPerspective,
  LensEntry,
  LifeData,
  ProphecyPair,
  RisenData,
  StoneItem,
  WordsBook,
  WordsData,
} from "./types";
import type { LifePlateMeta } from "./life-plates";
import { lifeImageSrc } from "./life-plates";
import type { StonePlateMeta } from "./stone-plates";
import { stonePlateSrc } from "./stone-plates";

type PlateManifestEntry = {
  title: string;
  caption: string;
  alt: string;
  ready?: boolean;
  era?: string;
  eraName?: string;
  summary?: string;
  prompt?: string;
};

export const getLife = (): LifeData => lifeJson as LifeData;
export const getChristianWitnesses = (): ChristianWitness[] =>
  christianWitnessesJson as ChristianWitness[];
export const getHistory = (): HistoryItem[] => historyJson as HistoryItem[];
export const getStones = (): StoneItem[] => stonesJson as StoneItem[];
export const getWordsBook = (book: string): WordsBook =>
  (wordsJson as WordsData).books[book] ?? {};
export const getWordCounts = (): Record<string, number> =>
  (wordsJson as WordsData).counts;
export const getProphecies = (): ProphecyPair[] => propheciesJson as ProphecyPair[];
export const getRisen = (): RisenData => risenJson as RisenData;
export const getLensTexts = (): LensEntry[] => lensJson as LensEntry[];
export const getPerspectives = (): JesusPerspective[] =>
  perspectivesJson as JesusPerspective[];
export const getArt = (): ArtWork[] => artJson as ArtWork[];
export const getJesusEssays = (): JesusEssay[] => essaysJson as JesusEssay[];
export const getJesusHistorySources = (): JesusHistorySource[] =>
  historySourcesJson as JesusHistorySource[];
export const getSynopticPericopes = (): SynopticPericope[] =>
  (synopticPericopesJson as { pericopes: SynopticPericope[] }).pericopes;

export function getReadyLifePlates(): Record<string, LifePlateMeta> {
  const manifest = lifePlatesJson as Record<string, PlateManifestEntry>;
  const out: Record<string, LifePlateMeta> = {};
  for (const [eventId, entry] of Object.entries(manifest)) {
    if (!entry.ready) continue;
    out[eventId] = {
      src: lifeImageSrc(eventId),
      alt: entry.alt,
      caption: entry.caption,
      title: entry.title,
      era: entry.era ?? "",
    };
  }
  return out;
}

export function getReadyStonePlates(): Record<string, StonePlateMeta> {
  const manifest = stonesPlatesJson as Record<string, PlateManifestEntry>;
  const out: Record<string, StonePlateMeta> = {};
  for (const [stoneId, entry] of Object.entries(manifest)) {
    if (!entry.ready) continue;
    out[stoneId] = {
      src: stonePlateSrc(stoneId),
      alt: entry.alt,
      caption: entry.caption,
      title: entry.title,
    };
  }
  return out;
}
