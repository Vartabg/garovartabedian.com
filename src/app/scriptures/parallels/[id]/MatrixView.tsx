"use client";

import Link from "next/link";
import { useState } from "react";
import type { ParallelMatrix, EvidenceBasis, WitnessEdge, ReceptionClaim } from "@/lib/parallels/types";

const BASIS_BADGES: Record<
  EvidenceBasis,
  { label: string; bg: string; text: string; description: string }
> = {
  explicit: {
    label: "Explicit in text",
    bg: "bg-emerald-900/40 border-emerald-600/50",
    text: "text-emerald-300",
    description: "Stated directly in the primary text of this witness.",
  },
  inferred: {
    label: "Direct inference",
    bg: "bg-blue-900/40 border-blue-600/50",
    text: "text-blue-300",
    description: "Follows directly from the narrative sequence or language.",
  },
  disputed: {
    label: "Disputed reading",
    bg: "bg-amber-900/40 border-amber-600/50",
    text: "text-amber-300",
    description: "Plausible reading, but other interpretations or manuscript variants exist.",
  },
  reception: {
    label: "Later reception",
    bg: "bg-purple-900/40 border-purple-600/50",
    text: "text-purple-300",
    description: "Derived from subsequent liturgical or commentary tradition.",
  },
};

const CONSENSUS_BADGES: Record<WitnessEdge["scholarlyConsensus"], string> = {
  strong: "bg-emerald-950 text-emerald-300 border-emerald-700/60",
  debated: "bg-amber-950 text-amber-300 border-amber-700/60",
  "minority-view": "bg-neutral-900 text-neutral-300 border-neutral-700",
};

