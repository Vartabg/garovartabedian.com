import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";

export const alt = "Atlas Essays — long-form essays from How We Know";
export const size = OG_SIZE;
export const contentType = "image/png";

const EVIDENCE = WORLD_REGISTRY.find((w) => w.id === "evidence")!;

export default function Image() {
  return renderOgImage({
    kicker: "How We Know · The Afterlife Atlas",
    title: "Atlas Essays",
    line: "Long-form, source-led essays — one sharp claim per piece, defended honestly.",
    bg: EVIDENCE.bg,
    ink: EVIDENCE.ink,
    accent: EVIDENCE.accent,
  });
}
