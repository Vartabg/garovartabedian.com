import type { Metadata } from "next";

const DESCRIPTION =
  "Find passages across Scripture and early writings. Search words and phrases, follow sources in their named editions, and explore connections with optional, unreviewed AI checks.";

export const metadata: Metadata = {
  title: "Find",
  description: DESCRIPTION,
  alternates: { canonical: "/scriptures/search" },
  openGraph: {
    title: "Find — Scripture & Early Writings",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/scriptures/search",
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
    title: "Find — Scripture & Early Writings",
    description: DESCRIPTION,
    images: ["/worlds/scriptures.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
