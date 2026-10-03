"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  buildNotebookLMDossier,
  DOSSIER_PRESETS,
  type NotebookLMDossier,
  type DossierPreset,
} from "@/lib/site/notebooklm";
import type { Canons } from "@/lib/scriptures/types";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";
import { loadBook, loadOriginalChapter } from "@/lib/scriptures/client";

type Props = {
  canons: Canons;
  initialDossier: NotebookLMDossier;
  initialTarget: string;
};

export default function DossierClient({
  canons,
  initialDossier,
  initialTarget,
}: Props) {
  const [target, setTarget] = useState(initialTarget);
  const [dossier, setDossier] = useState<NotebookLMDossier>(initialDossier);
  const [activeTab, setActiveTab] = useState<"preview" | "markdown" | "audio-prompt">("preview");
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canExport = dossier.sourceWitnessCount > 0;

  const handleSelectPreset = useCallback(
    (preset: DossierPreset) => {
      setTarget(preset.query);
      startTransition(async () => {
        // Check if query is a scripture reference
        const parsed = parseScriptureQueryRef(preset.query, canons);
        const primaryVerses: {
          ref: string;
          original?: string;
          brenton?: string;
          drb?: string;
          kjv?: string;
          web?: string;
        }[] = [];

        if (parsed) {
          try {
            const [origChap, brentonBook, drbBook, kjvBook, webBook] = await Promise.all([
              loadOriginalChapter(parsed.book, parsed.chapter),
              loadBook("brenton", parsed.book).catch(() => null),
              loadBook("drb", parsed.book).catch(() => null),
              loadBook("kjv", parsed.book).catch(() => null),
              loadBook("web", parsed.book).catch(() => null),
            ]);

            const vStart = parsed.verse || 1;
            const vEnd = parsed.endVerse || (parsed.verse ? parsed.verse : 5);

            for (let v = vStart; v <= Math.min(vEnd, vStart + 6); v++) {
              const brentonText = brentonBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const drbText = drbBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const kjvText = kjvBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const webText = webBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const origVerse = origChap?.verses.find((ov) => ov.number === v);
              const origText = origVerse?.words.map((w) => w.text).join(" ");

              if (brentonText || drbText || kjvText || webText || origText) {
                primaryVerses.push({
                  ref: `${canons.books[parsed.book]?.name || parsed.book} ${parsed.chapter}:${v}`,
                  original: origText,
                  brenton: brentonText,
                  drb: drbText,
                  kjv: kjvText,
                  web: webText,
                });
              }
            }
          } catch {
            // Graceful fallback to static collation
          }
        }

        const newDossier = buildNotebookLMDossier({
          target: preset.query,
          canons,
          primaryVerses,
        });
        setDossier(newDossier);
      });
    },
    [canons],
  );

  const handleSearchSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const clean = target.trim();
      if (!clean) return;

      startTransition(async () => {
        const parsed = parseScriptureQueryRef(clean, canons);
        const primaryVerses: {
          ref: string;
          original?: string;
          brenton?: string;
          drb?: string;
          kjv?: string;
          web?: string;
        }[] = [];

        if (parsed) {
          try {
            const [origChap, brentonBook, drbBook, kjvBook, webBook] = await Promise.all([
              loadOriginalChapter(parsed.book, parsed.chapter),
              loadBook("brenton", parsed.book).catch(() => null),
              loadBook("drb", parsed.book).catch(() => null),
              loadBook("kjv", parsed.book).catch(() => null),
              loadBook("web", parsed.book).catch(() => null),
            ]);

            const vStart = parsed.verse || 1;
            const vEnd = parsed.endVerse || (parsed.verse ? parsed.verse : 5);

            for (let v = vStart; v <= Math.min(vEnd, vStart + 6); v++) {
              const brentonText = brentonBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const drbText = drbBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const kjvText = kjvBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const webText = webBook?.chapters[parsed.chapter - 1]?.[v - 1];
              const origVerse = origChap?.verses.find((ov) => ov.number === v);
              const origText = origVerse?.words.map((w) => w.text).join(" ");

              if (brentonText || drbText || kjvText || webText || origText) {
                primaryVerses.push({
                  ref: `${canons.books[parsed.book]?.name || parsed.book} ${parsed.chapter}:${v}`,
                  original: origText,
                  brenton: brentonText,
                  drb: drbText,
                  kjv: kjvText,
                  web: webText,
                });
              }
            }
          } catch {
            // Graceful fallback
          }
        }

        const newDossier = buildNotebookLMDossier({
          target: clean,
          canons,
          primaryVerses,
        });
        setDossier(newDossier);
      });
    },
    [target, canons],
  );

  const handleCopyDossier = () => {
    navigator.clipboard.writeText(dossier.markdown).then(() => {
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2500);
    });
  };

  const handleCopyAudioPrompt = () => {
    navigator.clipboard.writeText(dossier.audioHostPrompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    });
  };

  const handleDownloadDossier = () => {
    const slug = dossier.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const blob = new Blob([dossier.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notebooklm-dossier-${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="scr-dossier" aria-label="Universal NotebookLM Research Dossier Engine">
      {/* 1. Search & Target Input */}
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
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter Scripture passage (e.g. Isaiah 53, Psalm 22) or Patristic concept (e.g. Eucharist, Atonement)..."
            aria-label="Dossier Target Query"
            style={{
              flex: "1 1 20rem",
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "0.375rem",
              padding: "0.625rem 1rem",
              fontSize: "1rem",
              color: "var(--ink)",
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            style={{
              background: "var(--accent-deep)",
              color: "var(--accent-ink)",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              minHeight: "44px",
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            {isPending ? "Collating Witnesses..." : "Generate Dossier"}
          </button>
        </form>

        {/* Preset Quick-Buttons */}
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-ink)", display: "block", marginBottom: "0.375rem" }}>
            Curated Research Presets
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {DOSSIER_PRESETS.map((p) => {
              const isSelected = target.toLowerCase() === p.query.toLowerCase();
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  aria-pressed={isSelected}
                  style={{
                    background: isSelected ? "var(--accent-deep)" : "var(--paper)",
                    color: isSelected ? "var(--accent-ink)" : "var(--ink)",
                    border: "1px solid var(--line)",
                    borderRadius: "1rem",
                    padding: "0.5rem 0.75rem",
                    minHeight: "44px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p.query}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Dossier Control & Action Banner */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "0.5rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
              {dossier.targetType.toUpperCase()}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--muted-ink)", fontWeight: 500 }}>
              {dossier.sourceWitnessCount} named source entries · {dossier.wordCount.toLocaleString()} words
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-deep)",
                background: "rgba(100, 160, 120, 0.12)",
                padding: "0.15rem 0.45rem",
                borderRadius: "0.25rem",
                fontWeight: 600,
              }}
            >
              Hosted editions · Editorial notes labeled
            </span>
          </div>
          <h2 style={{ fontSize: "1.375rem", margin: "0.25rem 0 0", fontFamily: "Cinzel, serif" }}>
            {dossier.title}
          </h2>
          {!canExport && (
            <p role="alert" style={{ margin: "0.35rem 0 0", color: "var(--muted-ink)" }}>
              No hosted source entry resolved for this request. Choose a curated preset or enter a hosted Scripture reference.
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleCopyDossier}
            disabled={!canExport}
            style={{
              background: copiedDossier ? "var(--accent-deep)" : "var(--paper)",
              color: copiedDossier ? "var(--accent-ink)" : "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "0.375rem",
              padding: "0.5rem 0.875rem",
              minHeight: "44px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: canExport ? "pointer" : "not-allowed",
            }}
          >
            {copiedDossier ? "✓ Dossier Copied!" : "Copy Full Dossier (.md)"}
          </button>

          <button
            type="button"
            onClick={handleDownloadDossier}
            disabled={!canExport}
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "0.375rem",
              padding: "0.5rem 0.875rem",
              minHeight: "44px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: canExport ? "pointer" : "not-allowed",
            }}
          >
            Download .md
          </button>

          <button
            type="button"
            onClick={handleCopyAudioPrompt}
            disabled={!canExport}
            style={{
              background: copiedPrompt ? "var(--accent-deep)" : "var(--paper)",
              color: copiedPrompt ? "var(--accent-ink)" : "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "0.375rem",
              padding: "0.5rem 0.875rem",
              minHeight: "44px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: canExport ? "pointer" : "not-allowed",
            }}
          >
            {copiedPrompt ? "✓ Prompt Copied!" : "Copy Audio Host Prompt"}
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

      {/* 3. NotebookLM Workflow Guide Card */}
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: "0.5rem",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          fontSize: "0.875rem",
          lineHeight: 1.6,
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--accent-deep)", display: "block", marginBottom: "0.25rem" }}>
          How to synthesise with Google NotebookLM:
        </span>
        <ol style={{ margin: "0.25rem 0 0 1.25rem", padding: 0 }}>
          <li>
            Click <strong>Copy Full Dossier (.md)</strong> or <strong>Download .md</strong> above.
          </li>
          <li>
            In <a href="https://notebooklm.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-deep)", textDecoration: "underline" }}>Google NotebookLM</a>, create a notebook and upload/paste this dossier as a source document.
          </li>
          <li>
            In NotebookLM&apos;s Studio panel, click <strong>Audio Overview → Customize</strong>, paste the copied <strong>Audio Host Prompt</strong>, and ask the hosts to separate supplied source text from editorial comparison notes.
          </li>
        </ol>
      </div>

      {/* 4. Tab Navigation */}
      <div
        role="group"
        aria-label="Dossier views"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          borderBottom: "1px solid var(--line)",
          marginBottom: "1.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          aria-pressed={activeTab === "preview"}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "preview" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: activeTab === "preview" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            minHeight: "44px",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "preview" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Formatted Preview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("markdown")}
          aria-pressed={activeTab === "markdown"}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "markdown" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: activeTab === "markdown" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            minHeight: "44px",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "markdown" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Raw Markdown (.md)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audio-prompt")}
          aria-pressed={activeTab === "audio-prompt"}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "audio-prompt" ? "2px solid var(--accent-deep)" : "2px solid transparent",
            color: activeTab === "audio-prompt" ? "var(--ink)" : "var(--muted-ink)",
            padding: "0.625rem 1rem",
            minHeight: "44px",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "audio-prompt" ? 700 : 500,
            cursor: "pointer",
          }}
        >
          Audio Overview Prompt
        </button>
      </div>

      {/* 5. Tab Panels */}
      {activeTab === "preview" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "0.5rem",
            padding: "2rem",
            lineHeight: 1.7,
            fontSize: "0.95rem",
          }}
        >
          {/* Executive Summary */}
          <div style={{ marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700 }}>
              Section 1
            </span>
            <h3 style={{ fontSize: "1.25rem", margin: "0.25rem 0 0.75rem", fontFamily: "Cinzel, serif" }}>
              Executive Research Summary
            </h3>
            {dossier.preset ? (
              <div>
                <p style={{ margin: "0 0 1rem" }}>{dossier.preset.summary}</p>
                <div style={{ background: "var(--paper)", padding: "1rem", borderRadius: "0.375rem", borderLeft: "3px solid var(--accent-deep)" }}>
                  <strong style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--accent-deep)" }}>
                    Theological & Historical Significance
                  </strong>
                  <p style={{ margin: 0 }}>{dossier.preset.theologicalSignificance}</p>
                </div>
              </div>
            ) : (
              <p>
                This research worksheet collates named hosted editions and source-attributed early Christian reception notes for <strong>{dossier.title}</strong>.
              </p>
            )}
          </div>

          {/* Critical Textual Divergence */}
          {dossier.preset && (
            <div style={{ marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700 }}>
                Section 2
              </span>
              <h3 style={{ fontSize: "1.25rem", margin: "0.25rem 0 0.75rem", fontFamily: "Cinzel, serif" }}>
                Textual Comparison Notes
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-ink)", margin: "0 0 1rem" }}>
                Key Divergence: Verse {dossier.preset.textualDivergence.verse} · Source Reference: <code>{dossier.preset.textualDivergence.hebrewOrGreekRef}</code>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {dossier.preset.textualDivergence.readingDifferences.map((rd, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      borderRadius: "0.375rem",
                      padding: "0.75rem 1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <strong style={{ color: "var(--accent-deep)" }}>{rd.witness}</strong>
                      <span style={{ fontSize: "0.9rem" }}>{rd.reading}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-ink)" }}>{rd.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patristic Reception Catena */}
          {dossier.catenaEntries.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700 }}>
                Patristic Reception
              </span>
              <h3 style={{ fontSize: "1.25rem", margin: "0.25rem 0 0.75rem", fontFamily: "Cinzel, serif" }}>
                Selected Early Christian Reception
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {dossier.catenaEntries.map((ce) => (
                  <div
                    key={ce.id}
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      borderRadius: "0.375rem",
                      padding: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--accent-deep)" }}>
                        {ce.father} ({ce.date})
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted-ink)" }}>
                        {ce.workTitle} §{ce.section}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted-ink)", margin: "0.25rem 0 0.5rem" }}>
                      Theme: {ce.theologicalTheme} · Linked: {ce.scriptureDisplay}
                    </div>
                    <blockquote
                      style={{
                        margin: "0.5rem 0",
                        padding: "0.5rem 0.75rem",
                        borderLeft: "3px solid var(--line)",
                        fontStyle: "italic",
                        fontSize: "0.9rem",
                        background: "var(--surface)",
                      }}
                    >
                      &ldquo;{ce.excerpt}&rdquo;
                    </blockquote>
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--muted-ink)" }}>
                      <em>Historical Commentary:</em> {ce.commentaryNote}
                    </p>
                    <div style={{ marginTop: "0.5rem" }}>
                      <Link
                        href={ce.href}
                        style={{ fontSize: "0.8rem", color: "var(--accent-deep)", textDecoration: "underline" }}
                      >
                        Read full chapter in Ante-Nicene library →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dialectical Inquiry Prompts */}
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", fontWeight: 700 }}>
              Synthesis
            </span>
            <h3 style={{ fontSize: "1.25rem", margin: "0.25rem 0 0.75rem", fontFamily: "Cinzel, serif" }}>
              Dialectical Inquiry Prompts for NotebookLM Synthesis
            </h3>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "0.375rem", padding: "1rem" }}>
              <ol style={{ margin: "0 0 0 1.25rem", padding: 0 }}>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Textual comparison:</strong> Which differences actually appear among the supplied editions, and which may arise from translation rather than a manuscript variant?
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Translation:</strong> How do the named English translations render key Hebrew or Greek phrases, and where does the supplied evidence leave uncertainty?
                </li>
                <li>
                  <strong>Reception:</strong> How do the selected early Christian passages use this text, and what can their dates and genres establish?
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {activeTab === "markdown" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--muted-ink)" }}>
              Ready to paste directly into Google NotebookLM as a note or source document.
            </span>
            <button
              type="button"
              onClick={handleCopyDossier}
              disabled={!canExport}
              style={{
                background: copiedDossier ? "var(--accent-deep)" : "var(--paper)",
                color: copiedDossier ? "var(--accent-ink)" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.375rem 0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: canExport ? "pointer" : "not-allowed",
              }}
            >
              {copiedDossier ? "✓ Copied!" : "Copy Markdown"}
            </button>
          </div>
          <textarea
            readOnly
            value={dossier.markdown}
            rows={24}
            aria-label="Markdown Dossier Output"
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
                NotebookLM Audio Overview Custom Prompt
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--muted-ink)" }}>
                Paste this into NotebookLM &gt; Audio Overview &gt; Customize to configure the two-host synthetic podcast.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAudioPrompt}
              disabled={!canExport}
              style={{
                background: copiedPrompt ? "var(--accent-deep)" : "var(--paper)",
                color: copiedPrompt ? "var(--accent-ink)" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "0.375rem",
                padding: "0.375rem 0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: canExport ? "pointer" : "not-allowed",
              }}
            >
              {copiedPrompt ? "✓ Copied!" : "Copy Audio Host Prompt"}
            </button>
          </div>
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "0.375rem",
              padding: "1.25rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "var(--ink)",
            }}
          >
            {dossier.audioHostPrompt}
          </div>
        </div>
      )}
    </section>
  );
}
