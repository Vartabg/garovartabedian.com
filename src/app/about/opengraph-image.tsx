import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Why Garo Vartabedian built this work";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "About this work",
    title: "Why I built all of this.",
    line: "Open the text. Follow the record. Hand the help to the next person.",
  });
}
