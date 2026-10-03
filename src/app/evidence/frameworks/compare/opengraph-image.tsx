import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";

export const alt = "Synoptic Berean Comparator — The Afterlife Atlas";
export const size = OG_SIZE;
export const contentType = "image/png";

const EVIDENCE = WORLD_REGISTRY.find((w) => w.id === "evidence")!;

export default function Image() {
  return renderOgImage({
    kicker: "How We Know · The Afterlife Atlas",
    title: "Synoptic Berean Comparator",
    line: "Compare 54 world traditions side-by-side: primary observed archaeology, inferred architecture, interpreted doctrine, and stated limits.",
    bg: EVIDENCE.bg,
    ink: EVIDENCE.ink,
    accent: EVIDENCE.accent,
  });
}
