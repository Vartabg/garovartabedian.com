"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  HEXAPLA_WITNESSES,
  HEXAPLA_PRESETS,
  alignPolyglotVerses,
  generateHexaplaDossier,
  type HexaplaPreset,
  type PolyglotAlignedVerse,
  type PolyglotWitnessId,
} from "@/lib/scriptures/polyglot";
import type { BookMeta, OriginalEditionId, OriginalWord } from "@/lib/scriptures/types";
import { loadBook, loadOriginalChapter } from "@/lib/scriptures/client";
import { describeOriginalWord } from "@/lib/scriptures/morphology";

type Props = {
  initialPreset: HexaplaPreset;
  initialAligned: PolyglotAlignedVerse[];
  bookOrder: string[];
  booksMeta: Record<string, BookMeta>;
};

const LANGUAGE_NAMES: Record<string, string> = {
  hebrew: "Hebrew",
  aramaic: "Aramaic",
  greek: "Greek",
};

type HistoricPsalmLocation = {
  chapter: number;
  leadingItems: number;
};

// This mirrors the server loader. Only passages verified against the hosted
// Brenton and Douay-Rheims files belong here; the combined and divided Psalms
// cannot be represented by a universal minus-one rule.
const HISTORIC_PSALM_LOCATIONS: Partial<Record<number, HistoricPsalmLocation>> = {
  22: { chapter: 21, leadingItems: 1 },
  110: { chapter: 109, leadingItems: 0 },
};

export function selectHistoricPsalmVerses(
  chapters: string[][] | undefined,
  book: string,
  hebrewChapter: number,
): string[] | null {
  const location = book === "PSA" ? HISTORIC_PSALM_LOCATIONS[hebrewChapter] : undefined;
  const verses = chapters?.[(location?.chapter ?? hebrewChapter) - 1] ?? null;

  return verses && location?.leadingItems
    ? verses.slice(location.leadingItems)
    : verses;
}

