/**
 * Server-side Angels room data — static imports for first paint without client fetch.
 */

import demonsJson from "../../../public/angels/demons.json";
import encountersJson from "../../../public/angels/encounters.json";
import fallJson from "../../../public/angels/fall.json";
import lexiconJson from "../../../public/angels/lexicon.json";
import mediaPlatesJson from "../../../public/angels/media-plates.json";
import orderJson from "../../../public/angels/order.json";
import teachingJson from "../../../public/angels/teaching.json";
import type { AngelsPlateMeta } from "./media-plates";
import { angelPlateSrc } from "./media-plates";
import type {
  DemonsData,
  EncountersData,
  FallData,
  LexiconData,
  OrderData,
  TeachingData,
} from "./types";

export const getAngelsOrder = (): OrderData => orderJson as OrderData;
export const getFall = (): FallData => fallJson as FallData;
export const getEncounters = (): EncountersData => encountersJson as EncountersData;
export const getDemons = (): DemonsData => demonsJson as DemonsData;
export const getTeaching = (): TeachingData => teachingJson as TeachingData;
export const getLexicon = (): LexiconData => lexiconJson as LexiconData;

export function getReadyAngelsPlates(): Record<string, AngelsPlateMeta> {
  const manifest = mediaPlatesJson as Record<
    string,
    {
      kind: AngelsPlateMeta["kind"];
      title: string;
      caption: string;
      alt: string;
      ready?: boolean;
    }
  >;
  const out: Record<string, AngelsPlateMeta> = {};
  for (const [plateId, entry] of Object.entries(manifest)) {
    if (!entry.ready) continue;
    out[plateId] = {
      src: angelPlateSrc(plateId),
      alt: entry.alt,
      // These generated Lane B plates (docs/media-lanes.md) are interpretive
      // illustrations. Their manifest captions repeat the adjoining sourced
      // paragraph, so identify the art here and let that paragraph appear once.
      caption: `Interpretive illustration · ${entry.title}`,
      title: entry.title,
      kind: entry.kind,
    };
  }
  return out;
}
