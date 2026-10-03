"use client";

import { SEMANTIC_DOWNLOAD_NOTICE } from "@/lib/scriptures/semantic-model";

import { useState, useCallback, useEffect, useId } from "react";
import { useSemanticRequest } from "@/lib/use-semantic-request";
import { isAbortError } from "@/lib/scriptures/cancellation";
import Link from "next/link";
import {
  HORIZONS,
  HORIZON_ORDER,
  RESONANCE_SPARKS,
  searchOmniResonance,
  type HorizonId,
  type OmniResonanceResult,
  type ResonanceSpark,
} from "@/lib/semantic-resonance";
import {
  hasOptedIntoMeaningSearch,
  rememberMeaningSearchOptIn,
} from "@/lib/semantic-opt-in";

export default function ResonanceRadar({
  initialQuery = "",
  standalone = false,
  search = searchOmniResonance,
}: {
  initialQuery?: string;
  standalone?: boolean;
  search?: typeof searchOmniResonance;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<OmniResonanceResult | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<HorizonId | "all">("all");
  const inputId = useId();
  const { begin, cancel } = useSemanticRequest();

  const runSearch = useCallback((q: string, explicit = true) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const request = begin();
    if (explicit) rememberMeaningSearchOptIn();
    setPhase("loading");
    setStatus("Preparing semantic vector engine…");
    setActiveQuery(trimmed);

    search(trimmed, {
      signal: request.signal,
      onProgress: (msg) => { if (request.current()) setStatus(msg); },
      limitPerHorizon: 4,
    })
      .then((res) => {
        if (!request.current()) return;
        setResult(res);
        setSelectedHorizon("all");
        setPhase("done");
      })
      .catch((err) => {
        if (!request.current() || isAbortError(err)) return;
        console.error("Omni resonance search error:", err);
        setPhase("error");
      });
  }, [begin, search]);

  // Deep links preserve the reader's existing download preference.
  useEffect(() => {
    if (initialQuery && hasOptedIntoMeaningSearch()) runSearch(initialQuery, false);
    return cancel;
  }, [initialQuery, runSearch, cancel]);

  const handleSparkClick = (spark: ResonanceSpark) => {
    setQuery(spark.query);
    runSearch(spark.query);
  };

  const currentHorizonData =
    result && selectedHorizon !== "all"
      ? result.horizons.find((h) => h.id === selectedHorizon)
      : null;

  return (
    <section
      className={`scr-resonance-matrix ${standalone ? "scr-resonance-standalone" : ""}`}
      aria-label="Omni-Corpus Conceptual Resonance Matrix"
    >
      <div className="scr-resonance-header">
        <div className="scr-resonance-titles">
          <span className="scr-resonance-kicker">Corpus Comparison Radar</span>
          <h2 className="scr-resonance-title">Omni-Corpus Conceptual Resonance</h2>
          <p className="scr-resonance-lead">
            Explore similar wording across {HORIZON_ORDER.length} corpus groups, including
            complete Gospel chapters, additional Scripture books, early texts, and
            editorial descriptions of religious frameworks. Open each result to examine its source.
          </p>
        </div>

        {/* Custom Concept Input */}
        <form
          className="scr-resonance-form"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Search conceptual theme across corpus groups
          </label>
          <div className="scr-resonance-input-wrap">
            <input
              id={inputId}
              type="text"
              className="scr-resonance-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter concept (e.g. living water, divine council, scapegoat, hades)…"
            />
            <button
              type="submit"
              className="scr-btn scr-resonance-submit"
              disabled={phase === "loading"}
            >
              {phase === "loading" ? "Tracing…" : "Compute Resonance"}
            </button>
          </div>
        </form>

        {/* Curated Sparks */}
        <div className="scr-resonance-sparks" aria-label="Conceptual spark presets">
          <span className="scr-resonance-sparks-label">Iconic Concepts:</span>
          <div className="scr-resonance-spark-chips">
            {RESONANCE_SPARKS.map((spark) => (
              <button
                key={spark.label}
                type="button"
                className={`scr-spark-chip ${activeQuery === spark.query ? "is-active" : ""}`}
                onClick={() => handleSparkClick(spark)}
                title={spark.blurb}
              >
                {spark.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {phase === "loading" && (
        <div className="scr-resonance-status" role="status" aria-live="polite">
          <div className="scr-resonance-spinner" aria-hidden="true" />
          <p>{status || "Computing cross-horizon resonance…"}</p>
        </div>
      )}

      {phase === "error" && (
        <div className="scr-resonance-error" role="alert">
          <p>
            Unable to compute resonance. Please check your connection or try again.
          </p>
        </div>
      )}

      {phase === "idle" && (
        <div className="scr-resonance-empty-state">
          <p>
            Select one of the iconic concepts above or enter any biblical, theological,
            or classical theme to compare the indexed corpus groups. {SEMANTIC_DOWNLOAD_NOTICE}
          </p>
        </div>
      )}

      {/* Results Matrix */}
      {phase === "done" && result && (
        <div className="scr-resonance-content">
          {/* Active Query Meta */}
          <div className="scr-resonance-meta-bar">
            <span>
              Resonance for <strong>&ldquo;{activeQuery}&rdquo;</strong>
            </span>
            <span className="scr-resonance-epicenter">
              {result.peakHorizon ? <>Highest raw score: <strong>{HORIZONS[result.peakHorizon].name}</strong></> : "No positive raw scores found"}
            </span>
          </div>

          {/* Relative corpus scores */}
          <div
            className="scr-radar-spectrum"
            role="region"
            aria-label="Relative similarity across corpus groups"
          >
            <div className="scr-radar-bars-grid">
              {result.horizons.map((h) => {
                const isSelected = selectedHorizon === h.id;

                return (
                  <button
                    key={h.id}
                    type="button"
                    className={`scr-radar-col ${isSelected ? "is-selected" : ""}`}
                    onClick={() => setSelectedHorizon(h.id)}
                    aria-pressed={isSelected}
                    title={`${h.name}: ${h.intensityPercent}% of the highest group score`}
                  >
                    <div className="scr-radar-meter-container">
                      <div
                        className="scr-radar-meter-bar"
                        style={{ height: `${h.intensityPercent}%` }}
                      >
                        <span className="scr-radar-meter-val">
                          {h.intensityPercent}%
                        </span>
                      </div>
                    </div>
                    <div className="scr-radar-col-info">
                      <strong className="scr-radar-col-name">{h.name}</strong>
                      <span className="scr-radar-col-era">{h.kicker}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="scr-horizon-desc">
            Bars show each group’s best positive score relative to the highest raw score in this search. Scores across these different kinds of content are not calibrated for comparison.
            Similarity is approximate cosine similarity, not a probability or evidence of quotation,
            influence, or historical development. Chapters, selected verses, translated sections,
            and editorial summaries differ in length and scope; groups also overlap.
          </p>
          <details className="scr-resonance-coverage">
            <summary>Index coverage: {result.coverage.assignedChapters} of {result.coverage.indexedChapters} indexed Scripture chapters assigned</summary>
            <p>The Scripture chapter index uses the World English Bible. The following hosted book IDs are outside this index:</p>
            {result.coverage.unindexedBooks.length ? <ul>
              {result.coverage.unindexedBooks.map((book) => <li key={book.book}>{book.name} ({book.book}): {book.reason}.</li>)}
            </ul> : <p>All hosted book IDs are represented.</p>}
            {result.coverage.excludedChapters.length > 0 && <>
              <p>Indexed chapters excluded from results:</p>
              <ul>{result.coverage.excludedChapters.map((chapter) => <li key={`${chapter.book}.${chapter.chapter}`}>
                {chapter.book} {chapter.chapter}: {chapter.reason}.
              </li>)}</ul>
            </>}
          </details>

          {/* Horizon Selection Filter Chips */}
          <div className="scr-horizon-filter-bar">
            <button
              type="button"
              className={`scr-btn scr-horizon-btn ${
                selectedHorizon === "all" ? "is-active" : ""
              }`}
              onClick={() => setSelectedHorizon("all")}
            >
              Up to 4 per group ({result.allByRelevance.length})
            </button>
            {result.horizons.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`scr-btn scr-horizon-btn ${
                  selectedHorizon === h.id ? "is-active" : ""
                }`}
                onClick={() => setSelectedHorizon(h.id)}
              >
                {h.name} ({h.hits.length})
              </button>
            ))}
          </div>

          {/* Active Horizon Detail View */}
          {selectedHorizon !== "all" && currentHorizonData && (
            <div className="scr-horizon-detail">
              <div className="scr-horizon-detail-header">
                <div>
                  <span className="scr-horizon-kicker">
                    {currentHorizonData.kicker}
                  </span>
                  <h3 className="scr-horizon-heading">{currentHorizonData.name}</h3>
                  <p className="scr-horizon-desc">{currentHorizonData.description}</p>
                </div>
                <div className="scr-horizon-score-badge">
                  <span className="scr-horizon-score-label">Relative score</span>
                  <span className="scr-horizon-score-pct">
                    {currentHorizonData.intensityPercent}%
                  </span>
                </div>
              </div>

              {currentHorizonData.hits.length === 0 ? (
                <p className="scr-empty">No positive similarity in this group.</p>
              ) : (
                <div className="scr-horizon-cards-grid">
                  {currentHorizonData.hits.map((hit) => (
                    <article key={hit.id} className="scr-evidence-card">
                      <div className="scr-evidence-head">
                        <Link
                          href={hit.href}
                          className="scr-evidence-link"
                          prefetch={false}
                        >
                          {hit.label}
                          <span className="scr-evidence-arrow" aria-hidden="true">
                            {" "}
                            →
                          </span>
                        </Link>
                        {hit.sublabel && (
                          <span className="scr-evidence-sub">{hit.sublabel}</span>
                        )}
                      </div>
                      {hit.preview && (
                        <p className="scr-evidence-preview">{hit.preview}</p>
                      )}
                      <div className="scr-evidence-footer">
                        <span className="scr-evidence-score">
                          Similarity: {hit.score.toFixed(3)}
                        </span>
                        <Link
                          href={hit.href}
                          className="scr-evidence-action"
                          prefetch={false}
                        >
                          Open source
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Groups Ranked Side-by-Side View */}
          {selectedHorizon === "all" && (
            <div className="scr-horizon-all-view">
              <h3 className="scr-horizon-heading">Selected Results by Raw Similarity</h3>
              <div className="scr-horizon-cards-grid">
                {result.allByRelevance.map((hit) => (
                  <article key={`${hit.horizonId}-${hit.id}`} className="scr-evidence-card">
                    <div className="scr-evidence-head">
                      <div className="scr-evidence-tags">
                        <span className="scr-evidence-horizon-badge">
                          {hit.horizonName}
                        </span>
                        {hit.sublabel && (
                          <span className="scr-evidence-sub">{hit.sublabel}</span>
                        )}
                      </div>
                      <Link
                        href={hit.href}
                        className="scr-evidence-link"
                        prefetch={false}
                      >
                        {hit.label}
                        <span className="scr-evidence-arrow" aria-hidden="true">
                          {" "}
                          →
                        </span>
                      </Link>
                    </div>
                    {hit.preview && (
                      <p className="scr-evidence-preview">{hit.preview}</p>
                    )}
                    <div className="scr-evidence-footer">
                      <span className="scr-evidence-score">
                        Similarity: {hit.score.toFixed(3)}
                      </span>
                      <Link
                        href={hit.href}
                        className="scr-evidence-action"
                        prefetch={false}
                      >
                        Open source
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
