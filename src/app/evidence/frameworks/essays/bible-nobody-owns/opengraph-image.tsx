import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";

export const alt =
  "Essay: The Bible Nobody Owns — and the Empire That Publishes It";
export const size = OG_SIZE;
export const contentType = "image/png";

const EVIDENCE = WORLD_REGISTRY.find((w) => w.id === "evidence")!;

export default function Image() {
  return renderOgImage({
    kicker: "How We Know · Essay No. 1",
    title: "The Bible Nobody Owns — and the Empire That Publishes It",
    line: "You cannot copyright the Word of God — but you can copyright the words it was just translated into.",
    bg: EVIDENCE.bg,
    ink: EVIDENCE.ink,
    accent: EVIDENCE.accent,
  });
}
