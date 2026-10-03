import Link from "next/link";
import type { Metadata } from "next";
import LibraryMeaningRail from "../library/LibraryMeaningRail";
import { searchLibrary, getLibraryRecord } from "@/lib/early/library-server";
import { wordingLabel } from "@/lib/scriptures/search-wording";
import { searchExpansion } from "@/lib/scriptures/search-expansion";
import { librarySearchHref, scriptureSearchHref, withLibraryFindContext } from "@/lib/scriptures/search-url";
import { KIND_LABELS } from "@/lib/early/library";

export const metadata: Metadata = { title: "Search the writings", description: "Search translated texts, edition commentary and reference records separately.", alternates: { canonical: "/early/search" }, robots: { index: false, follow: true } };
export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const q = value("q").slice(0, 160), kind = value("kind") || "all", record = value("record");
  const entry = record ? await getLibraryRecord(record) : null;
  const result = await searchLibrary(q, kind, record, Number(value("page") || 1));
  const pageHref = (page: number) => librarySearchHref(q, kind, record, page);
  const expansion = searchExpansion(q);
  return <article className="world-reading-page">
    <p className="kicker"><Link href="/early/library">The library</Link></p><h1>Search the writings</h1>
    <p className="lede">Find words in their source. Translated text, historical commentary and modern catalog records appear with distinct labels.</p>
    <form action="/early/search" className="ew-library-form">
      <label>Words or a phrase<input type="search" name="q" defaultValue={q} minLength={2} maxLength={160} required placeholder="resurrection, the creation of the world…" /></label>
      <label>Search within<select name="kind" defaultValue={kind}><option value="all">All content types</option>{Object.entries(KIND_LABELS).filter(([key]) => key !== "mixed-edition").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {record && <input type="hidden" name="record" value={record} />}<button type="submit">Search</button>
    </form>
    {entry && <p>Edition: {entry.title} · {entry.editionLabel}. <Link href={`/early/search?${new URLSearchParams({ q, kind })}`}>Search all editions</Link></p>}
    <p className="scr-meta">All hosted paragraphs and edition notes are searched, including the original shelf. Complete phrases come first, followed by word overlap; case, accents and punctuation are ignored. Reference-only results search catalog metadata, never restricted or unproofread source text. Similar words do not establish quotation, influence, agreement or support for a claim.</p>
    {q.trim().length >= 2 && <p>{result.total} matching passages or records · page {result.page}</p>}
    {q.trim().length >= 2 && !result.total && <p role="status">No word matches in the selected texts. Try different wording or another content type.</p>}
    {q.trim().length >= 2 && result.searched.length > 0 && <p className="scr-meta">Search words: {result.searched.join(", ")}. {result.dropped.length > 0 && `Common question words are omitted from word overlap, but kept when checking complete phrases.`}</p>}
    {expansion.negated && <p className="scr-meta">Your negation stays in the query. Word overlap alone does not show whether a passage agrees with it.</p>}
    {q.trim().length >= 2 && expansion.terms.length > 0 && <nav className="scr-search-examples" aria-label="Try related wording">{expansion.terms.map(term => <Link href={librarySearchHref(term, kind, record)} key={term}>Search “{term}”</Link>)}</nav>}
    <LibraryMeaningRail initialQuery={q} />
    {q.trim().length >= 2 && <p className="scr-meta"><Link href={scriptureSearchHref(q, "web", "texts")}>Look in Scripture too</Link> · <Link href={`/early?ask=${encodeURIComponent(q)}`}>Ask the original shelf by meaning</Link>.</p>}
    <ol className="ew-library-results">{result.hits.map(hit => <li key={hit.id}><span className="ew-library-status">{KIND_LABELS[hit.kind]}</span><h2><Link href={withLibraryFindContext(hit.href, q, kind, record, result.page)} prefetch={false}>{hit.title} — {hit.label}</Link></h2><p className="world-cite">{hit.edition}</p><p className="scr-meta">{wordingLabel(hit)}</p><p dir="auto">{hit.snippet}</p></li>)}</ol>
    <nav className="ew-era-pager" aria-label="Search results pages">{result.page > 1 ? <Link href={pageHref(result.page - 1)} prefetch={false}>← Previous results</Link> : <span />}{result.page * 30 < result.total && <Link href={pageHref(result.page + 1)} prefetch={false}>Next results →</Link>}</nav>
  </article>;
}
