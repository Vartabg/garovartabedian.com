import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Résumé — Garo Vartabedian";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Résumé",
    title: "Garo Vartabedian",
    line: "Solutions Engineer · Implementation & Technical Support.",
  });
}
