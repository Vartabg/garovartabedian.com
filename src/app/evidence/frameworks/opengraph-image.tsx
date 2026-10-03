import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";

export const alt = "The Afterlife Atlas: 54 World Traditions";
export const size = OG_SIZE;
export const contentType = "image/png";

const EVIDENCE = WORLD_REGISTRY.find((w) => w.id === "evidence")!;

export default function Image() {
  return renderOgImage({
    kicker: "How We Know · Comparative Inquiry",
    title: "The Afterlife Atlas",
    line: "54 world traditions mapped across millennia — primary texts, archaeology, and beliefs analyzed through observation, inference, and limit.",
    bg: EVIDENCE.bg,
    ink: EVIDENCE.ink,
    accent: EVIDENCE.accent,
  });
}
