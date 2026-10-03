import type { Metadata } from "next";

const DESCRIPTION =
  "Every Scripture text this site hosts, traced from source file to license to reader — five public-domain texts, the cross-references, the topical index, and the original-language editions with their licenses.";

export const metadata: Metadata = {
  title: "The free way, checked",
  description: DESCRIPTION,
  alternates: { canonical: "/word/free" },
  openGraph: {
    title: "The free way, checked — Who Owns the Word?",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/word/free",
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
    title: "The free way, checked — Who Owns the Word?",
    description: DESCRIPTION,
    images: ["/worlds/word.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
