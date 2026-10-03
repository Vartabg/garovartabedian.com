import ReadingNarrative from "../_components/reading/ReadingNarrative";
import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import "../styles/worlds-shared.css";
import "../styles/evidence.css";

const DESCRIPTION =
  "A claim-by-claim evidence world separating source, observation, inference, interpretation, tradition, and limit across Scripture, history, science, philosophy, and theology.";

export const metadata: Metadata = {
  title: {
    default: "How We Know",
    template: "%s — How We Know",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/evidence" },
  openGraph: {
    title: "How We Know",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/evidence",
    images: [
      {
        url: "/worlds/evidence.jpg",
        width: 1200,
        height: 800,
        alt: "A telescope, manuscript, archaeological stone, prism, and balance share a research table at the edge of dawn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How We Know",
    description: DESCRIPTION,
    images: ["/worlds/evidence.jpg"],
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "How We Know",
  url: "https://garovartabedian.com/evidence",
  description: DESCRIPTION,
  hasPart: [
    {
      "@type": "CreativeWork",
      name: "The Claim Lab",
      url: "https://garovartabedian.com/evidence#claim-lab",
    },
    {
      "@type": "CreativeWork",
      name: "The evidence charter",
      url: "https://garovartabedian.com/evidence#method",
    },
    {
      "@type": "CreativeWork",
      name: "Eight evidence rooms",
      url: "https://garovartabedian.com/evidence#rooms",
    },
    {
      "@type": "CreativeWork",
      name: "Faith & Science research docket",
      url: "https://garovartabedian.com/evidence#faith-science",
    },
  ],
};

export default function EvidenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="world-shell world-evidence">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
        }}
      />
      <WorldHeader href="/evidence" label="How We Know" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="evidence" />
          <ReadingNarrative>{children}</ReadingNarrative>
          <WorldNextSteps world="evidence" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>Text · stone · witness · experiment · inference · limit</span>
          <span>
            Every bridge shown ·{" "}
            <Link href="/sources#how-we-know" className="textlink">
              Sources
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
