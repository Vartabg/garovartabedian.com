"use client";

import { useState, useMemo } from "react";
import {
  type SacredDisputation,
  generateDisputationDossier,
} from "@/lib/scriptures/disputation";

type Props = {
  initialDisputations: SacredDisputation[];
};

export default function DisputationClient({ initialDisputations }: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialDisputations[0]?.id ?? "suffering-theodicy");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"collation" | "synthesis" | "dossier" | "audio-prompt">("collation");
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const categories = useMemo(() => {
    return [
      { id: "all", label: "All Disputations" },
      { id: "theodicy", label: "Suffering & Theodicy" },
      { id: "soteriology", label: "Faith & Works" },
      { id: "christology", label: "Christology" },
      { id: "torah", label: "Torah & Law" },
      { id: "eschatology", label: "Eschatology" },
      { id: "sovereignty", label: "Sovereignty & Choice" },
    ];
  }, []);

  const filtered = useMemo(() => {
    return initialDisputations.filter((d) => {
      if (selectedCategory !== "all" && d.thematicCategory !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matches =
          d.title.toLowerCase().includes(q) ||
          d.theologicalQuestion.toLowerCase().includes(q) ||
          d.coreTension.toLowerCase().includes(q) ||
          d.voices.some(
            (v) =>
              v.name.toLowerCase().includes(q) ||
              v.traditionOrAuthor.toLowerCase().includes(q) ||
              v.coreThesis.toLowerCase().includes(q),
          );
        if (!matches) return false;
      }
      return true;
    });
  }, [initialDisputations, selectedCategory, searchQuery]);

  const activeDisputation = useMemo(() => {
    return (
      filtered.find((d) => d.id === selectedId) ||
      filtered[0] ||
      initialDisputations[0]
    );
  }, [filtered, selectedId, initialDisputations]);

  const handleCopyDossier = () => {
    if (!activeDisputation) return;
    const md = generateDisputationDossier(activeDisputation);
    navigator.clipboard.writeText(md).then(() => {
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2500);
    });
  };

  const handleCopyAudioPrompt = () => {
    if (!activeDisputation) return;
    const prompt = `Deep-dive theological debate podcast on the sacred disputation: "${activeDisputation.title}". Central Question: "${activeDisputation.theologicalQuestion}". ${activeDisputation.audioHostRolePrompt.host1Role} ${activeDisputation.audioHostRolePrompt.host2Role} ${activeDisputation.audioHostRolePrompt.inquiryFocus} Every statement must be strictly grounded in the provided source text without inventing modern dogmas.`;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    });
  };

  const handleDownloadDossier = () => {
    if (!activeDisputation) return;
    const md = generateDisputationDossier(activeDisputation);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sacred-disputation-${activeDisputation.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="scr-disputation" aria-label="The Polyphonic Sacred Disputation Engine">
      {/* 1. Filter Bar & Disputation Selector */}
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
              The Great Dialectical Debates
            </span>
            <div style={{ fontSize: "0.9rem", color: "var(--muted-ink)" }}>
              Explore how Scripture and tradition hold profound theological tensions in polyphonic harmony.
            </div>
          </div>
          <div style={{ width: "100%", maxWidth: "20rem" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter disputations (e.g. Job, Paul, Torah)..."
              aria-label="Filter sacred disputations"
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

        {/* Category Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: isSelected ? "var(--accent-deep)" : "var(--paper)",
                  color: isSelected ? "var(--accent-ink)" : "var(--ink)",
                  border: "1px solid var(--line)",
                  borderRadius: "1rem",
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Disputation Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(19rem, 1fr))",
            gap: "0.5rem",
          }}
        >
          {filtered.map((d) => {
            const isSelected = d.id === activeDisputation.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
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
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: isSelected ? "var(--accent-ink)" : "var(--muted-ink)" }}>
                  {d.thematicCategory} · {d.voices.length} Voices
                </span>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.3 }}>
                  {d.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Disputation Hero Banner */}
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
              {activeDisputation.thematicCategory.toUpperCase()} · SACRED DISPUTATION
            </span>
            <h2 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0.25rem", fontFamily: "Cinzel, serif" }}>
              {activeDisputation.title}
            </h2>
            <div style={{ fontSize: "1.1rem", fontStyle: "italic", color: "var(--accent-deep)", margin: "0.25rem 0 0" }}>
              &ldquo;{activeDisputation.theologicalQuestion}&rdquo;
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
              {copiedDossier ? "✓ Dossier Copied!" : "Copy Debate Dossier (.md)"}
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
              {copiedPrompt ? "✓ Prompt Copied!" : "Copy Audio Debate Prompt"}
            </button>

            <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "var(--paper)",
                color: "var(--accent-deep)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.5rem 0.875rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              Open NotebookLM ↗
            </a>
          </div>
        </div>

        {/* The Core Tension Callout */}
        <div
          style={{
            background: "var(--paper)",
            borderLeft: "4px solid var(--accent-deep)",
            padding: "1rem 1.25rem",
            borderRadius: "0.375rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
            The Canonical Antinomy & Tension
          </span>
          <div style={{ fontSize: "1rem", color: "var(--ink)", lineHeight: 1.5 }}>
            {activeDisputation.coreTension}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.65, color: "var(--ink)" }}>
          {activeDisputation.summary}
        </p>
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
          onClick={() => setActiveTab("collation")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "collation" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: activeTab === "collation" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "collation" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Dialectical Voice Collation ({activeDisputation.voices.length} Voices)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("synthesis")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "synthesis" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: activeTab === "synthesis" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "synthesis" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Canonical & Patristic Synthesis
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audio-prompt")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "audio-prompt" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: activeTab === "audio-prompt" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "audio-prompt" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Audio Overview Debate Prompt
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dossier")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "dossier" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: activeTab === "dossier" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "dossier" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Raw Dossier (.md)
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === "collation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {activeDisputation.voices.map((voice, idx) => (
            <div
              key={voice.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
              }}
            >
              {/* Voice Header */}
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
                    {voice.name}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.8rem", background: "var(--paper)", border: "1px solid var(--line)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", color: "var(--muted-ink)" }}>
                    {voice.historicalPeriod}
                  </span>
                  <span style={{ fontSize: "0.8rem", background: "var(--gold-soft)", color: "var(--accent-deep)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontWeight: 600 }}>
                    {voice.perspectiveBadge}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--muted-ink)", marginBottom: "0.75rem" }}>
                <strong>Author / Tradition:</strong> {voice.traditionOrAuthor}
              </div>

              {/* Core Thesis */}
              <div
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: "0.375rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                }}
              >
                &ldquo;{voice.coreThesis}&rdquo;
              </div>

              {/* Pastoral Context */}
              <p style={{ fontSize: "0.875rem", color: "var(--muted-ink)", margin: "0 0 1rem" }}>
                <strong>Historical & Pastoral Battleground:</strong> {voice.pastoralContext}
              </p>

              {/* Scriptural Witnesses */}
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                  Primary Scriptural & Patristic Prooftexts:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {voice.scripturalWitnesses.map((w, wIdx) => (
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
                        <span style={{ color: "var(--muted-ink)", fontSize: "0.8rem" }}>{w.exegeticalNote}</span>
                      </div>
                      <blockquote style={{ margin: 0, fontStyle: "italic", color: "var(--ink)" }}>
                        &ldquo;{w.text}&rdquo;
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "synthesis" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "0.5rem",
            padding: "2rem",
            lineHeight: 1.7,
          }}
        >
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700 }}>
            Historical Harmonization
          </span>
          <h3 style={{ fontSize: "1.35rem", margin: "0.25rem 0 1rem", fontFamily: "Cinzel, serif" }}>
            {activeDisputation.historicalSynthesis.title}
          </h3>

          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1rem", color: "var(--accent-deep)", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              How the Church Fathers & Classical Commentators Held the Tension:
            </h4>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>
              {activeDisputation.historicalSynthesis.patristicAndClassicalView}
            </p>
          </div>

          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "0.375rem", padding: "1.25rem" }}>
            <h4 style={{ fontSize: "1rem", color: "var(--accent-deep)", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Why the Canon Preserves Both Horizons:
            </h4>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>
              {activeDisputation.historicalSynthesis.howTheCanonHoldsBoth}
            </p>
          </div>
        </div>
      )}

      {activeTab === "audio-prompt" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.125rem", fontFamily: "Cinzel, serif" }}>
                NotebookLM Two-Host Dialectical Debate Prompt
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--muted-ink)" }}>
                Paste into NotebookLM &gt; Audio Overview &gt; Customize to configure the two hosts into a rigorous scholarly dispute.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAudioPrompt}
              style={{
                background: copiedPrompt ? "var(--accent-deep)" : "var(--paper)",
                color: copiedPrompt ? "var(--accent-ink)" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.375rem 0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copiedPrompt ? "✓ Copied!" : "Copy Debate Prompt"}
            </button>
          </div>

          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "0.375rem",
              padding: "1.25rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div>
              <strong style={{ color: "var(--accent-deep)" }}>Host 1 Role:</strong> {activeDisputation.audioHostRolePrompt.host1Role}
            </div>
            <div>
              <strong style={{ color: "var(--accent-deep)" }}>Host 2 Role:</strong> {activeDisputation.audioHostRolePrompt.host2Role}
            </div>
            <div>
              <strong style={{ color: "var(--accent-deep)" }}>Inquiry Focus:</strong> {activeDisputation.audioHostRolePrompt.inquiryFocus}
            </div>
          </div>
        </div>
      )}

      {activeTab === "dossier" && (
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
              Full source-grounded research dossier ready to paste into Google NotebookLM.
            </span>
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
          </div>
          <textarea
            readOnly
            value={generateDisputationDossier(activeDisputation)}
            rows={22}
            aria-label="Disputation Dossier Output"
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
