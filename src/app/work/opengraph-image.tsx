import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Work — inspectable systems by Garo Vartabedian";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Work",
    title: "Systems you can inspect.",
    line: "Workflow tools, research systems, source links, and live demos.",
  });
}
