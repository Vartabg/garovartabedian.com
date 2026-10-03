/**
 * Direct allusions and quotations in the hosted Early Christian Writings
 * that cite Scripture passages, derived from public/early/allusions/.
 *
 * Each key is in the format `${BOOK}:${chapter}:${verse}` (e.g. "JAS:4:6", "ISA:1:18").
 */

export type EarlyAllusionHit = {
  textId: string;
  textTitle: string;
  section: number;
  href: string;
};

export const SCRIPTURE_EARLY_ALLUSIONS: Record<string, EarlyAllusionHit[]> = {
  "ISA:1:13": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 1,
      href: "/early/barnabas#s1",
    },
  ],
  "ISA:58:5": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 2,
      href: "/early/barnabas#s2",
    },
  ],
  "EXO:31:18": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 3,
      href: "/early/barnabas#s3",
    },
  ],
  "ISA:5:21": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 3,
      href: "/early/barnabas#s3",
    },
  ],
  "LUK:5:32": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 4,
      href: "/early/barnabas#s4",
    },
  ],
  "GEN:1:26": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 5,
      href: "/early/barnabas#s5",
    },
  ],
  "LEV:11:3": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 9,
      href: "/early/barnabas#s9",
    },
  ],
  "JER:2:13": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 10,
      href: "/early/barnabas#s10",
    },
  ],
  "PSA:1:3": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 10,
      href: "/early/barnabas#s10",
    },
  ],
  "ISA:42:7": [
    {
      textId: "barnabas",
      textTitle: "The Epistle of Barnabas",
      section: 13,
      href: "/early/barnabas#s13",
    },
  ],
  "GAL:4:27": [
    {
      textId: "2clement",
      textTitle: "2 Clement",
      section: 1,
      href: "/early/2clement#s1",
    },
  ],
  "EZK:14:14": [
    {
      textId: "2clement",
      textTitle: "2 Clement",
      section: 5,
      href: "/early/2clement#s5",
    },
  ],
  "MRK:9:44": [
    {
      textId: "2clement",
      textTitle: "2 Clement",
      section: 6,
      href: "/early/2clement#s6",
    },
  ],
  "ROM:2:24": [
    {
      textId: "2clement",
      textTitle: "2 Clement",
      section: 12,
      href: "/early/2clement#s12",
    },
  ],
  "1PE:1:8": [
    {
      textId: "polycarp-philippians",
      textTitle: "Polycarp — To the Philippians",
      section: 1,
      href: "/early/polycarp-philippians#s1",
    },
  ],
  "MAT:7:2": [
    {
      textId: "polycarp-philippians",
      textTitle: "Polycarp — To the Philippians",
      section: 2,
      href: "/early/polycarp-philippians#s2",
    },
  ],
  "ISA:1:18": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 7,
      href: "/early/1clement#s7",
    },
  ],
  "GEN:12:3": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 9,
      href: "/early/1clement#s9",
    },
  ],
  "PSA:12:5": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 14,
      href: "/early/1clement#s14",
    },
  ],
  "PSA:22:6": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 15,
      href: "/early/1clement#s15",
    },
  ],
  "PSA:139:8": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 27,
      href: "/early/1clement#s27",
    },
  ],
  "JAS:4:6": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 29,
      href: "/early/1clement#s29",
    },
  ],
  "GEN:1:27": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 32,
      href: "/early/1clement#s32",
    },
  ],
  "PSA:2:8": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 35,
      href: "/early/1clement#s35",
    },
  ],
  "PSA:50:14": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 51,
      href: "/early/1clement#s51",
    },
  ],
  "DEU:9:12": [
    {
      textId: "1clement",
      textTitle: "1 Clement",
      section: 52,
      href: "/early/1clement#s52",
    },
  ],
  "MAT:10:16": [
    {
      textId: "ignatius-polycarp",
      textTitle: "Ignatius — To Polycarp",
      section: 2,
      href: "/early/ignatius-polycarp#s2",
    },
  ],
};

export function earlyAllusionsForVerse(
  book: string,
  chapter: number,
  verse?: number,
): EarlyAllusionHit[] {
  if (!verse) return [];
  const key = `${book}:${chapter}:${verse}`;
  return SCRIPTURE_EARLY_ALLUSIONS[key] ?? [];
}
