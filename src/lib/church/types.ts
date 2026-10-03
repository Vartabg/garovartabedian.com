/**
 * The Church world — contracts for the static JSON under public/church/.
 * The Road is a continuous walk from Pentecost to today; every step carries
 * its source, and public-domain quotes let each era speak in its own voice.
 */

export type RoadQuote = {
  text: string;
  cite: string;
  translator?: string;
  sourceUrl: string;
};

export type RoadStep = {
  year: string;
  title: string;
  note: string;
  quote?: RoadQuote;
  sourceUrl: string;
};

export type RoadEra = {
  id: string;
  name: string;
  years: string;
  intro: string;
  /** The power thread: who held authority in this era, in one honest line. */
  power: string;
  steps: RoadStep[];
};

export type RoadData = {
  eras: RoadEra[];
};

export type TreeBranch = {
  id: string;
  name: string;
  /** Year the branch separates from its parent. */
  from: number;
  parent: string | null;
  note: string;
  /** Communions/examples riding this limb. */
  includes?: string;
};

export type TreeData = {
  range: { start: number; end: number };
  branches: TreeBranch[];
};

/** A real, verified public-domain artwork depicting a face or its tradition. */
export type FaceArt = {
  id: string;
  title: string;
  date: string;
  medium: string;
  museum: string;
  objectUrl: string;
  /** A file on this site under /art/ — see scripts/site/vendor-museum-art.mjs. */
  imageUrl: string;
  /** The museum URL the local copy was taken from, so the vendoring stays
   *  auditable and re-runnable. */
  sourceImageUrl: string;
  license: string;
  /** Screen-reader description of what the artwork depicts; falls back to
   *  title/medium/museum when absent. */
  alt?: string;
};

/** One cultural face of the church — a real historical figure, sourced. */
export type Face = {
  id: string;
  culture: string;
  name: string;
  years: string;
  line: string;
  quote?: { text: string; cite: string; sourceUrl: string };
  today: string;
  art: FaceArt[];
};

export type FacesData = {
  faces: Face[];
};

/** A link into another room of this world — the tree, the faces. */
export type SeeAlso = { label: string; href: string };

/** One church council, in its own words where the text is safely public domain. */
export type Council = {
  id: string;
  name: string;
  year: string;
  place: string;
  /** Who actually summoned it — emperor, empress regent, or pope. */
  calledBy: string;
  decision: string;
  quote?: { text: string; cite: string; sourceUrl: string };
  consequence: string;
  seeAlso?: SeeAlso;
};

export type CouncilsData = {
  intro: string;
  councils: Council[];
};

/** A record backing a stated fault — label + a link the reader can follow. */
export type GiantSource = { label: string; url: string };

/** One giant of the church — the gift and the fault, both sourced. */
export type Giant = {
  id: string;
  name: string;
  years: string;
  place: string;
  /** Where he stands in the story, in a few words. */
  stands: string;
  /** Scan-first statement of the contribution developed in the full record. */
  giftSummary: string;
  /** Scan-first statement of the documented fault developed in the full record. */
  faultSummary: string;
  /** What the church owes him. */
  gift: string;
  /** What the record shows against him, stated plainly. */
  fault: string;
  quote?: { text: string; cite: string; translator?: string; sourceUrl: string };
  faultSources: GiantSource[];
  seeAlso?: SeeAlso;
};

export type GiantsData = {
  intro: string;
  /** The biblical precedent that frames the room — verse text is verbatim WEB. */
  precedent: { text: string; cite: string; note: string };
  giants: Giant[];
};
