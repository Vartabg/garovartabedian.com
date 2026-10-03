import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Sources — garovartabedian.com";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Sources",
    title: "The source map",
    line: "Every world's sources, in one human-readable page.",
  });
}
