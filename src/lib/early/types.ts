/**
 * Early Writings world — contracts for the static JSON under public/early/.
 * Texts are verbatim public-domain translations with per-file provenance;
 * timeline and journey datasets carry consensus scholarly date ranges.
 */

export type EarlyText = {
  id: string;
  title: string;
  date: string;
  intro: string;
  translator: string;
  sourceUrl: string;
  sections: { heading?: string; paragraphs: string[] }[];
  /** Optional "how this text survived" panel — manuscript witnesses + editions. */
  survival?: {
    intro: string;
    witnesses: { name: string; detail: string }[];
    editions: string;
    canonNote?: string;
  };
};

export type TimelineItem = {
  id: string;
  label: string;
  /** A shorter label for the bar when the full one would truncate mid-word. */
  short?: string;
  lane: "event" | "nt" | "writing";
  start: number;
  end: number;
  note: string;
  /** Only on lane "writing" items we host — links into the reader. */
  textId?: string;
};

export type TimelineData = {
  range: { start: number; end: number };
  items: TimelineItem[];
};

export type IgnatiusStop = {
  place: string;
  label: string;
  note: string;
  lettersWritten: string[];
};

export type IgnatiusLetter = {
  textId: string;
  title: string;
  writtenAt: string;
  to: string;
  note: string;
  quote: { text: string; cite: string };
};

export type IgnatiusData = {
  route: string[];
  stops: IgnatiusStop[];
  letters: IgnatiusLetter[];
};

/**
 * Where a hosted writing quotes Scripture, found by
 * scripts/early/build-allusions.mjs. Deterministic throughout: the candidates
 * are the quotation marks the translators set, and the match is rare-word
 * overlap against the hosted World English Bible, published only when one
 * passage stands clearly above every rival. The layer is deliberately partial
 * — an unidentified quotation links to nothing rather than to a guess.
 */
export type Allusion = {
  section: number;
  paragraph: number;
  /** Character offsets of the quoted span within the paragraph. */
  start: number;
  end: number;
  quote: string;
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  endChapter?: number;
  /** Summed rarity of the words the quotation and the passage share. */
  score: number;
  shared: string[];
  /** The uncommon words among those — the ones that identify the passage. */
  rare: string[];
  /** How far this passage stands above the best candidate from another book. */
  margin: number | null;
};

export type AllusionFile = {
  textId: string;
  allusions: Allusion[];
};
