import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "JobPilot — ATS-first application copilot";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Work / Case study",
    title: "JobPilot",
    line: "An ATS-first application copilot that keeps a human in the loop.",
  });
}
