"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  buildAngelsNotebookLMDossier,
  ANGELS_DOSSIER_PRESETS,
  findAngelsDossierPreset,
  type AngelsDossierPreset,
  type AngelsNotebookLMDossier,
  type AngelsDossierCategory,
} from "@/lib/angels/notebooklm";
import type { Canons } from "@/lib/scriptures/types";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";
import { loadBook, loadOriginalChapter } from "@/lib/scriptures/client";

type Props = {
  canons: Canons;
  initialDossier: AngelsNotebookLMDossier;
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
  charles?: string;
};

const MAX_DOSSIER_VERSES_PER_REFERENCE = 200;

async function loadPrimaryVerses(
  query: string,
  canons: Canons,
): Promise<{ parsed: boolean; verses: PrimaryVerse[]; error?: string }> {
  const parsed = parseScriptureQueryRef(query, canons);
  if (!parsed) return { parsed: false, verses: [] };

  const verses: PrimaryVerse[] = [];
  const startVerse = parsed.verse || 1;
  const requestedEnd = parsed.endVerse || (parsed.verse ? parsed.verse : 4);
  if (requestedEnd - startVerse + 1 > MAX_DOSSIER_VERSES_PER_REFERENCE) {
    return {
      parsed: true,
      verses,
      error: `A dossier request can include at most ${MAX_DOSSIER_VERSES_PER_REFERENCE} verses per reference.`,
    };
  }

  if (parsed.book === "ENO" || parsed.book === "JUB") {
    const charles = await loadBook("charles", parsed.book).catch(() => null);
    const endVerse = Math.min(
      requestedEnd,
      charles?.chapters[parsed.chapter - 1]?.length ?? 0,
    );
    for (let verse = startVerse; verse <= endVerse; verse += 1) {
      const text = charles?.chapters[parsed.chapter - 1]?.[verse - 1];
      if (text) {
        verses.push({
          ref: `${canons.books[parsed.book]?.name || parsed.book} ${parsed.chapter}:${verse}`,
          charles: text,
        });
      }
    }
    return { parsed: true, verses };
  }

  const [original, brenton, drb, kjv, web] = await Promise.all([
    loadOriginalChapter(parsed.book, parsed.chapter).catch(() => null),
    loadBook("brenton", parsed.book).catch(() => null),
    loadBook("drb", parsed.book).catch(() => null),
    loadBook("kjv", parsed.book).catch(() => null),
    loadBook("web", parsed.book).catch(() => null),
  ]);
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

  return { parsed: true, verses };
}

const CATEGORIES: { id: "all" | AngelsDossierCategory; label: string }[] = [
  { id: "all", label: "All Dossiers" },
  { id: "cosmic-order", label: "Cosmic Order" },
  { id: "demonology", label: "Demonology" },
  { id: "christological-warfare", label: "Kingdom Warfare" },
  { id: "textual-criticism", label: "Textual Criticism" },
];

