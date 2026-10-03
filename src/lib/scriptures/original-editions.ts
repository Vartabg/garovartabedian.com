import type { OriginalEditionId } from "./types";

type OriginalEditionDisplay = {
  short: string;
  name: string;
  href: string;
  language: string;
  lemmaLabel: "Lemma" | "Lexical ID";
};

/**
 * Reader-facing labels for the pinned original-language datasets.
 * `satisfies` keeps this map exhaustive when an edition is added to the data contract.
 */
export const ORIGINAL_EDITION_DISPLAY = {
  oshb: {
    short: "OSHB",
    name: "Open Scriptures Hebrew Bible",
    href: "https://github.com/openscriptures/morphhb",
    language: "Hebrew and Aramaic",
    lemmaLabel: "Lexical ID",
  },
  sblgnt: {
    short: "SBLGNT + MorphGNT",
    name: "SBL Greek New Testament + MorphGNT",
    href: "https://github.com/morphgnt/sblgnt",
    language: "Koine Greek",
    lemmaLabel: "Lemma",
  },
  lxx: {
    short: "Rahlfs LXX + lxx-morph",
    name: "Rahlfs Septuagint (1935) + lxx-morph",
    href: "https://git.sr.ht/~sethkush/lxx-morph",
    language: "Septuagint Greek",
    lemmaLabel: "Lemma",
  },
} as const satisfies Record<OriginalEditionId, OriginalEditionDisplay>;
