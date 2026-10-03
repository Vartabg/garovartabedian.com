import type { Metadata } from "next";

const DESCRIPTION =
  "Browse collected angel appearances and confrontations with hostile spirits by name, place, or passage, with quotations and links to the source text.";

export const metadata: Metadata = {
  title: "The encounters",
  description: DESCRIPTION,
  alternates: { canonical: "/angels/encounters" },
  openGraph: {
    title: "The encounters — Angels & Demons",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/angels/encounters",
    images: [
      {
        url: "/worlds/angels.jpg",
        width: 1200,
        height: 800,
        alt: "Vast geometric wings of light flanking a radiant stair that descends to a cracked dark pavement",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The encounters — Angels & Demons",
    description: DESCRIPTION,
    images: ["/worlds/angels.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