export default function AngelsDossierClient({
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
  const [activeCategory, setActiveCategory] = useState<"all" | AngelsDossierCategory>("all");
  const [dossier, setDossier] = useState<AngelsNotebookLMDossier>(initialDossier);
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
    async (preset: AngelsDossierPreset) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setSourceError(null);
      try {
        const loaded = await loadPrimaryVerses(preset.query, canons);
        if (requestId !== requestIdRef.current) return;
        if (loaded.error) throw new Error(loaded.error);
        if (!loaded.parsed || loaded.verses.length === 0) {
          throw new Error("The preset passage could not be loaded from a hosted edition.");
        }
        const newDossier = buildAngelsNotebookLMDossier({
          target: preset.id,
          canons,
          primaryVerses: loaded.verses,
        });
        setDossier(newDossier);
        setSelectedPresetId(preset.id);
        setSearchQuery("");
        router.replace(`/angels/dossier?preset=${encodeURIComponent(preset.id)}`, {
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

  const handleSearchSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const clean = searchQuery.trim();
      if (!clean) return;
      if (!parseScriptureQueryRef(clean, canons)) {
        const preset = findAngelsDossierPreset(clean);
        if (preset) {
          await handleSelectPreset(preset);
          return;
        }
      }
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setSourceError(null);
      try {
        const loaded = await loadPrimaryVerses(clean, canons);
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
        const newDossier = buildAngelsNotebookLMDossier({
          target: clean,
          canons,
          primaryVerses: loaded.verses,
        });
        setDossier(newDossier);
        setSelectedPresetId("");
        router.replace(`/angels/dossier?target=${encodeURIComponent(clean)}`, {
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
    [searchQuery, canons, router, handleSelectPreset],
  );

  const handleCopyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(dossier.markdown);
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2500);
    } catch {
      // Fallback
    }
  }, [dossier.markdown]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(dossier.audioHostPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Fallback
    }
  }, [dossier.audioHostPrompt]);

  const filteredPresets =
    activeCategory === "all"
      ? ANGELS_DOSSIER_PRESETS
      : ANGELS_DOSSIER_PRESETS.filter((p) => p.category === activeCategory);
  const canExport = dossier.sourceEntryCount > 0 && !sourceError;

  return (
    <div className="an-dossier-studio">
      {/* Category selector */}
      <nav className="an-dossier-categories" aria-label="Dossier categories">
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.id}
            className={`an-dossier-cat-pill ${activeCategory === cat.id ? "is-active" : ""}`}
            aria-pressed={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* Preset pills grid */}
      <section className="an-dossier-presets-grid" aria-label="Curated landmark dossiers">
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              type="button"
              key={preset.id}
              className={`an-dossier-card ${isSelected ? "is-selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => handleSelectPreset(preset)}
            >
              <span className="an-dossier-tag">{preset.category.replace("-", " ")}</span>
              <strong>{preset.title}</strong>
              <p>{preset.description}</p>
              <span className="an-dossier-query">Query: {preset.query}</span>
            </button>
          );
        })}
      </section>

      {/* Custom query input */}
      <form className="an-dossier-search-bar" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Load a hosted passage (e.g. Daniel 10:13, Mark 5:9, or Jubilees 10:8)..."
          aria-label="Target scripture passage or theological topic"
        />
        <button type="submit" className="an-dossier-submit-btn" disabled={isLoading}>
          {isLoading ? "Collating..." : "Generate Dossier"}
        </button>
      </form>
      {sourceError && (
        <p className="an-dossier-source-error" role="alert">
          {sourceError}
        </p>
      )}

      {/* Dossier Header & Action Toolbar */}
      <div className="an-dossier-toolbar">
        <div className="an-dossier-meta-stats">
          <span className="an-stat-badge">
            <strong>{dossier.wordCount.toLocaleString()}</strong> words
          </span>
          <span className="an-stat-badge">
            <strong>{dossier.sourceEntryCount}</strong> named source editions and notes
          </span>
          <span className="an-stat-badge">
            Format: <strong>NotebookLM Ready</strong>
          </span>
        </div>

        <div className="an-dossier-actions">
          <button
            type="button"
            className="an-btn-action primary"
            onClick={handleCopyMarkdown}
            disabled={!canExport}
            aria-label="Copy full markdown dossier for Google NotebookLM"
          >
            {copiedDossier ? "✓ Dossier Copied!" : "Copy Full Markdown Dossier"}
          </button>
          <button
            type="button"
            className="an-btn-action secondary"
            onClick={handleCopyPrompt}
            disabled={!canExport}
            aria-label="Copy Audio Overview prompt for NotebookLM podcast host generation"
          >
            {copiedPrompt ? "✓ Prompt Copied!" : "Copy Audio Deep Dive Prompt"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="an-dossier-tabs" role="group" aria-label="Dossier views">
        <button
          type="button"
          aria-pressed={activeTab === "preview"}
          className={`an-tab-btn ${activeTab === "preview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          Dossier Synthesis Preview
        </button>
        <button
          type="button"
          aria-pressed={activeTab === "markdown"}
          className={`an-tab-btn ${activeTab === "markdown" ? "is-active" : ""}`}
          onClick={() => setActiveTab("markdown")}
        >
          Raw Markdown Source (.md)
        </button>
        <button
          type="button"
          aria-pressed={activeTab === "audio-prompt"}
          className={`an-tab-btn ${activeTab === "audio-prompt" ? "is-active" : ""}`}
          onClick={() => setActiveTab("audio-prompt")}
        >
          NotebookLM Audio Deep Dive Prompt
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "preview" && (
        <div className="an-dossier-panel preview">
          {dossier.preset && (
            <div className="an-preview-summary-card">
              <span className="an-section-kicker">Executive Research Synthesis</span>
              <h2>{dossier.preset.title}</h2>
              <p className="an-lead-summary">{dossier.preset.summary}</p>
              <div className="an-significance-box">
                <strong>Historical &amp; Theological Significance:</strong>
                <p>{dossier.preset.theologicalSignificance}</p>
              </div>
            </div>
          )}

          {dossier.preset?.textualDivergence && (
            <div className="an-divergence-card">
              <span className="an-section-kicker">Textual Comparison Notes</span>
              <h3>Key passage: {dossier.preset.textualDivergence.keyVerse}</h3>
              <div className="an-witness-divergence-grid">
                {dossier.preset.textualDivergence.readingDifferences.map((diff) => (
                  <div key={diff.witness} className="an-witness-diff-card">
                    <span className="an-witness-badge">{diff.witness}</span>
                    <p className="an-witness-reading">
                      <strong>Reading or source note:</strong> {diff.reading}
                    </p>
                    <p className="an-witness-expl">{diff.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dossier.preset?.ancientWitnesses && dossier.preset.ancientWitnesses.length > 0 && (
            <div className="an-catena-card">
              <span className="an-section-kicker">Curated Historical Source Notes</span>
              <h3>Second Temple and Christian reception</h3>
              <p>
                These entries identify the work and section behind each research note.
                Some wording is summarized; consult the named source before quoting it.
              </p>
              <div className="an-catena-grid">
                {dossier.preset.ancientWitnesses.map((w) => (
                  <article key={w.source} className="an-catena-item">
                    <header className="an-catena-head">
                      <strong>{w.source}</strong>
                      <small>
                        {w.date} · {w.period}
                      </small>
                    </header>
                    <p className="an-source-note">
                      <strong>Excerpt or editorial summary:</strong> {w.excerpt}
                    </p>
                    <p className="an-catena-analysis">
                      <strong>Analysis:</strong> {w.analysis}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="an-prompts-card">
            <span className="an-section-kicker">Dialectical Inquiry Framework</span>
            <h3>Guiding Questions for AI Deep Dive &amp; Human Seminar</h3>
            <ol className="an-prompts-list">
              {(dossier.preset?.dialecticalPrompts ?? [
                "How does the original Semitic or Greek core vocabulary define this unseen entity?",
                "What historical pressures influenced the theological development between biblical testimony and later tradition?",
                "How does the New Testament redefine this power in light of the enthronement of Christ?",
              ]).map((prompt, idx) => (
                <li key={idx}>{prompt}</li>
              ))}
            </ol>
          </div>

          <div className="an-grounding-contract">
            <strong>Source boundary</strong>
            <p>
              Scripture lines loaded by this tool come from the named hosted editions.
              Preset readings and historical notes are curated research aids; verify
              them against the named work before quotation or publication. AI output can still contain errors.
            </p>
          </div>
        </div>
      )}

      {activeTab === "markdown" && (
        <div className="an-dossier-panel markdown">
          <div className="an-markdown-header">
            <p>
              Upload or paste this entire document directly as a source file into{" "}
              <strong>Google NotebookLM™</strong>. It contains YAML metadata, hosted Scripture
              where available, and clearly labeled historical source notes.
            </p>
            <button
              type="button"
              className="an-btn-action primary small"
              onClick={handleCopyMarkdown}
              disabled={!canExport}
            >
              {copiedDossier ? "✓ Copied" : "Copy Markdown"}
            </button>
          </div>
          <pre className="an-code-block" tabIndex={0}>
            <code>{dossier.markdown}</code>
          </pre>
        </div>
      )}

      {activeTab === "audio-prompt" && (
        <div className="an-dossier-panel audio-prompt">
          <div className="an-audio-guide-card">
            <span className="an-section-kicker">Google NotebookLM Audio Overview Customization</span>
            <h3>How to use this prompt in NotebookLM:</h3>
            <ol>
              <li>Open your Notebook in Google NotebookLM and upload the Markdown dossier from Tab 2.</li>
              <li>Under the <strong>Audio Overview (Deep Dive)</strong> panel, click <strong>Customize</strong>.</li>
              <li>Paste the instructions below into the customization prompt box.</li>
              <li>Generate the Audio Overview, then check its claims against the named source material before reuse.</li>
            </ol>
          </div>

          <div className="an-prompt-display-card">
            <header className="an-prompt-head">
              <strong>Engineered Host Instructions</strong>
              <button
                type="button"
                className="an-btn-action primary small"
                onClick={handleCopyPrompt}
                disabled={!canExport}
              >
                {copiedPrompt ? "✓ Copied" : "Copy Audio Prompt"}
              </button>
            </header>
            <blockquote className="an-prompt-text">{dossier.audioHostPrompt}</blockquote>
          </div>
        </div>
      )}

      {/* Cross links back to Angels world rooms */}
      <footer className="an-dossier-footer-nav">
        <h3>Explore Related Rooms in the Unseen World</h3>
        <div className="an-dossier-room-links">
          <Link href="/angels#order-ladder" className="an-room-card">
            <strong>01 / The Order</strong>
            <span>From the throne to the deep: ranks, cherubim, seraphim.</span>
          </Link>
          <Link href="/angels/fall" className="an-room-card">
            <strong>02 / The Fall</strong>
            <span>Watchers, accusers, laments, and final judgment.</span>
          </Link>
          <Link href="/angels/encounters" className="an-room-card">
            <strong>03 / The Encounters</strong>
            <span>61 appearances and exorcisms across the record.</span>
          </Link>
          <Link href="/angels/demons" className="an-room-card">
            <strong>04 / The Demons</strong>
            <span>Named figures, territorial rulers, and titles.</span>
          </Link>
          <Link href="/angels/vocabulary" className="an-room-card">
            <strong>05 / The Vocabulary</strong>
            <span>Original Hebrew and Greek tagged lemmas and occurrences.</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
