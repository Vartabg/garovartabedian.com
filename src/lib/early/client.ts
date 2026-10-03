/** The corpus we host, in reading order — ids match data in public/early/texts/.
 *  Each date mirrors the `date` field of its own texts/<id>.json, verbatim.
 *  `chapters` = headed sections; `paragraphs` = total body paragraphs (from JSON). */

export type EarlyTextMeta = {
  id: string;
  title: string;
  blurb: string;
  date: string;
  /** Headed sections in the hosted JSON. */
  chapters: number;
  /** Total paragraphs across all sections. */
  paragraphs: number;
};

export const EARLY_TEXTS: EarlyTextMeta[] = [
  { id: "didache", title: "The Didache", blurb: "The church's oldest manual — the Two Ways, baptism, the meal, the traveling prophets.", date: "c. AD 50–120", chapters: 17, paragraphs: 17 },
  { id: "1clement", title: "1 Clement", blurb: "Rome writes to a divided Corinth, within living memory of the apostles.", date: "c. AD 95–96", chapters: 59, paragraphs: 61 },
  { id: "2clement", title: "2 Clement", blurb: "The earliest surviving Christian sermon — its lost ending recovered from a Constantinople library in 1873.", date: "c. AD 120–160", chapters: 20, paragraphs: 23 },
  { id: "barnabas", title: "The Epistle of Barnabas", blurb: "An anonymous letter reading all of Hebrew Scripture as a cipher for Christ — bound with the New Testament in Codex Sinaiticus.", date: "c. AD 70–132", chapters: 21, paragraphs: 24 },
  { id: "ignatius-ephesians", title: "Ignatius — To the Ephesians", blurb: "Written under guard on the road to martyrdom.", date: "c. AD 105–115", chapters: 22, paragraphs: 22 },
  { id: "ignatius-magnesians", title: "Ignatius — To the Magnesians", blurb: "Urges unity under a bishop young enough that some doubted him.", date: "c. AD 105–115", chapters: 16, paragraphs: 16 },
  { id: "ignatius-trallians", title: "Ignatius — To the Trallians", blurb: "Warns against the teaching that Christ only seemed to suffer.", date: "c. AD 105–115", chapters: 14, paragraphs: 14 },
  { id: "ignatius-romans", title: "Ignatius — To the Romans", blurb: "The letter that begs Rome not to save him.", date: "c. AD 105–115", chapters: 11, paragraphs: 11 },
  { id: "ignatius-philadelphians", title: "Ignatius — To the Philadelphians", blurb: "A plea against schism, written from personal experience of one.", date: "c. AD 105–115", chapters: 12, paragraphs: 12 },
  { id: "ignatius-smyrnaeans", title: "Ignatius — To the Smyrnaeans", blurb: "The first time anyone wrote the words \"the catholic Church.\"", date: "c. AD 105–115", chapters: 14, paragraphs: 14 },
  { id: "ignatius-polycarp", title: "Ignatius — To Polycarp", blurb: "One bishop to another, weeks from death.", date: "c. AD 105–115", chapters: 9, paragraphs: 9 },
  { id: "polycarp-philippians", title: "Polycarp — To the Philippians", blurb: "The disciple of John writes to Paul's church.", date: "c. AD 110–140", chapters: 15, paragraphs: 15 },
  { id: "papias", title: "The Fragments of Papias", blurb: "The lost work of a bishop who knew the apostles' hearers — surviving as quotations, including the earliest account of how Mark and Matthew were written.", date: "c. AD 95–140 (as quoted by later writers)", chapters: 10, paragraphs: 14 },
  { id: "martyrdom-polycarp", title: "The Martyrdom of Polycarp", blurb: "The earliest martyrdom account outside the New Testament.", date: "c. AD 155–160", chapters: 23, paragraphs: 25 },
  { id: "quadratus", title: "The Fragment of Quadratus", blurb: "The oldest Christian apology, to the emperor Hadrian — one sentence, saved by Eusebius.", date: "c. AD 124–125", chapters: 1, paragraphs: 1 },
  { id: "diognetus", title: "The Epistle to Diognetus", blurb: "An anonymous apology to a curious pagan — Christians in the world as the soul in the body — from a manuscript that burned in 1870.", date: "c. AD 130–200", chapters: 12, paragraphs: 13 },
  { id: "epistula-apostolorum", title: "Epistula Apostolorum", blurb: "The risen Christ in dialogue with the apostles — with the manuscript's own wounds left visible.", date: "2nd century (c. AD 120–170)", chapters: 51, paragraphs: 89 },
  { id: "3corinthians", title: "Third Epistle to the Corinthians", blurb: "The apocryphal exchange between the Corinthian elders and Paul — their alarm at teachers who denied the resurrection, and Paul's reply defending the resurrection of the flesh. Part of the Acts of Paul.", date: "c. AD 160–190", chapters: 5, paragraphs: 15 },
  { id: "abgar", title: "The Abgar Correspondence", blurb: "A king's letter to Jesus, and the reply tradition preserved — cherished in Syriac and Armenian memory.", date: "c. AD 300–325 (as recorded by Eusebius)", chapters: 3, paragraphs: 10 },
  { id: "ascension-isaiah", title: "The Ascension of Isaiah", blurb: "The prophet sees the Beloved descend through seven heavens in disguise — and rise again with every heaven watching.", date: "c. AD 70–150 (composite, assembled by the 2nd century)", chapters: 11, paragraphs: 49 },
  { id: "enoch", title: "The Book of Enoch (1 Enoch)", blurb: "The oldest book in this room — fallen angels, the Son of Man, and the verse Jude quotes by name.", date: "Composed in stages, c. 300–100 BC", chapters: 113, paragraphs: 113 },
  { id: "shepherd-hermas", title: "The Shepherd of Hermas", blurb: "A Roman book of visions and parables — the Church as an aging woman, one more repentance for the baptized, and an incomplete place in Codex Sinaiticus just after the New Testament.", date: "c. AD 90–150 (composed in stages)", chapters: 116, paragraphs: 124 },
  { id: "apocalypse-paul", title: "The Apocalypse of Paul", blurb: "Paul's tour of heaven and hell — the text behind Dante's Inferno.", date: "c. AD 380–400", chapters: 39, paragraphs: 87 },
];

