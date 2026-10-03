"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  buildJesusNotebookLMDossier,
  downloadJesusNotebookLMDossier,
  findJesusDossierPreset,
  JESUS_DOSSIER_PRESETS,
  splitJesusSourceQueries,
  type JesusDossierPreset,
  type JesusNotebookLMDossier,
  type JesusDossierCategory,
} from "@/lib/jesus/notebooklm";
import type { Canons } from "@/lib/scriptures/types";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";
import { loadBook, loadOriginalChapter } from "@/lib/scriptures/client";

type Props = {
  canons: Canons;
  initialDossier: JesusNotebookLMDossier;
  initialPresetId: string;
  initialTarget: string;
};

type PrimaryVerse = {
  ref: string;
  original?: string;
  brenton?: string;
  drb?: string;
  kjv?: string;
  web?: string;
};

const MAX_DOSSIER_VERSES_PER_REFERENCE = 200;

async function loadPrimaryVerses(
  query: string,
  canons: Canons,
): Promise<{ parsed: boolean; verses: PrimaryVerse[]; error?: string }> {
  const queryParts = splitJesusSourceQueries(query);
  const parsedCandidates = queryParts.map((part) =>
    parseScriptureQueryRef(part, canons),
  );
  if (parsedCandidates.length === 0 || parsedCandidates.some((parsed) => !parsed)) {
    return { parsed: false, verses: [] };
  }
  const parsedRefs = parsedCandidates.filter(
    (parsed): parsed is NonNullable<typeof parsed> => Boolean(parsed),
  );
  if (
    parsedRefs.some((parsed) => {
      const start = parsed.verse || 1;
      const end = parsed.endVerse || (parsed.verse ? parsed.verse : 4);
      return end - start + 1 > MAX_DOSSIER_VERSES_PER_REFERENCE;
    })
  ) {
    return {
      parsed: true,
      verses: [],
      error: `A dossier request can include at most ${MAX_DOSSIER_VERSES_PER_REFERENCE} verses per reference.`,
    };
  }

  const groups = await Promise.all(
    parsedRefs.map(async (parsed) => {
      const [original, brenton, drb, kjv, web] = await Promise.all([
        loadOriginalChapter(parsed.book, parsed.chapter).catch(() => null),
        loadBook("brenton", parsed.book).catch(() => null),
        loadBook("drb", parsed.book).catch(() => null),
        loadBook("kjv", parsed.book).catch(() => null),
        loadBook("web", parsed.book).catch(() => null),
      ]);
      const verses: PrimaryVerse[] = [];
      const startVerse = parsed.verse || 1;
      const requestedEnd = parsed.endVerse || (parsed.verse ? parsed.verse : 4);
      const maxVerse = Math.max(
        original?.verses.at(-1)?.number ?? 0,
        brenton?.chapters[parsed.chapter - 1]?.length ?? 0,
        drb?.chapters[parsed.chapter - 1]?.length ?? 0,
        kjv?.chapters[parsed.chapter - 1]?.length ?? 0,
        web?.chapters[parsed.chapter - 1]?.length ?? 0,
      );
      const endVerse = Math.min(requestedEnd, maxVerse);

      for (let verse = startVerse; verse <= endVerse; verse += 1) {
        const originalText = original?.verses
          .find((entry) => entry.number === verse)
          ?.words.map((word) => word.text)
          .join(" ");
        const row = {
          ref: `${canons.books[parsed.book]?.name || parsed.book} ${parsed.chapter}:${verse}`,
          original: originalText,
          brenton: brenton?.chapters[parsed.chapter - 1]?.[verse - 1],
          drb: drb?.chapters[parsed.chapter - 1]?.[verse - 1],
          kjv: kjv?.chapters[parsed.chapter - 1]?.[verse - 1],
          web: web?.chapters[parsed.chapter - 1]?.[verse - 1],
        };
        if ([row.original, row.brenton, row.drb, row.kjv, row.web].some(Boolean)) {
          verses.push(row);
        }
      }
      return verses;
    }),
  );

  return { parsed: true, verses: groups.flat() };
}

const CATEGORIES: { id: "all" | JesusDossierCategory; label: string }[] = [
  { id: "all", label: "All Dossiers" },
  { id: "historical-attestation", label: "Historical Attestation" },
  { id: "messianic-prophecy", label: "Messianic Prophecy" },
  { id: "synoptic-problem", label: "Synoptic Problem" },
  { id: "christology-titles", label: "Christology & Titles" },
  { id: "passion-resurrection", label: "Passion & Resurrection" },
];

