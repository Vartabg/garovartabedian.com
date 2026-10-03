import type { FindItem } from "./find-query";

export const FIND_RECENT_KEY = "garovartabedian:find:recent:v1";
const MAX_RECENTS = 5;

export function getRecentFindItems(): FindItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FIND_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.href === "string" &&
        typeof item.title === "string" &&
        typeof item.note === "string",
    );
  } catch {
    return [];
  }
}

export function recordRecentFindItem(item: FindItem): void {
  if (typeof window === "undefined") return;
  if (!item || item.kind === "action" || item.kind === "ask" || item.href === "#") {
    return;
  }
  try {
    const current = getRecentFindItems();
    const filtered = current.filter((r) => r.href !== item.href);
    const updated = [
      {
        id: item.id,
        href: item.href,
        title: item.title,
        note: item.note,
        kind: item.kind,
      },
      ...filtered,
    ].slice(0, MAX_RECENTS);
    window.localStorage.setItem(FIND_RECENT_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be unavailable or full
  }
}

export function clearRecentFindItems(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(FIND_RECENT_KEY);
  } catch {
    // ignore
  }
}
