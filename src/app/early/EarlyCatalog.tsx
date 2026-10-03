"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  EARLY_TEXTS,
  ERAS,
  TEXT_ERA,
  type EraId,
  type EarlyTextMeta,
} from "@/lib/early/client";
import EarlyTextCard from "./EarlyTextCard";
import MeaningRail from "@/app/_components/MeaningRail";
import type { EarlyEntry } from "@/lib/semantic-corpus";

type EraFilter = "all" | EraId;

function matchesQuery(text: EarlyTextMeta, q: string): boolean {
  if (!q) return true;
  const hay = `${text.title} ${text.blurb} ${text.date}`.toLowerCase();
  return hay.includes(q);
}

/**
 * Filterable shelf of every hosted writing, still grouped by era when
 * browsing all eras; collapses to a flat grid when a single era or search
 * is active.
 */
function EarlyCatalogInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") ?? "";
  const initialAsk = searchParams?.get("ask") ?? "";
  const initialEra = searchParams?.get("era") as EraFilter | null;

  const [era, setEra] = useState<EraFilter>(
    initialEra && (initialEra === "all" || ERAS.some((e) => e.id === initialEra))
      ? initialEra
      : "all",
  );
  const [query, setQuery] = useState(initialQ);

  useEffect(() => {
    if (initialQ) setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (initialEra && (initialEra === "all" || ERAS.some((e) => e.id === initialEra))) {
      setEra(initialEra);
    }
  }, [initialEra]);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return EARLY_TEXTS.filter((t) => {
      if (era !== "all" && TEXT_ERA[t.id] !== era) return false;
      return matchesQuery(t, q);
    });
  }, [era, q]);

  const byEra = useMemo(() => {
    return ERAS.map((e) => ({
      era: e,
      texts: filtered.filter((t) => TEXT_ERA[t.id] === e.id),
    })).filter((row) => row.texts.length > 0);
  }, [filtered]);

  const flatMode = era !== "all" || q.length > 0;

  return (
    <div className="ew-catalog">
      <MeaningRail<EarlyEntry>
        corpus="early"
        label="Ask the writings"
        placeholder="don't let anyone stop my death"
        initialQuery={initialAsk}
        note={`Meaning search here covers the original ${EARLY_TEXTS.length} writings. Long sections are indexed in shorter excerpts. The expanded editions have their own meaning search. Similarity does not prove historical dependence.`}
        renderHit={(hit) => (
          <Link href={`/early/${hit.entry.textId}#s${hit.entry.section}`} prefetch={false}>
            {hit.entry.label}
            {hit.entry.chunk && hit.entry.chunk.count > 1 && (
              <small> · Matched excerpt {hit.entry.chunk.index + 1} of {hit.entry.chunk.count}</small>
            )}
          </Link>
        )}
      />
      <p className="scr-meta"><Link href="/early/search">Search all editions by word or phrase</Link> · <Link href="/early/library">Browse the expanded library</Link></p>

      <div className="ew-catalog-toolbar">
        <label className="ew-catalog-search">
          <span className="sr-fallback">Search writings</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or blurb…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div
          className="ew-catalog-eras"
          role="group"
          aria-label="Filter by era"
        >
          <button
            type="button"
            className={era === "all" ? "is-active" : undefined}
            aria-pressed={era === "all"}
            onClick={() => setEra("all")}
          >
            All
          </button>
          {ERAS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={era === e.id ? "is-active" : undefined}
              aria-pressed={era === e.id}
              onClick={() => setEra(e.id)}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <p className="scr-meta ew-catalog-count" aria-live="polite">
        {filtered.length === EARLY_TEXTS.length
          ? `${filtered.length} writings`
          : `${filtered.length} of ${EARLY_TEXTS.length} writings`}
        {q ? ` matching “${query.trim()}”` : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="scr-empty">No writings match that filter.</p>
      ) : flatMode ? (
        <div className="scr-cards">
          {filtered.map((t) => (
            <EarlyTextCard key={t.id} text={t} />
          ))}
        </div>
      ) : (
        <>
          <nav className="ew-era-nav" aria-label="Jump to an era">
            {ERAS.map((e) => (
              <a key={e.id} href={`#era-${e.id}`}>
                <strong>{e.label}</strong>
                <span>{e.range}</span>
              </a>
            ))}
          </nav>

          {byEra.map(({ era: e, texts }) => (
            <section key={e.id} id={`era-${e.id}`} className="ew-era">
              <div className="ew-era-head">
                <h2 className="jsu-chapter">{e.label}</h2>
                <span className="ew-era-range">{e.range}</span>
                <Link href={`/early/era/${e.id}`} className="ew-era-open">
                  Open this era →
                </Link>
              </div>
              <p className="ew-era-blurb">{e.blurb}</p>
              <div className="scr-cards">
                {texts.map((t) => (
                  <EarlyTextCard key={t.id} text={t} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

export default function EarlyCatalog() {
  return (
    <Suspense fallback={null}>
      <EarlyCatalogInner />
    </Suspense>
  );
}
