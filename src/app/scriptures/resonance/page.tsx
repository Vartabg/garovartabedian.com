import { Suspense } from "react";
import type { Metadata } from "next";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import ResonanceClient from "./ResonanceClient";

export const metadata: Metadata = {
  title: "Conceptual resonance",
  description:
    "Compare similar wording across Scripture chapters, sayings of Jesus, early texts, and editorial frameworks, with explicit index coverage.",
  alternates: { canonical: "/scriptures/resonance" },
  openGraph: { title: "Conceptual resonance", url: "/scriptures/resonance", images: ["/worlds/scriptures.jpg"] },
};

export default function ResonancePage() {
  return (
    <div className="scr-resonance-page">
      <StudyPageHeader path="/scriptures/resonance" action="Enter a theme or try an example. Search runs on your device; open a result to read its source and judge the connection." />

      <Suspense fallback={<p className="scr-empty">Loading search…</p>}>
        <ResonanceClient />
      </Suspense>
    </div>
  );
}
