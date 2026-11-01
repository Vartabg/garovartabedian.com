import { renderOgImage, OG_SIZE } from "@/lib/og";
import { STARTER_MENU, WORK_PAGE } from "@/lib/portfolio-content";

export const alt = "Work — three business tools for $100 total by Garo Vartabedian";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Work",
    title: WORK_PAGE.headline,
    line: STARTER_MENU.socialLine,
  });
}
