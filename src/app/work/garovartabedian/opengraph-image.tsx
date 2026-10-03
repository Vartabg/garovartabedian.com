import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "garovartabedian.com — self-funded research platform";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Work / Case study",
    title: "garovartabedian.com",
    line: "Eight research worlds, built as a public resource.",
  });
}
