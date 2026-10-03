import ReadingNarrative from "../_components/reading/ReadingNarrative";
import type { Metadata } from "next";
import Link from "next/link";
import WorldSwitcher from "../_components/WorldSwitcher";
import { WorldGuide, WorldNextSteps } from "../_components/WorldGuide";
import WorldHeader from "../_components/WorldHeader";
import "../styles/worlds-shared.css";
import "../styles/apostles.css";
import "../styles/apostles-home.css";

const DESCRIPTION =
  "Walk with the Apostles through illustrated stories, meet every recorded life, and follow the sending with scripture and tradition kept honestly apart.";

export const metadata: Metadata = {
  title: {
    default: "The Apostles",
    template: "%s — The Apostles",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/apostles" },
  openGraph: {
    title: "The Apostles",
    description: DESCRIPTION,
    siteName: "Garo Vartabedian",
    type: "website",
    url: "/apostles",
    images: [
      {
        url: "/worlds/apostles.jpg",
        width: 1200,
        height: 800,
        alt: "Twelve rays of light scattering from one point across aged parchment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Apostles",
    description: DESCRIPTION,
    images: ["/worlds/apostles.jpg"],
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "The Apostles",
  url: "https://garovartabedian.com/apostles",
  description: DESCRIPTION,
  hasPart: [
    { "@type": "Article", name: "Come and eat", url: "https://garovartabedian.com/apostles/stories/come-and-eat" },
    { "@type": "Article", name: "Peace be with you", url: "https://garovartabedian.com/apostles/stories/peace-be-with-you" },
    { "@type": "Article", name: "In our own languages", url: "https://garovartabedian.com/apostles/stories/every-language" },
    { "@type": "Article", name: "The twelve", url: "https://garovartabedian.com/apostles/twelve" },
    { "@type": "Article", name: "The sending", url: "https://garovartabedian.com/apostles/sent" },
  ],
};

/** The Apostles world — ember and parchment: men set on fire and scattered. */
export default function ApostlesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-shell world-apostles">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <WorldHeader href="/apostles" label="The Apostles" />
      <main id="main">
        <div className="wrap">
          <WorldGuide world="apostles" />
          <ReadingNarrative>{children}</ReadingNarrative>
          <WorldNextSteps world="apostles" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>
            &ldquo;You will be witnesses to me in Jerusalem, in all Judea and
            Samaria, and to the uttermost parts of the earth.&rdquo; — Acts 1:8
          </span>
          <span>
            Every road graded ·{" "}
            <Link href="/sources#apostles" className="textlink">
              tradition never dressed as scripture
            </Link>
          </span>
        </div>
      </footer>
      <WorldSwitcher />
    </div>
  );
}
