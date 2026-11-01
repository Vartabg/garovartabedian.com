import type { FromHereLink } from "@/lib/site/from-here";
import { EARLY_TEXTS, TEXT_ERA, eraById } from "./client";

/**
 * A library edition's "From here": the same work in the shelf's other
 * public-domain translation, when the shelf hosts one, and the era it
 * belongs to.
 * Paging, contents and source details are already on the page.
 */
export function libraryFromHere(existingTextId?: string | null): FromHereLink[] {
  const text = existingTextId ? EARLY_TEXTS.find((item) => item.id === existingTextId) : undefined;
  if (!text) return [];
  const era = eraById(TEXT_ERA[text.id] ?? "");
  return [
    { href: `/early/${text.id}`, label: text.title, kind: "Another translation" },
    ...(era ? [{ href: `/early/era/${era.id}`, label: era.label, kind: "Writings from this era" }] : []),
  ];
}
