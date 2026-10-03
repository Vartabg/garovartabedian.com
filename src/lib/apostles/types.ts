/**
 * The Apostles world — contracts for the static JSON under public/apostles/.
 * Twelve records plus the empty seat and the man who filled it. Scripture
 * carries machine refs that resolve into the hosted reader; every tradition
 * claim names its earliest source and wears an honesty grade.
 */

/** Machine ref ("JHN 20:28") resolves into the reader; label is for eyes. */
export type RefLink = {
  ref: string;
  label: string;
};

export type ApostleScene = {
  title: string;
  note: string;
  refs: RefLink[];
};

/**
 * How well a claim is attested:
 * scripture — stated in the New Testament itself.
 * early     — named by a source within roughly a century of the apostles.
 * late      — first appears centuries on; tradition, not evidence.
 */
export type TraditionWeight = "scripture" | "early" | "late";

export type TraditionClaim = {
  claim: string;
  /** Earliest source that states it, named plainly. */
  earliest: string;
  sourceUrl: string;
  weight: TraditionWeight;
  note?: string;
};

export type Apostle = {
  id: string;
  name: string;
  /** Other names and bynames the text itself uses. */
  aka: string;
  /** What the name means, where that is known. */
  meaning: string;
  /** Seat 1–12 in the canonical lists; Matthias inherits 12. */
  seat: number;
  /** One line: trade and town before the call. */
  band: string;
  /** Dive-summary glance lines. */
  glanceCall: string;
  glanceCost: string;
  before: string;
  call: ApostleScene;
  /** Every named scene this man gets in the text — or the honest count. */
  record: ApostleScene[];
  /** The documented human moment; for the quiet ones, the shared one. */
  human: { text: string; refs: RefLink[] };
  /** What the New Testament itself shows after the upper room. */
  after: { text: string; refs: RefLink[] };
  /** Where tradition sends him, claim by graded claim. */
  sent: TraditionClaim[];
  /** How the record says he ended. */
  death: TraditionClaim;
  /** New Testament writings carried under his name, stated honestly. */
  writings?: string;
  seeAlso?: { href: string; label: string };
};

/** One of the four canonical roll-calls, in its own order. */
export type ApostleList = {
  id: string;
  cite: RefLink;
  note: string;
  names: string[];
};

export type TwelveData = {
  intro: string;
  precedent: { text: string; cite: string; note: string };
  lists: ApostleList[];
  listsNote: string;
  apostles: Apostle[];
  paul: { text: string; refs: RefLink[] };
};

/**
 * A graded headline claim per apostle. The map draws roads from `routes`;
 * rays supply the destination summaries and claims. The map also uses
 * reach === 0 to identify apostles who remained in Jerusalem.
 */
export type SentRay = {
  apostleId: string;
  name: string;
  /** Headline destination the claim points to. */
  to: string;
  /** Compass bearing from Jerusalem in degrees, 0 = north. */
  bearing: number;
  /** 0–1 log-scaled distance; 0 = never left (drawn as the center ring). */
  reach: number;
  weight: TraditionWeight;
  /** True when even the headline destination is disputed. */
  uncertain?: boolean;
  claims: TraditionClaim[];
};

/** A pinned place on the sending map — real lat/lng, hand-tuned label side. */
export type MapCity = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  anchor: "start" | "middle" | "end";
  dx: number;
  dy: number;
  /** The one center everything leaves from. */
  hub?: boolean;
  /** The tradition names the place but cannot locate it. */
  uncertainSite?: boolean;
};

/** One graded segment of a road; via points shape it along its corridor. */
export type RouteLeg = {
  from: string;
  to: string;
  weight: TraditionWeight;
  /** Shaping waypoints, [lat, lng] — sea lanes, mountain corridors. */
  via?: [number, number][];
  /**
   * The source grades the STORY, not necessarily this man — e.g. Eusebius
   * credits Edessa to a Thaddaeus of the seventy. Drawn faded.
   */
  uncertain?: boolean;
};

export type SentRoute = {
  apostleId: string;
  name: string;
  legs: RouteLeg[];
  /** Which city carries this man's name label; alsoAt repeats it at forks. */
  label: { at: string; alsoAt?: string[] };
  /** Even the destination is disputed — draw faded, mark with ?. */
  uncertain?: boolean;
  /** A direction the record gestures at without giving a destination. */
  stub?: { toward: [number, number]; note: string; weight: TraditionWeight };
};

export type SeaLabel = { name: string; lat: number; lng: number };

export type SentData = {
  intro: string;
  rays: SentRay[];
  cities: MapCity[];
  routes: SentRoute[];
  seas: SeaLabel[];
  /** Men the chart cannot honestly place. */
  unplaced: { apostleId: string; name: string; note: string }[];
  armenia: {
    title: string;
    text: string;
    seeAlso: { href: string; label: string };
  };
};
