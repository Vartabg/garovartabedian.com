"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ParallelMatrix } from "@/lib/parallels/types";
import ParallelsTopologyMap, { type FilterCategory } from "./ParallelsTopologyMap";

const AXIS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  "christology": {
    label: "Christology & Incarnation",
    bg: "bg-blue-950/60 border-blue-800/60",
    text: "text-blue-300",
  },
  "atonement": {
    label: "Atonement & Trial",
    bg: "bg-amber-950/60 border-amber-800/60",
    text: "text-amber-300",
  },
  "sin-human-nature": {
    label: "Sin & Human Anthropology",
    bg: "bg-purple-950/60 border-purple-800/60",
    text: "text-purple-300",
  },
  "prophethood": {
    label: "Prophethood & Impeccability",
    bg: "bg-emerald-950/60 border-emerald-800/60",
    text: "text-emerald-300",
  },
  "law-sanctity": {
    label: "Sanctity of Life & Law",
    bg: "bg-rose-950/60 border-rose-800/60",
    text: "text-rose-300",
  },
};

const CATEGORY_MAP: Record<string, FilterCategory[]> = {
  "adam-fall-and-iblis": ["all", "quranic", "primeval"],
  "the-watchers": ["all", "enochic", "primeval"],
  "sanctity-of-human-life": ["all", "quranic", "primeval", "prophetic-law"],
  "sacrifice-of-the-son": ["all", "quranic", "prophetic-law"],
  "son-of-man": ["all", "enochic", "christological"],
  "infancy-and-clay-birds": ["all", "quranic", "christological"],
  "the-golden-calf-and-samiri": ["all", "quranic", "prophetic-law"],
  "jude-enoch-quotation": ["all", "enochic"],
};

export default function ParallelsShelf({
  matrices,
}: {
  matrices: ParallelMatrix[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  const filteredMatrices = useMemo(() => {
    if (filter === "all") return matrices;
    return matrices.filter((m) => {
      const cats = CATEGORY_MAP[m.slug] || ["all"];
      return cats.includes(filter);
    });
  }, [matrices, filter]);

  const handleSelectFromMap = (slug: string) => {
    router.push(`/scriptures/parallels/${slug}`);
  };

  return (
    <div>
      {/* Interactive Tradition & Literary Flow Topology Map */}
      <ParallelsTopologyMap
        activeFilter={filter}
        onFilterChange={setFilter}
        highlightedMatrixId={highlightedSlug}
        onSelectMatrix={handleSelectFromMap}
      />

      {/* Grid of Comparative Matrix Cards */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-white">
            Comparative Matrix Catalog
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Showing {filteredMatrices.length} of {matrices.length} peer-reviewed Abrahamic matrices
          </p>
        </div>
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 transition underline underline-offset-2"
          >
            Reset to All 8 Matrices
          </button>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8" aria-label="Comparative matrices">
        {filteredMatrices.map((matrix) => {
          const axisMeta = (matrix.axis && AXIS_LABELS[matrix.axis]) || {
            label: "Theological Matrix",
            bg: "bg-neutral-900 border-neutral-700",
            text: "text-neutral-300",
          };

          return (
            <article
              key={matrix.id}
              id={`matrix-card-${matrix.slug}`}
              onMouseEnter={() => setHighlightedSlug(matrix.slug)}
              onMouseLeave={() => setHighlightedSlug(null)}
              className="flex flex-col justify-between rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition p-6 sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${axisMeta.bg} ${axisMeta.text}`}
                  >
                    {axisMeta.label}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {matrix.slots.length} slots · {matrix.witnesses.length} witnesses
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-medium text-white mb-2">
                  <Link
                    href={`/scriptures/parallels/${matrix.slug}`}
                    className="hover:text-amber-200 transition focus:outline-none focus:underline"
                  >
                    {matrix.title}
                  </Link>
                </h3>
                <p className="text-sm font-serif text-amber-200/70 mb-4">{matrix.subtitle}</p>
                <p className="text-sm text-neutral-400 leading-relaxed mb-6">{matrix.summary}</p>

                {/* Witnesses Pill Row */}
                <div className="space-y-2 mb-6">
                  <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                    Textual Witnesses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matrix.witnesses.map((w) => (
                      <span
                        key={w.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <strong>{w.shortTitle}</strong>
                        <span className="text-neutral-500 text-[10px]">
                          ({w.dates.composition?.split("(")[0].trim()})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-500">
                  SHA: {matrix.provenance.reviewedContentHash.slice(0, 8)}…
                </span>
                <Link
                  href={`/scriptures/parallels/${matrix.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium transition"
                >
                  <span>Explore Slot-Diff</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
