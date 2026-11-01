import type { Metadata } from "next";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import { canons } from "@/lib/scriptures/server/canons";
import WordBridgeEntry from "./WordBridgeEntry";

export const metadata: Metadata = {
  title: "Word Bridge",
  description: "Connect World English Bible words with Hebrew and Greek, then inspect their dictionary entries, grammar, and alignment checks.",
  alternates: { canonical: "/scriptures/word-bridge" },
  openGraph: {
    title: "Word Bridge",
    description: "Connect World English Bible words with Hebrew and Greek, dictionary entries, and grammar.",
    url: "/scriptures/word-bridge",
    type: "website",
    images: ["/worlds/scriptures.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word Bridge",
    description: "Connect World English Bible words with Hebrew and Greek, dictionary entries, and grammar.",
    images: ["/worlds/scriptures.jpg"],
  },
};

export default function WordBridgePage() {
  return <article className="prose-wrap">
    <StudyPageHeader path="/scriptures/word-bridge" action="Choose a verse, then select an English or source word to see the connection, dictionary entry, and grammar." />
    <WordBridgeEntry canons={canons} />
    <details className="scr-bridge-method">
      <summary>Coverage and how the links are checked</summary>
      <p>Word Bridge uses the World English Bible with named Hebrew and Greek editions. The Gospels include expanded AI-drafted alignments; other verses may use existing lexical-tag links. Some verses are absent from the chosen source edition.</p>
      <p>Dictionary checks support individual word connections. They do not establish that every connection is correct in context. Links that need review are marked separately, and supplied or untranslated words remain visible.</p>
      <a href="/sources#word-bridge">Inspect sources and method</a>
    </details>
  </article>;
}
