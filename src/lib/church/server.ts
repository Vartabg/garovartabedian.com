/**
 * Server-side Church room data — static imports for first paint without client fetch.
 */

import councilPlatesJson from "../../../public/church/council-plates.json";
import councilsJson from "../../../public/church/councils.json";
import facesJson from "../../../public/church/faces.json";
import giantsJson from "../../../public/church/giants.json";
import roadJson from "../../../public/church/road.json";
import treeJson from "../../../public/church/tree.json";
import type { CouncilPlateMeta } from "./media-plates";
import { councilPlateSrc } from "./media-plates";
import type { CouncilsData, FacesData, GiantsData, RoadData, TreeData } from "./types";

export const getChurchRoad = (): RoadData => roadJson as RoadData;
export const getChurchTree = (): TreeData => treeJson as TreeData;
export const getCouncils = (): CouncilsData => councilsJson as CouncilsData;
export const getFaces = (): FacesData => facesJson as FacesData;
export const getGiants = (): GiantsData => giantsJson as GiantsData;

/** Great-fork years for the church era spine (from the tree data). */
export function churchSpineForks(tree: TreeData = getChurchTree()): number[] {
  const great = tree.branches
    .filter((b) => b.parent === "one" && b.from > 100)
    .map((b) => b.from);
  const reformation = tree.branches
    .filter((b) => b.parent === "catholic")
    .map((b) => b.from)
    .sort((a, b) => a - b)[0];
  return [...new Set([...great, ...(reformation ? [reformation] : [])])].sort(
    (a, b) => a - b,
  );
}

export function getReadyCouncilPlates(): Record<string, CouncilPlateMeta> {
  const manifest = councilPlatesJson as Record<
    string,
    {
      kind: "council";
      title: string;
      caption: string;
      alt: string;
      ready?: boolean;
    }
  >;
  const out: Record<string, CouncilPlateMeta> = {};
  for (const [councilId, entry] of Object.entries(manifest)) {
    if (!entry.ready) continue;
    out[councilId] = {
      src: councilPlateSrc(councilId),
      alt: entry.alt,
      caption: entry.caption,
      title: entry.title,
      kind: entry.kind,
    };
  }
  return out;
}
