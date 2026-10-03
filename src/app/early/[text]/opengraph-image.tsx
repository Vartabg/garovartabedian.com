import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";
import { EARLY_TEXTS } from "@/lib/early/client";

export const alt = "An early Christian writing";
export const size = OG_SIZE;
export const contentType = "image/png";

const EARLY = WORLD_REGISTRY.find((world) => world.id === "early")!;

/**
 * Twenty-three texts, so every card is generated at build. The line under the
 * title is the text's own date and blurb from EARLY_TEXTS — the same words the
 * catalogue page shows, so the card cannot say something the site does not.
 */
export function generateStaticParams() {
  return EARLY_TEXTS.map((text) => ({ text: text.id }));
}

export default async function Image({ params }: { params: Promise<{ text: string }> }) {
  const { text: textId } = await params;
  const meta = EARLY_TEXTS.find((t) => t.id === textId);

  return renderOgImage({
    kicker: "The Writings",
    title: meta?.title ?? "The Writings",
    line: meta ? `${meta.date} — ${meta.blurb}` : EARLY.hint,
    bg: EARLY.bg,
    ink: EARLY.ink,
    accent: EARLY.accent,
  });
}
