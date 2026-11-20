import type { Canons, TranslationId } from "../scriptures/types";
import type { FindGroup, FindItem } from "./find-query";
import { WORLD_REGISTRY } from "../world-registry";

export type FindScope = "all" | "texts" | "site";
const textKinds = new Set(["verse", "ref", "book", "topic", "text", "section"]);

/** Present bounded discovery groups; specialist commands remain searchable. */
export function surfaceGroups(
  groups: FindGroup[],
  scope: FindScope,
  hasQuery: boolean,
): FindGroup[] {
  const seen = new Set<string>();
  const hasDirectPassages =
    scope === "all" &&
    hasQuery &&
    groups.some((g) => g.id === "exact" && g.items.length > 0);
  return groups.flatMap((group) => {
    if (
      group.id === "ask" ||
      (!hasQuery && (group.id === "console" || group.id === "walks"))
    )
      return [];
    const cap = hasQuery
      ? group.id === "places" && hasDirectPassages
        ? 3
        : 8
      : group.id === "worlds"
        ? // Every section, so the opening list never hides one.
          WORLD_REGISTRY.length
        : 3;
    const items = group.items
      .filter((item) => {
        const matches =
          scope === "all" ||
          (item.kind === "action" && hasQuery) ||
          (scope === "texts"
            ? textKinds.has(item.kind)
            : !["verse", "ref", "topic"].includes(item.kind));
        if (!matches || seen.has(item.href)) return false;
        // Preference actions share '#', so their IDs are the deduplication key.
        const key = item.href === "#" ? item.id : item.href;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, cap);
    return items.length ? [{ ...group, items }] : [];
  });
}

/** Resolve the same edition the reader would open; never silently swap editions. */
export function previewTarget(item: FindItem, canons: Canons) {
  if (!item.href.startsWith("/scriptures/")) return null;
  const url = new URL(item.href, "https://local.invalid");
  const match = /^\/scriptures\/([^/]+)\/([A-Z0-9]{2,4})\/(\d+)$/.exec(
    url.pathname,
  );
  if (!match) return null;
  const [, tradition, book, chapterText] = match;
  const meta = canons.books[book];
  const chapter = Number(chapterText),
    verse = Number(/^#v(\d+)/.exec(url.hash)?.[1] ?? 1);
  if (!meta || chapter < 1 || chapter > meta.chapters || verse < 1) return null;
  const explicit = url.searchParams.get("t") as TranslationId | null;
  const translation =
    explicit ??
    canons.traditions
      .find((t) => t.id === tradition)
      ?.transPreference.find((t) => meta.trans.includes(t)) ??
    meta.trans[0];
  if (!translation || !meta.trans.includes(translation)) return null;
  return {
    book,
    chapter,
    verse,
    translation,
    isVerse: !!url.hash,
    edition:
      canons.translations[translation]?.name ?? translation.toUpperCase(),
  };
}
