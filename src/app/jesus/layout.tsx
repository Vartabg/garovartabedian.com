import ReadingNarrative from "../_components/reading/ReadingNarrative";
import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import "../styles/worlds-shared.css";
import "../styles/jesus.css";

const DESCRIPTION =
  "Jesus Christ through his recorded words, life, prophecy, historical witnesses, and the ways faiths, readers, and legends understand him — with sources available to inspect.";

export const metadata: Metadata = {
  title: {
    default: "Jesus Christ",
    template: "%s — Jesus Christ",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/jesus" },
  openGraph: {
    title: "Jesus Christ",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/jesus",
    images: [
      {
        url: "/worlds/jesus.jpg",
        width: 1200,
        height: 800,
        alt: "The stone rolled away from an open garden tomb at dawn, folded linen resting on the rock",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jesus Christ",
    description: DESCRIPTION,
    images: ["/worlds/jesus.jpg"],
  },
};


const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Jesus Christ",
  url: "https://garovartabedian.com/jesus",
  description: DESCRIPTION,
  hasPart: [
    { "@type": "Article", name: "Overview", url: "https://garovartabedian.com/jesus" },
    { "@type": "Article", name: "His words", url: "https://garovartabedian.com/jesus/words" },
    { "@type": "Article", name: "Synoptic harmony", url: "https://garovartabedian.com/jesus/harmony" },
    { "@type": "Article", name: "His life", url: "https://garovartabedian.com/jesus/life" },
    {
      "@type": "Article",
      name: "From the cross to the ascension",
      url: "https://garovartabedian.com/jesus/risen",
    },
    { "@type": "Article", name: "Prophecy", url: "https://garovartabedian.com/jesus/prophecy" },
    { "@type": "Article", name: "History", url: "https://garovartabedian.com/jesus/history" },
    { "@type": "Article", name: "World views", url: "https://garovartabedian.com/jesus/lens" },
    {
      "@type": "Article",
      name: "NotebookLM Research Dossier Engine",
      url: "https://garovartabedian.com/jesus/dossier",
    },
  ],
};

/** The Jesus world — ivory, deep slate, wine. Faith meets history. */
export default function JesusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-shell world-jesus">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <WorldHeader href="/jesus" label="Jesus Christ" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="jesus" />
          <ReadingNarrative>{children}</ReadingNarrative>
          <WorldNextSteps world="jesus" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>&ldquo;Come and see.&rdquo; — John 1:46</span>
          <span>
            Sources cited on every page ·{" "}
            <Link href="/sources#jesus-history" className="textlink">
              Sources
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
