import type { Metadata } from "next";

const DESCRIPTION =
  "Every road out of the upper room, drawn as far as the evidence reaches — solid for scripture, dashed for early sources, dotted for later tradition.";

export const metadata: Metadata = {
  title: "The sending",
  description: DESCRIPTION,
  alternates: { canonical: "/apostles/sent" },
  openGraph: {
    title: "The sending — The Apostles",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/apostles/sent",
    images: [
      {
        url: "/worlds/apostles.jpg",
        width: 1200,
        height: 800,
        alt: "Twelve rays of light scattering from one point across aged parchment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The sending — The Apostles",
    description: DESCRIPTION,
    images: ["/worlds/apostles.jpg"],
  },
};

export default function SentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
