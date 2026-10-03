import type { Metadata } from "next";

const DESCRIPTION =
  "Ten documented episodes of Bible-translation copyright in practice — from a 1712 Crown patent fight to an open-source app losing the ESV.";

export const metadata: Metadata = {
  title: "When the fence gets tested",
  description: DESCRIPTION,
  alternates: { canonical: "/word/cases" },
  openGraph: {
    title: "When the fence gets tested — Who Owns the Word?",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/word/cases",
    images: [
      {
        url: "/worlds/word.jpg",
        width: 1200,
        height: 800,
        alt: "An open Bible separated from sealed legal documents by a brass fence on a desk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "When the fence gets tested — Who Owns the Word?",
    description: DESCRIPTION,
    images: ["/worlds/word.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
