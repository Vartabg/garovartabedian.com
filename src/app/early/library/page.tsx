import Link from "next/link";
import type { Metadata } from "next";
import { getLibrary } from "@/lib/early/library-server";
import LibraryMeaningRail from "./LibraryMeaningRail";
import { LIBRARY_GROUPS, LIBRARY_MEANING_NOTE, recordHref } from "@/lib/early/library";

export const metadata: Metadata = { title: "Scripture and early-writings library", description: "Read historical editions by section, compare editions, and find attributed references with explicit coverage and publication limits.", alternates: { canonical: "/early/library" } };

export default async function Library({ searchParams }: { searchParams: Promise<{ q?: string; group?: string; work?: string }> }) {
  const { q = "", group = "", work = "" } = await searchParams;
  const catalog = await getLibrary();
  const records = catalog.filter(r => (!group || r.group === group) && (!work || r.workId === work) && `${r.title} ${r.edition} ${r.coverage}`.toLowerCase().includes(q.toLowerCase().slice(0, 160)));
  return <article className="world-reading-page">
    <p className="kicker"><Link href="/early">The Writings</Link></p>
    <h1>Scripture and early writings</h1>
    <p className="lede">Historical editions, living questions. Read by book and section, keep translations distinct, and follow every text back to its source.</p>
    <p>These groupings describe a library, not a universal canon. Traditions receive these works differently. Fragments remain fragments; a complete edition is not a complete manuscript tradition.</p>
    <p className="scr-meta">{catalog.filter(r => r.publicationStatus === "published").length} readable edition entries · {catalog.filter(r => r.publicationStatus === "reference-only").length} reference editions · {catalog.filter(r => r.publicationStatus === "deferred").length} awaiting acquisition. Parts and editions can share a work.</p>
    <p><Link href="/early/search" className="textlink">Search text, commentary and source records →</Link></p>
    <LibraryMeaningRail />
    <form className="ew-library-form" action="/early/library">
      <label>Find a work or edition<input type="search" name="q" defaultValue={q} maxLength={160} placeholder="Clement, Philo, Whiston…" /></label>
      <label>Collection<select name="group" defaultValue={group}><option value="">All collections</option>{LIBRARY_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
      {work && <input type="hidden" name="work" value={work} />}
      <button type="submit">Filter library</button>
      <Link href="/early/library">Clear filters</Link>
    </form>
    <nav className="ew-era-nav" aria-label="Library collections">{LIBRARY_GROUPS.map(g => <a key={g.id} href={`#collection-${g.id}`}>{g.label}</a>)}</nav>
    <p className="scr-meta">{records.length} edition and reference entries</p>
    {!records.length && <p>No entries match these filters.</p>}
    {LIBRARY_GROUPS.map(g => {
      const entries = records.filter(r => r.group === g.id);
      return entries.length ? <section key={g.id} id={`collection-${g.id}`} className="ew-era">
        <h2 className="jsu-chapter">{g.label}</h2>
        {g.id === "gnostic" && <p>Six writings on creation, revelation and resurrection, presented for historical reading. Each edition identifies its translation and surviving witnesses. Names in titles do not establish apostolic authorship, and inclusion does not assign canonical status.</p>}
        <div className="scr-cards">{entries.map(r => <Link className="scr-card" href={recordHref(r)} key={r.id} prefetch={false}>
          <span className="ew-library-status">{r.publicationStatus === "published" ? "Read edition" : r.publicationStatus === "deferred" ? "Awaiting acquisition" : "Reference only"}</span>
          <h3>{r.title}</h3><p>{r.editionLabel}</p><p className="scr-meta">{r.coverage}</p>
          {r.existingTextId && <p className="scr-meta">Also on the original shelf · separate edition</p>}
        </Link>)}</div>
      </section> : null;
    })}
    <aside className="world-survival"><h2 className="jsu-chapter">Coverage and source care</h2><p>Exact search covers these readable editions, their separately labelled notes, and reference metadata. {LIBRARY_MEANING_NOTE} Scripture allusions still cover the original shelf only.</p><p>Composition dates are left open where this import has no reviewed dating evidence. Modern edition dates are listed separately on each record.</p></aside>
  </article>;
}
