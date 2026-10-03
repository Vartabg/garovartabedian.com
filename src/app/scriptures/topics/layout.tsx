import type { Metadata } from "next";

const DESCRIPTION =
  "Nave's Topical Bible, 1897 — 5,319 subjects, every reference verified against the text hosted here.";

export const metadata: Metadata = {
  title: "Topics",
  description: DESCRIPTION,
  alternates: { canonical: "/scriptures/topics" },
  openGraph: {
    title: "Topics — Scriptures",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/scriptures/topics",
    images: [
      {
        url: "/worlds/scriptures.jpg",
        width: 1200,
        height: 800,
        alt: "An open ancient manuscript with a search lens hovering over the text",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Topics — Scriptures",
    description: DESCRIPTION,
    images: ["/worlds/scriptures.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
