/**
 * Synoptic Harmony & Pericope Diffing Engine.
 *
 * Algorithmic comparative analysis across the canonical Gospels (Matthew, Mark, Luke, John).
 * Classifies every word into:
 *   - "all": Universal Agreement / Triple Tradition across all witnesses in the pericope
 *   - "shared": Double Tradition / Q-Source or pairwise shared material
 *   - "unique": Sondergut (unique to a single evangelist)
 *   - "stopword": Grammatical particles and common function words
 *
 * Detects multi-word consecutive verbatim runs (literary copying) and computes
 * pairwise Jaccard vocabulary overlap matrices.
 */

export type GospelCode = "MAT" | "MRK" | "LUK" | "JHN";

export const GOSPEL_NAMES: Record<GospelCode, string> = {
  MAT: "Matthew",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
};

export const GOSPEL_ORDER: GospelCode[] = ["MAT", "MRK", "LUK", "JHN"];

export type VerseWord = {
  text: string;
  lemma: string;
  morph: string;
};

export type SynopticGreekVerse = {
  number: number;
  words: VerseWord[];
};

export type SynopticEnglishVerse = {
  number: number;
  text: string;
};

export type SynopticWitness = {
  book: GospelCode;
  bookName: string;
  ref: string;
  order: number;
  verses: SynopticEnglishVerse[];
  greekVerses?: SynopticGreekVerse[];
};

export type SynopticTradition =
  | "triple-tradition"
  | "double-tradition-q"
  | "quadruple-attestation"
  | "special-matthew"
  | "special-luke";

export type SynopticPericope = {
  id: string;
  title: string;
  category: string;
  tradition: SynopticTradition;
  traditionLabel: string;
  synopsis: string;
  witnesses: Partial<Record<GospelCode, SynopticWitness>>;
};

export type WordClassification = "all" | "shared" | "unique" | "stopword";

export type DiffToken = {
  id: string;
  raw: string;
  clean: string;
  stem: string;
  classification: WordClassification;
  sharedWith: GospelCode[];
  isVerbatimRun: boolean;
  verseNumber: number;
  lemma?: string;
  morph?: string;
};

export type WitnessDiffResult = {
  book: GospelCode;
  bookName: string;
  ref: string;
  tokens: DiffToken[];
  totalWords: number;
  universalCount: number;
  universalRatio: number;
  sharedCount: number;
  sharedRatio: number;
  sondergutCount: number;
  sondergutRatio: number;
  verbatimRunCount: number;
};

export type PericopeDiffResult = {
  pericopeId: string;
  language: "en" | "el";
  witnesses: Partial<Record<GospelCode, WitnessDiffResult>>;
  pairwiseOverlap: Record<string, number>;
  sharedAllVocabulary: string[];
  totalWordsCombined: number;
};

export const STOPWORDS_EN = new Set(
  (
    "a an the and or but for nor so yet of in on at to from by with without into unto " +
    "upon over under through as is are was were be been being am do does did done have " +
    "has had having shall will would should may might must can could not no if then than " +
    "that this these those there here it its he him his she her they them their we us our " +
    "you your i me my mine who whom whose which what when where why how all any every some " +
    "such same other another one two said say says also again very much many more most now " +
    "let out up down came come went go going about because they’re"
  ).split(" "),
);

export const STOPWORDS_EL = new Set(
  (
    "ὁ ἡ τό καί δέ εἰς ἐν αὐτός σύ ἐγώ οὗτος ὅς τις ὅτι μή οὐ οὐκ οὐχί ὡς κατά " +
    "διά μετά περί πρός ὑπό παρά ἐκ ἐξ περίγε"
  ).split(" "),
);

/** Normalize English surface word to comparable stem. */
export function normalizeEnglish(word: string): string {
  const clean = word
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!clean) return "";
  if (clean.length > 4 && clean.endsWith("s") && !clean.endsWith("ss")) {
    return clean.slice(0, -1);
  }
  return clean;
}

/** Normalize Greek surface word or lemma. */
export function normalizeGreek(word: string): string {
  return word
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u0370-\u0373\u0384-\u0385]/g, "")
    .toLowerCase()
    .replace(/[^\u0391-\u03ce\u1f00-\u1ffe]/g, "");
}

type TokenSeed = {
  raw: string;
  clean: string;
  stem: string;
  verseNumber: number;
  lemma?: string;
  morph?: string;
};

