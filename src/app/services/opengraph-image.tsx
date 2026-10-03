import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Workflow & Automation Audit — $500 fixed";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Work with Garo",
    title: "Workflow & Automation Audit",
    line: "One working week, one bounded workflow — $500 fixed.",
  });
}
