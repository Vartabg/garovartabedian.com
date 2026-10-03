"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  type BeliefSystem,
  type ComparatorPreset,
  getBereanDossierLayers,
  TRADITION_FAMILY_LABELS,
  formatAntiquityAge,
} from "@/lib/evidence/afterlife";

export function TraditionComparator({
  allBeliefs,
  presets,
  initialTraditionIds,
}: {
  allBeliefs: BeliefSystem[];
  presets: ComparatorPreset[];
  initialTraditionIds: [string, string, string];
}) {
  const [selectedIds, setSelectedIds] = useState<[string, string, string]>(
    initialTraditionIds,
  );
  const [activePreset, setActivePreset] = useState<string | null>(
    presets[0]?.id || null,
  );

  const beliefMap = new Map<string, BeliefSystem>(allBeliefs.map((b) => [b.id, b]));

  const activeTraditions = selectedIds.map((id) => beliefMap.get(id)).filter(Boolean) as BeliefSystem[];

  const handleSelectPreset = (preset: ComparatorPreset) => {
    setSelectedIds(preset.traditionIds);
    setActivePreset(preset.id);
  };

  const handleSlotChange = (index: 0 | 1 | 2, newId: string) => {
    const updated: [string, string, string] = [...selectedIds];
    updated[index] = newId;
    setSelectedIds(updated);
    setActivePreset(null);
  };

  return (
    <div className="hw-comparator-matrix">
      {/* Presets Bar */}
      <section aria-label="Comparative study presets">
        <p style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", margin: "0 0 0.5rem" }}>
          Scholarly Presets
        </p>
        <div className="hw-comparator-presets">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`hw-comparator-preset-btn${activePreset === preset.id ? " is-active" : ""}`}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </section>

      {/* Dropdown Selectors */}
      <div className="hw-comparator-selectors" aria-label="Tradition selectors">
        {[0, 1, 2].map((slotIndex) => {
          const id = selectedIds[slotIndex as 0 | 1 | 2];
          return (
            <div key={slotIndex} className="hw-comparator-select-group">
              <label className="hw-comparator-select-label">
                Tradition {slotIndex + 1}
              </label>
              <select
                value={id}
                onChange={(e) => handleSlotChange(slotIndex as 0 | 1 | 2, e.target.value)}
                className="hw-comparator-select"
              >
                {allBeliefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({formatAntiquityAge(b.tactics.antiquityAge)})
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Synchronized Synoptic Matrix Grid */}
      <div
        className="hw-comparator-grid"
        style={{ "--cols": activeTraditions.length } as React.CSSProperties}
      >
        {activeTraditions.map((belief) => {
          const layers = getBereanDossierLayers(belief);
          const familyLabel = TRADITION_FAMILY_LABELS[belief.taxonomy.family] || belief.taxonomy.family;
          const ageLabel = formatAntiquityAge(belief.tactics.antiquityAge);

          return (
            <div key={belief.id} className="hw-comparator-col">
              {/* Identity & Hero Card */}
              <article className="hw-comparator-card" style={{ padding: "1rem" }}>
                <div style={{ borderRadius: "8px", overflow: "hidden", position: "relative", marginBottom: "0.75rem" }}>
                  <Image
                    src={belief.visualAssets.thumbnail}
                    alt={belief.name}
                    width={480}
                    height={300}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: "rgba(0,0,0,0.75)",
                      color: "#fff",
                    }}
                  >
                    {ageLabel}
                  </span>
                </div>

                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent)" }}>
                  {familyLabel}
                </span>
                <h3 style={{ fontSize: "1.25rem", margin: "0.2rem 0 0.4rem" }}>
                  <Link href={`/evidence/frameworks/${belief.id}`} style={{ color: "var(--ink)", textDecoration: "none" }}>
                    {belief.name} ↗
                  </Link>
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, lineHeight: 1.45 }}>
                  {belief.metadata.origin}
                </p>
              </article>

              {/* Layer 01: Observed */}
              <article className="hw-dossier-layer hw-layer-observed" style={{ margin: 0 }}>
                <div className="hw-dossier-layer-kicker">Layer 01 · Observed (Primary Soil)</div>
                <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.95rem" }}>Key Source Texts</h4>
                <ul style={{ paddingLeft: "1.1rem", margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--ink)" }}>
                  {layers.observed.texts.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>

                <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", textTransform: "uppercase", color: "var(--muted)" }}>
                  Archaeology & Geography
                </h4>
                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--ink)", lineHeight: 1.45 }}>
                  {layers.observed.geography}
                </p>
              </article>

              {/* Layer 02: Inferred */}
              <article className="hw-dossier-layer hw-layer-inferred" style={{ margin: 0 }}>
                <div className="hw-dossier-layer-kicker">Layer 02 · Inferred (Eschatological Structure)</div>
                <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.95rem" }}>Structural Taxonomy</h4>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600 }}>
                  {layers.inferred.structure}
                </p>

                <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", textTransform: "uppercase", color: "var(--muted)" }}>
                  The Soul Journey
                </h4>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.84rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {layers.inferred.journey}
                </p>

                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  {layers.inferred.patterns.map((p, i) => (
                    <span key={i} className="hw-atlas-pattern-tag" style={{ fontSize: "0.72rem" }}>
                      {p}
                    </span>
                  ))}
                </div>
              </article>

              {/* Layer 03: Interpreted */}
              <article className="hw-dossier-layer hw-layer-interpreted" style={{ margin: 0 }}>
                <div className="hw-dossier-layer-kicker">Layer 03 · Interpreted (Doctrine & Meaning)</div>
                <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.95rem" }}>Primary Doctrine</h4>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.88rem", lineHeight: 1.5, color: "var(--ink)", fontStyle: "italic" }}>
                  &ldquo;{layers.interpreted.doctrine}&rdquo;
                </p>

                {layers.interpreted.figures.length > 0 && (
                  <>
                    <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", textTransform: "uppercase", color: "var(--muted)" }}>
                      Guides & Entities
                    </h4>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.84rem", color: "var(--ink)" }}>
                      {layers.interpreted.figures.map((f) => `${f.name} (${f.role})`).join(" · ")}
                    </p>
                  </>
                )}

                <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", textTransform: "uppercase", color: "var(--muted)" }}>
                  Ritual Motifs
                </h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                  {layers.interpreted.motifs.join(" · ")}
                </p>
              </article>

              {/* Layer 04: Stated Limit */}
              <article className="hw-dossier-layer hw-layer-limit" style={{ margin: 0 }}>
                <div className="hw-dossier-layer-kicker">Layer 04 · Stated Limit</div>
                <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5, color: "var(--ink)" }}>
                  {layers.limit}
                </p>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
