import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";
import { canons, getChapterGuide } from "@/lib/scriptures/server";

export const alt = "A chapter of Scripture";
export const size = OG_SIZE;
export const contentType = "image/png";

const SCRIPTURES = WORLD_REGISTRY.find((world) => world.id === "scriptures")!;

/**
 * A shared chapter link should unfurl as itself, not as the site's generic
 * card. The line under the title is the chapter guide's own key verse where
 * one exists — already machine-verified as verbatim in the hosted text — so
 * nothing new is authored here to be wrong.
 *
 * Deliberately not statically generated. Enumerating ~6,700 cards at build
 * would add many minutes to every deploy to pre-render images for chapters
 * nobody has shared yet. Next renders each card on first request and it is
 * cached from then on, which keeps the reading path itself entirely static.
 */
export const dynamic = "force-dynamic";
export default async function Image({
  params,
}: {
  params: Promise<{ tradition: string; book: string; chapter: string }>;
}) {
  const { book, chapter } = await params;
  const bookId = book.toUpperCase();
  const chapterNumber = Number(chapter);
  const meta = canons.books[bookId];

  if (!meta || !Number.isInteger(chapterNumber)) {
    return renderOgImage({
      kicker: "Scriptures",
      title: "Scripture",
      line: SCRIPTURES.hint,
      bg: SCRIPTURES.bg,
      ink: SCRIPTURES.ink,
      accent: SCRIPTURES.accent,
    });
  }

  const guide = await getChapterGuide(bookId, chapterNumber);
  const keyVerse = guide?.keyVerses?.[0];
  const line = keyVerse
    ? `“${trim(keyVerse.text, 150)}” — ${meta.name} ${keyVerse.ref}`
    : `${meta.name} has ${meta.chapters} chapters. Read the text, its cross-references, and its guide.`;

  return renderOgImage({
    kicker: "Scriptures",
    title: `${meta.name} ${chapterNumber}`,
    line,
    bg: SCRIPTURES.bg,
    ink: SCRIPTURES.ink,
    accent: SCRIPTURES.accent,
  });
}

/** Trim on a word boundary so a card never ends mid-word. */
function trim(value: string, max: number): string {
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
