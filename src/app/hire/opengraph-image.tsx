import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Employment profile — Garo Vartabedian";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "For hiring teams",
    title: "Employment profile",
    line: "Solutions Engineer — field service turned software builder.",
  });
}
