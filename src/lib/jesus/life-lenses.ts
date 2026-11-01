/**
 * The /jesus landing: forty moments of his life, each seen through several
 * lenses that stay on the same moment. Data comes from
 * scripts/jesus/build-life-lenses.ts; this module holds its shape and the
 * pure helpers the page and its tests share.
 */

export type LifeLensMoment = {
  id: string;
  era: string;
  title: string;
  line: string;
  place: string;
  /** Reference labels, Gospels first ("Matthew 3:13-17"). */
  refs: string[];
  /** Books that tell it, Gospels first. */
  books: string[];
  counts: { words: number; prophecy: number };
  /** Word-by-word comparisons in /jesus/harmony that cover it. */
  harmony: { id: string; title: string }[];
  /** Hour-by-hour sources in /jesus/risen: how many, and the section to open. */
  risen: { count: number; section: string } | null;
};

export type LifeLensesIndex = {
  schemaVersion: 1;
  eras: { id: string; name: string }[];
  places: { id: string; name: string; modern: string; x: number; y: number }[];
  /** SVG paths in the 400×560 frame of src/app/jesus/life/geo.ts. */
  map: { land: string; water: string; jordan: string };
  moments: LifeLensMoment[];
};

export type LifeLensPassage = {
  ref: string;
  book: string;
  chapter: number;
  verse: number;
  /** [label, text]; the label carries the chapter only when a passage crosses one. */
  verses: [string, string][];
};

export type LifeLensMomentDetail = {
  passages: LifeLensPassage[];
  words: { ref: string; text: string }[];
  prophecy: {
    id: string;
    theme: string;
    line: string;
    connection: string;
    from: { ref: string; text: string };
    to: string[];
  }[];
};

export type LifeLensesDetail = {
  schemaVersion: 1;
  moments: Record<string, LifeLensMomentDetail>;
};

export type LifeLens = "words" | "gospels" | "prophecy";

export const LIFE_LENSES: { id: LifeLens; label: string }[] = [
  { id: "words", label: "His words" },
  { id: "gospels", label: "The Gospels" },
  { id: "prophecy", label: "Prophecy" },
];

/** Era names short enough for the timeline; the moment header uses the full name. */
export const ERA_SHORT: Record<string, string> = {
  birth: "Birth",
  preparation: "Baptism",
  galilee: "Galilee",
  journey: "To Jerusalem",
  passion: "Passion week",
  resurrection: "Risen",
};

export const GOSPELS: { id: string; name: string }[] = [
  { id: "MAT", name: "Matthew" },
  { id: "MRK", name: "Mark" },
  { id: "LUK", name: "Luke" },
  { id: "JHN", name: "John" },
];

/** The prophecy room's own labels for how a pair is connected. */
export const CONNECTION_LABELS: Record<string, string> = {
  explicit: "Explicit New Testament claim",
  echo: "Textual echo or application",
  typology: "Christian typological reading",
};

export function lensCount(moment: LifeLensMoment, lens: LifeLens): number {
  if (lens === "words") return moment.counts.words;
  if (lens === "prophecy") return moment.counts.prophecy;
  return moment.books.filter((book) => GOSPELS.some((g) => g.id === book)).length;
}

export const isLens = (value: unknown): value is LifeLens =>
  LIFE_LENSES.some((lens) => lens.id === value);

/** The reader opened at a passage's first verse. */
export const passageHref = (p: Pick<LifeLensPassage, "book" | "chapter" | "verse">) =>
  `/scriptures/protestant/${p.book}/${p.chapter}?t=web#v${p.verse}`;

/**
 * Moments matching what someone typed: a title, a place, a phrase from the
 * summary, or a reference such as "John 11" or "Luke 2:41".
 */
export function findMoments(index: LifeLensesIndex, query: string, limit = 7): LifeLensMoment[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (q.length < 2) return [];
  const placeName = new Map(index.places.map((p) => [p.id, `${p.name} ${p.modern}`]));
  const byTitle: LifeLensMoment[] = [];
  const byRest: LifeLensMoment[] = [];
  for (const m of index.moments) {
    if (m.title.toLowerCase().includes(q)) byTitle.push(m);
    else if ([m.line, placeName.get(m.place) ?? "", ...m.refs].join(" ").toLowerCase().includes(q)) byRest.push(m);
  }
  return [...byTitle, ...byRest].slice(0, limit);
}
