"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TRADITION_FAMILIES,
  TRADITION_FAMILY_LABELS,
  AFTERLIFE_PATTERNS,
  AFTERLIFE_PATTERN_LABELS,
  formatAntiquityAge,
  type AfterlifeCardSummary,
  type TraditionFamily,
  type AfterlifePattern,
} from "@/lib/evidence/afterlife";
import { searchCorpus, type AfterlifeEntry } from "@/lib/semantic-corpus";
import { rememberMeaningSearchOptIn } from "@/lib/semantic-opt-in";
import { useSemanticRequest } from "@/lib/use-semantic-request";
import { isAbortError } from "@/lib/scriptures/cancellation";

export function AfterlifeExplorer({
  initialBeliefs,
  initialFamily,
  search = searchCorpus<AfterlifeEntry>,
}: {
  initialBeliefs: AfterlifeCardSummary[];
  initialFamily?: TraditionFamily;
  search?: typeof searchCorpus<AfterlifeEntry>;
}) {
  const { begin, cancel } = useSemanticRequest();
  const [query, setQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<TraditionFamily | "all">(
    initialFamily || "all",
  );
  const [selectedPattern, setSelectedPattern] = useState<AfterlifePattern | "all">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<"antiquity" | "name">("antiquity");
  const [semanticActive, setSemanticActive] = useState(false);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticStatus, setSemanticStatus] = useState("");
  const [semanticScores, setSemanticScores] = useState<Record<string, number>>({});
  const resetSemantic = useCallback(() => {
    cancel();
    setSemanticScores({});
    setSemanticActive(false);
    setSemanticLoading(false);
    setSemanticStatus("");
  }, [cancel]);

  const runSemantic = useCallback((searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      resetSemantic();
      return;
    }
    const request = begin();
    rememberMeaningSearchOptIn();
    setSemanticActive(true);
    setSemanticLoading(true);
    setSemanticStatus("Loading vector model…");
    search("afterlife", q, {
      limit: 54,
      minScore: 0.12,
      signal: request.signal,
      onProgress: status => { if (request.current()) setSemanticStatus(status); },
    })
      .then((res) => {
        if (!request.current()) return;
        const scores: Record<string, number> = {};
        for (const h of res.hits) {
          scores[h.entry.parentId ?? h.entry.id] = h.score;
        }
        setSemanticScores(scores);
        setSemanticLoading(false);
      })
      .catch(error => {
        if (!request.current() || isAbortError(error)) return;
        setSemanticLoading(false);
      });
  }, [begin, resetSemantic, search]);

  // Clear semantic mode if query is cleared
  useEffect(() => {
    if (!query.trim() && semanticActive) {
      resetSemantic();
    }
  }, [query, semanticActive, resetSemantic]);

  const filteredBeliefs = useMemo(() => {
    const list = initialBeliefs.filter((b) => {
      // Family filter
      if (selectedFamily !== "all" && b.family !== selectedFamily) {
        return false;
      }
      // Pattern filter
      if (
        selectedPattern !== "all" &&
        !b.patterns.includes(selectedPattern)
      ) {
        return false;
      }
      if (semanticActive) {
        return (semanticScores[b.id] ?? 0) > 0;
      }
      // Search query filter
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesDesc = b.description.toLowerCase().includes(q);
        const matchesOrigin = b.origin.toLowerCase().includes(q);
        const matchesSearchText = b.searchText.toLowerCase().includes(q);

        if (!matchesName && !matchesDesc && !matchesOrigin && !matchesSearchText) {
          return false;
        }
      }
      return true;
    });

    if (semanticActive) {
      return [...list].sort((a, b) => (semanticScores[b.id] ?? 0) - (semanticScores[a.id] ?? 0));
    }

    return [...list].sort((a, b) => {
      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.antiquityAge - b.antiquityAge;
    });
  }, [initialBeliefs, query, selectedFamily, selectedPattern, sortOrder, semanticActive, semanticScores]);

  return (
    <div className="hw-atlas-interactive">
      {/* Search, comparison link, and control bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "1.5rem 0",
          padding: "1rem",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
        }}
      >
        <div style={{ flex: "1 1 300px", display: "flex", gap: "0.5rem" }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                e.preventDefault();
                runSemantic(query);
              }
            }}
            placeholder="Search motifs, deities, river of forgetfulness, scales..."
            aria-label="Search traditions"
            style={{
              flex: 1,
              padding: "0.5rem 0.85rem",
              fontSize: "0.9rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--bg)",
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (semanticActive) {
                resetSemantic();
              } else if (query.trim()) {
                runSemantic(query);
              }
            }}
            style={{
              padding: "0.5rem 0.85rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: semanticActive ? "var(--accent)" : "var(--surface)",
              color: semanticActive ? "var(--bg)" : "var(--ink)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {semanticLoading
              ? "Ranking…"
              : semanticActive
                ? "Reset Meaning Mode"
                : "Vector Search"}
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)" }}>
            Pattern:
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value as AfterlifePattern | "all")}
              style={{
                marginLeft: "0.35rem",
                padding: "0.35rem 0.6rem",
                fontSize: "0.8rem",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--bg)",
                color: "var(--ink)",
              }}
            >
              <option value="all">All Eschatological Patterns</option>
              {AFTERLIFE_PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {AFTERLIFE_PATTERN_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)" }}>
            Sort:
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "antiquity" | "name")}
              style={{
                marginLeft: "0.35rem",
                padding: "0.35rem 0.6rem",
                fontSize: "0.8rem",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--bg)",
                color: "var(--ink)",
              }}
            >
              <option value="antiquity">Chronological (Oldest First)</option>
              <option value="name">Alphabetical</option>
            </select>
          </label>

          <Link
            href="/evidence/frameworks/compare"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              borderRadius: "6px",
              background: "var(--accent)",
              color: "var(--bg)",
              textDecoration: "none",
            }}
          >
            Compare Matrix ↗
          </Link>
        </div>
      </div>

      {/* Tradition Family Tabs */}
      <nav className="hw-atlas-filters" aria-label="Tradition family filters">
        <button
          type="button"
          onClick={() => setSelectedFamily("all")}
          className={`hw-atlas-filter-btn${selectedFamily === "all" ? " is-active" : ""}`}
        >
          All Traditions ({initialBeliefs.length})
        </button>
        {TRADITION_FAMILIES.map((fam) => {
          const count = initialBeliefs.filter((b) => b.family === fam).length;
          if (count === 0) return null;
          const isActive = selectedFamily === fam;
          return (
            <button
              key={fam}
              type="button"
              onClick={() => setSelectedFamily(fam)}
              className={`hw-atlas-filter-btn${isActive ? " is-active" : ""}`}
            >
              {TRADITION_FAMILY_LABELS[fam]} ({count})
            </button>
          );
        })}
      </nav>

      {/* Results Count & Semantic Status */}
      <div style={{ margin: "1rem 0", fontSize: "0.85rem", color: "var(--muted)" }}>
        {semanticLoading ? (
          <span style={{ color: "var(--accent)" }}>{semanticStatus || "Ranking 54 traditions in vector space…"}</span>
        ) : (
          <>
            Showing <strong>{filteredBeliefs.length}</strong> of {initialBeliefs.length} traditions
            {semanticActive
              ? ` ranked by vector similarity to "${query}"`
              : query
                ? ` matching "${query}"`
                : ""}
          </>
        )}
      </div>

      {/* Grid */}
      <div className="hw-atlas-grid">
        {filteredBeliefs.map((belief) => {
          const familyLabel = TRADITION_FAMILY_LABELS[belief.family] || belief.family;
          const ageLabel = formatAntiquityAge(belief.antiquityAge);
          const score = semanticScores[belief.id];

          return (
            <article key={belief.id} className="hw-atlas-card">
              <div className="hw-atlas-media">
                <Image
                  src={belief.thumbnail}
                  alt={belief.name}
                  width={480}
                  height={300}
                  className="hw-atlas-img"
                />
                <span className="hw-atlas-family-pill">{familyLabel}</span>
                {semanticActive && score !== undefined ? (
                  <span
                    className="hw-atlas-age-pill"
                    style={{
                      background: "var(--accent)",
                      color: "var(--bg)",
                      fontWeight: 700,
                    }}
                  >
                    sim {score.toFixed(2)}
                  </span>
                ) : (
                  <span className="hw-atlas-age-pill">{ageLabel}</span>
                )}
              </div>

              <div className="hw-atlas-body">
                <h3 style={{ fontSize: "1.15rem", margin: "0 0 0.4rem" }}>
                  <Link href={`/evidence/frameworks/${belief.id}`}>
                    {belief.name}
                  </Link>
                </h3>
                <p className="hw-atlas-desc">{belief.description}</p>

                <div className="hw-atlas-patterns">
                  {belief.patterns.map((pat) => (
                    <span key={pat} className="hw-atlas-pattern-tag">
                      {AFTERLIFE_PATTERN_LABELS[pat] || pat}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
