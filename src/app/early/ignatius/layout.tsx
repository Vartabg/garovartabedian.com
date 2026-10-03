import type { Metadata } from "next";

const DESCRIPTION =
  "The seven letters Ignatius of Antioch wrote under guard on the road to martyrdom in Rome, traced stop by stop.";

export const metadata: Metadata = {
  title: "Ignatius' road",
  description: DESCRIPTION,
  alternates: { canonical: "/early/ignatius" },
  openGraph: {
    title: "Ignatius' road — The Writings",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/early/ignatius",
    images: [
      {
        url: "/worlds/early.jpg",
        width: 1200,
        height: 800,
        alt: "Ancient manuscripts, writing tools, and a marked map on a lamplit early Christian worktable",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ignatius' road — The Writings",
    description: DESCRIPTION,
    images: ["/worlds/early.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