/** Compact length line for catalog cards. */
export function textLengthLabel(t: Pick<EarlyTextMeta, "chapters" | "paragraphs">): string | null {
  if (t.chapters <= 1 && t.paragraphs <= 1) return null;
  if (t.chapters <= 1) return `${t.paragraphs} paragraphs`;
  if (t.chapters === t.paragraphs) return `${t.chapters} sections`;
  return `${t.chapters} sections · ${t.paragraphs} paragraphs`;
}

/** The four eras the writings group into, in chronological order. Each hosted
 *  text is assigned to one via TEXT_ERA; the shelf and the era pages read from
 *  these so the grouping lives in one place. */
export type EraId = "jewish" | "fathers" | "apologists" | "apocrypha";

export type EarlyEra = {
  id: EraId;
  label: string;
  /** Display date span for the whole era. */
  range: string;
  /** 1–2 sentences of plain framing. */
  blurb: string;
};

export const ERAS: EarlyEra[] = [
  {
    id: "jewish",
    label: "Jewish apocalyptic",
    range: "c. 300 BC – AD 150",
    blurb:
      "Before and around the time of Christ — visionary Jewish writings read by early Christians and received differently across traditions. Jude quotes 1 Enoch, which remains canonical in Ethiopian Orthodox tradition.",
  },
  {
    id: "fathers",
    label: "The Apostolic Fathers",
    range: "c. AD 90–160",
    blurb:
      "The generation with a living link to the apostles — the letters, manuals, and martyr-accounts of the church's first century and a half outside the New Testament.",
  },
  {
    id: "apologists",
    label: "The Apologists",
    range: "c. AD 120–200",
    blurb:
      "The first Christians to argue the faith to outsiders — defenses addressed to emperors and philosophers rather than to their own churches.",
  },
  {
    id: "apocrypha",
    label: "The Apocrypha",
    range: "c. AD 120–400",
    blurb:
      "Letters, acts, and visions associated with apostolic names — with differing histories of reception. Inclusion here describes a literary collection, not a judgment of universal canonical status.",
  },
];

/** Which era each hosted text belongs to. Every id in EARLY_TEXTS appears here,
 *  grouped in ERAS order so a misfiled text is visible on sight — which is how
 *  apocalypse-paul was found sitting among the Apostolic Fathers. */
export const TEXT_ERA: Record<string, EraId> = {
  enoch: "jewish",
  "ascension-isaiah": "jewish",
  didache: "fathers",
  "1clement": "fathers",
  "2clement": "fathers",
  barnabas: "fathers",
  "ignatius-ephesians": "fathers",
  "ignatius-magnesians": "fathers",
  "ignatius-trallians": "fathers",
  "ignatius-romans": "fathers",
  "ignatius-philadelphians": "fathers",
  "ignatius-smyrnaeans": "fathers",
  "ignatius-polycarp": "fathers",
  "polycarp-philippians": "fathers",
  papias: "fathers",
  "martyrdom-polycarp": "fathers",
  "shepherd-hermas": "fathers",
  quadratus: "apologists",
  diognetus: "apologists",
  "apocalypse-paul": "apocrypha",
  "epistula-apostolorum": "apocrypha",
  "3corinthians": "apocrypha",
  abgar: "apocrypha",
};

export const eraById = (id: string): EarlyEra | undefined =>
  ERAS.find((e) => e.id === id);

/** Texts in a given era, in shelf reading order. */
export const textsForEra = (era: EraId) =>
  EARLY_TEXTS.filter((t) => TEXT_ERA[t.id] === era);
