/** Compares indexed corpus groups; similarity does not establish historical influence. */
import { throwIfAborted, waitForShared, yieldToBrowser } from "./scriptures/semantic-task";
import canonsData from "../../public/scriptures/canons.json";
import type { Canons } from "./scriptures/types";
const canons = canonsData as Canons;

import {
  SEMANTIC_DIMS,
  loadQueryEmbedder,
  scoreRow,
  loadSemanticManifest,
  loadSemanticChapterRows,
  validateMatrix,
  type SemanticManifest,
} from "./scriptures/semantic";
import {
  loadCorpusIndex,
  loadCorpusRows,
  rankCorpusRows,
  type CorpusIndex,
  type WordsEntry,
  type EarlyEntry,
  type AfterlifeEntry,
} from "./semantic-corpus";

export type HorizonId =
  | "torah"
  | "prophets"
  | "writings"
  | "additional"
  | "gospels"
  | "words"
  | "epistles"
  | "early"
  | "antiquity";

export type HorizonMeta = {
  id: HorizonId;
  name: string;
  kicker: string;
  order: number;
  description: string;
};

export const HORIZON_ORDER: HorizonId[] = [
  "torah", "prophets", "writings", "additional", "gospels", "words", "epistles", "early", "antiquity",
];

export const HORIZONS: Record<HorizonId, HorizonMeta> = {
  torah: { id: "torah", name: "Torah / Pentateuch", kicker: "WEB chapters", order: 1,
    description: "Genesis through Deuteronomy: creation, covenant, and the Law of Moses." },
  prophets: { id: "prophets", name: "The Prophets (Nevi'im)", kicker: "WEB chapters", order: 2,
    description: "The Former and Latter Prophets: narrative, warning, and promise." },
  writings: { id: "writings", name: "The Writings (Ketuvim)", kicker: "WEB chapters", order: 3,
    description: "Psalms, wisdom, narrative, and the other Writings." },
  additional: { id: "additional", name: "Additional Scripture Books", kicker: "WEB chapters", order: 4,
    description: "Indexed books and additions beyond the Protestant canon, received differently across traditions." },
  gospels: { id: "gospels", name: "Gospel Chapters", kicker: "WEB chapters", order: 5,
    description: "The complete indexed chapters of Matthew, Mark, Luke, and John, including narrative." },
  words: { id: "words", name: "Sayings of Jesus", kicker: "Selected WEB verses", order: 6,
    description: "Verses selected by the sayings index. This overlaps with the Gospel chapter group." },
  epistles: { id: "epistles", name: "Apostolic Writings", kicker: "WEB chapters", order: 7,
    description: "Acts, the apostolic letters, and Revelation." },
  early: { id: "early", name: "Early Texts", kicker: "Hosted sections", order: 8,
    description: "Hosted early Christian writings and other early texts, including 1 Enoch. Translations and editorial notes are indexed in excerpts; each section appears once with its strongest match." },
  antiquity: { id: "antiquity", name: "Comparative Frameworks", kicker: "Editorial summaries", order: 9,
    description: "Modern editorial descriptions of religious frameworks. Scores compare these summaries, not ancient primary-text passages." },
};

export const TORAH_BOOKS = new Set(["GEN", "EXO", "LEV", "NUM", "DEU"]);
export const PROPHETS_BOOKS = new Set([
  "JOS", "JDG", "1SA", "2SA", "1KI", "2KI", "ISA", "JER", "EZK",
  "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
]);
export const WRITINGS_BOOKS = new Set([
  "PSA", "PRO", "JOB", "SNG", "RUT", "LAM", "ECC", "EST", "DAN", "EZR", "NEH", "1CH", "2CH",
]);
export const GOSPEL_BOOKS = new Set(["MAT", "MRK", "LUK", "JHN"]);
export const EPISTLE_BOOKS = new Set([
  "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH",
  "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
]);

export const BOOK_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(canons.books).map(([id, book]) => [id, book.name]),
);

export function scriptureGroup(book: string): HorizonId | null {
  if (TORAH_BOOKS.has(book)) return "torah";
  if (PROPHETS_BOOKS.has(book)) return "prophets";
  if (WRITINGS_BOOKS.has(book)) return "writings";
  if (GOSPEL_BOOKS.has(book)) return "gospels";
  if (EPISTLE_BOOKS.has(book)) return "epistles";
  return canons.books[book] && canons.traditions.some((t) => t.books.includes(book)) ? "additional" : null;
}

