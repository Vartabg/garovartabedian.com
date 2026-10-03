import type { Metadata } from "next";

const DESCRIPTION =
  "Read the spirits, collective names, ruler titles, and Watchers in their own source settings, with identity distinctions and canon context kept visible.";

export const metadata: Metadata = {
  title: "The demons",
  description: DESCRIPTION,
  alternates: { canonical: "/angels/demons" },
  openGraph: {
    title: "The demons — Angels & Demons",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/angels/demons",
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
    title: "The demons — Angels & Demons",
    description: DESCRIPTION,
    images: ["/worlds/angels.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
