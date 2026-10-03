import { renderOgImage, OG_SIZE } from "@/lib/og";
export const alt = "Accessibility is a product feature — four products, one responsibility";
export const size = OG_SIZE;
export const contentType = "image/png";
export default async function Image() {
  return renderOgImage({ kicker: "Work / Case study", title: "Accessibility", line: "Four products. Practical repairs. A standard to share." });
}
