import ReadingNarrative from "../_components/reading/ReadingNarrative";
import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import "../styles/worlds-shared.css";
import "../styles/church.css";

const DESCRIPTION =
  "From the upper room to today — every step traced. The church's evolution, its traditions and cultures, who held the power and what they did with it.";

export const metadata: Metadata = {
  title: {
    default: "The Church",
    template: "%s — The Church",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/church" },
  openGraph: {
    title: "The Church",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/church",
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
    title: "The Church",
    description: DESCRIPTION,
    images: ["/worlds/church.jpg"],
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "The Church",
  url: "https://garovartabedian.com/church",
  description: DESCRIPTION,
  hasPart: [
    { "@type": "Article", name: "The road", url: "https://garovartabedian.com/church" },
    { "@type": "Article", name: "The tree", url: "https://garovartabedian.com/church/tree" },
    { "@type": "Article", name: "The faces", url: "https://garovartabedian.com/church/faces" },
    { "@type": "Article", name: "The councils", url: "https://garovartabedian.com/church/councils" },
    { "@type": "Article", name: "The giants", url: "https://garovartabedian.com/church/giants" },
  ],
};

/** The Church world — stone and royal purple: imperial and liturgical at once. */
export default function ChurchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-shell world-church">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <WorldHeader href="/church" label="The Church" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="church" />
          <ReadingNarrative>{children}</ReadingNarrative>
          <WorldNextSteps world="church" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>
            &ldquo;I will build my church, and the gates of Hades will not prevail against
            it.&rdquo; — Matthew 16:18
          </span>
          <span>
            Every step sourced ·{" "}
            <Link href="/sources#church-history" className="textlink">
              dark chapters stated as plainly as bright ones
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
