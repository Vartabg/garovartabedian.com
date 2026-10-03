/**
 * Who Owns the Word? — contracts for the static JSON under public/word/.
 * Every entry carries the rights-holder's own page (or an equally solid
 * source) as sourceUrl; the dataset states facts, not opinions.
 */

/**
 * The copyright life drawn on the fences chart. `pub` is publication; `free`
 * is the year the text became (or will become) free to reuse — publication
 * + 95 years for the still-fenced US term, the actual lapse, dedication, or
 * publication year otherwise. `note` is the short status the chart reads out.
 */
export type FenceLife = { pub: number; free: number; note: string };

export type FencedTranslation = {
  id: string;
  abbr: string;
  name: string;
  year: number;
  owner: string;
  /** Commercial publisher/licensee when distinct from the copyright owner. */
  publisher?: string;
  /** The gratis-use policy, in plain language: what you may quote unasked. */
  policy: string;
  sourceUrl: string;
  life: FenceLife;
};

export type FreeTranslation = {
  id: string;
  abbr: string;
  name: string;
  year: string;
  status: string;
  note: string;
  sourceUrl: string;
  life: FenceLife;
  /** Reader translation id when it differs from the record id (dra → drb). */
  readerId?: string;
  /** Derived at load: true when the Scriptures world hosts this translation. */
  onSite?: boolean;
};

export type StoryBeat = {
  year: string;
  title: string;
  note: string;
};

export type WordResearchStatus = "researched" | "placeholder";

export type WordSourceKind =
  | "rights-holder"
  | "public-domain"
  | "license"
  | "archive"
  | "research-placeholder";

export type WordLedgerSource = {
  id: string;
  label: string;
  organization: string;
  kind: WordSourceKind;
  href: string;
  note: string;
  status: WordResearchStatus;
};

export type WordTimelineEvent = {
  id: string;
  year: string;
  title: string;
  note: string;
  sourceIds: string[];
  status: WordResearchStatus;
};

export type WordLedgerEntry = {
  id: string;
  abbr: string;
  name: string;
  category: "fenced" | "free" | "placeholder";
  status: WordResearchStatus;
  owner: string;
  summary: string;
  permission: string;
  sourceIds: string[];
  timeline: WordTimelineEvent[];
};

export type WordLedger = {
  title: string;
  intro: string;
  entries: WordLedgerEntry[];
  sources: WordLedgerSource[];
};

export type WordData = {
  fenced: FencedTranslation[];
  free: FreeTranslation[];
  story: StoryBeat[];
  /** The rights-holders' stated reasons, quoted or closely paraphrased. */
  theirCase: { text: string; who: string; sourceUrl: string }[];
  /** Texts the Scripture reader actually hosts, from the corpus-health snapshot. */
  hosted: { count: number; ids: string[] };
  ledger: WordLedger;
};

export type EnforcementCategory =
  | "historical"
  | "lawsuit"
  | "policy"
  | "licensing"
  | "informal"
  | "explainer"
  | "ai";

export type EnforcementCase = {
  id: string;
  title: string;
  year: string;
  category: EnforcementCategory;
  summary: string;
  outcome: string;
  quote?: { text: string; who: string };
  sourceUrl: string;
  /** Every page the case rests on, when one source cannot carry it. */
  sources?: { label: string; url: string }[];
  /** ISO date the cited pages were last read. */
  checked?: string;
};

export type CasesData = {
  roomIntro: string;
  cases: EnforcementCase[];
};

/** One link in a hosted text's chain: the file, the rights page, the review. */
export type ChainLink = { label: string; href: string; note?: string };

/** A hosted Scripture text, traced from source file to license to reader. */
export type HostedText = {
  /** Reader translation id (public/scriptures/text/<id>). */
  id: string;
  /** The matching card and ledger record (the reader's drb is the card's dra). */
  recordId: string;
  abbr: string;
  name: string;
  edition: string;
  year: string;
  /** The rights basis in one plain sentence. */
  basis: string;
  /** The file(s) the site ingested. */
  sources: ChainLink[];
  /** The rights statement the basis rests on. */
  license: ChainLink;
  /** ISO date the eBible archives were retrieved; supplements carry their own records. */
  retrieved?: string;
  /** What the processing did to the text, and what it did not. */
  processing: string;
  /** A published review of the text's boundaries, where one exists. */
  review?: ChainLink;
  /** A route into the reader where this text serves. */
  sample: { label: string; href: string };
};

/** Something else the reader hosts alongside the texts, with its own license. */
export type HostedApparatus = {
  id: string;
  name: string;
  basis: string;
  note: string;
  links: ChainLink[];
};

export type FreeChainData = {
  intro: string;
  texts: HostedText[];
  apparatus: HostedApparatus[];
  /** Where the public-domain claim stops. */
  boundary: string[];
};

/** Derived at load: where a hosted text is the reader's default for a shelf. */
export type HostedShelf = { tradition: string; label: string; books: number };

export type HostedTextView = HostedText & {
  books: number;
  chapters: number;
  /** Shelves where this text is the reader's default. */
  shelves: HostedShelf[];
  /** Shelves where it is offered as an alternate to the default. */
  alternateShelves: HostedShelf[];
};

export type FreeChainView = Omit<FreeChainData, "texts"> & {
  texts: HostedTextView[];
  hosted: { count: number; ids: string[] };
  stats: {
    crossReferenceTargets: number;
    topics: number;
    semanticVerses: number;
    semanticModel: string;
    narrationChapters: number;
  };
};
