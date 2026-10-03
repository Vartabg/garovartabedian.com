import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import "../styles/worlds-shared.css";
import "../styles/early.css";

const DESCRIPTION =
  "Jewish writings, Apostolic Fathers, apocrypha, interpreters, histories and church orders. Read attributed editions by section, search text and notes, and inspect source and coverage limits.";

export const metadata: Metadata = {
  title: {
    default: "The Writings",
    template: "%s — The Writings",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/early" },
  openGraph: {
    title: "The Writings",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/early",
    images: [
      {
        url: "/worlds/early.jpg",
        width: 1200,
        height: 800,
        alt: "Papyrus letters and a scroll on a lamplit work table beneath a route map of the Mediterranean",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Writings",
    description: DESCRIPTION,
    images: ["/worlds/early.jpg"],
  },
};


const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "The Writings",
  url: "https://garovartabedian.com/early",
  description: DESCRIPTION,
  hasPart: [
    { "@type": "Article", name: "Overview", url: "https://garovartabedian.com/early" },
    { "@type": "Article", name: "Jewish apocalyptic", url: "https://garovartabedian.com/early/era/jewish" },
    { "@type": "Article", name: "The Apostolic Fathers", url: "https://garovartabedian.com/early/era/fathers" },
    { "@type": "Article", name: "The Apologists", url: "https://garovartabedian.com/early/era/apologists" },
    { "@type": "Article", name: "The Apocrypha", url: "https://garovartabedian.com/early/era/apocrypha" },
    { "@type": "Article", name: "Ignatius' road", url: "https://garovartabedian.com/early/ignatius" },
  ],
};

/** The Writings world — aged papyrus, sepia ink, verdigris. */
export default function EarlyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-shell world-early">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <WorldHeader href="/early" label="The Writings" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="early" />
          <nav className="ew-library-nav" aria-label="Writings library">
            <Link href="/early">Original shelf</Link>
            <Link href="/early/library">Works and editions</Link>
            <Link href="/early/search">Search the library</Link>
          </nav>
          {children}
          <WorldNextSteps world="early" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>&ldquo;There are two ways, one of life and one of death.&rdquo; — Didache 1</span>
          <span>
            Edition rights and coverage disclosed ·{" "}
            <Link href="/sources#early-writings" className="textlink">
              sources cited on each page
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
