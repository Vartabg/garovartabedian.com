import canonsData from "../../../../public/scriptures/canons.json";
import type { Canons, TranslationId } from "../types";

export const canons = canonsData as Canons;

export function isTranslationId(value: unknown): value is TranslationId {
  return typeof value === "string" && value in canons.translations;
}

export function pickTranslation(
  preference: TranslationId[],
  book: string,
): TranslationId | null {
  const available = canons.books[book]?.trans ?? [];
  for (const translation of preference) {
    if (available.includes(translation)) return translation;
  }
  return available[0] ?? null;
}

export function traditionFor(book: string): string {
  for (const tradition of canons.traditions) {
    if (tradition.books.includes(book)) return tradition.id;
  }
  return canons.traditions[0]?.id ?? "protestant";
}
