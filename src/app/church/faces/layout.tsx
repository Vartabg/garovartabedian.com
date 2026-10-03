import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The faces",
  description:
    "A real person behind each cultural expression of the church — Coptic, Syriac, Ethiopian, Armenian, Cappadocian, Byzantine, and Latin — with real public-domain art and where that tradition lives today.",
  alternates: { canonical: "/church/faces" },
  openGraph: {
    title: "The faces — The Church",
    description:
      "A real person behind each cultural expression of the church — Coptic, Syriac, Ethiopian, Armenian, Cappadocian, Byzantine, and Latin — with real public-domain art and where that tradition lives today.",
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/church/faces",
    images: [
      {
        url: "/worlds/church.jpg",
        width: 1200,
        height: 800,
        alt: "A hand-drawn map of church history branching across parchment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The faces — The Church",
    description:
      "A real person behind each cultural expression of the church — Coptic, Syriac, Ethiopian, Armenian, Cappadocian, Byzantine, and Latin — with real public-domain art and where that tradition lives today.",
    images: ["/worlds/church.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
