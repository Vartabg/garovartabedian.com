"use client";

import { SEMANTIC_DOWNLOAD_NOTICE } from "@/lib/scriptures/semantic-model";

import { useCallback, useEffect, useId, useState } from "react";
import {
  hasOptedIntoMeaningSearch,
  rememberMeaningSearchOptIn,
} from "@/lib/semantic-opt-in";
import { searchCorpus } from "@/lib/semantic-corpus";
import type { CorpusEntry, CorpusHit, CorpusId } from "@/lib/semantic-corpus";
import { useSemanticRequest } from "@/lib/use-semantic-request";
import { isAbortError } from "@/lib/scriptures/cancellation";

/**
 * Ask a room in plain words and get places to look.
 *
 * The same in-browser model the Scripture search uses, pointed at one room's
 * own corpus. Nothing is generated: every result is a link into the hosted
 * text, ranked by how close the wording of a passage sits to the question. The
 * copy says "places to look" rather than "answers" because that is what a
 * similarity score can honestly support.
 *
 * The model download is opt-in and the choice is remembered per browser, so a
 * reader who agreed on the search page is not asked again here.
 */
export default function MeaningRail<E extends CorpusEntry>({
  corpus,
  label,
  placeholder,
  note,
  renderHit,
  limit = 8,
  initialQuery = "",
  search = searchCorpus<E>,
}: {
  corpus: CorpusId;
  label: string;
  placeholder: string;
  /** One line naming what is being ranked, so the reader knows the scope. */
  note: string;
  renderHit: (hit: CorpusHit<E>) => React.ReactNode;
  limit?: number;
  initialQuery?: string;
  search?: typeof searchCorpus<E>;
}) {
  const { begin, cancel } = useSemanticRequest();
  const inputId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [asked, setAsked] = useState("");
  const [optedIn, setOptedIn] = useState(false);
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [status, setStatus] = useState("");
  const [hits, setHits] = useState<CorpusHit<E>[]>([]);

  useEffect(() => {
    setOptedIn(hasOptedIntoMeaningSearch());
  }, []);

  const run = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const request = begin();
      rememberMeaningSearchOptIn();
      setOptedIn(true);
      setAsked(trimmed);
      setPhase("loading");
      setStatus("Preparing the model…");
      search(corpus, trimmed, { limit, signal: request.signal,
        onProgress: status => { if (request.current()) setStatus(status); } })
        .then((result) => {
          if (!request.current()) return;
          setHits(result.hits);
          setPhase("done");
        })
        .catch(error => { if (request.current() && !isAbortError(error)) setPhase("error"); });
    },
    [corpus, limit, begin, search],
  );

  useEffect(() => {
    if (initialQuery.trim() && hasOptedIntoMeaningSearch()) {
      run(initialQuery.trim());
    }
    return cancel;
  }, [initialQuery, run, cancel]);

  return (
    <section className="meaning-rail" aria-labelledby={`${inputId}-h`}>
      <h2 id={`${inputId}-h`} className="meaning-rail-h">
        {label}
      </h2>
      <p className="meaning-rail-note">{note}</p>

      <form
        className="meaning-rail-form"
        onSubmit={(event) => {
          event.preventDefault();
          run(query);
        }}
      >
        <label className="meaning-rail-label" htmlFor={inputId}>
          Ask in your own words
        </label>
        <div className="meaning-rail-row">
          <input
            id={inputId}
            type="search"
            className="meaning-rail-input"
            value={query}
            placeholder={placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="scr-btn" disabled={phase === "loading"}>
            {phase === "loading" ? "Searching…" : "Find passages"}
          </button>
        </div>
        {!optedIn && (
          <p className="meaning-rail-note">
            {SEMANTIC_DOWNLOAD_NOTICE} Nothing you type leaves this page.
          </p>
        )}
      </form>

      {phase === "loading" && (
        <p className="meaning-rail-status" role="status" aria-live="polite">
          {status || "Searching…"}
        </p>
      )}
      {phase === "error" && (
        <p className="meaning-rail-status" role="alert">
          The meaning search couldn&rsquo;t load. Check your connection and try
          again.
        </p>
      )}
      {phase === "done" && hits.length === 0 && (
        <p className="meaning-rail-status" role="status">
          Nothing here ranked close to “{asked}”.
        </p>
      )}
      {phase === "done" && hits.length > 0 && (
        <>
          <p className="meaning-rail-status" role="status">
            Places to look for “{asked}” — ranked by closeness of wording, not
            by a judgement about meaning.
          </p>
          <ol className="meaning-rail-list">
            {hits.map((hit) => (
              <li key={hit.entry.id}>
                {renderHit(hit)}
                <span className="meaning-rail-score">{hit.score.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
