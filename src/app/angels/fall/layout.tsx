import type { Metadata } from "next";

const DESCRIPTION =
  "How the adversary enters the story — traced text by text from Genesis to Revelation, every quote verbatim, every interpretive step flagged.";

export const metadata: Metadata = {
  title: "The fall",
  description: DESCRIPTION,
  alternates: { canonical: "/angels/fall" },
  openGraph: {
    title: "The fall — Angels & Demons",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/angels/fall",
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
    title: "The fall — Angels & Demons",
    description: DESCRIPTION,
    images: ["/worlds/angels.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
