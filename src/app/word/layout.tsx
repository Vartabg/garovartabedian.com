import ReadingNarrative from "../_components/reading/ReadingNarrative";
import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import "../styles/worlds-shared.css";
import "../styles/word.css";

const DESCRIPTION =
  "The factual story of modern Bible translation copyright — who owns each translation, what you may quote, and the translations that were given away free.";

export const metadata: Metadata = {
  title: {
    default: "Who Owns the Word?",
    template: "%s — Who Owns the Word?",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/word" },
  openGraph: {
    title: "Who Owns the Word?",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/word",
    images: [
      {
        url: "/worlds/word.jpg",
        width: 1200,
        height: 800,
        alt: "An open Bible enclosed behind a small brass fence beside sealed manuscript stacks and a magnifying glass",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who Owns the Word?",
    description: DESCRIPTION,
    images: ["/worlds/word.jpg"],
  },
};


const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Who Owns the Word?",
  url: "https://garovartabedian.com/word",
  description: DESCRIPTION,
  hasPart: [
    { "@type": "Article", name: "The fences", url: "https://garovartabedian.com/word" },
    { "@type": "Article", name: "The cases", url: "https://garovartabedian.com/word/cases" },
    { "@type": "Article", name: "The free way, checked", url: "https://garovartabedian.com/word/free" },
  ],
};

/** The Word-ownership world — cool paper, ledger blue. Facts, fairly stated. */
export default function WordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-shell world-word">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <WorldHeader href="/word" label="Who Owns the Word?" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="word" />
          <ReadingNarrative>{children}</ReadingNarrative>
          <WorldNextSteps world="word" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>&ldquo;He who desires, let him take the water of life freely.&rdquo; — Revelation 22:17</span>
          <span>
            Every claim sourced ·{" "}
            <Link href="/sources#word-ownership" className="textlink">
              Sources
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
