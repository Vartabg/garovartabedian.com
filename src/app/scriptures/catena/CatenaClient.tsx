"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  generateCatenaDossier,
  type CatenaCentury,
  type CatenaEntry,
} from "@/lib/scriptures/catena";

type Props = {
  initialEntries: CatenaEntry[];
};

const THEMES = [
  "All",
  "Atonement",
  "Eucharist",
  "The Logos",
  "Faith & Works",
  "Creation & Imago Dei",
  "The Lord's Prayer",
] as const;

export default function CatenaClient({ initialEntries }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCentury, setSelectedCentury] = useState<"all" | CatenaCentury>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("All");
  const [copiedDossier, setCopiedDossier] = useState(false);

  const filtered = useMemo(() => {
    return initialEntries.filter((entry) => {
      if (selectedCentury !== "all" && entry.century !== selectedCentury) {
        return false;
      }

      if (selectedTheme !== "All") {
        const themeLower = selectedTheme.toLowerCase();
        if (!entry.theologicalTheme.toLowerCase().includes(themeLower)) {
          return false;
        }
      }

      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const matches =
          entry.scriptureDisplay.toLowerCase().includes(q) ||
          entry.father.toLowerCase().includes(q) ||
          entry.workTitle.toLowerCase().includes(q) ||
          entry.theologicalTheme.toLowerCase().includes(q) ||
          entry.excerpt.toLowerCase().includes(q) ||
          entry.commentaryNote.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [initialEntries, query, selectedCentury, selectedTheme]);

  const handleExportDossier = () => {
    const targetLabel =
      selectedTheme !== "All"
        ? `${selectedTheme} in Early Church Reception`
        : query.trim()
          ? `“${query.trim()}” Patristic Witnesses`
          : "Ante-Nicene Patristic Reception";

    const dossier = generateCatenaDossier({
      target: targetLabel,
      entries: filtered,
    });

    navigator.clipboard.writeText(dossier).then(() => {
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 3000);
    });
  };

  return (
    <section className="scr-catena" aria-label="Catena Aurea Patristic Apparatus">
      {/* 1. Header Controls & Search Bar */}
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
              Search the Golden Chain
            </span>
            <div style={{ fontSize: "0.9rem", color: "var(--muted-ink)" }}>
              Filter by Scripture verse (e.g. <em>Isaiah 53</em>, <em>John 1</em>), Church Father, or theological concept.
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportDossier}
            style={{
              fontSize: "0.85rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "0.25rem",
              border: "1px solid var(--accent)",
              background: copiedDossier ? "#2e7d32" : "var(--accent-deep)",
              color: copiedDossier ? "#fff" : "var(--accent-ink)",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            {copiedDossier ? "✓ Dossier Copied!" : "Export for NotebookLM"}
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter verses or fathers (e.g. Isaiah 53, Didache, Clement, Eucharist, Justification)..."
          style={{
            width: "100%",
            padding: "0.6rem 0.9rem",
            borderRadius: "0.35rem",
            border: "1px solid var(--line)",
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: "1rem",
            fontFamily: "inherit",
          }}
        />

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          {/* Theme chips */}
          <div role="group" aria-label="Reception themes" style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted-ink)", marginRight: "0.25rem" }}>
              Theme:
            </span>
            {THEMES.map((theme) => {
              const isSelected = selectedTheme === theme;
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setSelectedTheme(theme)}
                  aria-pressed={isSelected}
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.5rem 0.65rem",
                    minHeight: "44px",
                    borderRadius: "9999px",
                    border: isSelected ? "1px solid var(--accent)" : "1px solid var(--line)",
                    background: isSelected ? "var(--accent)" : "transparent",
                    color: isSelected ? "var(--accent-ink)" : "var(--ink)",
                    cursor: "pointer",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {theme}
                </button>
              );
            })}
          </div>

          {/* Century buttons */}
          <div role="group" aria-label="Approximate date groups" style={{ display: "flex", flexWrap: "wrap", border: "1px solid var(--line)", borderRadius: "0.25rem", overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setSelectedCentury("all")}
              aria-pressed={selectedCentury === "all"}
              style={{
                fontSize: "0.78rem",
                padding: "0.5rem 0.65rem",
                minHeight: "44px",
                border: "none",
                background: selectedCentury === "all" ? "var(--accent)" : "transparent",
                color: selectedCentury === "all" ? "var(--accent-ink)" : "var(--ink)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              All Eras
            </button>
            <button
              type="button"
              onClick={() => setSelectedCentury("1st Century")}
              aria-pressed={selectedCentury === "1st Century"}
              style={{
                fontSize: "0.78rem",
                padding: "0.5rem 0.65rem",
                minHeight: "44px",
                border: "none",
                background: selectedCentury === "1st Century" ? "var(--accent)" : "transparent",
                color: selectedCentury === "1st Century" ? "var(--accent-ink)" : "var(--ink)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              1st-century entries
            </button>
            <button
              type="button"
              onClick={() => setSelectedCentury("1st–2nd Century")}
              aria-pressed={selectedCentury === "1st–2nd Century"}
              style={{
                fontSize: "0.78rem",
                padding: "0.5rem 0.65rem",
                minHeight: "44px",
                border: "none",
                background: selectedCentury === "1st–2nd Century" ? "var(--accent)" : "transparent",
                color: selectedCentury === "1st–2nd Century" ? "var(--accent-ink)" : "var(--ink)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Dates spanning both
            </button>
            <button
              type="button"
              onClick={() => setSelectedCentury("2nd Century")}
              aria-pressed={selectedCentury === "2nd Century"}
              style={{
                fontSize: "0.78rem",
                padding: "0.5rem 0.65rem",
                minHeight: "44px",
                border: "none",
                background: selectedCentury === "2nd Century" ? "var(--accent)" : "transparent",
                color: selectedCentury === "2nd Century" ? "var(--accent-ink)" : "var(--ink)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              2nd-century entries
            </button>
          </div>
        </div>
      </div>

      {/* 2. Results Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--muted-ink)", fontWeight: 600 }}>
          Showing {filtered.length} of {initialEntries.length} patristic reception links
        </span>
      </div>

      {/* 3. Reception Chain List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {filtered.map((entry) => (
          <article
            key={entry.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              position: "relative",
            }}
          >
            {/* Header: Scripture Reference & Church Father */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "0.75rem",
                borderBottom: "1px solid var(--line)",
                paddingBottom: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: "rgba(118, 84, 22, 0.1)",
                    color: "var(--accent-deep)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "0.2rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  {entry.theologicalTheme}
                </span>
                <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "1.3rem", margin: 0, color: "var(--accent-deep)" }}>
                  {entry.scriptureDisplay}
                </h2>
              </div>

              <div style={{ textAlign: "right" }}>
                <strong style={{ fontSize: "1rem", display: "block" }}>{entry.father}</strong>
                <span style={{ fontSize: "0.82rem", color: "var(--muted-ink)" }}>
                  {entry.workTitle} (§{entry.section}) · <em>{entry.date}</em>
                </span>
              </div>
            </div>

            {/* Verbatim Excerpt */}
            <div
              style={{
                background: "rgba(0,0,0,0.02)",
                borderLeft: "3px solid var(--accent)",
                padding: "1rem 1.25rem",
                borderRadius: "0 0.35rem 0.35rem 0",
                marginBottom: "1rem",
                fontSize: "1.05rem",
                lineHeight: 1.65,
                fontStyle: "italic",
              }}
            >
              &ldquo;{entry.excerpt}&rdquo;
            </div>

            {/* Historical Commentary & Context */}
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.92rem", lineHeight: 1.55, color: "var(--ink)" }}>
              {entry.commentaryNote}
            </p>

            {/* Footnote Links */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--muted-ink)" }}>
                Witness Role: <strong>{entry.fatherRole}</strong>
              </span>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {entry.investigationHref && (
                  <Link href={entry.investigationHref} className="textlink">
                    Inspect evidence and source checks →
                  </Link>
                )}
                <Link
                  href={entry.href}
                  className="textlink"
                  style={{ fontWeight: 600, color: "var(--accent)" }}
                >
                  Read in {entry.workTitle} §{entry.section} →
                </Link>
                <Link
                  href={`/scriptures/protestant/${entry.book}/${entry.chapter}#v${entry.verse}`}
                  className="textlink"
                  style={{ color: "var(--muted-ink)" }}
                >
                  Open Verse in Reader ↗
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
