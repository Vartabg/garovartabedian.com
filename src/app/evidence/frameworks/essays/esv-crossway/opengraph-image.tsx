import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";

export const alt =
  "Essay: The ESV Middle Case — Who Holds Crossway's Keys?";
export const size = OG_SIZE;
export const contentType = "image/png";

const EVIDENCE = WORLD_REGISTRY.find((w) => w.id === "evidence")!;

export default function Image() {
  return renderOgImage({
    kicker: "How We Know · Essay No. 2",
    title: "The ESV Middle Case — Who Holds Crossway's Keys?",
    line: "A ministry owns this translation outright. The fence looks remarkably similar.",
    bg: EVIDENCE.bg,
    ink: EVIDENCE.ink,
    accent: EVIDENCE.accent,
  });
}
