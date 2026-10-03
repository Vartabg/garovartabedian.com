import { renderOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Discuss a project with Garo Vartabedian";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    kicker: "Contact",
    title: "Tell me what is slowing the team down.",
    line: "Workflows, integrations, and practical technical systems.",
  });
}
