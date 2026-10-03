import type { Metadata } from "next";

const DESCRIPTION =
  "Selected Hebrew and Greek terms for angels, the adversary, demons, and the deep — counted from the tagged text, with occurrences linked to their verses.";

export const metadata: Metadata = {
  title: "The vocabulary",
  description: DESCRIPTION,
  alternates: { canonical: "/angels/vocabulary" },
  openGraph: {
    title: "The vocabulary — Angels & Demons",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/angels/vocabulary",
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
    title: "The vocabulary — Angels & Demons",
    description: DESCRIPTION,
    images: ["/worlds/angels.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
