import type { TranslationId } from "./types";

/**
 * Where each hosted translation came from, as public/scriptures/SOURCES.md
 * records it. The Engineer lens reads this table; the Sources page carries
 * the links. tests/sources-table.test.ts keeps the two in step.
 */
export const EBIBLE_RETRIEVED = "2026-07-01";

export type SourceRow = {
  label: string;
  origin: string;
  /** ISO date, or null where SOURCES.md records none. */
  retrieved: string | null;
  license: string;
  /** True when the verse text is served as published, markup stripped, no edits. */
  unmodified: boolean;
  byBook?: Record<string, { origin: string }>;
};

export const SCRIPTURE_SOURCES: Record<TranslationId, SourceRow> = {
  web: { label: "World English Bible", origin: "eBible.org", retrieved: EBIBLE_RETRIEVED, license: "public domain", unmodified: true },
  kjv: { label: "King James Version, 1769 Blayney text", origin: "eBible.org", retrieved: EBIBLE_RETRIEVED, license: "public domain", unmodified: true },
  drb: { label: "Douay-Rheims 1899 American, Challoner", origin: "eBible.org", retrieved: EBIBLE_RETRIEVED, license: "public domain", unmodified: true },
  brenton: { label: "Brenton Septuagint 1851", origin: "eBible.org", retrieved: EBIBLE_RETRIEVED, license: "public domain", unmodified: true },
  charles: {
    label: "R. H. Charles, 1913",
    origin: "Wikisource and CCEL",
    retrieved: null,
    license: "public domain",
    // Jubilees' verse boundaries were reviewed against the printed edition (SOURCES.md).
    unmodified: false,
    byBook: { ENO: { origin: "Wikisource" }, JUB: { origin: "CCEL" } },
  },
};