export default function PolyglotClient({
  initialPreset,
  initialAligned,
  bookOrder,
  booksMeta,
}: Props) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset.id);
  const [currentBook, setCurrentBook] = useState<string>(initialPreset.book);
  const [currentChapter, setCurrentChapter] = useState<number>(initialPreset.chapter);
  const [alignedVerses, setAlignedVerses] = useState<PolyglotAlignedVerse[]>(initialAligned);
  const [layoutMode, setLayoutMode] = useState<"interlinear" | "columns">("interlinear");
  const [visibleWitnesses, setVisibleWitnesses] = useState<Set<PolyglotWitnessId>>(
    new Set(["original", "brenton", "drb", "kjv", "web"]),
  );
  const [activeDivergence, setActiveDivergence] = useState<HexaplaPreset["textualDivergence"] | null>(
    initialPreset.textualDivergence,
  );
  const [selectedWord, setSelectedWord] = useState<{
    word: OriginalWord;
    edition: OriginalEditionId;
    verseNum: number;
  } | null>(null);
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleWitness = (id: PolyglotWitnessId) => {
    const next = new Set(visibleWitnesses);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setVisibleWitnesses(next);
  };

  const loadPassage = useCallback(
    (
      bookId: string,
      chapNum: number,
      start: number,
      end: number,
      divergence: HexaplaPreset["textualDivergence"] | null,
    ) => {
      startTransition(async () => {
        setSelectedWord(null);
        try {
          const [orig, brentonBook, drbBook, kjvBook, webBook] = await Promise.all([
            loadOriginalChapter(bookId, chapNum),
            loadBook("brenton", bookId).catch(() => null),
            loadBook("drb", bookId).catch(() => null),
            loadBook("kjv", bookId).catch(() => null),
            loadBook("web", bookId).catch(() => null),
          ]);

          const brentonVerses = selectHistoricPsalmVerses(
            brentonBook?.chapters,
            bookId,
            chapNum,
          );
          const drbVerses = selectHistoricPsalmVerses(
            drbBook?.chapters,
            bookId,
            chapNum,
          );
          const kjvVerses = kjvBook?.chapters[chapNum - 1] ?? null;
          const webVerses = webBook?.chapters[chapNum - 1] ?? null;

          const aligned = alignPolyglotVerses({
            originalChapter: orig,
            brentonVerses,
            drbVerses,
            kjvVerses,
            webVerses,
            startVerse: start,
            endVerse: end,
            presetDivergence: divergence,
          });

          setAlignedVerses(aligned);
          setCurrentBook(bookId);
          setCurrentChapter(chapNum);
          setActiveDivergence(divergence);
        } catch {
          // Keep current view on error
        }
      });
    },
    [],
  );

  const handleSelectPreset = (preset: HexaplaPreset) => {
    setSelectedPresetId(preset.id);
    loadPassage(
      preset.book,
      preset.chapter,
      preset.startVerse,
      preset.endVerse,
      preset.textualDivergence,
    );
  };

  const handleCustomBookChange = (bookId: string) => {
    setSelectedPresetId("custom");
    loadPassage(bookId, 1, 1, 200, null);
  };

  const handleCustomChapterChange = (chapNum: number) => {
    setSelectedPresetId("custom");
    loadPassage(currentBook, chapNum, 1, 200, null);
  };

  const handleExportDossier = () => {
    const currentPreset = HEXAPLA_PRESETS.find((p) => p.id === selectedPresetId);
    const dossierText = generateHexaplaDossier({
      book: currentBook,
      bookName: booksMeta[currentBook]?.name || currentBook,
      chapter: currentChapter,
      verses: alignedVerses,
      preset: currentPreset,
    });

    navigator.clipboard.writeText(dossierText).then(() => {
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 3000);
    });
  };

  const currentMeta = booksMeta[currentBook];
  const maxChapters = currentMeta?.chapters || 1;
  const currentPreset = HEXAPLA_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <section className="scr-polyglot" aria-label="Digital Polyglot Apparatus">
      {/* 1. Landmark Theological Presets */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "0.5rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-deep)", margin: 0, fontWeight: 700 }}>
            Landmark Divergence Presets
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--muted-ink)" }}>
            10 Classical Textual Crossroads
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {HEXAPLA_PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelectPreset(p)}
                style={{
                  fontSize: "0.85rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "9999px",
                  border: isSelected ? "1px solid var(--accent)" : "1px solid var(--line)",
                  background: isSelected ? "var(--accent)" : "transparent",
                  color: isSelected ? "var(--accent-ink)" : "var(--ink)",
                  cursor: "pointer",
                  fontWeight: isSelected ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {p.title.split(" — ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls & Apparatus Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 1.25rem",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Book & Chapter Pickers */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-deep)" }}>
            Book:
            <select
              value={currentBook}
              onChange={(e) => handleCustomBookChange(e.target.value)}
              style={{
                marginLeft: "0.4rem",
                padding: "0.3rem 0.6rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--line)",
                background: "var(--bg)",
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            >
              {bookOrder.map((b) => (
                <option key={b} value={b}>
                  {booksMeta[b]?.name || b}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-deep)" }}>
            Chapter:
            <select
              value={currentChapter}
              onChange={(e) => handleCustomChapterChange(Number(e.target.value))}
              style={{
                marginLeft: "0.4rem",
                padding: "0.3rem 0.6rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--line)",
                background: "var(--bg)",
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            >
              {Array.from({ length: maxChapters }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* View Mode & NotebookLM Export */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: "0.25rem", overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setLayoutMode("interlinear")}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.75rem",
                border: "none",
                background: layoutMode === "interlinear" ? "var(--accent)" : "transparent",
                color: layoutMode === "interlinear" ? "var(--accent-ink)" : "var(--ink)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Interlinear Rows
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("columns")}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.75rem",
                border: "none",
                background: layoutMode === "columns" ? "var(--accent)" : "transparent",
                color: layoutMode === "columns" ? "var(--accent-ink)" : "var(--ink)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Hexapla Columns
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportDossier}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.85rem",
              padding: "0.35rem 0.85rem",
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
      </div>

      {/* 3. Witness Filter Toggles */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-ink)", marginRight: "0.5rem" }}>
          Collate Witnesses:
        </span>
        {(Object.keys(HEXAPLA_WITNESSES) as PolyglotWitnessId[]).map((wid) => {
          const w = HEXAPLA_WITNESSES[wid];
          const isVisible = visibleWitnesses.has(wid);
          return (
            <button
              key={wid}
              type="button"
              onClick={() => toggleWitness(wid)}
              style={{
                fontSize: "0.8rem",
                padding: "0.3rem 0.7rem",
                borderRadius: "0.25rem",
                border: isVisible ? "1px solid var(--line)" : "1px dashed var(--line)",
                background: isVisible ? "var(--surface)" : "transparent",
                color: isVisible ? "var(--ink)" : "var(--muted-ink)",
                cursor: "pointer",
                opacity: isVisible ? 1 : 0.6,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isVisible ? "var(--accent)" : "transparent", border: "1px solid var(--accent)" }} />
              <span>{w.label}</span>
              <span style={{ fontSize: "0.7rem", opacity: 0.75 }}>({w.badge})</span>
            </button>
          );
        })}
      </div>

      {/* 4. Critical Apparatus Callout */}
      {currentPreset && activeDivergence && (
        <aside
          style={{
            background: "rgba(118, 84, 22, 0.08)",
            borderLeft: "4px solid var(--accent)",
            padding: "1.25rem",
            borderRadius: "0 0.5rem 0.5rem 0",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 700, color: "var(--accent-deep)", fontSize: "0.95rem" }}>
              Critical Textual Divergence Apparatus
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--muted-ink)" }}>
              {currentPreset.bookName} {currentPreset.chapter}:{activeDivergence.verse}
            </span>
          </div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", lineHeight: 1.5 }}>
            {currentPreset.summary}
          </p>
          <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", fontStyle: "italic", color: "var(--muted-ink)" }}>
            {currentPreset.theologicalSignificance}
          </p>
          <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {activeDivergence.readingDifferences.map((diff, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "0.35rem",
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                }}
              >
                <strong style={{ color: "var(--accent-deep)", display: "block", marginBottom: "0.2rem" }}>
                  {diff.witness}
                </strong>
                <div style={{ fontStyle: "italic", marginBottom: "0.3rem" }}>{diff.reading}</div>
                <div style={{ color: "var(--muted-ink)", fontSize: "0.8rem", lineHeight: 1.4 }}>
                  {diff.explanation}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* 5. Aligned Texts Display */}
      {isPending ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-ink)" }}>
          Collating ancient manuscript witnesses...
        </div>
      ) : layoutMode === "interlinear" ? (
        /* INTERLINEAR STACKED ROWS */
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {alignedVerses.map((v) => (
            <div
              key={v.number}
              id={`v${v.number}`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "0.5rem",
                padding: "1.25rem",
                scrollMarginTop: "5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <strong style={{ fontFamily: "Cinzel, serif", fontSize: "1.1rem", color: "var(--accent-deep)" }}>
                  {booksMeta[currentBook]?.name || currentBook} {currentChapter}:{v.number}
                </strong>
                <Link
                  href={`/scriptures/graph?from=${currentBook}.${currentChapter}.${v.number}`}
                  style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
                >
                  Explore Path in Graph →
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Original Language */}
                {visibleWitnesses.has("original") && v.originalVerse && (
                  <div style={{ background: "rgba(0,0,0,0.02)", padding: "0.75rem", borderRadius: "0.35rem" }}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", marginBottom: "0.4rem", fontWeight: 700 }}>
                      Original-language edition ({v.originalEdition?.toUpperCase() || "Source"}) — Click word to parse
                    </div>
                    <div
                      dir={v.originalDirection || "ltr"}
                      style={{
                        fontFamily: v.originalDirection === "rtl" ? "var(--font-hebrew, serif)" : "var(--font-greek, serif)",
                        fontSize: "1.35rem",
                        lineHeight: 1.8,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                      }}
                    >
                      {v.originalVerse.words.map((w, wIdx) => {
                        const isSelected =
                          selectedWord?.word === w && selectedWord?.verseNum === v.number;
                        return (
                          <button
                            key={w.id ?? `${w.text}-${wIdx}`}
                            type="button"
                            onClick={() =>
                              setSelectedWord(
                                isSelected
                                  ? null
                                  : {
                                      word: w,
                                      edition: v.originalEdition || "oshb",
                                      verseNum: v.number,
                                    },
                              )
                            }
                            style={{
                              background: isSelected ? "var(--accent)" : "transparent",
                              color: isSelected ? "var(--accent-ink)" : "inherit",
                              border: "1px solid transparent",
                              borderRadius: "0.2rem",
                              padding: "0.1rem 0.35rem",
                              cursor: "pointer",
                              font: "inherit",
                              transition: "all 0.15s ease",
                            }}
                            title={`Parse ${w.text} (Lemma: ${w.lemma})`}
                          >
                            {w.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Septuagint (Brenton) */}
                {visibleWitnesses.has("brenton") && v.brentonText && (
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-ink)", marginBottom: "0.2rem", fontWeight: 700 }}>
                      Brenton Septuagint — English translation (1851)
                    </div>
                    <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6 }}>{v.brentonText}</p>
                  </div>
                )}

                {/* Latin Vulgate (Douay-Rheims) */}
                {visibleWitnesses.has("drb") && v.drbText && (
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-ink)", marginBottom: "0.2rem", fontWeight: 700 }}>
                      Douay-Rheims — English Challoner text (hosted 1899 edition)
                    </div>
                    <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6 }}>{v.drbText}</p>
                  </div>
                )}

                {/* Classic Reformation (KJV) */}
                {visibleWitnesses.has("kjv") && v.kjvText && (
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-ink)", marginBottom: "0.2rem", fontWeight: 700 }}>
                      King James Version (1769 text)
                    </div>
                    <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6 }}>{v.kjvText}</p>
                  </div>
                )}

                {/* Modern Critical (WEB) */}
                {visibleWitnesses.has("web") && v.webText && (
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-ink)", marginBottom: "0.2rem", fontWeight: 700 }}>
                      World English Bible (2020)
                    </div>
                    <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6 }}>{v.webText}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* HEXAPLA PARALLEL COLUMNS */
        <div
          style={{
            overflowX: "auto",
            border: "1px solid var(--line)",
            borderRadius: "0.5rem",
            background: "var(--surface)",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: "900px",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.92rem",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "0.75rem 1rem", width: "4rem" }}>Verse</th>
                {visibleWitnesses.has("original") && (
                  <th style={{ padding: "0.75rem 1rem" }}>Original-language edition</th>
                )}
                {visibleWitnesses.has("brenton") && (
                  <th style={{ padding: "0.75rem 1rem" }}>Brenton Septuagint (English)</th>
                )}
                {visibleWitnesses.has("drb") && (
                  <th style={{ padding: "0.75rem 1rem" }}>Douay-Rheims (English)</th>
                )}
                {visibleWitnesses.has("kjv") && (
                  <th style={{ padding: "0.75rem 1rem" }}>KJV (1769 text)</th>
                )}
                {visibleWitnesses.has("web") && (
                  <th style={{ padding: "0.75rem 1rem" }}>WEB (2020)</th>
                )}
              </tr>
            </thead>
            <tbody>
              {alignedVerses.map((v) => (
                <tr
                  key={v.number}
                  style={{
                    borderBottom: "1px solid var(--line)",
                    verticalAlign: "top",
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--accent-deep)" }}>
                    {v.number}
                  </td>
                  {visibleWitnesses.has("original") && (
                    <td
                      dir={v.originalDirection || "ltr"}
                      style={{
                        padding: "0.75rem 1rem",
                        fontFamily: v.originalDirection === "rtl" ? "var(--font-hebrew, serif)" : "var(--font-greek, serif)",
                        fontSize: "1.1rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {v.originalVerse ? (
                        v.originalVerse.words.map((w, idx) => (
                          <span
                            key={idx}
                            onClick={() =>
                              setSelectedWord({
                                word: w,
                                edition: v.originalEdition || "oshb",
                                verseNum: v.number,
                              })
                            }
                            style={{ cursor: "pointer", marginRight: "0.3rem" }}
                            title={`Parse ${w.text}`}
                          >
                            {w.text}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "var(--muted-ink)", fontStyle: "italic" }}>—</span>
                      )}
                    </td>
                  )}
                  {visibleWitnesses.has("brenton") && (
                    <td style={{ padding: "0.75rem 1rem", lineHeight: 1.5 }}>
                      {v.brentonText || <span style={{ color: "var(--muted-ink)" }}>—</span>}
                    </td>
                  )}
                  {visibleWitnesses.has("drb") && (
                    <td style={{ padding: "0.75rem 1rem", lineHeight: 1.5 }}>
                      {v.drbText || <span style={{ color: "var(--muted-ink)" }}>—</span>}
                    </td>
                  )}
                  {visibleWitnesses.has("kjv") && (
                    <td style={{ padding: "0.75rem 1rem", lineHeight: 1.5 }}>
                      {v.kjvText || <span style={{ color: "var(--muted-ink)" }}>—</span>}
                    </td>
                  )}
                  {visibleWitnesses.has("web") && (
                    <td style={{ padding: "0.75rem 1rem", lineHeight: 1.5 }}>
                      {v.webText || <span style={{ color: "var(--muted-ink)" }}>—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Floating Morphological Word Inspector Drawer */}
      {selectedWord && (
        <div
          role="dialog"
          aria-label="Morphology Inspector"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            maxWidth: "380px",
            width: "calc(100vw - 3rem)",
            background: "var(--surface)",
            border: "2px solid var(--accent)",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            padding: "1.25rem",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-ink)" }}>
                Lexical Analysis · Verse {selectedWord.verseNum}
              </span>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-deep)", margin: "0.1rem 0" }}>
                {selectedWord.word.text}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWord(null)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.25rem",
                cursor: "pointer",
                color: "var(--muted-ink)",
              }}
              aria-label="Close Inspector"
            >
              ×
            </button>
          </div>

          {(() => {
            const desc = describeOriginalWord(selectedWord.word, selectedWord.edition);
            return (
              <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div>
                  <strong style={{ color: "var(--accent)" }}>Language:</strong>{" "}
                  {LANGUAGE_NAMES[desc.language] || desc.language}
                </div>
                <div>
                  <strong style={{ color: "var(--accent)" }}>Lemma / Root:</strong>{" "}
                  <code>{selectedWord.word.lemma || "Not supplied"}</code>
                </div>
                <div>
                  <strong style={{ color: "var(--accent)" }}>Grammar Parsing:</strong>{" "}
                  <span>{desc.segments.join(" + ") || "Not parsed"}</span>
                </div>
                <div>
                  <strong style={{ color: "var(--accent)" }}>Morph Code:</strong>{" "}
                  <code style={{ fontSize: "0.78rem" }}>{selectedWord.word.morph || "None"}</code>
                </div>
                {selectedWord.word.pos && (
                  <div>
                    <strong style={{ color: "var(--accent)" }}>Part of Speech:</strong>{" "}
                    {selectedWord.word.pos}
                  </div>
                )}
                {selectedWord.word.ketiv && (
                  <div>
                    <strong style={{ color: "var(--accent)" }}>Written (Ketiv):</strong>{" "}
                    <span dir="rtl">{selectedWord.word.ketiv}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