export function scriptureHitHref(book: string, chapter: number): string {
  const tradition = canons.traditions.find((t) => t.books.includes(book));
  if (!tradition) throw new Error(`No reader route for ${book}`);
  return `/scriptures/${tradition.id}/${book}/${chapter}?t=web`;
}

export type ResonanceCoverage = {
  indexedChapters: number;
  assignedChapters: number;
  excludedChapters: { book: string; chapter: number; reason: string }[];
  unindexedBooks: { book: string; name: string; reason: string }[];
};

export type HorizonHit = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  score: number;
  preview?: string;
};

export type HorizonResonance = HorizonMeta & {
  peakScore: number;
  intensityPercent: number; // 0..100 relative to global peak
  hits: HorizonHit[];
  topHit?: HorizonHit;
};

export type OmniResonanceResult = {
  query: string;
  model: string;
  horizons: HorizonResonance[];
  peakHorizon: HorizonId | null;
  coverage: ResonanceCoverage;
  highestScore: number;
  allByRelevance: (HorizonHit & { horizonId: HorizonId; horizonName: string })[];
};

export type ResonanceSpark = {
  label: string;
  query: string;
  blurb: string;
  epicenter: HorizonId;
};

export const RESONANCE_SPARKS: ResonanceSpark[] = [
  {
    label: "Living Water",
    query: "living water well spring fountain life thirsty",
    blurb: "From the wilderness rock and prophetic springs to Jesus at the Samaritan well and Patristic mystical streams.",
    epicenter: "words",
  },
  {
    label: "Divine Council",
    query: "divine council sons of God heavenly host throne angels assembly",
    blurb: "Yahweh presiding over the heavenly court, the Son of Man ascending, and Clement's celestial hierarchies.",
    epicenter: "prophets",
  },
  {
    label: "The Scapegoat & Atonement",
    query: "scapegoat Azazel atonement bearing sin sacrifice blood covenant",
    blurb: "The Day of Atonement goat in Leviticus, Isaiah's Suffering Servant, and the Epistle of Barnabas's typology.",
    epicenter: "torah",
  },
  {
    label: "Harrowing of Hades",
    query: "descent into hades underworld sheol death conquered prison resurrection",
    blurb: "The gates of Sheol, Christ preaching to the spirits in prison, and comparative journeys through the underworld.",
    epicenter: "early",
  },
  {
    label: "Word Made Flesh (Logos)",
    query: "word made flesh logos wisdom beginning created light dwelt among us",
    blurb: "Creation by divine utterance, Proverbs 8 personified Wisdom, the Johannine prologue, and Justin Martyr's Apologies.",
    epicenter: "words",
  },
  {
    label: "Light in Darkness",
    query: "light in darkness shining dawn lamp truth glory illumination",
    blurb: "Genesis creation light, Isaiah's great light, Christ the light of the world, and Zoroastrian cosmic radiance.",
    epicenter: "antiquity",
  },
  {
    label: "Resurrection of the Flesh",
    query: "resurrection of the dead dry bones flesh rising immortal life incorruptible",
    blurb: "Ezekiel's valley of dry bones, Job's redeemer, Paul's resurrection body in 1 Corinthians 15, and Athenagoras's defense.",
    epicenter: "epistles",
  },
  {
    label: "The Day of the Lord",
    query: "day of the Lord judgment fire clouds trumpet coming wrath justice",
    blurb: "The solemn prophetic storm of Joel and Zephaniah, the Olivet discourse, and apocalyptic revelation.",
    epicenter: "prophets",
  },
];

/**
 * Pure compute pass: given query vector and pre-loaded indices/rows,
 * scores and aggregates all corpus groups without I/O.
 */
