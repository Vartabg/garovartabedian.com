import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import "../styles/worlds-shared.css";
import "../styles/scriptures.css";

const DESCRIPTION =
  "Five Christian Scripture traditions compared with sourced canon histories, public-domain hosted texts, cross-references, search, and topics.";

export const metadata: Metadata = {
  title: {
    default: "Scriptures",
    template: "%s — Scriptures",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/scriptures" },
  openGraph: {
    title: "Scriptures",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/scriptures",
    images: [
      {
        url: "/worlds/scriptures.jpg",
        width: 1200,
        height: 800,
        alt: "Open manuscript codices on a candlelit study table, joined by faint threads of light",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scriptures",
    description: DESCRIPTION,
    images: ["/worlds/scriptures.jpg"],
  },
};


const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Scriptures",
  url: "https://garovartabedian.com/scriptures",
  description: DESCRIPTION,
  hasPart: [
    { "@type": "Article", name: "Traditions", url: "https://garovartabedian.com/scriptures" },
    { "@type": "Article", name: "Ask", url: "https://garovartabedian.com/scriptures/search" },
    { "@type": "Article", name: "Topics", url: "https://garovartabedian.com/scriptures/topics" },
  ],
};

/** The Scriptures world: its own light, its own pace. */
export default function ScripturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-shell world-scr">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <WorldHeader href="/scriptures" label="Scriptures" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="scriptures" />
          {process.env.NODE_ENV === "development" && process.env.JEV_RESEARCH_BRIDGE_PORT && <p className="local-research-shortcut"><Link className="textlink" href="/scriptures/research">Open local Jev research workspace →</Link></p>}
          {children}
          <WorldNextSteps world="scriptures" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>&ldquo;Freely you received, freely give.&rdquo; — Matthew 10:8</span>
          <span>
            Every hosted edition is public-domain or open-licensed ·{" "}
            <Link href="/sources#scripture-texts" className="textlink">
              Sources
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
