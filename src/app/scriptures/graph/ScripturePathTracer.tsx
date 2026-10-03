"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type IconicPath,
  PathTraceError,
  type PathTraceResult,
  resolveNodeId,
  tracePath,
} from "@/lib/scriptures/graph-tracer";
import type { Canons } from "@/lib/scriptures/types";
import PathMap from "./PathMap";

const MAX_LINKS = 6;

function exampleResult(example: IconicPath): PathTraceResult {
  return {
    from: example.from,
    to: example.to,
    hops: example.hops,
    chain: example.chain,
    title: example.title,
    theme: example.theme,
    isIconic: true,
  };
}

function explainError(error: unknown) {
  if (error instanceof PathTraceError) {
    return error.code === "invalid-reference"
      ? `${error.message} Enter one hosted verse, such as “John 3:16”.`
      : "The cross-reference data could not be loaded. Check your connection and try again.";
  }
  return "The path could not be traced. Please try again.";
}

export function ScripturePathTracer({
  canons,
  iconicPaths,
}: {
  canons: Canons;
  iconicPaths: IconicPath[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initial = iconicPaths[0] ?? null;

  const [from, setFrom] = useState(initial?.from ?? "Genesis 1:1");
  const [to, setTo] = useState(initial?.to ?? "Revelation 21:1");
  const [presetId, setPresetId] = useState<string | null>(initial?.id ?? null);
  const [result, setResult] = useState<PathTraceResult | null>(
    initial ? exampleResult(initial) : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [copied, setCopied] = useState(false);

  const clear = useCallback(() => {
    requestId.current += 1;
    setResult(null);
    setPresetId(null);
    setLoading(false);
    setError(null);
    setRetryable(false);
    setCopied(false);
  }, []);

  const trace = useCallback(
    async (start: string, end: string, updateUrl: boolean) => {
      const id = ++requestId.current;
      setResult(null);
      setPresetId(null);
      setLoading(true);
      setError(null);
      setRetryable(false);
      setCopied(false);
      try {
        const next = await tracePath(start, end, canons);
        if (requestId.current !== id) return;
        if (!next) {
          setError(
            `No route was found within ${MAX_LINKS} cross-reference links through the indexed hubs.`,
          );
          return;
        }
        setResult(next);
        if (updateUrl) {
          const startId = resolveNodeId(start, canons);
          const endId = resolveNodeId(end, canons);
          if (startId && endId) {
            const query = `from=${encodeURIComponent(startId)}&to=${encodeURIComponent(endId)}`;
            router.replace(`/scriptures/graph?${query}`, { scroll: false });
          }
        }
      } catch (caught) {
        if (requestId.current === id) {
          setError(explainError(caught));
          setRetryable(caught instanceof PathTraceError && caught.code === "load-failed");
        }
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    },
    [canons, router],
  );

  useEffect(() => {
    const query = searchParams.toString();
    const selectedId = searchParams.get("preset");
    const selected = selectedId
      ? iconicPaths.find((example) => example.id === selectedId)
      : null;
    if (selected) {
      requestId.current += 1;
      setFrom(selected.from);
      setTo(selected.to);
      setPresetId(selected.id);
      setResult(exampleResult(selected));
      setLoading(false);
      setError(null);
      setRetryable(false);
      return;
    }
    const start = searchParams.get("from");
    const end = searchParams.get("to");
    if (start && end) {
      setFrom(start);
      setTo(end);
      void trace(start, end, false);
      return;
    }
    if (query) {
      clear();
      setError("A shared path needs both a start verse and an end verse.");
      setRetryable(false);
      return;
    }
    if (initial) {
      requestId.current += 1;
      setFrom(initial.from);
      setTo(initial.to);
      setPresetId(initial.id);
      setResult(exampleResult(initial));
      setLoading(false);
      setError(null);
      setRetryable(false);
    }
  }, [clear, iconicPaths, initial, searchParams, trace]);

  useEffect(
    () => () => {
      requestId.current += 1;
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const chooseExample = (example: IconicPath) => {
    requestId.current += 1;
    setFrom(example.from);
    setTo(example.to);
    setPresetId(example.id);
    setResult(exampleResult(example));
    setLoading(false);
    setError(null);
    setRetryable(false);
    setCopied(false);
    const query = `preset=${encodeURIComponent(example.id)}`;
    router.replace(`/scriptures/graph?${query}`, { scroll: false });
  };

  const copyLink = async () => {
    try {
      if (!result) return;
      const query = presetId
        ? `preset=${encodeURIComponent(presetId)}`
        : `from=${encodeURIComponent(result.chain[0].id)}&to=${encodeURIComponent(result.chain.at(-1)!.id)}`;
      await navigator.clipboard.writeText(
        new URL(`/scriptures/graph?${query}`, window.location.origin).href,
      );
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError("The link could not be copied. You can copy it from the address bar.");
      setRetryable(false);
    }
  };

  return (
    <section className="scr-path-tracer" aria-labelledby="tracer-heading">
      <header className="scr-path-tracer-head">
        <p className="kicker">Follow the links</p>
        <h2 id="tracer-heading">Trace a cross-reference path</h2>
        <p className="scr-path-tracer-sub">
          Enter two hosted verses. The tracer follows indexed cross-reference links in either
          direction, using up to {MAX_LINKS} links through the 1,000 most connected hubs.
        </p>
        <p className="scr-path-tracer-note">
          A link marks a study connection in the source index; it does not by itself establish a
          quotation, agreement, or theological conclusion.
        </p>
      </header>

      {iconicPaths.length > 0 ? (
        <div className="scr-path-presets" aria-label="Editorial path examples">
          <span className="scr-path-presets-label">Editorial examples</span>
          <div className="scr-path-presets-scroll">
            {iconicPaths.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => chooseExample(example)}
                className={`scr-path-preset-chip${presetId === example.id ? " is-active" : ""}`}
                aria-pressed={presetId === example.id}
              >
                <span className="scr-path-preset-title">{example.title}</span>
                <span className="scr-path-preset-refs">
                  {example.from} <span aria-hidden="true">→</span> {example.to}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form
        className="scr-path-form"
        aria-label="Trace a cross-reference path"
        onSubmit={(event) => {
          event.preventDefault();
          void trace(from, to, true);
        }}
      >
        <div className="scr-path-input-group">
          <label className="scr-path-label" htmlFor="path-from-input">Start verse</label>
          <input
            id="path-from-input"
            className="scr-path-input"
            value={from}
            onChange={(event) => {
              clear();
              setFrom(event.target.value);
            }}
            aria-describedby="path-input-hint"
            autoComplete="off"
            placeholder="Genesis 1:1"
          />
        </div>
        <button
          type="button"
          className="scr-path-swap-btn"
          aria-label="Swap start and end verses"
          onClick={() => {
            clear();
            setFrom(to);
            setTo(from);
          }}
        >
          <span aria-hidden="true">⇄</span>
        </button>
        <div className="scr-path-input-group">
          <label className="scr-path-label" htmlFor="path-to-input">End verse</label>
          <input
            id="path-to-input"
            className="scr-path-input"
            value={to}
            onChange={(event) => {
              clear();
              setTo(event.target.value);
            }}
            aria-describedby="path-input-hint"
            autoComplete="off"
            placeholder="Revelation 21:1"
          />
        </div>
        <button className="scr-path-submit-btn" type="submit" disabled={loading}>
          {loading ? "Tracing…" : "Trace path"}
        </button>
        <p className="scr-path-form-hint" id="path-input-hint">
          Use one verse per field, such as John 3:16 or GEN.1.1.
        </p>
      </form>

      {loading ? <p className="scr-path-status" role="status">Finding a route…</p> : null}
      {error ? (
        <div className="scr-path-error" role="alert">
          <p>{error}</p>
          {retryable ? (
            <button
              className="scr-path-error-retry"
              type="button"
              onClick={() => void trace(from, to, true)}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
      {result ? (
        <div className="scr-path-result" aria-live="polite">
          <div className="scr-path-result-header">
            <div>
              {result.theme ? <span className="scr-path-theme-tag">{result.theme}</span> : null}
              <h3 className="scr-path-result-title">
                {result.title ?? `${result.from} to ${result.to}`}
              </h3>
            </div>
            <div className="scr-path-result-meta">
              <span className="scr-path-hops-pill">
                {result.hops === 0
                  ? "Same verse"
                  : `${result.hops} link${result.hops === 1 ? "" : "s"} · ${result.chain.length} passages`}
              </span>
              <button className="scr-path-copy-btn" type="button" onClick={() => void copyLink()}>
                {copied ? "Link copied" : "Copy path link"}
              </button>
            </div>
          </div>
          <PathMap key={result.chain.map((step) => step.id).join("|")} chain={result.chain} />
          <details className="scr-path-transcript"><summary>Read every passage in order</summary>
          <ol className="scr-path-chain" aria-label="Passages along the cross-reference path">
            {result.chain.map((step, index) => {
              const end = index === result.chain.length - 1;
              const label = index === 0 ? "Start" : end ? "End" : `Step ${index + 1}`;
              return (
                <li className="scr-path-step" key={step.id}>
                  <div className="scr-path-step-card">
                    <div className="scr-path-step-badge-row">
                      <span
                        className={`scr-path-step-badge${index === 0 ? " origin" : end ? " destination" : ""}`}
                      >
                        {label}
                      </span>
                      <Link className="scr-path-step-link" href={step.href}>
                        {step.ref} <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                    {step.snippet ? (
                      <blockquote className="scr-path-step-snippet">{step.snippet}</blockquote>
                    ) : null}
                  </div>
                  {!end ? (
                    <div className="scr-path-connector" aria-hidden="true">
                      <div className="scr-path-connector-line" />
                      <span className="scr-path-connector-badge">cross-reference</span>
                      <div className="scr-path-connector-line" />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
          </details>
        </div>
      ) : null}
    </section>
  );
}
