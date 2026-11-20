import Link from "next/link";
import type { Metadata } from "next";
import HashDisclosureOpener from "@/app/_components/HashDisclosureOpener";
import { getLibrary } from "@/lib/early/library-server";
import { LIBRARY_MEANING_NOTE } from "@/lib/early/library";
import { buildShelves } from "@/lib/early/library-shelves";
import LibraryMeaningRail from "./LibraryMeaningRail";
import LibraryShelves from "./LibraryShelves";

export const metadata: Metadata = { title: "Scripture and early-writings library", description: "Read historical editions by section, compare editions, and find attributed references with explicit coverage and publication limits.", alternates: { canonical: "/early/library" } };

/** Said once, at the top of the opened shelf, instead of on each of its rows. */
const SHELF_NOTES = {
  gnostic: "Six writings on creation, revelation and resurrection, presented for historical reading. Each edition identifies its translation and surviving witnesses. Names in titles do not establish apostolic authorship, and inclusion does not assign canonical status.",
};

export default async function Library({ searchParams }: { searchParams: Promise<{ q?: string; group?: string; work?: string }> }) {
  const { q = "", group = "", work = "" } = await searchParams;
  const catalog = await getLibrary();
  const shelves = buildShelves(catalog);
  const count = (status: string) => catalog.filter(r => r.publicationStatus === status).length;
  return <article className="world-reading-page ew-library">
    <h1>Scripture and early writings</h1>
    <p className="scr-meta ew-library-counts">{catalog.length} entries on {shelves.length} shelves · {count("published")} to read · {count("reference-only")} reference only · {count("deferred")} not yet acquired</p>
    <LibraryShelves key={`${q}|${group}|${work}`} shelves={shelves} initialQuery={q.slice(0, 160)} initialWork={work} openShelf={group} notes={SHELF_NOTES} />
    <HashDisclosureOpener />
    <p className="ew-library-search"><Link href="/early/search" className="textlink">Search text, commentary and source records →</Link></p>
    <LibraryMeaningRail />
    <aside className="world-survival"><h2 className="jsu-chapter">Coverage and source care</h2><p>These groupings describe a library, not a universal canon. Traditions receive these works differently. Fragments remain fragments; a complete edition is not a complete manuscript tradition. Parts and editions can share a work.</p><p>Exact search covers these readable editions, their separately labelled notes, and reference metadata. {LIBRARY_MEANING_NOTE} Scripture allusions still cover the original shelf only.</p><p>Composition dates are left open where this import has no reviewed dating evidence. Modern edition dates are listed separately on each record.</p></aside>
  </article>;
}
