import { renderOgImage, OG_SIZE } from "@/lib/og";
export const alt = "Merge Monitor — received, fixed, and verified mean different things";
export const size = OG_SIZE;
export const contentType = "image/png";
export default async function Image() {
  return renderOgImage({ kicker: "Work / Agent coordination", title: "Merge Monitor", line: "What makes a handoff useful? Explore the request, evidence, and result." });
}
