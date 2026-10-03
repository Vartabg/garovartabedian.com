"use client";
import { useEffect, useState } from "react";
import type { LibrarySearchResult } from "./library-search";

/** Debounced, cancellable retrieval of bounded excerpts; no provider calls. */
export function useLibrarySearch(query: string, enabled = true, limit = 6) {
  const [state, setState] = useState<{ query: string; result: LibrarySearchResult | null; failed: boolean; loading: boolean }>({ query: "", result: null, failed: false, loading: false });
  const [retry, setRetry] = useState(0);
  const q = query.trim().slice(0, 160);
  useEffect(() => {
    if (!enabled || q.length < 2) return;
    const controller = new AbortController();
    setState({ query: q, result: null, failed: false, loading: true });
    const timer = setTimeout(() => {
      // Preserve same-origin preview authentication; the endpoint itself does
      // not create or inspect assessment visitor identities.
      void fetch(`/api/library-search?${new URLSearchParams({ q, limit: String(limit) })}`, { signal: controller.signal, credentials: "same-origin", cache: "no-store" })
        .then(response => { if (!response.ok) throw new Error("Writings unavailable"); return response.json() as Promise<LibrarySearchResult>; })
        .then(result => { if (!controller.signal.aborted) setState({ query: q, result, failed: false, loading: false }); })
        .catch(() => { if (!controller.signal.aborted) setState({ query: q, result: null, failed: true, loading: false }); });
    }, 280);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, enabled, limit, retry]);
  const current = enabled && q.length >= 2 && state.query === q;
  return { result: current ? state.result : null, failed: current && state.failed, loading: enabled && q.length >= 2 && (!current || state.loading), retry: () => setRetry(n => n + 1) };
}
