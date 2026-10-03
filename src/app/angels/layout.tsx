import ReadingNarrative from "../_components/reading/ReadingNarrative";
import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import Sky from "./Sky";
import "../styles/worlds-shared.css";
import "../styles/angels.css";
import "../styles/angels-visual-system.css";
import "../styles/angels-atlas.css";
import "../styles/angels-interactions.css";
import "../styles/angels-demons.css";
import "../styles/angels-rooms-polish.css";

const DESCRIPTION =
  "Explore angels and demons through an illustrated guide to the unseen, collected encounters, named figures, and the passages behind them.";

export const metadata: Metadata = {
  title: {
    default: "Angels & Demons",
    template: "%s — Angels & Demons",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/angels" },
  openGraph: {
    title: "Angels & Demons",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/angels",
    images: [
      {
        url: "/worlds/angels.jpg",
        width: 1200,
        height: 800,
        alt: "Vast geometric wings of light flanking a radiant stair that descends to a cracked dark pavement",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Angels & Demons",
    description: DESCRIPTION,
    images: ["/worlds/angels.jpg"],
  },
};


const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Angels & Demons",
  url: "https://garovartabedian.com/angels",
  description: DESCRIPTION,
  hasPart: [
    { "@type": "Article", name: "The order", url: "https://garovartabedian.com/angels" },
    { "@type": "Article", name: "The fall", url: "https://garovartabedian.com/angels/fall" },
    { "@type": "Article", name: "The encounters", url: "https://garovartabedian.com/angels/encounters" },
    { "@type": "Article", name: "The demons", url: "https://garovartabedian.com/angels/demons" },
  ],
};

/** The Angels & Demons world — midnight, starlight, gold and ember. */
export default function AngelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-shell world-angels">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <Sky />
      <WorldHeader href="/angels" label="Angels & Demons" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="angels" />
          <ReadingNarrative>{children}</ReadingNarrative>
          <WorldNextSteps world="angels" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>
            &ldquo;Things visible and invisible.&rdquo; — Colossians 1:16
          </span>
          <span>
            Names, encounters, and words — with sources ·{" "}
            <Link href="/sources#angels-demons" className="textlink">
              Sources
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
