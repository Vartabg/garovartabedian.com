"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  type SynopticPericope,
  type DiffToken,
  diffPericope,
  GOSPEL_NAMES,
  GOSPEL_ORDER,
} from "@/lib/jesus/synoptic-diff";

interface SynopticComparatorProps {
  pericopes: SynopticPericope[];
  initialPericopeId?: string;
}

type ViewMode = "diff" | "runs" | "clean";

const CATEGORIES = [
  "All",
  "Sayings & Discourses",
  "Miracles & Signs",
  "Identity & Ministry",
  "Passion & Resurrection",
];

export default function SynopticComparator({
  pericopes,
  initialPericopeId,
}: SynopticComparatorProps) {
  const [selectedId, setSelectedId] = useState<string>(
    initialPericopeId || pericopes[0]?.id || "beatitudes",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [language, setLanguage] = useState<"en" | "el">("en");
  const [viewMode, setViewMode] = useState<ViewMode>("diff");
  const [dimStopwords, setDimStopwords] = useState<boolean>(true);
  const [hoveredStem, setHoveredStem] = useState<string | null>(null);
  const [inspectedToken, setInspectedToken] = useState<DiffToken | null>(null);

  const currentPericope = useMemo(() => {
    return pericopes.find((p) => p.id === selectedId) || pericopes[0];
  }, [pericopes, selectedId]);

  const filteredPericopes = useMemo(() => {
    if (categoryFilter === "All") return pericopes;
    return pericopes.filter((p) => p.category === categoryFilter);
  }, [pericopes, categoryFilter]);

  const diffResult = useMemo(() => {
    if (!currentPericope) return null;
    return diffPericope(currentPericope, language, dimStopwords);
  }, [currentPericope, language, dimStopwords]);

  const activeWitnesses = useMemo(() => {
    if (!currentPericope) return [];
    return GOSPEL_ORDER.filter((code) => currentPericope.witnesses[code]);
  }, [currentPericope]);

  if (!currentPericope || !diffResult) return null;

  const numWitnesses = activeWitnesses.length;
  const colGridClass =
    numWitnesses === 4
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      : numWitnesses === 3
      ? "grid-cols-1 md:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="synoptic-comparator my-8">
      {/* Category selector pills */}
      <nav
        aria-label="Synoptic pericope category filter"
        className="flex flex-wrap gap-2 pb-4 mb-6 border-b border-neutral-800"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategoryFilter(cat);
              const firstInCat =
                cat === "All"
                  ? pericopes[0]
                  : pericopes.find((p) => p.category === cat);
              if (firstInCat) setSelectedId(firstInCat.id);
            }}
            className={`px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-colors ${
              categoryFilter === cat
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-neutral-900/60 text-neutral-400 border border-neutral-800 hover:text-neutral-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Pericope selector dropdown and meta card */}
      <header className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-mono font-medium tracking-wide bg-amber-950/40 border border-amber-800/50 text-amber-300 mb-2">
              <span>{currentPericope.category}</span>
              <span>·</span>
              <span className="text-emerald-400">
                {currentPericope.traditionLabel}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium">
              {currentPericope.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="pericope-select" className="sr-only">
              Choose parallel pericope
            </label>
            <select
              id="pericope-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2 text-sm font-serif focus:outline-none focus:border-amber-500"
            >
              {filteredPericopes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.traditionLabel.split("(")[0].trim()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Synopsis & transmission note */}
        <p className="text-neutral-300 text-sm leading-relaxed max-w-4xl font-serif italic border-l-2 border-amber-500/50 pl-4 py-1">
          {currentPericope.synopsis}
        </p>

        {/* Control toolbar */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          {/* Language toggle */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 uppercase">Text:</span>
            <div className="inline-flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  language === "en"
                    ? "bg-neutral-800 text-amber-200 font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                English (WEB)
              </button>
              <button
                type="button"
                onClick={() => setLanguage("el")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  language === "el"
                    ? "bg-neutral-800 text-amber-200 font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Greek (SBLGNT)
              </button>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 uppercase">Diff Mode:</span>
            <div className="inline-flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800">
              <button
                type="button"
                onClick={() => setViewMode("diff")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  viewMode === "diff"
                    ? "bg-neutral-800 text-emerald-300 font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Full Synoptic Diff
              </button>
              <button
                type="button"
                onClick={() => setViewMode("runs")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  viewMode === "runs"
                    ? "bg-neutral-800 text-cyan-300 font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Verbatim Runs Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode("clean")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  viewMode === "clean"
                    ? "bg-neutral-800 text-neutral-200 font-medium"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Clean Text
              </button>
            </div>
          </div>

          {/* Stopwords filter */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-200">
              <input
                type="checkbox"
                checked={dimStopwords}
                onChange={(e) => setDimStopwords(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
              <span>Dim function words</span>
            </label>
          </div>
        </div>

        {/* Legend */}
        {viewMode !== "clean" && (
          <div className="mt-4 pt-3 border-t border-neutral-800/50 flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
            <span className="text-neutral-500 uppercase tracking-wider">
              Legend:
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
              <span className="text-emerald-300">
                Triple / All Tradition ({diffResult.sharedAllVocabulary.length} stems)
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/50" />
              <span className="text-sky-300">Double / Shared Pair (Q)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
              <span className="text-amber-300">Sondergut (Unique to Gospel)</span>
            </span>
            {viewMode === "runs" && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-400 underline decoration-cyan-400" />
                <span className="text-cyan-200 font-semibold">
                  Multi-word Verbatim Run
                </span>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Statistical Dashboard Cards */}
      <section
        aria-label="Synoptic statistical metrics"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs"
      >
        {activeWitnesses.map((code) => {
          const w = diffResult.witnesses[code];
          if (!w) return null;
          const sondergutPct = Math.round(w.sondergutRatio * 100);
          const universalPct = Math.round(w.universalRatio * 100);
          return (
            <div
              key={code}
              className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-neutral-300 font-semibold text-sm font-serif">
                  {GOSPEL_NAMES[code]}
                </span>
                <span className="text-neutral-500 text-[11px]">{w.totalWords} wds</span>
              </div>
              <div className="space-y-1 text-neutral-400">
                <div className="flex justify-between">
                  <span>Universal:</span>
                  <span className="text-emerald-400 font-medium">
                    {universalPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sondergut:</span>
                  <span className="text-amber-400 font-medium">
                    {sondergutPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Verbatim run:</span>
                  <span className="text-cyan-400 font-medium">
                    {w.verbatimRunCount} wds
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Pairwise similarity indices */}
      {Object.keys(diffResult.pairwiseOverlap).length > 0 && (
        <aside
          aria-label="Pairwise vocabulary similarity"
          className="bg-neutral-950/70 border border-neutral-800/80 rounded-lg px-4 py-2.5 mb-6 flex flex-wrap items-center gap-4 text-xs font-mono"
        >
          <span className="text-neutral-500 uppercase">
            Pairwise Jaccard Overlap:
          </span>
          {Object.entries(diffResult.pairwiseOverlap).map(([pair, score]) => (
            <span key={pair} className="text-neutral-300">
              <span className="text-amber-300/90">{pair.replace("-", " ↔ ")}</span>:{" "}
              <span className="text-emerald-400 font-semibold">
                {Math.round(score * 100)}%
              </span>
            </span>
          ))}
        </aside>
      )}

      {/* Word Inspector popover / card */}
      {inspectedToken && (
        <aside
          aria-label="Word inspection details"
          className="bg-neutral-900 border border-amber-500/40 rounded-xl p-4 mb-6 text-sm font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-serif font-semibold text-white">
                &ldquo;{inspectedToken.raw}&rdquo;
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  inspectedToken.classification === "all"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                    : inspectedToken.classification === "shared"
                    ? "bg-sky-950 text-sky-300 border border-sky-500/50"
                    : inspectedToken.classification === "unique"
                    ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {inspectedToken.classification === "all"
                  ? "Universal Agreement"
                  : inspectedToken.classification === "shared"
                  ? `Shared with ${inspectedToken.sharedWith.join(", ")}`
                  : inspectedToken.classification === "unique"
                  ? "Unique Sondergut"
                  : "Function Word"}
              </span>
              {inspectedToken.isVerbatimRun && (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                  Verbatim Run
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-400 flex flex-wrap gap-x-4 gap-y-1">
              <span>Stem: <span className="text-neutral-200">{inspectedToken.stem || "—"}</span></span>
              {inspectedToken.lemma && (
                <span>Lemma: <span className="text-amber-300 font-serif">{inspectedToken.lemma}</span></span>
              )}
              {inspectedToken.morph && (
                <span>Morphology: <span className="text-neutral-300">{inspectedToken.morph}</span></span>
              )}
              <span>Verse: <span className="text-neutral-300">v.{inspectedToken.verseNumber}</span></span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInspectedToken(null)}
            className="self-end sm:self-center px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
          >
            Close
          </button>
        </aside>
      )}

      {/* Multi-column Side-by-Side Pericope View */}
      <div className={`grid gap-4 ${colGridClass}`}>
        {activeWitnesses.map((code) => {
          const w = diffResult.witnesses[code];
          if (!w) return null;
          const [, chVPart] = w.ref.split(" ");
          const [ch] = (chVPart || "").split(":");
          const readerLink = `/scriptures/text/${code}/${ch || 1}`;

          return (
            <article
              key={code}
              className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden flex flex-col"
            >
              {/* Column Header */}
              <header className="px-4 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-white font-semibold text-lg">
                    {GOSPEL_NAMES[code]}
                  </h3>
                  <Link
                    href={readerLink}
                    className="text-xs font-mono text-amber-400 hover:underline inline-flex items-center gap-1"
                    title={`Open ${w.ref} in hosted reader`}
                  >
                    <span>{w.ref}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
                    {w.totalWords} wds
                  </span>
                </div>
              </header>

              {/* Column Verses Content */}
              <div className="p-4 space-y-3 font-serif text-sm leading-relaxed overflow-y-auto max-h-[680px] flex-1">
                {renderWitnessTokens(
                  w.tokens,
                  viewMode,
                  hoveredStem,
                  setHoveredStem,
                  setInspectedToken,
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Academic Explanatory Note */}
      <footer className="mt-12 pt-6 border-t border-neutral-800/80 text-xs text-neutral-400 leading-relaxed font-serif">
        <h4 className="font-mono uppercase tracking-wider text-neutral-300 text-[11px] mb-2">
          Methodological Framework: The Synoptic Problem & Literary Dependence
        </h4>
        <p className="mb-2">
          The Synoptic Problem examines why Matthew, Mark, and Luke share extensive verbatim agreements in Greek (often word-for-word in identical order), while diverging in structure and carrying independent material (<em>Sondergut</em>).
        </p>
        <p>
          The prevailing scholarly consensus (the Two-Source Hypothesis) posits that Mark was the earliest Gospel used as a narrative blueprint by Matthew and Luke (accounting for <strong>Triple Tradition</strong>), while Matthew and Luke independently drew upon a lost sayings collection termed <strong>Q</strong> (accounting for <strong>Double Tradition</strong>). This engine verifies these literary relationships mathematically through deterministic word-level alignment across the entire canonical text.
        </p>
      </footer>
    </div>
  );
}

/** Helper to render tokens grouped by verse numbers. */
function renderWitnessTokens(
  tokens: DiffToken[],
  viewMode: ViewMode,
  hoveredStem: string | null,
  setHoveredStem: (stem: string | null) => void,
  setInspectedToken: (token: DiffToken) => void,
) {
  // Group tokens by verseNumber
  const verseGroups: Record<number, DiffToken[]> = {};
  for (const t of tokens) {
    if (!verseGroups[t.verseNumber]) {
      verseGroups[t.verseNumber] = [];
    }
    verseGroups[t.verseNumber].push(t);
  }

  const verseNumbers = Object.keys(verseGroups).map(Number).sort((a, b) => a - b);

  return verseNumbers.map((vNum) => (
    <div key={vNum} className="verse-line flex gap-2">
      <span className="verse-badge select-none font-mono text-[10px] text-amber-500/80 font-semibold pt-0.5 w-6 shrink-0 text-right">
        {vNum}
      </span>
      <p className="flex-1">
        {verseGroups[vNum].map((t) => {
          const isHovered = hoveredStem && t.stem && hoveredStem === t.stem;

          let styleClass = "text-neutral-200";
          if (viewMode === "diff") {
            if (t.classification === "all") {
              styleClass =
                "bg-emerald-950/70 text-emerald-200 border-b border-emerald-500/60 font-medium";
            } else if (t.classification === "shared") {
              styleClass =
                "bg-sky-950/70 text-sky-200 border-b border-sky-500/60 font-medium";
            } else if (t.classification === "unique") {
              styleClass =
                "bg-amber-950/50 text-amber-200 border-b border-amber-600/50";
            } else if (t.classification === "stopword") {
              styleClass = "text-neutral-500";
            }
          } else if (viewMode === "runs") {
            if (t.isVerbatimRun) {
              styleClass =
                "bg-cyan-950/80 text-cyan-200 border-b-2 border-cyan-400 font-semibold";
            } else {
              styleClass = "text-neutral-400";
            }
          }

          if (isHovered) {
            styleClass += " ring-2 ring-amber-400 bg-amber-400/20 text-white rounded";
          }

          return (
            <span
              key={t.id}
              onMouseEnter={() => t.stem && setHoveredStem(t.stem)}
              onMouseLeave={() => setHoveredStem(null)}
              onClick={() => setInspectedToken(t)}
              className={`inline-block mx-0.5 px-0.5 rounded cursor-pointer transition-colors ${styleClass}`}
              title={
                t.classification === "all"
                  ? "Triple / All Tradition"
                  : t.classification === "shared"
                  ? `Shared with ${t.sharedWith.join(", ")}`
                  : t.classification === "unique"
                  ? "Unique Sondergut"
                  : undefined
              }
            >
              {t.raw}{" "}
            </span>
          );
        })}
      </p>
    </div>
  ));
}
