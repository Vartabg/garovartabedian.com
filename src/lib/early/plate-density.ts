/**
 * How densely chapter illustrations appear on long Writings pages.
 *
 * Short texts keep every plate. Long texts (Enoch, Hermas, 1 Clement, …)
 * start sparse so the first paint is not 100+ images; the reader can expand.
 */

/** Section count (with plates) above this starts sparse by default. */
export const LONG_TEXT_PLATE_THRESHOLD = 28;

/** In sparse mode, keep every Nth plated section after the lead-in. */
export const SPARSE_EVERY = 4;

/** Always keep this many leading plated sections even when sparse. */
export const SPARSE_LEAD = 3;

export type PlateDensity = "full" | "sparse";

export function defaultPlateDensity(platedSectionCount: number): PlateDensity {
  return platedSectionCount > LONG_TEXT_PLATE_THRESHOLD ? "sparse" : "full";
}

/**
 * @param platedIndex — 0-based index among sections that *have* a plate
 * @param isBookBoundary — book-divider headings always keep their plate
 */
export function shouldShowSectionPlate(
  density: PlateDensity,
  platedIndex: number,
  isBookBoundary: boolean,
): boolean {
  if (density === "full") return true;
  if (isBookBoundary) return true;
  if (platedIndex < SPARSE_LEAD) return true;
  return (platedIndex - SPARSE_LEAD) % SPARSE_EVERY === 0;
}
