"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { WordLedger, WordLedgerEntry } from "@/lib/word/types";
import { getWordEntry, searchWordEntries } from "@/lib/word/search";
import WordSourceCards from "./WordSourceCards";
import WordTimeline from "./WordTimeline";

const CATEGORY_LABEL = {
  fenced: "Copyrighted translation",
  free: "Free-to-use translation",
  placeholder: "Research queue",
} as const;

const RESULT_CATEGORY_LABEL = {
  fenced: "Fenced",
  free: "Free",
  placeholder: "Queue",
} as const;

const STATUS_LABEL = {
  researched: "Source checked",
  placeholder: "Not yet verified",
} as const;

function entrySources(entry: WordLedgerEntry, ledger: WordLedger) {
  const ids = new Set(entry.sourceIds);
  return ledger.sources.filter((source) => ids.has(source.id));
}

function entryFromHash(entries: WordLedgerEntry[]): string | null {
  if (typeof window === "undefined") return null;
  const prefix = "#word-entry-";
  if (!window.location.hash.startsWith(prefix)) return null;
  const id = window.location.hash.slice(prefix.length);
  return getWordEntry(entries, id)?.id ?? null;
}

export default function WordLedger({ ledger }: { ledger: WordLedger }) {
  const searchId = useId();
  const detailHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const hasSelectedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(ledger.entries[0]?.id ?? "");
  const results = useMemo(
    () => searchWordEntries(ledger.entries, query),
    [ledger.entries, query],
  );

  useEffect(() => {
    const selectHashEntry = () => {
      const hashEntry = entryFromHash(ledger.entries);
      if (!hashEntry) return;

      setSelectedId(hashEntry);
      window.requestAnimationFrame(() => {
        document.getElementById("word-entry-detail")?.scrollIntoView({
          block: "start",
        });
      });
    };

    selectHashEntry();
    window.addEventListener("hashchange", selectHashEntry);
    return () => window.removeEventListener("hashchange", selectHashEntry);
  }, [ledger.entries]);

  useEffect(() => {
    if (results.length === 0 || results.some((entry) => entry.id === selectedId)) return;
    setSelectedId(results[0].id);
  }, [results, selectedId]);

  const selected =
    results.length === 0
      ? undefined
      : getWordEntry(ledger.entries, selectedId) ?? results[0] ?? ledger.entries[0];
  const selectedIdForEffect = selected?.id;
  const hasSelected = Boolean(selected);

  useEffect(() => {
    if (!hasSelected || !hasSelectedRef.current) {
      hasSelectedRef.current = hasSelected;
      return;
    }
    detailHeadingRef.current?.focus({ preventScroll: true });
  }, [hasSelected, selectedIdForEffect]);

  function selectEntry(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#word-entry-${id}`);
    }
  }

  return (
    <section className="word-ledger" id="word-ledger" aria-labelledby="word-ledger-title">
      <header className="word-ledger-header">
        <div>
          <p className="word-section-kicker">The searchable record</p>
          <h2 id="word-ledger-title">{ledger.title}</h2>
          <p>{ledger.intro}</p>
        </div>
        <span className="word-ledger-count">{ledger.entries.length} records</span>
      </header>

      <div className="word-ledger-search">
        <label htmlFor={searchId}>Search the word record</label>
        <div className="word-search-control">
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try NIV, public domain, or Biblica"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button type="button" className="word-search-clear" onClick={() => setQuery("") }>
              Clear
            </button>
          )}
        </div>
        <p className="word-search-status" role="status" aria-live="polite">
          {results.length === 0
            ? "No records match that search."
            : `${results.length} record${results.length === 1 ? "" : "s"} found.`}
        </p>
      </div>

      <div className="word-ledger-layout">
        <nav className="word-results" aria-label="Word ownership records">
          <p className="word-results-heading">Choose a record</p>
          {results.length > 0 ? (
            <ul>
              {results.map((entry, index) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={entry.id === selected?.id ? "is-active" : ""}
                    aria-pressed={entry.id === selected?.id}
                    aria-controls="word-entry-detail"
                    onClick={() => selectEntry(entry.id)}
                  >
                    <span className="word-result-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="word-result-copy">
                      <strong>{entry.abbr}</strong>
                      <span>{entry.name}</span>
                      <small>{entry.owner}</small>
                    </span>
                    <span className={`word-status word-status--${entry.status}`}>
                      {RESULT_CATEGORY_LABEL[entry.category]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="word-no-results">
              <p>Try a translation abbreviation, owner, or status.</p>
              <button type="button" className="textlink" onClick={() => setQuery("")}>
                Clear search
              </button>
            </div>
          )}
        </nav>

        {selected ? (
          <article
            className={`word-entry-detail is-${selected.status}`}
            id="word-entry-detail"
            aria-labelledby={`word-entry-title-${selected.id}`}
          >
            <header className="word-detail-header">
              <div>
                <p className="word-section-kicker">{CATEGORY_LABEL[selected.category]}</p>
                <h3 id={`word-entry-title-${selected.id}`} ref={detailHeadingRef} tabIndex={-1}>
                  <span>{selected.abbr}</span> {selected.name}
                </h3>
              </div>
              <span className={`word-status word-status--${selected.status}`}>
                {STATUS_LABEL[selected.status]}
              </span>
            </header>

            <dl className="word-detail-facts">
              <div>
                <dt>Record owner / posture</dt>
                <dd>{selected.owner}</dd>
              </div>
              <div>
                <dt>What the record says</dt>
                <dd>{selected.summary}</dd>
              </div>
            </dl>

            <div className="word-permission-note">
              <p className="word-section-kicker">Permission posture</p>
              <p>{selected.permission}</p>
            </div>

            <section className="word-provenance" id="word-provenance" aria-labelledby="word-provenance-title">
              <div className="word-section-heading">
                <div>
                  <p className="word-section-kicker">Provenance</p>
                  <h3 id="word-provenance-title">How this record got here.</h3>
                </div>
                <span>{selected.timeline.length} step{selected.timeline.length === 1 ? "" : "s"}</span>
              </div>
              <WordTimeline events={selected.timeline} sources={ledger.sources} />
            </section>

            <WordSourceCards sources={entrySources(selected, ledger)} />
          </article>
        ) : (
          <div className="word-entry-detail word-entry-detail--empty" id="word-entry-detail" aria-live="polite">
            <p>Choose a record to inspect its ownership and source trail.</p>
          </div>
        )}
      </div>
    </section>
  );
}
