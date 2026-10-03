import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ResonanceClient from "./ResonanceClient";

export const metadata: Metadata = {
  title: "Conceptual Resonance Matrix · Scriptures",
  description:
    "Compare similar wording across Scripture chapters, sayings of Jesus, early texts, and editorial frameworks, with explicit index coverage.",
};

export default function ResonancePage() {
  return (
    <div className="scr-resonance-page">
      <p className="kicker">
        <Link href="/scriptures">Scriptures</Link> · <Link href="/scriptures/search">Search</Link>
      </p>
      <h1>Conceptual Resonance Matrix</h1>
      <p className="lede">
        Explore theological and philosophical themes across the indexed collections.
        Search runs on your device and returns links to the hosted sources for examination.
      </p>

      <Suspense fallback={<p className="scr-empty">Loading Resonance Matrix…</p>}>
        <ResonanceClient />
      </Suspense>
    </div>
  );
}
