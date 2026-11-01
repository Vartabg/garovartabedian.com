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
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
    description: "Stated directly in the primary text of this witness.",
  },
  inferred: {
    label: "Direct inference",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
    description: "Follows directly from the narrative sequence or language.",
  },
  disputed: {
    label: "Disputed reading",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
    description: "Plausible reading, but other interpretations or manuscript variants exist.",
  },
  reception: {
    label: "Later reception",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
    description: "Derived from subsequent liturgical or commentary tradition.",
  },
};

const CONSENSUS_BADGES: Record<WitnessEdge["scholarlyConsensus"], string> = {
  strong: "parallel-surface parallel-accent parallel-rule",
  debated: "parallel-surface parallel-accent parallel-rule",
  "minority-view": "parallel-panel parallel-muted parallel-rule",
};

export default function MatrixView({ matrix, returnHref = "/scriptures/parallels" }: { matrix: ParallelMatrix; returnHref?: string }) {
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
    <div className="scr-parallels-detail py-8 parallel-ink">
      {/* Top Header */}
      <header className="border-b parallel-rule pb-8 mb-10">
        <div className="flex items-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide parallel-panel border parallel-rule parallel-muted">
            <span>SOURCE COMPARISON</span>
            <span>·</span>
            <span className="parallel-accent capitalize">{matrix.provenance.reviewStatus.replace("-", " ")}</span>
          </div>
        </div>

        <h1 data-hand="capitals" className="text-3xl sm:text-4xl font-serif font-medium tracking-tight parallel-ink mb-2">
          {matrix.title}
        </h1>
        <p className="text-lg parallel-accent font-serif mb-4">{matrix.subtitle}</p>
        <p className="parallel-muted text-base max-w-3xl leading-relaxed">{matrix.summary}</p>

        {/* Provenance & Verification Card */}
        <details className="mt-6 group rounded-xl parallel-panel border parallel-rule text-xs parallel-muted overflow-hidden transition">
          <summary className="px-4 py-3 cursor-pointer flex items-center justify-between  select-none">
            <div className="flex items-center gap-2">
              <span className="parallel-muted group-open:rotate-90 transition-transform font-mono">›</span>
              <span className="parallel-muted font-medium font-mono text-[.8rem] uppercase tracking-wider">
                Sources and review history
              </span>
            </div>
            <span className="parallel-muted font-mono text-[.8rem]">
              {matrix.provenance.rubricVersion} · {matrix.provenance.reviewedAt.slice(0, 10)}
            </span>
          </summary>
          <div className="px-4 pb-4 pt-2 border-t parallel-rule space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="parallel-muted font-medium">Reviewed by: </span>
                <span>{matrix.provenance.reviewer}</span>
              </div>
              <div>
                <span className="parallel-muted font-medium">Rubric: </span>
                <span className="font-mono">{matrix.provenance.rubricVersion}</span>
              </div>
            </div>
            <div>
              <span className="parallel-muted font-medium">Review Scope: </span>
              <span>{matrix.provenance.reviewScope}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t parallel-rule font-mono text-[.8rem] parallel-muted">
              <div className="truncate max-w-xl">
                <span className="parallel-muted font-sans">Content Digest (SHA-256): </span>
                <code className="parallel-muted parallel-surface px-1.5 py-0.5 rounded border parallel-rule">
                  {matrix.provenance.reviewedContentHash}
                </code>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyCitation}
                  className="parallel-accent  transition font-sans underline underline-offset-2 flex-shrink-0"
                >
                  {citationCopied ? "Citation copied" : "Copy citation"}
                </button>
                <span>·</span>
                <a
                  href={`/parallels/${matrix.slug}.json`}
                  target="_blank"
                  rel="noreferrer"
                  className="parallel-muted  transition underline underline-offset-2 flex-shrink-0"
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
        <h2 id="witnesses-heading" className="text-xs uppercase tracking-widest font-mono parallel-muted mb-4">
          The Compared Witnesses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matrix.witnesses.map((w) => (
            <div
              key={w.id}
              className="p-5 rounded-xl parallel-panel border parallel-rule  transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-mono parallel-accent tracking-wide">{w.primaryTradition}</span>
                <h3 className="text-lg font-serif font-medium parallel-ink mt-1 mb-2">{w.title}</h3>
                <dl className="text-xs space-y-1.5 parallel-muted">
                  <div>
                    <dt className="inline parallel-muted">Language: </dt>
                    <dd className="inline parallel-muted">{w.language}</dd>
                  </div>
                  <div>
                    <dt className="inline parallel-muted">Composition: </dt>
                    <dd className="inline parallel-muted">{w.dates.composition}</dd>
                  </div>
                  <div>
                    <dt className="inline parallel-muted">Earliest Witness: </dt>
                    <dd className="inline parallel-muted">{w.dates.earliestManuscript}</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-4 pt-3 border-t parallel-rule text-[.8rem] parallel-muted leading-snug">
                {w.licenseNotice}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Slot Comparison Matrix */}
      <section className="mb-16" aria-labelledby="slots-heading">
        <div className="flex items-center justify-between mb-6">
          <h2 id="slots-heading" className="text-xs uppercase tracking-widest font-mono parallel-muted">
            Compare the passages
          </h2>
          <span className="text-xs parallel-muted font-mono">
            {matrix.slots.length} themes · cited excerpts
          </span>
        </div>

        <div className="space-y-10">
          {matrix.slots.map((slot, sIdx) => (
            <article
              key={slot.id}
              className="p-6 rounded-2xl parallel-panel border parallel-rule shadow-sm"
              aria-labelledby={`slot-title-${slot.id}`}
            >
              <div className="flex items-start gap-4 mb-6 border-b parallel-rule pb-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full parallel-panel border parallel-rule flex items-center justify-center font-mono text-sm parallel-muted">
                  {sIdx + 1}
                </span>
                <div>
                  <h3 id={`slot-title-${slot.id}`} className="text-xl font-serif parallel-ink font-medium">
                    {slot.label}
                  </h3>
                  <p className="text-sm parallel-muted mt-0.5">{slot.description}</p>
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
                      className="flex flex-col justify-between p-4 rounded-xl parallel-panel border parallel-rule"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-mono font-medium parallel-muted">{w.shortTitle}</span>
                          <div className="flex items-center gap-1.5">
                            {cell.locator.originalLanguage && (
                              <span className="px-1.5 py-0.5 rounded text-[.75rem] font-mono parallel-panel border parallel-rule parallel-muted">
                                {cell.locator.originalLanguage}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[.8rem] font-mono border ${badge.bg} ${badge.text}`}
                              title={badge.description}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm font-medium parallel-muted mb-3 leading-snug">{cell.summary}</p>

                        {/* Verbatim Quote */}
                        <blockquote
                          className={`p-3 rounded-lg parallel-surface border parallel-rule text-xs leading-relaxed parallel-muted mb-3 ${
                            w.isRtl ? "font-serif text-right" : ""
                          }`}
                          dir={w.isRtl ? "rtl" : "ltr"}
                        >
                          &ldquo;{cell.verbatimExcerpt}&rdquo;
                        </blockquote>

                        {/* Limits / Boundaries */}
                        {cell.limits && (
                          <div className="text-[.8rem] parallel-muted parallel-panel p-2.5 rounded border parallel-rule mb-3">
                            <span className="parallel-accent font-mono">Bound: </span>
                            {cell.limits}
                          </div>
                        )}
                      </div>

                      {/* Footer Citation & Copy */}
                      <div className="pt-2 border-t parallel-rule flex items-center justify-between text-xs parallel-muted font-mono">
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
                          className="px-2 py-1 rounded parallel-surface  parallel-muted transition text-[.8rem]"
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
      <section className="mb-16 border-t parallel-rule pt-10" aria-labelledby="edges-heading">
        <div className="max-w-3xl mb-6">
          <h2 id="edges-heading" className="text-xs uppercase tracking-widest font-mono parallel-muted mb-2">
            How the sources relate
          </h2>
          <p className="text-sm parallel-muted">
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
                aria-pressed={isSelected}
                className={`px-4 py-2 rounded-lg text-xs font-mono transition border ${
                  isSelected
                    ? "parallel-surface parallel-rule parallel-accent"
                    : "parallel-panel parallel-rule parallel-muted "
                }`}
              >
                {src} ↔ {tgt}
              </button>
            );
          })}
        </div>

        {selectedEdge && (
          <div className="p-6 rounded-2xl parallel-panel border parallel-rule max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-sm font-mono parallel-ink font-medium uppercase tracking-wider">
                Relationship: <span className="parallel-accent">{selectedEdge.relationship}</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                  CONSENSUS_BADGES[selectedEdge.scholarlyConsensus]
                }`}
              >
                Consensus: {selectedEdge.scholarlyConsensus}
              </span>
            </div>

            <p className="text-sm parallel-muted leading-relaxed mb-4">{selectedEdge.basisNote}</p>

            <div>
              <h4 className="text-xs font-mono uppercase parallel-muted tracking-wider mb-2">
                Scholarly Citations & References
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs parallel-muted">
                {selectedEdge.citations.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Sourced Reception History Claims */}
      <section className="border-t parallel-rule pt-10" aria-labelledby="reception-heading">
        <div className="max-w-3xl mb-6">
          <h2 id="reception-heading" className="text-xs uppercase tracking-widest font-mono parallel-muted mb-2">
            Sourced Reception History
          </h2>
          <p className="text-sm parallel-muted">
            Theological typologies, midrashic developments, and liturgical commemorations separated from the textual
            diff and grounded in their own historic reception sources.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="parallel-controls flex gap-2 mb-6 text-xs font-mono">
          {(["all", "jewish", "christian", "islamic"] as const).map((trad) => (
            <button
              key={trad}
              type="button"
              onClick={() => setActiveReception(trad)}
              aria-pressed={activeReception === trad}
              className={`px-3 py-1.5 rounded-lg border transition capitalize ${
                activeReception === trad
                  ? "parallel-surface parallel-rule parallel-ink"
                  : "parallel-panel parallel-rule parallel-muted "
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
              className="p-5 rounded-xl parallel-panel border parallel-rule flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono uppercase parallel-accent">{claim.tradition}</span>
                  <span className="text-[.8rem] font-mono px-2 py-0.5 rounded parallel-surface parallel-muted">
                    {claim.basis.grade}
                  </span>
                </div>
                <h3 className="text-base font-serif font-medium parallel-ink mb-2">{claim.subject}</h3>
                <p className="text-xs parallel-muted leading-relaxed mb-4">{claim.text}</p>
                {claim.limit && (
                  <p className="text-[.8rem] parallel-muted italic parallel-surface p-2.5 rounded border parallel-rule mb-4">
                    Boundary: {claim.limit}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t parallel-rule">
                <h4 className="text-[.8rem] font-mono parallel-muted uppercase tracking-wider mb-1.5">
                  Sources Cited
                </h4>
                <ul className="text-xs parallel-muted space-y-1">
                  {claim.sources.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="parallel-muted">›</span>
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
      <nav className="mt-16 pt-8 border-t parallel-rule flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono" aria-label="Matrix navigation">
        <Link
          href={returnHref}
          className="inline-flex items-center gap-2 parallel-accent  transition"
        >
          <span aria-hidden="true">←</span>
          <span>All parallel claims</span>
        </Link>
        <div className="flex items-center gap-4 parallel-muted">
          <Link href="/scriptures/graph" className=" transition">
            Cross-Reference Graph →
          </Link>
          <Link href="/sources" className=" transition">
            Source Records →
          </Link>
        </div>
      </nav>
    </div>
  );
}
