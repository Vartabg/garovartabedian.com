import type { InvestigationPacket } from "./investigation-types";
import type { PublicSource } from "../find-server/sources";

export const READING_PATH = "/scriptures/read/isaiah-53-clement-16";
export type ReadingJourney = {
  packet: InvestigationPacket;
  scripture: string[];
  early: string[];
  anchor: PublicSource;
  candidate: PublicSource;
};
export type ReadingPreferences = {
  size: "standard" | "large" | "largest";
  theme: "device" | "paper" | "warm" | "night";
  monochrome: boolean;
};
export const READING_PREFERENCES_KEY = "garovartabedian:reading-path:v1";
export const defaultReadingPreferences: ReadingPreferences = { size: "standard", theme: "device", monochrome: false };
export function readingPreferences(value: unknown): ReadingPreferences {
  const p = (value && typeof value === "object" ? value : {}) as Partial<ReadingPreferences>;
  return {
    size: p.size === "large" || p.size === "largest" ? p.size : "standard",
    theme: p.theme === "paper" || p.theme === "warm" || p.theme === "night" ? p.theme : "device",
    monochrome: p.monochrome === true,
  };
}

/** Spans come from the existing verified source packet, not a model rewrite. */
export function passageSegments(text: string, spans: { id: string; start: number; end: number }[]) {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const pieces: { text: string; note?: string }[] = [];
  let cursor = 0;
  for (const span of sorted) {
    if (!Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end) || span.start < cursor || span.end <= span.start || span.end > text.length) throw new Error("Invalid reading annotation span.");
    pieces.push({ text: text.slice(cursor, span.start) }, { text: text.slice(span.start, span.end), note: span.id });
    cursor = span.end;
  }
  pieces.push({ text: text.slice(cursor) });
  return pieces;
}
