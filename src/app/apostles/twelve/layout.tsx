import type { Metadata } from "next";

const DESCRIPTION =
  "One record per apostle: the call, every scene on the page, the documented fault, the road, and the cost — scripture cited, tradition graded.";

export const metadata: Metadata = {
  title: "The twelve records",
  description: DESCRIPTION,
  alternates: { canonical: "/apostles/twelve" },
  openGraph: {
    title: "The twelve records — The Apostles",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/apostles/twelve",
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
    title: "The twelve records — The Apostles",
    description: DESCRIPTION,
    images: ["/worlds/apostles.jpg"],
  },
};

export default function TwelveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