export default function JesusDossierClient({
  canons,
  initialDossier,
  initialPresetId,
  initialTarget,
}: Props) {
  const router = useRouter();
  const requestIdRef = useRef(0);
  const [selectedPresetId, setSelectedPresetId] = useState(initialPresetId);
  const [searchQuery, setSearchQuery] = useState(
    initialPresetId ? "" : initialTarget,
  );
  const [activeCategory, setActiveCategory] = useState<"all" | JesusDossierCategory>("all");
  const [dossier, setDossier] = useState<JesusNotebookLMDossier>(initialDossier);
  const [activeTab, setActiveTab] = useState<"preview" | "markdown" | "audio-prompt">("preview");
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(
    initialDossier.sourceEntryCount === 0
      ? "No hosted source resolved for this request. Check the reference or choose a curated dossier."
      : null,
  );

  const handleSelectPreset = useCallback(
    async (preset: JesusDossierPreset) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setSourceError(null);
      try {
        const loaded = await loadPrimaryVerses(preset.query, canons);
        if (requestId !== requestIdRef.current) return;
        if (loaded.error) throw new Error(loaded.error);
        if (loaded.parsed && loaded.verses.length === 0) {
          throw new Error("The preset passage could not be loaded from a hosted edition.");
        }
        const compiled = buildJesusNotebookLMDossier({
          target: preset.id,
          canons,
          primaryVerses: loaded.verses,
        });
        setDossier(compiled);
        setSelectedPresetId(preset.id);
        setSearchQuery("");
        router.replace(`/jesus/dossier?preset=${encodeURIComponent(preset.id)}`, {
          scroll: false,
        });
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        setSourceError(
          error instanceof Error
            ? error.message
            : "The requested source could not be loaded.",
        );
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [canons, router],
  );

  const handleCustomSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;
      const queryParts = splitJesusSourceQueries(query);
      const isScriptureQuery = queryParts.length > 0 && queryParts.every(
        (part) => Boolean(parseScriptureQueryRef(part, canons)),
      );
      if (!isScriptureQuery) {
        const preset = findJesusDossierPreset(query);
        if (preset) {
          await handleSelectPreset(preset);
          return;
        }
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setSourceError(null);
      try {
        const loaded = await loadPrimaryVerses(query, canons);
        if (requestId !== requestIdRef.current) return;
        if (loaded.error) throw new Error(loaded.error);
        if (!loaded.parsed) {
          throw new Error(
            "Enter a hosted Scripture reference or choose one of the curated dossiers.",
          );
        }
        if (loaded.verses.length === 0) {
          throw new Error(
            "No hosted verse resolved for that reference. Check the chapter and verse.",
          );
        }
        const compiled = buildJesusNotebookLMDossier({
          target: query,
          canons,
          primaryVerses: loaded.verses,
        });
        setDossier(compiled);
        setSelectedPresetId("");
        router.replace(`/jesus/dossier?target=${encodeURIComponent(query)}`, {
          scroll: false,
        });
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        setSourceError(
          error instanceof Error
            ? error.message
            : "The requested source could not be loaded.",
        );
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [canons, handleSelectPreset, router, searchQuery],
  );

  const copyDossier = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(dossier.markdown);
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2400);
    } catch {
      // Fallback
    }
  }, [dossier.markdown]);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(dossier.audioHostPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2400);
    } catch {
      // Fallback
    }
  }, [dossier.audioHostPrompt]);

  const filteredPresets =
    activeCategory === "all"
      ? JESUS_DOSSIER_PRESETS
      : JESUS_DOSSIER_PRESETS.filter((p) => p.category === activeCategory);

  const activePreset = dossier.preset;
  const canExport = dossier.sourceEntryCount > 0 && !sourceError;

  return (
    <div className="jsu-dossier-root">
      {/* Category Pills */}
      <div className="jsu-dossier-categories" role="group" aria-label="Preset categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            aria-pressed={activeCategory === cat.id}
            className={`jsu-dossier-cat-pill ${activeCategory === cat.id ? "is-active" : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset Grid Selector */}
      <div className="jsu-dossier-presets-grid" role="region" aria-label="Scholarly preset dossiers">
        {filteredPresets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`jsu-dossier-preset-card ${selectedPresetId === p.id ? "is-selected" : ""}`}
            aria-pressed={selectedPresetId === p.id}
            onClick={() => handleSelectPreset(p)}
          >
            <div className="jsu-dossier-card-top">
              <span className="jsu-dossier-card-tag">{p.category.replace(/-/g, " ")}</span>
              <span className="jsu-dossier-card-query">{p.query}</span>
            </div>
            <h3 className="jsu-dossier-card-title">{p.title}</h3>
            <p className="jsu-dossier-card-desc">{p.description}</p>
          </button>
        ))}
      </div>

      {/* Custom Inquiry Bar */}
      <div className="jsu-dossier-inquiry-bar">
        <form onSubmit={handleCustomSearch} className="jsu-dossier-form">
          <label htmlFor="jsu-dossier-input" className="jsu-visually-hidden">
            Enter scripture reference or historical inquiry
          </label>
          <input
            id="jsu-dossier-input"
            type="text"
            className="jsu-dossier-input"
            placeholder="Compile custom dossier (e.g., JHN 1:1, ISA 53:5, DAN 7:13, or Tacitus Annals)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="jsu-dossier-submit-btn" disabled={isLoading}>
            {isLoading ? "Compiling..." : "Generate Dossier"}
          </button>
        </form>
        {sourceError && (
          <p className="jsu-dossier-source-error" role="alert">
            {sourceError}
          </p>
        )}
      </div>

      {/* Main Dossier Workspace */}
      <div className="jsu-dossier-workspace">
        <header className="jsu-dossier-header">
          <div className="jsu-dossier-header-main">
            <span className="jsu-dossier-tag">
              {dossier.targetType.toUpperCase()} DOSSIER · {dossier.wordCount.toLocaleString()} WORDS ·{" "}
              {dossier.sourceEntryCount} NAMED SOURCE EDITIONS AND NOTES
            </span>
            <h2 className="jsu-dossier-active-title">{dossier.title}</h2>
          </div>
          <div className="jsu-dossier-actions">
            <button
              type="button"
              className="jsu-dossier-btn is-primary"
              onClick={copyDossier}
              disabled={!canExport}
              title="Copy the source-aware Markdown worksheet for Google NotebookLM"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copiedDossier ? "Copied Dossier!" : "Copy Full Dossier"}</span>
            </button>
            <button
              type="button"
              className="jsu-dossier-btn"
              onClick={() => downloadJesusNotebookLMDossier(dossier)}
              disabled={!canExport}
              title="Download structured Markdown file (.md)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download .md</span>
            </button>
            <button
              type="button"
              className="jsu-dossier-btn is-accent"
              onClick={copyPrompt}
              disabled={!canExport}
              title="Copy dialectical Audio Overview podcast prompt to paste into NotebookLM"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span>{copiedPrompt ? "Copied Host Prompt!" : "Copy Audio Host Prompt"}</span>
            </button>
          </div>
        </header>

        {/* Studio Workspace Tabs */}
        <div className="jsu-dossier-tabs" role="group" aria-label="Dossier views">
          <button
            type="button"
            aria-pressed={activeTab === "preview"}
            className={`jsu-dossier-tab-btn ${activeTab === "preview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            Structured Synthesis View
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "markdown"}
            className={`jsu-dossier-tab-btn ${activeTab === "markdown" ? "is-active" : ""}`}
            onClick={() => setActiveTab("markdown")}
          >
            Raw Markdown (NotebookLM Ingestion)
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "audio-prompt"}
            className={`jsu-dossier-tab-btn ${activeTab === "audio-prompt" ? "is-active" : ""}`}
            onClick={() => setActiveTab("audio-prompt")}
          >
            Audio Deep Dive Host Studio
          </button>
        </div>

        {/* Tab 1: Structured Synthesis Preview */}
        {activeTab === "preview" && (
          <div className="jsu-dossier-content">
            {activePreset && (
              <div className="jsu-dossier-summary-block">
                <h3>Executive Scholarly Summary</h3>
                <p>{activePreset.summary}</p>
                <h4>Historical &amp; Textual Significance</h4>
                <p>{activePreset.historicalSignificance}</p>
              </div>
            )}

            {activePreset?.textualDivergence && (
              <div className="jsu-dossier-divergence-block">
                <h3>Textual Comparison Notes</h3>
                <p className="jsu-dossier-divergence-key">
                  Key passage or record: <strong>{activePreset.textualDivergence.keyVerse}</strong> (
                  <code>{activePreset.textualDivergence.originalRef}</code>)
                </p>
                <div className="jsu-dossier-divergence-grid">
                  {activePreset.textualDivergence.readingDifferences.map((rd, i) => (
                    <div key={i} className="jsu-dossier-diff-item">
                      <span className="jsu-dossier-diff-witness">{rd.witness}</span>
                      <p className="jsu-dossier-diff-reading">
                        <strong>Reading or source note:</strong> {rd.reading}
                      </p>
                      <p className="jsu-dossier-diff-expl">{rd.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreset?.ancientWitnesses && activePreset.ancientWitnesses.length > 0 && (
              <div className="jsu-dossier-witnesses-block">
                <h3>Historical Witnesses &amp; Early Reception Notes</h3>
                <p>
                  These entries identify the work and section behind each research note.
                  Some wording is summarized; consult the named source before quoting it.
                </p>
                <div className="jsu-dossier-witness-list">
                  {activePreset.ancientWitnesses.map((w, i) => (
                    <div key={i} className="jsu-dossier-witness-entry">
                      <div className="jsu-dossier-witness-head">
                        <strong>{w.source}</strong>
                        <span className="jsu-dossier-witness-date">
                          {w.date} · [{w.period}]
                        </span>
                      </div>
                      <p className="jsu-dossier-witness-quote">
                        <strong>Excerpt or editorial summary:</strong> {w.excerpt}
                      </p>
                      <p className="jsu-dossier-witness-analysis">
                        <em>Critical Analysis:</em> {w.analysis}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreset && (
              <div className="jsu-dossier-prompts-block">
                <h3>Dialectical Inquiry Prompts for NotebookLM Synthesis</h3>
                <ul className="jsu-dossier-prompts-list">
                  {activePreset.dialecticalPrompts.map((prompt, i) => (
                    <li key={i}>
                      <strong>{prompt.split("?")[0]}?</strong>
                      {prompt.substring(prompt.indexOf("?") + 1)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!activePreset && (
              <div className="jsu-dossier-prose-render">
                <pre className="jsu-dossier-prose-pre">{dossier.markdown}</pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Raw Markdown */}
        {activeTab === "markdown" && (
          <div className="jsu-dossier-markdown-tab">
            <div className="jsu-dossier-md-actions">
              <span className="jsu-dossier-md-note">
                Ready for copy-paste into Google NotebookLM (Add Source &gt; Copied Text).
              </span>
              <button
                type="button"
                className="jsu-dossier-btn is-sm"
                onClick={copyDossier}
                disabled={!canExport}
              >
                {copiedDossier ? "Copied!" : "Copy Markdown"}
              </button>
            </div>
            <textarea
              readOnly
              className="jsu-dossier-raw-textarea"
              value={dossier.markdown}
              rows={24}
              aria-label="Raw Markdown dossier content"
            />
          </div>
        )}

        {/* Tab 3: Audio Host Prompt */}
        {activeTab === "audio-prompt" && (
          <div className="jsu-dossier-prompt-tab">
            <div className="jsu-dossier-prompt-box">
              <span className="jsu-dossier-card-tag">SYSTEM PROMPT INSTRUCTION</span>
              <h3>NotebookLM Audio Overview Custom Instructions</h3>
              <p>
                When generating a Deep Dive podcast in NotebookLM, click <strong>Customize</strong> and
                paste the instructions below into the Audio Overview configuration prompt. Check the
                generated claims against the named source material before reuse.
              </p>
              <textarea
                readOnly
                className="jsu-dossier-prompt-textarea"
                value={dossier.audioHostPrompt}
                rows={8}
                aria-label="Audio Overview custom prompt instructions"
              />
              <button
                type="button"
                className="jsu-dossier-btn is-accent"
                style={{ marginTop: "1rem" }}
                onClick={copyPrompt}
                disabled={!canExport}
              >
                {copiedPrompt ? "Copied Prompt!" : "Copy System Prompt"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cross-World Contextual Links */}
      <footer className="jsu-dossier-footer">
        <p className="jsu-dossier-grounding-notice">
          Source boundary: Scripture lines loaded by this tool come from the named hosted editions.
          Preset readings and historical notes are curated research aids; verify them against the named
          work before quotation or publication. AI output can still contain errors.
        </p>
        <div className="jsu-dossier-nav-links">
          <Link href="/jesus/history" className="jsu-dossier-link">
            ← The Historical Record (Josephus, Tacitus, Pliny)
          </Link>
          <Link href="/jesus/prophecy" className="jsu-dossier-link">
            Prophecy Beside Fulfillment →
          </Link>
          <Link href="/jesus/harmony" className="jsu-dossier-link">
            Synoptic Gospel Harmony &amp; Word-Diffing →
          </Link>
          <Link href="/jesus/risen" className="jsu-dossier-link">
            Cross to Ascension Sequence →
          </Link>
        </div>
      </footer>
    </div>
  );
}
