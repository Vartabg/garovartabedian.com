import type {
  OriginalEditionId,
  OriginalLanguage,
  OriginalWord,
} from "./types";

const GREEK_POS: Record<string, string> = {
  "A-": "adjective",
  "C-": "conjunction",
  "D-": "adverb",
  "I-": "interjection",
  "N-": "noun",
  "P-": "preposition",
  RA: "definite article",
  RD: "demonstrative pronoun",
  RI: "interrogative or indefinite pronoun",
  RP: "personal pronoun",
  RR: "relative pronoun",
  "V-": "verb",
  "X-": "particle",
};

const PERSON: Record<string, string> = {
  "1": "first person",
  "2": "second person",
  "3": "third person",
};
const GENDER: Record<string, string> = {
  M: "masculine", F: "feminine", N: "neuter",
  m: "masculine", f: "feminine", c: "common", b: "both genders",
};
const NUMBER: Record<string, string> = {
  S: "singular", P: "plural",
  s: "singular", p: "plural", d: "dual",
};
const CASE: Record<string, string> = {
  N: "nominative", G: "genitive", D: "dative", A: "accusative", V: "vocative",
};

function values(...items: Array<string | undefined>): string[] {
  return items.filter((item): item is string => Boolean(item));
}

function parseMorphGnt(morph: string) {
  const [pos = "", code = ""] = morph.split(/\s+/);
  const grammar = values(
    PERSON[code[0]],
    { P: "present", I: "imperfect", F: "future", A: "aorist", X: "perfect", Y: "pluperfect" }[code[1]],
    { A: "active", M: "middle", P: "passive" }[code[2]],
    { I: "indicative", D: "imperative", S: "subjunctive", O: "optative", N: "infinitive", P: "participle" }[code[3]],
    CASE[code[4]],
    NUMBER[code[5]],
    GENDER[code[6]],
    { C: "comparative", S: "superlative" }[code[7]],
  );
  return { language: "greek" as const, segments: [values(GREEK_POS[pos] ?? pos, ...grammar).join(" · ")] };
}

const LXX_MORPH_TOKEN: Record<string, string> = {
  "1st": "first person",
  "2nd": "second person",
  "3rd": "third person",
  acc: "accusative",
  act: "active",
  aor: "aorist",
  comp: "comparative",
  dat: "dative",
  fem: "feminine",
  fut: "future",
  futperf: "future perfect",
  gen: "genitive",
  imperat: "imperative",
  imperf: "imperfect",
  ind: "indicative",
  inf: "infinitive",
  masc: "masculine",
  mid: "middle",
  neut: "neuter",
  nom: "nominative",
  opt: "optative",
  pass: "passive",
  perf: "perfect",
  pl: "plural",
  plup: "pluperfect",
  pres: "present",
  ptc: "participle",
  sg: "singular",
  subj: "subjunctive",
  superl: "superlative",
  voc: "vocative",
};

const LXX_VERB_TENSES = new Set([
  "aor",
  "fut",
  "futperf",
  "imperf",
  "perf",
  "plup",
  "pres",
]);

function expandLxxToken(token: string): string {
  return token
    .split("/")
    .map((part) => LXX_MORPH_TOKEN[part] ?? part)
    .join("/");
}

/** lxx-morph stores POS and readable parsing abbreviations as separate fields. */
function parseLxxMorph(word: OriginalWord) {
  const normalized = word.morph.trim();
  const tokens = normalized.split(/\s+/);
  const inferredVerb = tokens[0]?.split("/").some((token) => LXX_VERB_TENSES.has(token));
  const partOfSpeech = word.pos?.trim() || (inferredVerb ? "verb" : undefined);
  const grammar = normalized ? tokens.map(expandLxxToken) : [];
  return {
    language: "greek" as const,
    segments: [values(partOfSpeech, ...grammar).join(" · ")].filter(Boolean),
  };
}

