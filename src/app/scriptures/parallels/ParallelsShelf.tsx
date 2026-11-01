"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ParallelMatrix } from "@/lib/parallels/types";
import type { StudyContext } from "@/lib/scriptures/study-context";
import { parallelComparisonHref } from "@/lib/scriptures/parallel-study-url";
import ParallelsTopologyMap, { type FilterCategory } from "./ParallelsTopologyMap";

const AXIS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  "christology": {
    label: "Christology & Incarnation",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
  },
  "atonement": {
    label: "Atonement & Trial",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
  },
  "sin-human-nature": {
    label: "Sin & Human Anthropology",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
  },
  "prophethood": {
    label: "Prophethood & Impeccability",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
  },
  "law-sanctity": {
    label: "Sanctity of Life & Law",
    bg: "parallel-surface parallel-rule",
    text: "parallel-accent",
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
  context,
}: {
  matrices: ParallelMatrix[];
  context?: StudyContext | null;
}) {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  const filteredMatrices = useMemo(() => {
    if (filter === "all") return matrices;
    return matrices.filter((m) => {
      const cats = CATEGORY_MAP[m.slug] || ["all"];
      return cats.includes(filter);
    });
  }, [matrices, filter]);

  return (
    <div>
      {/* Interactive Tradition & Literary Flow Topology Map */}
      <ParallelsTopologyMap
        activeFilter={filter}
        onFilterChange={setFilter}
        highlightedMatrixId={highlightedSlug}
        context={context}
      />

      {/* Grid of Comparative Matrix Cards */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b parallel-rule">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium parallel-ink">
            Choose a comparison
          </h2>
          <p className="text-xs parallel-muted mt-0.5">
            Showing {filteredMatrices.length} of {matrices.length} source comparisons
          </p>
        </div>
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="text-xs font-mono parallel-accent  transition underline underline-offset-2"
          >
            Show all comparisons
          </button>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8" aria-label="Comparative matrices">
        {filteredMatrices.map((matrix) => {
          const axisMeta = (matrix.axis && AXIS_LABELS[matrix.axis]) || {
            label: "Theological Matrix",
            bg: "parallel-panel parallel-rule",
            text: "parallel-muted",
          };

          return (
            <article
              key={matrix.id}
              id={`matrix-card-${matrix.slug}`}
              onMouseEnter={() => setHighlightedSlug(matrix.slug)}
              onMouseLeave={() => setHighlightedSlug(null)}
              className="flex flex-col justify-between rounded-2xl parallel-panel border parallel-rule  transition p-6 sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[.8rem] font-mono border ${axisMeta.bg} ${axisMeta.text}`}
                  >
                    {axisMeta.label}
                  </span>
                  <span className="text-[.8rem] font-mono parallel-muted">
                    {matrix.slots.length} slots · {matrix.witnesses.length} witnesses
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-medium parallel-ink mb-2">
                  <Link
                    href={parallelComparisonHref(matrix.slug, context)}
                    className=" transition focus:outline-none focus:underline"
                  >
                    {matrix.title}
                  </Link>
                </h3>
                <p className="text-sm font-serif parallel-accent mb-4">{matrix.subtitle}</p>
                <p className="text-sm parallel-muted leading-relaxed mb-6">{matrix.summary}</p>

                {/* Witnesses Pill Row */}
                <div className="space-y-2 mb-6">
                  <p className="text-[.8rem] font-mono parallel-muted uppercase tracking-wider">
                    Textual Witnesses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matrix.witnesses.map((w) => (
                      <span
                        key={w.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg parallel-panel border parallel-rule text-xs parallel-muted"
                      >
                        <span className="w-1.5 h-1.5 rounded-full parallel-surface" />
                        <strong>{w.shortTitle}</strong>
                        <span className="parallel-muted text-[.75rem]">
                          ({w.dates.composition?.split("(")[0].trim()})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t parallel-rule flex items-center justify-between">
                <span className="text-xs font-mono parallel-muted">
                  Review: {matrix.provenance.reviewStatus.replaceAll("-", " ")}
                </span>
                <Link
                  href={parallelComparisonHref(matrix.slug, context)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl parallel-surface  border parallel-rule parallel-accent text-xs font-mono font-medium transition"
                >
                  <span>Open comparison</span>
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
