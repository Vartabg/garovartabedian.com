"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./connections.module.css";

export type GraphThread = { from: string; to: string; hops: number; chain: Array<{ ref: string; href: string }> };
const PAGE_SIZE = 12;

export default function ThreadBrowser({ threads: initialThreads, total }: { threads: GraphThread[]; total: number }) {
  const [threads, setThreads] = useState(initialThreads);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const loadAll = async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setStatus("loading");
    try {
      const response = await fetch("/scriptures/graph/threads.json", { signal: request.signal });
      if (!response.ok) throw new Error("Unavailable");
      const data: unknown = await response.json();
      if (!Array.isArray(data) || data.length !== total || !data.every((thread) =>
        typeof thread?.from === "string" && typeof thread?.to === "string" && Number.isInteger(thread?.hops) &&
        Array.isArray(thread?.chain) && thread.chain.length > 0 && thread.chain.every((step: { ref?: unknown; href?: unknown }) =>
          typeof step?.ref === "string" && typeof step?.href === "string" && /^\/scriptures\/[a-z]+\/[A-Z0-9]+\/\d+#v\d+$/.test(step.href)))) throw new Error("Invalid paths");
      if (request.signal.aborted) return;
      setThreads(data);
      setStatus("ready");
    } catch { if (!request.signal.aborted) setStatus("error"); }
  };
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? threads.filter((thread) => thread.chain.some((step) => step.ref.toLowerCase().includes(needle))) : threads;
  }, [query, threads]);
  const count = Math.ceil(filtered.length / PAGE_SIZE);
  return <div>
    {status !== "ready" && <div className={styles.pagination}>
      <button type="button" disabled={status === "loading"} onClick={() => void loadAll()}>{status === "loading" ? "Loading paths…" : status === "error" ? "Retry loading all paths" : `Browse all ${total.toLocaleString("en-US")} paths`}</button>
    </div>}
    {status === "error" && <p role="alert">The full path index could not load. The initial examples remain available; check your connection and retry.</p>}
    <label className={styles.threadSearch}>Find a book or verse in these paths
      <input type="search" disabled={status !== "ready"} placeholder="For example, Isaiah or John 3:16" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
    </label>
    <p role="status" className={styles.resultCount}>{filtered.length.toLocaleString("en-US")} of {total.toLocaleString("en-US")} paths{count > 0 ? ` · page ${page + 1} of ${count}` : ""}{status !== "ready" ? " · initial examples" : ""}</p>
    <ol className="scr-graph-threads" start={page * PAGE_SIZE + 1}>
      {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((thread) => <li key={`${thread.from}-${thread.to}`}>
        <p className="scr-graph-thread-meta">{thread.from} → {thread.to} · {thread.hops} links</p>
        <p className="scr-graph-thread-chain">{thread.chain.map((step, index) => <span key={`${index}-${step.href}`}>{index > 0 && <span aria-hidden="true"> → </span>}<Link href={step.href} prefetch={false}>{step.ref}</Link></span>)}</p>
        <Link className={styles.traceThread} prefetch={false} href={`/scriptures/graph?from=${encodeURIComponent(thread.from)}&to=${encodeURIComponent(thread.to)}#tracer-heading`}>Explore this path →</Link>
      </li>)}
    </ol>
    <nav className={styles.pagination} aria-label="Hub path pages">
      <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>← Previous paths</button>
      <button type="button" disabled={page + 1 >= count} onClick={() => setPage((current) => current + 1)}>Next paths →</button>
    </nav>
  </div>;
}