export function computeOmniResonance(
  query: string,
  queryVec: Float32Array | number[],
  manifest: SemanticManifest,
  chaptersRows: Int8Array,
  wordsIdx: CorpusIndex<WordsEntry>,
  wordsRows: Int8Array,
  earlyIdx: CorpusIndex<EarlyEntry>,
  earlyRows: Int8Array,
  afterlifeIdx: CorpusIndex<AfterlifeEntry>,
  afterlifeRows: Int8Array,
  { limitPerHorizon = 4 }: { limitPerHorizon?: number } = {},
): OmniResonanceResult {
  if (!Number.isInteger(limitPerHorizon) || limitPerHorizon < 1) throw new Error("Invalid group result limit");
  validateMatrix(queryVec, chaptersRows, SEMANTIC_DIMS, manifest.chapterIndex.length);
  for (const [idx, rows] of [[wordsIdx, wordsRows], [earlyIdx, earlyRows], [afterlifeIdx, afterlifeRows]] as const) {
    if (idx.model !== manifest.model || idx.dims !== SEMANTIC_DIMS || idx.quantization !== manifest.quantization) {
      throw new Error("Incompatible corpus index");
    }
    validateMatrix(queryVec, rows, SEMANTIC_DIMS, idx.entries.length);
  }
  if (manifest.dims !== SEMANTIC_DIMS) throw new Error("Incompatible scripture dimensions");
  const chapterHits = Object.fromEntries(HORIZON_ORDER.map((id) => [id, []])) as unknown as Record<HorizonId, HorizonHit[]>;
  const indexedBooks = new Set(manifest.chapterIndex.map(([book]) => book));
  const coverage: ResonanceCoverage = {
    indexedChapters: manifest.chapterIndex.length, assignedChapters: 0, excludedChapters: [],
    unindexedBooks: canons.bookOrder.filter((book) => !indexedBooks.has(book)).map((book) => ({
      book, name: BOOK_NAMES[book],
      reason: canons.books[book].trans.includes("web") ? "WEB book missing from this index" : "No WEB edition indexed under this book ID",
    })),
  };
  for (let row = 0; row < manifest.chapterIndex.length; row++) {
    const [book, chapter] = manifest.chapterIndex[row];
    const group = scriptureGroup(book);
    if (!group) {
      coverage.excludedChapters.push({ book, chapter, reason: "No registered corpus group and reader route" });
      continue;
    }
    coverage.assignedChapters++;
    const score = scoreRow(queryVec, chaptersRows, row, SEMANTIC_DIMS);
    if (score <= 0) continue;
    chapterHits[group].push({ id: `${book}.${chapter}`, label: `${BOOK_NAMES[book]} ${chapter}`,
      sublabel: `WEB chapter centroid · ${book}`, href: scriptureHitHref(book, chapter), score });
  }
  for (const id of HORIZON_ORDER) chapterHits[id].sort((a, b) => b.score - a.score);

  // 2. Score Sayings of Jesus (words.bin)
  const wordsRanked = rankCorpusRows(queryVec, wordsIdx, wordsRows, Math.max(limitPerHorizon * 2, 8));
  const wordsHits: HorizonHit[] = wordsRanked
    .filter((r) => r.score > 0 && wordsIdx.entries[r.row])
    .slice(0, limitPerHorizon)
    .map((r) => {
      const entry = wordsIdx.entries[r.row];
      const bookName = BOOK_NAMES[entry.book] ?? entry.book;
      return {
        id: entry.id,
        label: `${bookName} ${entry.chapter}:${entry.verse}`,
        sublabel: "Saying of Jesus",
        href: `${scriptureHitHref(entry.book, entry.chapter)}#v${entry.verse}`,
        score: r.score,
      };
    });

  // 3. Score Early Church Writings (early.bin)
  const earlyRanked = rankCorpusRows(queryVec, earlyIdx, earlyRows, Math.max(limitPerHorizon * 2, 8));
  const earlyHits: HorizonHit[] = earlyRanked
    .filter((r) => r.score > 0 && earlyIdx.entries[r.row])
    .slice(0, limitPerHorizon)
    .map((r) => {
      const entry = earlyIdx.entries[r.row];
      return {
        id: entry.id,
        label: entry.label,
        sublabel: entry.chunk && entry.chunk.count > 1
          ? `Hosted section · excerpt ${entry.chunk.index + 1} of ${entry.chunk.count}`
          : "Hosted text section",
        href: `/early/${entry.textId}#s${entry.section}`,
        score: r.score,
      };
    });

  // 4. Score Comparative Antiquity Frameworks (afterlife.bin)
  const afterlifeRanked = rankCorpusRows(queryVec, afterlifeIdx, afterlifeRows, Math.max(limitPerHorizon * 2, 8));
  const antiquityHits: HorizonHit[] = afterlifeRanked
    .filter((r) => r.score > 0 && afterlifeIdx.entries[r.row])
    .slice(0, limitPerHorizon)
    .map((r) => {
      const entry = afterlifeIdx.entries[r.row];
      return {
        id: entry.id,
        label: entry.name,
        sublabel: `Editorial summary · ${entry.family} · ${entry.primaryDoctrine}`,
        href: entry.href,
        score: r.score,
        preview: entry.description,
      };
    });

  // Aggregate horizon hits map
  const rawHorizons: Record<HorizonId, HorizonHit[]> = {
    torah: chapterHits.torah.slice(0, limitPerHorizon),
    prophets: chapterHits.prophets.slice(0, limitPerHorizon),
    writings: chapterHits.writings.slice(0, limitPerHorizon),
    additional: chapterHits.additional.slice(0, limitPerHorizon),
    gospels: chapterHits.gospels.slice(0, limitPerHorizon),
    words: wordsHits,
    epistles: chapterHits.epistles.slice(0, limitPerHorizon),
    early: earlyHits,
    antiquity: antiquityHits,
  };

  // Find global peak score across all horizons
  let highestScore = 0;
  let peakHorizon: HorizonId | null = null;

  for (const id of HORIZON_ORDER) {
    const hits = rawHorizons[id];
    const topScore = hits[0]?.score ?? 0;
    if (topScore > highestScore) {
      highestScore = topScore;
      peakHorizon = id;
    }
  }

  // Build the corpus group objects with normalized intensity percentages
  const horizons: HorizonResonance[] = HORIZON_ORDER.map((id) => {
    const meta = HORIZONS[id];
    const hits = rawHorizons[id];
    const peakScore = hits[0]?.score ?? 0;
    // Relative display scale; zero means no positive similarity.
    const intensityPercent =
      peakScore <= 0
        ? 0
        : Math.round(Math.min(100, (peakScore / highestScore) * 100));

    return {
      ...meta,
      peakScore,
      intensityPercent,
      hits,
      topHit: hits[0],
    };
  });

  // Flatten all hits into unified relevance ranking
  const allByRelevance: (HorizonHit & { horizonId: HorizonId; horizonName: string })[] = [];
  for (const h of horizons) {
    for (const hit of h.hits) {
      allByRelevance.push({
        ...hit,
        horizonId: h.id,
        horizonName: h.name,
      });
    }
  }
  allByRelevance.sort((a, b) => b.score - a.score);

  return {
    query,
    model: manifest.model,
    horizons,
    peakHorizon,
    highestScore,
    coverage,
    allByRelevance,
  };
}

