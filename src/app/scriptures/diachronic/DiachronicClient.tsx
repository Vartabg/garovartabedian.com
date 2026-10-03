"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  type DiachronicConcept,
  generateDiachronicDossier,
} from "@/lib/scriptures/diachronic";

type Props = {
  initialConcepts: DiachronicConcept[];
};

export default function DiachronicClient({ initialConcepts }: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialConcepts[0]?.id ?? "ruach-spirit");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "matrix" | "dossier">("timeline");
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const filteredConcepts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initialConcepts;
    return initialConcepts.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.hebrewTerm.toLowerCase().includes(q) ||
        c.greekTerm.toLowerCase().includes(q) ||
        c.latinTerm.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.stages.some(
          (s) =>
            s.term.toLowerCase().includes(q) ||
            s.transliteration.toLowerCase().includes(q) ||
            s.theologicalShift.toLowerCase().includes(q),
        ),
    );
  }, [initialConcepts, searchQuery]);

  const activeConcept = useMemo(() => {
    return (
      filteredConcepts.find((c) => c.id === selectedId) ||
      filteredConcepts[0] ||
      initialConcepts[0]
    );
  }, [filteredConcepts, selectedId, initialConcepts]);

  const handleCopyDossier = () => {
    if (!activeConcept) return;
    const md = generateDiachronicDossier(activeConcept);
    navigator.clipboard.writeText(md).then(() => {
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2500);
    });
  };

  const handleCopyAudioPrompt = () => {
    if (!activeConcept) return;
    const prompt = `Deep-dive linguistic theology podcast tracing the 1,500-year evolution of ${activeConcept.title}. Host 1 acts as the Semitic philologist exposing the earthy, dynamic, physical roots of the term in ancient Biblical Hebrew. Host 2 acts as the Hellenistic and Patristic scholar analyzing how translating the concept into Greek philosophy and Latin legalism radically shifted its theological implications for early believers. Ground every statement strictly in the provided dossier.`;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    });
  };

  const handleDownloadDossier = () => {
    if (!activeConcept) return;
    const md = generateDiachronicDossier(activeConcept);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diachronic-evolution-${activeConcept.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="scr-diachronic" aria-label="Diachronic Semantic Evolution Tracker">
      {/* 1. Header Search & Concept Selector Grid */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "0.5rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700 }}>
              Diachronic Lexical Apparatus
            </span>
            <div style={{ fontSize: "0.9rem", color: "var(--muted-ink)" }}>
              Select a core sacred concept to trace its 1,500-year semantic transformation across Hebrew, Greek, and Latin.
            </div>
          </div>
          <div style={{ width: "100%", maxWidth: "20rem" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter concepts (e.g. pneuma, hades, covenant)..."
              aria-label="Filter semantic concepts"
              style={{
                width: "100%",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                color: "var(--ink)",
              }}
            />
          </div>
        </div>

        {/* Concept Pill Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))",
            gap: "0.5rem",
          }}
        >
          {filteredConcepts.map((concept) => {
            const isSelected = concept.id === activeConcept.id;
            return (
              <button
                key={concept.id}
                type="button"
                onClick={() => setSelectedId(concept.id)}
                style={{
                  background: isSelected ? "var(--accent-deep)" : "var(--paper)",
                  color: isSelected ? "var(--accent-ink)" : "var(--ink)",
                  border: isSelected ? "1px solid var(--accent-deep)" : "1px solid var(--line)",
                  borderRadius: "0.375rem",
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.3 }}>
                  {concept.title}
                </span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: isSelected ? "var(--accent-ink)" : "var(--muted-ink)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {concept.hebrewTerm} → {concept.greekTerm}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Concept Hero Banner */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                background: "var(--gold-soft)",
                color: "var(--accent-deep)",
                padding: "0.2rem 0.5rem",
                borderRadius: "0.25rem",
                fontWeight: 700,
              }}
            >
              1,500-YEAR DIACHRONIC MIGRATION
            </span>
            <h2 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0.25rem", fontFamily: "Cinzel, serif" }}>
              {activeConcept.title}
            </h2>
            <div style={{ fontSize: "0.95rem", color: "var(--accent-deep)", fontFamily: "var(--font-mono, monospace)" }}>
              Hebrew: <strong>{activeConcept.hebrewTerm}</strong> · Greek: <strong>{activeConcept.greekTerm}</strong> · Latin: <strong>{activeConcept.latinTerm}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleCopyDossier}
              style={{
                background: copiedDossier ? "var(--accent-deep)" : "var(--paper)",
                color: copiedDossier ? "var(--accent-ink)" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.5rem 0.875rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copiedDossier ? "✓ Dossier Copied!" : "Copy Dossier (.md)"}
            </button>

            <button
              type="button"
              onClick={handleDownloadDossier}
              style={{
                background: "var(--paper)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.5rem 0.875rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Download .md
            </button>

            <button
              type="button"
              onClick={handleCopyAudioPrompt}
              style={{
                background: copiedPrompt ? "var(--accent-deep)" : "var(--paper)",
                color: copiedPrompt ? "var(--accent-ink)" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.5rem 0.875rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {copiedPrompt ? "✓ Prompt Copied!" : "Copy Audio Host Prompt"}
            </button>
          </div>
        </div>

        {/* The Core Paradox Card */}
        <div
          style={{
            background: "var(--paper)",
            borderLeft: "4px solid var(--accent-deep)",
            padding: "1rem 1.25rem",
            borderRadius: "0.375rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
            The Core Semantic Paradox
          </span>
          <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.5 }}>
            &ldquo;{activeConcept.coreParadox}&rdquo;
          </div>
        </div>

        {/* Overview & Why it Matters */}
        <div style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--ink)" }}>
          <p style={{ margin: "0 0 0.75rem" }}>{activeConcept.summary}</p>
          <div style={{ background: "rgba(100, 160, 120, 0.08)", border: "1px solid var(--line)", padding: "0.75rem 1rem", borderRadius: "0.375rem" }}>
            <strong style={{ color: "var(--accent-deep)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Why this translation matters today:
            </strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "var(--ink)" }}>
              {activeConcept.whyItMatters}
            </p>
          </div>
        </div>
      </div>

      {/* 3. View Mode Navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--line)",
          marginBottom: "1.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("timeline")}
          style={{
            background: "none",
            border: "none",
            borderBottom: viewMode === "timeline" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: viewMode === "timeline" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: viewMode === "timeline" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Chronological Evolution Timeline
        </button>

        <button
          type="button"
          onClick={() => setViewMode("matrix")}
          style={{
            background: "none",
            border: "none",
            borderBottom: viewMode === "matrix" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: viewMode === "matrix" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: viewMode === "matrix" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Cross-Linguistic Matrix
        </button>

        <button
          type="button"
          onClick={() => setViewMode("dossier")}
          style={{
            background: "none",
            border: "none",
            borderBottom: viewMode === "dossier" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: viewMode === "dossier" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: viewMode === "dossier" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          NotebookLM Source Dossier
        </button>
      </div>

      {/* 4. Main Views */}
      {viewMode === "timeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {activeConcept.stages.map((stage, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                position: "relative",
              }}
            >
              {/* Stage Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      background: "var(--accent-deep)",
                      color: "var(--accent-ink)",
                      width: "1.75rem",
                      height: "1.75rem",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontFamily: "Cinzel, serif" }}>
                    {stage.era}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", background: "var(--paper)", border: "1px solid var(--line)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", color: "var(--muted-ink)" }}>
                    {stage.century}
                  </span>
                  <span style={{ fontSize: "0.8rem", background: "var(--gold-soft)", color: "var(--accent-deep)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontWeight: 600 }}>
                    {stage.language}
                  </span>
                </div>
              </div>

              {/* Term & Literal Sense Card */}
              <div
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: "0.375rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-ink)", display: "block" }}>
                    Original Term & Transliteration
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono, monospace)" }}>
                    {stage.term} <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--muted-ink)", fontStyle: "italic" }}>({stage.transliteration})</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-ink)", display: "block" }}>
                    Literal Classical Meaning
                  </span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--accent-deep)" }}>
                    &ldquo;{stage.literalMeaning}&rdquo;
                  </span>
                </div>
              </div>

              {/* Theological Transposition */}
              <p style={{ margin: "0 0 1rem", fontSize: "0.95rem", lineHeight: 1.65, color: "var(--ink)" }}>
                {stage.theologicalShift}
              </p>

              {/* Primary Manuscript Witnesses */}
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                  Primary Manuscript Witnesses:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {stage.primaryWitnesses.map((w, wIdx) => (
                    <div
                      key={wIdx}
                      style={{
                        background: "var(--paper)",
                        border: "1px solid var(--line)",
                        borderRadius: "0.375rem",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <strong style={{ color: "var(--accent-deep)" }}>{w.ref}</strong>
                        <span style={{ color: "var(--muted-ink)", fontSize: "0.8rem" }}>{w.historicalContext}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--ink)" }}>
                        {w.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Translation Traps Card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "0.5rem",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", fontFamily: "Cinzel, serif", color: "var(--accent-deep)" }}>
              ⚠️ Modern Translation Traps & Semantic Divergences
            </h3>
            <ul style={{ margin: "0 0 0 1.25rem", padding: 0 }}>
              {activeConcept.divergenceTraps.map((trap, tIdx) => (
                <li key={tIdx} style={{ marginBottom: "0.5rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {trap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {viewMode === "matrix" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)", background: "var(--paper)" }}>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Era & Century</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Language</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Written Term</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Literal Meaning</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Cognitive Shift</th>
              </tr>
            </thead>
            <tbody>
              {activeConcept.stages.map((stage, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                    {stage.era}
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-ink)" }}>{stage.century}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{stage.language}</td>
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-mono, monospace)" }}>
                    <strong>{stage.term}</strong>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted-ink)" }}>{stage.transliteration}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontStyle: "italic" }}>
                    &ldquo;{stage.literalMeaning}&rdquo;
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--muted-ink)", maxWidth: "20rem" }}>
                    {stage.theologicalShift.slice(0, 140)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "dossier" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted-ink)" }}>
              Source-grounded research dossier ready to paste into Google NotebookLM.
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handleCopyDossier}
                style={{
                  background: copiedDossier ? "var(--accent-deep)" : "var(--paper)",
                  color: copiedDossier ? "var(--accent-ink)" : "var(--ink)",
                  border: "1px solid var(--line)",
                  borderRadius: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copiedDossier ? "✓ Copied!" : "Copy Dossier"}
              </button>
              <Link
                href="/scriptures/dossier"
                style={{
                  background: "var(--paper)",
                  color: "var(--accent-deep)",
                  border: "1px solid var(--line)",
                  borderRadius: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Open Full Dossier Engine →
              </Link>
            </div>
          </div>
          <textarea
            readOnly
            value={generateDiachronicDossier(activeConcept)}
            rows={22}
            aria-label="Diachronic Dossier Output"
            style={{
              width: "100%",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "0.375rem",
              padding: "1rem",
              resize: "vertical",
            }}
          />
        </div>
      )}
    </section>
  );
}
