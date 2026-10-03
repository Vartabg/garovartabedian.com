import type { Metadata } from "next";
import Link from "next/link";
import { listParallelMatrices } from "@/lib/parallels/server";
import ParallelsShelf from "./ParallelsShelf";

export const metadata: Metadata = {
  title: "Comparative Abrahamic Matrices · Parallel Claims",
  description:
    "Source-anchored comparative analysis of narrative, legal, and theological passages across biblical, Second Temple Jewish, rabbinic, and Islamic textual witnesses.",
  openGraph: {
    title: "Comparative Abrahamic Matrices · Parallel Claims",
    description:
      "Source-anchored comparative analysis of narrative, legal, and theological passages across biblical, Second Temple Jewish, rabbinic, and Islamic textual witnesses.",
  },
};

export default async function ParallelsIndexPage() {
  const matrices = await listParallelMatrices();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-neutral-200">
      {/* Header */}
      <header className="border-b border-neutral-800 pb-8 mb-12">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide bg-neutral-900 border border-neutral-700 text-neutral-300">
            <span>ABRAHAMIC PARALLEL MATRICES</span>
            <span>·</span>
            <span className="text-emerald-400">Slot-Diff Engine</span>
          </div>
          <Link
            href="/jesus/harmony"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide bg-neutral-900 border border-neutral-700 text-amber-300 hover:border-amber-500/50 transition-colors"
          >
            <span className="text-cyan-400">Gospel Synoptics</span>
            <span>·</span>
            <span>Pericope Diff Engine &rarr;</span>
          </Link>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-medium tracking-tight text-white mb-4">
          Comparative Abrahamic Claims
        </h1>
        <p className="text-lg text-amber-200/90 font-serif max-w-3xl mb-4">
          Verbatim text comparisons, transmission bridges, and precise theological divergences across Jewish, Christian, and Islamic records.
        </p>
        <p className="text-neutral-400 text-sm max-w-3xl leading-relaxed">
          This research matrix refuses both false syncretism (&ldquo;all traditions say the exact same thing&rdquo;) and polemical distortion. Every pericope is structured as a deterministic slot diff with verified verbatim citations, original language witnesses, and distinct reception histories.
        </p>
      </header>

      {/* Main Interactive Shelf with Topology Map */}
      <ParallelsShelf matrices={matrices} />

      {/* Methodological Integrity Note */}
      <footer className="mt-16 pt-8 border-t border-neutral-800/80 text-xs text-neutral-500 max-w-3xl leading-relaxed">
        <p className="font-mono uppercase tracking-wider text-neutral-400 mb-2">
          Methodological Standard: Slot-Diff, Not Vector Distance
        </p>
        <p>
          Vector proximity measurements (cosine distance) detect shared vocabulary but are structurally blind to theological pivots (e.g. &ldquo;God provides the ram&rdquo; vs &ldquo;God has no son&rdquo;). This matrix extracts structured comparative slots to expose authentic doctrinal and narrative agreements and deviations with cryptographic hash verification and full rights provenance.
        </p>
      </footer>
    </main>
  );
}