/**
 * Executes full asynchronous Omni-Corpus Resonance search in browser.
 */
export async function searchOmniResonance(
  query: string,
  {
    onProgress,
    signal,
    limitPerHorizon = 4,
  }: {
    onProgress?: (status: string) => void;
    signal?: AbortSignal;
    limitPerHorizon?: number;
  } = {},
): Promise<OmniResonanceResult> {
  throwIfAborted(signal);
  const progress = (status: string) => { if (!signal?.aborted) onProgress?.(status); };
  progress("Loading semantic model…");
  const [
    embedder,
    manifest,
    wordsIdx,
    wordsRows,
    earlyIdx,
    earlyRows,
    afterlifeIdx,
    afterlifeRows,
  ] = await waitForShared(Promise.all([
    loadQueryEmbedder(),
    loadSemanticManifest(),
    loadCorpusIndex<WordsEntry>("words"),
    loadCorpusRows("words"),
    loadCorpusIndex<EarlyEntry>("early"),
    loadCorpusRows("early"),
    loadCorpusIndex<AfterlifeEntry>("afterlife"),
    loadCorpusRows("afterlife"),
  ]), signal);

  throwIfAborted(signal);
  progress("Comparing indexed corpus groups…");
  const [queryVec, chaptersRows] = await waitForShared(Promise.all([embedder([query], {signal, onProgress: progress}), loadSemanticChapterRows(manifest)]), signal);
  // This established pure computation remains synchronous; give navigation a
  // turn and check cancellation before entering it.
  await waitForShared(yieldToBrowser(), signal);
  throwIfAborted(signal);

  return computeOmniResonance(
    query,
    queryVec,
    manifest,
    chaptersRows,
    wordsIdx,
    wordsRows,
    earlyIdx,
    earlyRows,
    afterlifeIdx,
    afterlifeRows,
    { limitPerHorizon },
  );
}
