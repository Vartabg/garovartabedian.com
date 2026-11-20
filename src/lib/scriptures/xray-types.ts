import type { TranslationId } from "./types";

/** The facts a chapter page computes about its own data for the Engineer lens. */
export type ChapterXray = {
  text: { translation: TranslationId; verses: number; emptySlots: number };
  original: { edition: string; verses: number } | null;
  bridge: {
    verses: number;
    links: number;
    ok: number;
    plain: number;
    flag: number;
    drafted: { ai: number; ebible: number; none: number };
    book: { words: number; linked: number; ok: number; plain: number; flag: number } | null;
  } | null;
  xref: { verses: number; links: number };
  neighbours: { count: number; top: { book: string; chapter: number; shared: number } | null } | null;
  guide:
    | { kind: "published"; questions: number; status: string | null; reviewedOn: string | null; reviewer: string | null }
    | { kind: "template" }
    | { kind: "none" };
  unseen: { entries: number; terms: number };
};

export type XrayTagId = "text" | "original" | "xref" | "guide" | "neighbours" | "unseen";

/** One tag as the page renders it: a label, facts joined by middle dots, and the detail behind a disclosure. */
export type XrayTagSpec = { id: XrayTagId | "world" | "parables" | "checksums" | "counts"; label: string; facts: string[]; detail: string[] };

export type ChapterXrayTags = Record<XrayTagId, XrayTagSpec>;
