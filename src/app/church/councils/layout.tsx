import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The councils",
  description:
    "Ten councils, Nicaea to Vatican II — in their own words where the text is safely public domain, and who actually called each one, from emperors to popes.",
  alternates: { canonical: "/church/councils" },
  openGraph: {
    title: "The councils — The Church",
    description:
      "Ten councils, Nicaea to Vatican II — in their own words where the text is safely public domain, and who actually called each one, from emperors to popes.",
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/church/councils",
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
    title: "The councils — The Church",
    description:
      "Ten councils, Nicaea to Vatican II — in their own words where the text is safely public domain, and who actually called each one, from emperors to popes.",
    images: ["/worlds/church.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
