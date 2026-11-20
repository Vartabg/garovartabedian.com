import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORK_PAGE } from "@/lib/portfolio-content";

export const alt = "Work — case studies, systems, and interactive demos by Garo Vartabedian";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: WORK_PAGE.kicker,
    title: WORK_PAGE.headline,
    line: "JobPilot · garovartabedian.com · Merge Monitor · Interactive browser demos",
  });
}
