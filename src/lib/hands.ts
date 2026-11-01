/**
 * The hands of the record: which letterform a headline takes, by the era its
 * words come from. Garo picked this system ("Titulus Type") on 2026-10-16.
 *
 * - capitals:    Roman inscriptional capitals — the first centuries, in stone
 * - uncial:      the rounded book hand of the early codices (4th–8th c.)
 * - blackletter: the high medieval church through Gutenberg (c. 1455)
 * - print:       Renaissance book type, from the 1500s on
 * - today:       this site's own face (Fraunces)
 *
 * The faces are modern open-license designs drawn after those hands.
 */
export type Hand = "capitals" | "uncial" | "blackletter" | "print" | "today";

export function handForYear(year: number): Hand {
  if (year < 300) return "capitals";
  if (year < 1000) return "uncial";
  if (year < 1500) return "blackletter";
  if (year < 1900) return "print";
  return "today";
}

/** First year in a string like "c. AD 30–49" or "1914–today". */
export function firstYear(years: string): number | null {
  const m = /\d{2,4}/.exec(years);
  return m ? Number(m[0]) : null;
}

/** Static outlines the morph reads (WOFF; opentype.js cannot read WOFF2). */
export const HAND_OUTLINES: Record<Hand, string> = {
  capitals: "/fonts/era/capitals.woff",
  uncial: "/fonts/era/uncial.woff",
  blackletter: "/fonts/era/blackletter.woff",
  print: "/fonts/era/print.woff",
  today: "/fonts/era/today.woff",
};
