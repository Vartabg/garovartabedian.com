import Link from "next/link";
import { getSynopticPericopes } from "@/lib/jesus/server";
import SynopticComparator from "../_components/SynopticComparator";

export default function SynopticHarmonyPage() {
  const pericopes = getSynopticPericopes();

  return (
    <div className="synoptic-harmony-room py-6">
      <header className="room-lead border-b border-neutral-800/80 pb-6 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide bg-neutral-900 border border-neutral-700 text-neutral-300 mb-4">
          <span>SYNOPTIC GOSPEL HARMONY</span>
          <span>·</span>
          <span className="text-emerald-400">Word-Level Diff Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-medium tracking-tight text-white mb-4">
          Synoptic Harmony &amp; Pericope Diffing
        </h1>
        <p className="text-lg text-amber-200/90 font-serif max-w-3xl mb-3">
          Synchronized multi-gospel alignment with mathematical word-level diffing across English (WEB) and Greek (SBLGNT).
        </p>
        <p className="text-neutral-400 text-sm max-w-3xl leading-relaxed">
          Witness where Matthew, Mark, and Luke copy identical phrasing (<em>Triple Tradition</em>), where Matthew and Luke share sayings absent in Mark (<em>Double Tradition / Q</em>), and where each evangelist speaks with an entirely unique authorial voice (<em>Sondergut</em>). Every word is anchored to the hosted canonical text.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/jesus/dossier?preset=synoptic-problem-q"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium bg-amber-950/40 text-amber-200 border border-amber-800/60 hover:border-amber-600 transition-colors"
          >
            <span>Open Synoptic Problem in NotebookLM Dossier Studio</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <SynopticComparator pericopes={pericopes} />
    </div>
  );
}
