import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "EYE — Visual Code Execution";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Work / Case study",
    title: "EYE",
    line: "Watch code run as a graph you can drag.",
  });
}