export default function MatrixView({ matrix }: { matrix: ParallelMatrix }) {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(
    matrix.edges[0]?.id ?? null,
  );
  const [activeReception, setActiveReception] = useState<ReceptionClaim["tradition"] | "all">("all");
  const [copiedCellId, setCopiedCellId] = useState<string | null>(null);
  const [citationCopied, setCitationCopied] = useState(false);

  const selectedEdge = matrix.edges.find((e) => e.id === selectedEdgeId) ?? matrix.edges[0];

  const handleCopyCitation = async () => {
    const citation = `Vartabedian, Garo, ed. "${matrix.title} (${matrix.subtitle})." Comparative Abrahamic Textual Matrices (2026). Reviewed digest (SHA-256): ${matrix.provenance.reviewedContentHash}. https://garovartabedian.com/scriptures/parallels/${matrix.slug}`;
    try {
      await navigator.clipboard.writeText(citation);
      setCitationCopied(true);
      setTimeout(() => setCitationCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopy = async (slotId: string, witnessId: string, text: string, citation: string, notice: string) => {
    const fullSnippet = `"${text}"\n— ${citation}\n\nAttribution & Rights: ${notice}\nSource: garovartabedian.com/scriptures/parallels/${matrix.slug}`;
    try {
      await navigator.clipboard.writeText(fullSnippet);
      const key = `${slotId}-${witnessId}`;
      setCopiedCellId(key);
      setTimeout(() => setCopiedCellId(null), 2500);
    } catch {
      // ignore
    }
  };

  const filteredClaims =
    activeReception === "all"
      ? matrix.receptionClaims
      : matrix.receptionClaims.filter((c) => c.tradition === activeReception);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-neutral-200">
      {/* Top Header */}
      <header className="border-b border-neutral-800 pb-8 mb-10">
        <div className="flex items-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide bg-neutral-900 border border-neutral-700 text-neutral-300">
            <span>PARALLEL CLAIM MATRIX</span>
            <span>·</span>
            <span className="text-emerald-400 capitalize">{matrix.provenance.reviewStatus.replace("-", " ")}</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-white mb-2">
          {matrix.title}
        </h1>
        <p className="text-lg text-amber-200/80 font-serif mb-4">{matrix.subtitle}</p>
        <p className="text-neutral-300 text-base max-w-3xl leading-relaxed">{matrix.summary}</p>

        {/* Provenance & Verification Card */}
        <details className="mt-6 group rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-400 overflow-hidden transition">
          <summary className="px-4 py-3 cursor-pointer flex items-center justify-between hover:text-neutral-200 select-none">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 group-open:rotate-90 transition-transform font-mono">›</span>
              <span className="text-neutral-300 font-medium font-mono text-[11px] uppercase tracking-wider">
                Provenance & Machine Verification
              </span>
            </div>
            <span className="text-neutral-500 font-mono text-[11px]">
              {matrix.provenance.rubricVersion} · {matrix.provenance.reviewedAt.slice(0, 10)}
            </span>
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-neutral-800/60 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-neutral-300 font-medium">Review Authority: </span>
                <span>{matrix.provenance.reviewer}</span>
              </div>
              <div>
                <span className="text-neutral-300 font-medium">Rubric: </span>
                <span className="font-mono">{matrix.provenance.rubricVersion}</span>
              </div>
            </div>
            <div>
              <span className="text-neutral-300 font-medium">Review Scope: </span>
              <span>{matrix.provenance.reviewScope}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-800/40 font-mono text-[11px] text-neutral-500">
              <div className="truncate max-w-xl">
                <span className="text-neutral-400 font-sans">Content Digest (SHA-256): </span>
                <code className="text-neutral-300 bg-black/40 px-1.5 py-0.5 rounded border border-neutral-800">
                  {matrix.provenance.reviewedContentHash}
                </code>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyCitation}
                  className="text-amber-300 hover:text-amber-200 transition font-sans underline underline-offset-2 flex-shrink-0"
                >
                  {citationCopied ? "✓ SBL Citation Copied" : "Copy Academic Citation"}
                </button>
                <span>·</span>
                <a
                  href={`/parallels/${matrix.slug}.json`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-400 hover:text-neutral-200 transition underline underline-offset-2 flex-shrink-0"
                >
                  JSON Record ↗
                </a>
              </div>
            </div>
          </div>
        </details>
      </header>

      {/* Witnesses Grid */}
      <section className="mb-12" aria-labelledby="witnesses-heading">
        <h2 id="witnesses-heading" className="text-xs uppercase tracking-widest font-mono text-neutral-400 mb-4">
          The Compared Witnesses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matrix.witnesses.map((w) => (
            <div
              key={w.id}
              className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-mono text-amber-400/90 tracking-wide">{w.primaryTradition}</span>
                <h3 className="text-lg font-serif font-medium text-white mt-1 mb-2">{w.title}</h3>
                <dl className="text-xs space-y-1.5 text-neutral-400">
                  <div>
                    <dt className="inline text-neutral-500">Language: </dt>
                    <dd className="inline text-neutral-300">{w.language}</dd>
                  </div>
                  <div>
                    <dt className="inline text-neutral-500">Composition: </dt>
                    <dd className="inline text-neutral-300">{w.dates.composition}</dd>
                  </div>
                  <div>
                    <dt className="inline text-neutral-500">Earliest Witness: </dt>
                    <dd className="inline text-neutral-300">{w.dates.earliestManuscript}</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-500 leading-snug">
                {w.licenseNotice}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Slot Comparison Matrix */}
      <section className="mb-16" aria-labelledby="slots-heading">
        <div className="flex items-center justify-between mb-6">
          <h2 id="slots-heading" className="text-xs uppercase tracking-widest font-mono text-neutral-400">
            Source-Anchored Slot Comparison
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            {matrix.slots.length} thematic slots · deterministic verbatim quotes
          </span>
        </div>

        <div className="space-y-10">
          {matrix.slots.map((slot, sIdx) => (
            <article
              key={slot.id}
              className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/90 shadow-sm"
              aria-labelledby={`slot-title-${slot.id}`}
            >
              <div className="flex items-start gap-4 mb-6 border-b border-neutral-800/70 pb-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center font-mono text-sm text-neutral-300">
                  {sIdx + 1}
                </span>
                <div>
                  <h3 id={`slot-title-${slot.id}`} className="text-xl font-serif text-white font-medium">
                    {slot.label}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-0.5">{slot.description}</p>
                </div>
              </div>

              {/* Grid of Cells */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {matrix.witnesses.map((w) => {
                  const cell = slot.cells[w.id];
                  if (!cell) return null;
                  const badge = BASIS_BADGES[cell.basis];
                  const cellKey = `${slot.id}-${w.id}`;
                  const isCopied = copiedCellId === cellKey;

                  return (
                    <div
                      key={w.id}
                      className="flex flex-col justify-between p-4 rounded-xl bg-neutral-900/50 border border-neutral-800"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-mono font-medium text-neutral-300">{w.shortTitle}</span>
                          <div className="flex items-center gap-1.5">
                            {cell.locator.originalLanguage && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-400">
                                {cell.locator.originalLanguage}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono border ${badge.bg} ${badge.text}`}
                              title={badge.description}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm font-medium text-neutral-200 mb-3 leading-snug">{cell.summary}</p>

                        {/* Verbatim Quote */}
                        <blockquote
                          className={`p-3 rounded-lg bg-black/40 border border-neutral-800 text-xs leading-relaxed text-neutral-300 mb-3 ${
                            w.isRtl ? "font-serif text-right" : ""
                          }`}
                          dir={w.isRtl ? "rtl" : "ltr"}
                        >
                          &ldquo;{cell.verbatimExcerpt}&rdquo;
                        </blockquote>

                        {/* Limits / Boundaries */}
                        {cell.limits && (
                          <div className="text-[11px] text-neutral-400 bg-neutral-900/80 p-2.5 rounded border border-neutral-800 mb-3">
                            <span className="text-amber-400/90 font-mono">Bound: </span>
                            {cell.limits}
                          </div>
                        )}
                      </div>

                      {/* Footer Citation & Copy */}
                      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-mono">
                        <span>{cell.locator.passageRef}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              slot.id,
                              w.id,
                              cell.verbatimExcerpt,
                              cell.locator.passageRef,
                              w.licenseNotice,
                            )
                          }
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-[11px]"
                          aria-label={`Copy citation and quote for ${w.shortTitle}`}
                        >
                          {isCopied ? "✓ Copied" : "Copy Quote"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Pairwise Relationship Graph Section */}
      <section className="mb-16 border-t border-neutral-800 pt-10" aria-labelledby="edges-heading">
        <div className="max-w-3xl mb-6">
          <h2 id="edges-heading" className="text-xs uppercase tracking-widest font-mono text-neutral-400 mb-2">
            Pairwise Textual & Literary Relationships
          </h2>
          <p className="text-sm text-neutral-400">
            Rather than assigning a single broad label to multi-tradition corpora, relationships are evaluated as
            pairwise edges with explicit scholarly consensus ratings and citations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {matrix.edges.map((edge) => {
            const isSelected = edge.id === selectedEdge?.id;
            const src = matrix.witnesses.find((w) => w.id === edge.sourceWitnessId)?.shortTitle ?? edge.sourceWitnessId;
            const tgt = matrix.witnesses.find((w) => w.id === edge.targetWitnessId)?.shortTitle ?? edge.targetWitnessId;

            return (
              <button
                key={edge.id}
                type="button"
                onClick={() => setSelectedEdgeId(edge.id)}
                className={`px-4 py-2 rounded-lg text-xs font-mono transition border ${
                  isSelected
                    ? "bg-amber-950/60 border-amber-500 text-amber-200"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                {src} ↔ {tgt}
              </button>
            );
          })}
        </div>

        {selectedEdge && (
          <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-sm font-mono text-white font-medium uppercase tracking-wider">
                Relationship: <span className="text-amber-400">{selectedEdge.relationship}</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                  CONSENSUS_BADGES[selectedEdge.scholarlyConsensus]
                }`}
              >
                Consensus: {selectedEdge.scholarlyConsensus}
              </span>
            </div>

            <p className="text-sm text-neutral-200 leading-relaxed mb-4">{selectedEdge.basisNote}</p>

            <div>
              <h4 className="text-xs font-mono uppercase text-neutral-500 tracking-wider mb-2">
                Scholarly Citations & References
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400">
                {selectedEdge.citations.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Sourced Reception History Claims */}
      <section className="border-t border-neutral-800 pt-10" aria-labelledby="reception-heading">
        <div className="max-w-3xl mb-6">
          <h2 id="reception-heading" className="text-xs uppercase tracking-widest font-mono text-neutral-400 mb-2">
            Sourced Reception History
          </h2>
          <p className="text-sm text-neutral-400">
            Theological typologies, midrashic developments, and liturgical commemorations separated from the textual
            diff and grounded in their own historic reception sources.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 text-xs font-mono">
          {(["all", "jewish", "christian", "islamic"] as const).map((trad) => (
            <button
              key={trad}
              type="button"
              onClick={() => setActiveReception(trad)}
              className={`px-3 py-1.5 rounded-lg border transition capitalize ${
                activeReception === trad
                  ? "bg-neutral-800 border-neutral-600 text-white"
                  : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
              }`}
            >
              {trad === "all" ? "All Traditions" : trad}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono uppercase text-amber-400/90">{claim.tradition}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {claim.basis.grade}
                  </span>
                </div>
                <h3 className="text-base font-serif font-medium text-white mb-2">{claim.subject}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">{claim.text}</p>
                {claim.limit && (
                  <p className="text-[11px] text-neutral-400 italic bg-black/30 p-2.5 rounded border border-neutral-800/80 mb-4">
                    Boundary: {claim.limit}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-800/80">
                <h4 className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1.5">
                  Sources Cited
                </h4>
                <ul className="text-xs text-neutral-400 space-y-1">
                  {claim.sources.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-neutral-600">›</span>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Navigation & Index Link */}
      <nav className="mt-16 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono" aria-label="Matrix navigation">
        <Link
          href="/scriptures/parallels"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 transition"
        >
          <span aria-hidden="true">←</span>
          <span>All Abrahamic Parallel Matrices</span>
        </Link>
        <div className="flex items-center gap-4 text-neutral-500">
          <Link href="/scriptures/graph" className="hover:text-neutral-300 transition">
            Cross-Reference Graph →
          </Link>
          <Link href="/sources" className="hover:text-neutral-300 transition">
            Source Records →
          </Link>
        </div>
      </nav>
    </div>
  );
}