/** Extract tokens from English verses. */
function extractEnglishTokens(verses: SynopticEnglishVerse[]): TokenSeed[] {
  const seeds: TokenSeed[] = [];
  for (const v of verses) {
    const rawTokens = v.text.split(/\s+/).filter(Boolean);
    for (const raw of rawTokens) {
      const clean = raw.replace(/[“”—".,!?:;()[\]’]/g, "").trim();
      const stem = normalizeEnglish(clean);
      seeds.push({
        raw,
        clean,
        stem,
        verseNumber: v.number,
      });
    }
  }
  return seeds;
}

/** Extract tokens from Greek verses. */
function extractGreekTokens(verses: SynopticGreekVerse[]): TokenSeed[] {
  const seeds: TokenSeed[] = [];
  for (const v of verses) {
    for (const w of v.words) {
      const clean = w.text.replace(/[\u00b7\u002c\u002e\u003b\u0387\u2e00-\u2e7f]/g, "").trim();
      const stem = normalizeGreek(w.lemma || w.text);
      seeds.push({
        raw: w.text,
        clean,
        stem,
        verseNumber: v.number,
        lemma: w.lemma,
        morph: w.morph,
      });
    }
  }
  return seeds;
}

/** Detect contiguous matching runs (length >= 2) between two token lists. */
function findVerbatimRuns(tokensA: TokenSeed[], tokensB: TokenSeed[]): {
  runsA: Set<number>;
  runsB: Set<number>;
} {
  const runsA = new Set<number>();
  const runsB = new Set<number>();
  const minLen = 2;

  for (let i = 0; i < tokensA.length; i++) {
    for (let j = 0; j < tokensB.length; j++) {
      let len = 0;
      while (
        i + len < tokensA.length &&
        j + len < tokensB.length &&
        tokensA[i + len].stem &&
        tokensB[j + len].stem &&
        tokensA[i + len].stem === tokensB[j + len].stem
      ) {
        len++;
      }
      if (len >= minLen) {
        for (let k = 0; k < len; k++) {
          runsA.add(i + k);
          runsB.add(j + k);
        }
      }
    }
  }
  return { runsA, runsB };
}

/**
 * Perform synoptic comparative diffing on a single pericope.
 *
 * @param pericope The pericope data with its witness verses.
 * @param language "en" for WEB English, "el" for Greek SBLGNT.
 * @param filterStopwords When true, common stopwords are tagged as "stopword" rather than influencing diff statistics.
 */
export function diffPericope(
  pericope: SynopticPericope,
  language: "en" | "el" = "en",
  filterStopwords = false,
): PericopeDiffResult {
  const witnessCodes = GOSPEL_ORDER.filter((code) => pericope.witnesses[code]);
  const tokenSeeds: Record<GospelCode, TokenSeed[]> = {} as Record<GospelCode, TokenSeed[]>;

  for (const code of witnessCodes) {
    const witness = pericope.witnesses[code]!;
    if (language === "el" && witness.greekVerses && witness.greekVerses.length > 0) {
      tokenSeeds[code] = extractGreekTokens(witness.greekVerses);
    } else {
      tokenSeeds[code] = extractEnglishTokens(witness.verses);
    }
  }

  // Detect verbatim runs across all pairs of witnesses
  const verbatimRuns: Record<GospelCode, Set<number>> = {} as Record<GospelCode, Set<number>>;
  for (const code of witnessCodes) {
    verbatimRuns[code] = new Set<number>();
  }

  for (let i = 0; i < witnessCodes.length; i++) {
    for (let j = i + 1; j < witnessCodes.length; j++) {
      const cA = witnessCodes[i];
      const cB = witnessCodes[j];
      const { runsA, runsB } = findVerbatimRuns(tokenSeeds[cA], tokenSeeds[cB]);
      for (const idx of runsA) verbatimRuns[cA].add(idx);
      for (const idx of runsB) verbatimRuns[cB].add(idx);
    }
  }

  // Build vocabulary occurrence map: stem -> Set of GospelCodes
  const stopwords = language === "el" ? STOPWORDS_EL : STOPWORDS_EN;
  const stemWitnessMap = new Map<string, Set<GospelCode>>();
  const stemWordSets: Record<GospelCode, Set<string>> = {} as Record<GospelCode, Set<string>>;

  for (const code of witnessCodes) {
    stemWordSets[code] = new Set<string>();
    for (const token of tokenSeeds[code]) {
      if (!token.stem) continue;
      const isStop = stopwords.has(token.clean.toLowerCase()) || stopwords.has(token.stem);
      if (filterStopwords && isStop) continue;

      stemWordSets[code].add(token.stem);
      if (!stemWitnessMap.has(token.stem)) {
        stemWitnessMap.set(token.stem, new Set());
      }
      stemWitnessMap.get(token.stem)!.add(code);
    }
  }

  const numWitnesses = witnessCodes.length;
  const sharedAllVocabulary: string[] = [];
  for (const [stem, presentWitnesses] of stemWitnessMap.entries()) {
    if (presentWitnesses.size === numWitnesses) {
      sharedAllVocabulary.push(stem);
    }
  }

  // Classify each token
  const witnessResults: Partial<Record<GospelCode, WitnessDiffResult>> = {};
  let totalWordsCombined = 0;

  for (const code of witnessCodes) {
    const seeds = tokenSeeds[code];
    const diffTokens: DiffToken[] = [];
    let universalCount = 0;
    let sharedCount = 0;
    let sondergutCount = 0;
    let verbatimRunCount = 0;

    for (let idx = 0; idx < seeds.length; idx++) {
      const s = seeds[idx];
      const isStop = stopwords.has(s.clean.toLowerCase()) || stopwords.has(s.stem);
      const isRun = verbatimRuns[code].has(idx);
      if (isRun) verbatimRunCount++;

      let classification: WordClassification = "unique";
      const sharedWith: GospelCode[] = [];

      if (!s.stem) {
        classification = "stopword";
      } else if (filterStopwords && isStop) {
        classification = "stopword";
      } else {
        const owners = stemWitnessMap.get(s.stem);
        if (owners) {
          for (const other of owners) {
            if (other !== code) sharedWith.push(other);
          }
          if (owners.size === numWitnesses) {
            classification = "all";
            universalCount++;
          } else if (owners.size >= 2) {
            classification = "shared";
            sharedCount++;
          } else {
            classification = "unique";
            sondergutCount++;
          }
        } else {
          classification = "unique";
          sondergutCount++;
        }
      }

      diffTokens.push({
        id: `${code}-${s.verseNumber}-${idx}`,
        raw: s.raw,
        clean: s.clean,
        stem: s.stem,
        classification,
        sharedWith,
        isVerbatimRun: isRun,
        verseNumber: s.verseNumber,
        lemma: s.lemma,
        morph: s.morph,
      });
    }

    const totalWords = seeds.length;
    totalWordsCombined += totalWords;
    const denominator = filterStopwords
      ? Math.max(1, universalCount + sharedCount + sondergutCount)
      : Math.max(1, totalWords);

    witnessResults[code] = {
      book: code,
      bookName: GOSPEL_NAMES[code],
      ref: pericope.witnesses[code]!.ref,
      tokens: diffTokens,
      totalWords,
      universalCount,
      universalRatio: Math.round((universalCount / denominator) * 1000) / 1000,
      sharedCount,
      sharedRatio: Math.round((sharedCount / denominator) * 1000) / 1000,
      sondergutCount,
      sondergutRatio: Math.round((sondergutCount / denominator) * 1000) / 1000,
      verbatimRunCount,
    };
  }

  // Calculate pairwise Jaccard similarity across content stems
  const pairwiseOverlap: Record<string, number> = {};
  for (let i = 0; i < witnessCodes.length; i++) {
    for (let j = i + 1; j < witnessCodes.length; j++) {
      const cA = witnessCodes[i];
      const cB = witnessCodes[j];
      const setA = stemWordSets[cA];
      const setB = stemWordSets[cB];
      let intersection = 0;
      for (const word of setA) {
        if (setB.has(word)) intersection++;
      }
      const union = setA.size + setB.size - intersection;
      const jaccard = union > 0 ? Math.round((intersection / union) * 1000) / 1000 : 0;
      pairwiseOverlap[`${cA}-${cB}`] = jaccard;
    }
  }

  return {
    pericopeId: pericope.id,
    language,
    witnesses: witnessResults,
    pairwiseOverlap,
    sharedAllVocabulary: sharedAllVocabulary.sort(),
    totalWordsCombined,
  };
}