const SEMITIC_POS: Record<string, string> = {
  A: "adjective", C: "conjunction", D: "adverb", N: "noun",
  P: "pronoun", R: "preposition", S: "suffix", T: "particle", V: "verb",
};
const ADJECTIVE_TYPE: Record<string, string> = {
  a: "adjective", c: "cardinal number", g: "gentilic", o: "ordinal number",
};
const NOUN_TYPE: Record<string, string> = { c: "common", g: "gentilic", p: "proper name" };
const PRONOUN_TYPE: Record<string, string> = {
  d: "demonstrative", f: "indefinite", i: "interrogative", p: "personal", r: "relative",
};
const SUFFIX_TYPE: Record<string, string> = {
  d: "directional he", h: "paragogic he", n: "paragogic nun", p: "pronominal",
};
const PARTICLE_TYPE: Record<string, string> = {
  a: "affirmation", d: "definite article", e: "exhortation", i: "interrogative",
  j: "interjection", m: "demonstrative", n: "negative", o: "direct-object marker",
  p: "article with inseparable preposition", r: "relative",
};
const STATE: Record<string, string> = { a: "absolute", c: "construct", d: "determined" };
const HEBREW_STEM: Record<string, string> = {
  q: "qal", N: "niphal", p: "piel", P: "pual", h: "hiphil", H: "hophal",
  t: "hithpael", o: "polel", O: "polal", r: "hithpolel", m: "poel",
  M: "poal", k: "palel", K: "pulal", Q: "qal passive", l: "pilpel",
  L: "polpal", f: "hithpalpel", D: "nithpael", j: "pealal", i: "pilel",
  u: "hothpaal", c: "tiphil", v: "hishtaphel", w: "nithpalel",
  y: "nithpoel", z: "hithpoel",
};
const ARAMAIC_STEM: Record<string, string> = {
  q: "peal", Q: "peil", u: "hithpeel", N: "niphal", p: "pael", P: "ithpaal",
  M: "hithpaal", a: "aphel", h: "haphel", s: "saphel", e: "shaphel",
  H: "hophal", i: "ithpeel", t: "hishtaphel", v: "ishtaphel", w: "hithaphel",
  o: "polel", z: "ithpoel", r: "hithpolel", f: "hithpalpel", b: "hephal",
  c: "tiphel", m: "poel", l: "palpel", L: "ithpalpel", O: "ithpolel", G: "ittaphal",
};
const ASPECT: Record<string, string> = {
  a: "infinitive absolute", c: "infinitive construct", h: "cohortative",
  i: "imperfect", j: "jussive", p: "perfect", q: "sequential perfect",
  r: "active participle", s: "passive participle", v: "imperative",
  w: "sequential imperfect",
};

function personGenderNumberState(code: string, offset: number, includeState = true) {
  return values(
    PERSON[code[offset]],
    GENDER[code[offset + 1]],
    NUMBER[code[offset + 2]],
    includeState ? STATE[code[offset + 3]] : undefined,
  );
}

function genderNumberState(code: string, offset: number, includeState = true) {
  return values(
    GENDER[code[offset]],
    NUMBER[code[offset + 1]],
    includeState ? STATE[code[offset + 2]] : undefined,
  );
}

function parseSemiticSegment(code: string, language: "hebrew" | "aramaic") {
  const pos = code[0];
  const label = SEMITIC_POS[pos] ?? code;
  let grammar: string[] = [];
  if (pos === "A") grammar = values(ADJECTIVE_TYPE[code[1]], ...genderNumberState(code, 2));
  else if (pos === "N") grammar = values(NOUN_TYPE[code[1]], ...genderNumberState(code, 2));
  else if (pos === "P") grammar = values(PRONOUN_TYPE[code[1]], ...personGenderNumberState(code, 2, false));
  else if (pos === "S") grammar = values(SUFFIX_TYPE[code[1]], ...personGenderNumberState(code, 2, false));
  else if (pos === "T") grammar = values(PARTICLE_TYPE[code[1]]);
  else if (pos === "R") grammar = values(code[1] === "d" ? "definite article" : undefined);
  else if (pos === "V") {
    const aspect = ASPECT[code[2]];
    const stem = (language === "hebrew" ? HEBREW_STEM : ARAMAIC_STEM)[code[1]];
    const features = aspect === "active participle" || aspect === "passive participle"
      ? genderNumberState(code, 3)
      : aspect === "infinitive absolute" || aspect === "infinitive construct"
        ? []
        : personGenderNumberState(code, 3, false);
    grammar = values(stem, aspect, ...features);
  }
  return values(label, ...grammar).join(" · ");
}

function parseSemitic(morph: string) {
  const language: OriginalLanguage = morph.startsWith("A") ? "aramaic" : "hebrew";
  return {
    language,
    segments: morph.slice(1).split("/").filter(Boolean).map((code) => parseSemiticSegment(code, language)),
  };
}

export function describeOriginalWord(word: OriginalWord, edition: OriginalEditionId) {
  switch (edition) {
    case "oshb":
      return parseSemitic(word.morph);
    case "sblgnt":
      return parseMorphGnt(word.morph);
    case "lxx":
      return parseLxxMorph(word);
    default: {
      const unsupported: never = edition;
      return unsupported;
    }
  }
}
