/** Session-only positions: no account, provider request, or cross-session reading history. */
export type ReadingPosition = { url: string; edition: string; anchor: string; section: string; offset: number; x: number; y: number; layout: string };
export const readingLayout = () => {
  const root = document.documentElement;
  return [innerWidth, root.style.fontSize, root.dataset.a11yFont, root.dataset.a11ySpacing, document.querySelector<HTMLElement>("[data-reading-surface]")?.dataset.readingMode, document.documentElement.scrollHeight].join(":");
};
export function captureReadingPosition(): ReadingPosition | null {
  const surface = document.querySelector<HTMLElement>("[data-reading-surface]");
  if (!surface) return null;
  // A downloaded paragraph may span many screens. Bookmark its visible reading
  // fragment, not the large original wrapper (whose public citation stays intact).
  const passages = [...surface.querySelectorAll<HTMLElement>(".scr-v[id], .ew-para[id]:not(:has([data-reading-fragment])), p[data-reading-anchor], [data-reading-fragment][id]")].filter(el => el.getClientRects().length > 0);
  const anchor = passages.find(el => el.getBoundingClientRect().bottom > 100) ?? passages.at(-1) ?? surface.querySelector<HTMLElement>("[id]");
  if (!anchor) return null;
  return { url: location.pathname + location.search + location.hash, edition: surface.dataset.readingEdition ?? new URLSearchParams(location.search).get("t") ?? "hosted", anchor: anchor.id, section: anchor.closest("section[id]")?.id ?? anchor.closest("section")?.querySelector<HTMLElement>(".ew-section-anchor[id]")?.id ?? anchor.id, offset: anchor.getBoundingClientRect().top, x: scrollX, y: scrollY, layout: readingLayout() };
}
export function restoreReadingPosition(place: ReadingPosition, forceAnchor = false): boolean {
  const surface = document.querySelector<HTMLElement>("[data-reading-surface]");
  if (!surface || (surface.dataset.readingEdition && surface.dataset.readingEdition !== place.edition)) return false;
  const anchor = document.getElementById(place.anchor) ?? document.getElementById(place.section);
  if (!anchor || !surface.contains(anchor)) return false;
  const top = !forceAnchor && place.layout === readingLayout() ? place.y : scrollY + anchor.getBoundingClientRect().top - place.offset;
  window.scrollTo({ left: place.x, top: Math.max(0, top), behavior: "instant" });
  return true;
}
