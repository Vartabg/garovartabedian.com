import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The giants",
  description:
    "Athanasius, Augustine, Aquinas, Luther, Calvin, Barth — what the church owes each of its giant theologians, and the fault the record shows against him. Both stated plainly, every claim sourced.",
  alternates: { canonical: "/church/giants" },
  openGraph: {
    title: "The giants — The Church",
    description:
      "From Origen to Barth — the giant theologians the church owes, each set beside the fault the record shows against him. Both stated plainly, every claim sourced.",
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/church/giants",
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
    title: "The giants — The Church",
    description:
      "From Origen to Barth — the giant theologians the church owes, each set beside the fault the record shows against him. Both stated plainly, every claim sourced.",
    images: ["/worlds/church.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
