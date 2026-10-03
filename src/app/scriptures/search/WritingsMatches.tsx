"use client";
import Link from "next/link";
import { useLibrarySearch } from "@/lib/early/use-library-search";
import { KIND_LABELS, LIBRARY_MEANING_NOTE } from "@/lib/early/library";
import { wordingLabel } from "@/lib/scriptures/search-wording";
import { librarySearchHref, withFindContext } from "@/lib/scriptures/search-url";
import type { TranslationId } from "@/lib/scriptures/types";

export default function WritingsMatches({ query, translation, scope }: { query: string; translation: TranslationId; scope?: string }) {
  const { result, failed, loading, retry } = useLibrarySearch(query);
  if (query.trim().length < 2) return null;
  return <section aria-label="Other writings" className="scr-writings-matches">
    <details>
      <summary>Other writings{result ? ` · ${result.total.toLocaleString()} word matches` : loading ? " · searching…" : ""}</summary>
      <p className="scr-meta">All hosted writing editions and their notes, with paragraphs kept separate. Each result names its own edition; the Scripture selector does not change it. Similarity does not establish quotation, influence, agreement or support.</p>
      {loading && <p role="status">Searching the writings…</p>}
      {failed && <p role="status">Writings search could not load. <button type="button" onClick={retry}>Try again</button></p>}
      {result?.total === 0 && <p>No word matches in the writings. Open the full writings search to try related wording or another content type.</p>}
      {result && <ol className="ew-library-results">{result.hits.map(hit => <li key={hit.id}>
        <span className="ew-library-status">{KIND_LABELS[hit.kind]} · {wordingLabel(hit)}</span>
        <h3><Link href={withFindContext(hit.href, query, translation, scope)} prefetch={false}>{hit.title} — {hit.label}</Link></h3>
        <p className="world-cite">{hit.edition}</p><p dir="auto">{hit.snippet}</p>
      </li>)}</ol>}
      <p><Link href={librarySearchHref(query)}>Search all writing passages and notes →</Link></p>
      <p className="scr-meta">{LIBRARY_MEANING_NOTE} <Link href={librarySearchHref(query)}>Ask the expanded editions by meaning</Link>. The original shelf has its own meaning search.</p>
    </details>
  </section>;
}
