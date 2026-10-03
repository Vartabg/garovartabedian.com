import type { Metadata } from "next";
import Link from "next/link";
import { getChurchTree } from "@/lib/church/server";
import Tree from "./Tree";

export const metadata: Metadata = {
  title: "The tree",
  description:
    "One church becoming many, drawn — every fork dated, every living branch traced from Pentecost to today.",
  alternates: { canonical: "/church/tree" },
  openGraph: {
    title: "The tree — The Church",
    description:
      "One church becoming many, drawn — every fork dated, every living branch traced from Pentecost to today.",
    siteName: "Garo Vartabedian",
    type: "article",
    url: "/church/tree",
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
    title: "The tree — The Church",
    description:
      "One church becoming many, drawn — every fork dated, every living branch traced from Pentecost to today.",
    images: ["/worlds/church.jpg"],
  },
};

export default function TreePage() {
  return (
    <>
      <p className="kicker">
        <Link href="/church">The Church</Link>
      </p>
      <h1>The tree</h1>
      <p className="lede">
        One trunk, from the upper room. Four great forks — 431, 451, 1054,
        1517 — and every limb still bearing leaves. The divisions are real and
        the dates are hard; so is this: nothing on this tree has died.
      </p>
      <Tree data={getChurchTree()} />
      <p>
        Walk the whole story on{" "}
        <Link href="/church" className="textlink">
          the road
        </Link>{" "}
        — each fork happens somewhere along it, and the road tells you why.
      </p>
    </>
  );
}
