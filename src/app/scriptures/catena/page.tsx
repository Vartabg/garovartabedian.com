import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CATENA_RECEPTION } from "@/lib/scriptures/catena";
import CatenaClient from "./CatenaClient";

export const metadata: Metadata = {
  title: "The Computational Catena Aurea — Patristic Reception Chain",
  description:
    "A source-attributed index linking selected Scripture verses with hosted passages from Clement, Ignatius, Polycarp, the Didache, and Barnabas, with editorial notes and NotebookLM export.",
  alternates: { canonical: "/scriptures/catena" },
  openGraph: {
    title: "The Computational Catena Aurea — Patristic Reception Chain",
    description:
      "Trace selected early Christian uses of biblical passages with hosted excerpts, dates, links, and clearly labeled editorial notes.",
    url: "/scriptures/catena",
  },
};

export default function CatenaPage() {
  return (
    <article className="prose-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/scriptures" className="crumb">
          Scriptures
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="crumb is-current">Catena Aurea</span>
      </nav>

      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <p className="kicker">HISTORICAL RECEPTION · SOURCE-ATTRIBUTED LINKS</p>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          The Computational Catena Aurea
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--muted-ink)", maxWidth: "56rem" }}>
          Thomas Aquinas&apos;s medieval <em>Catena Aurea</em> arranged earlier commentary alongside the Gospels. This digital
          index borrows that organizing idea for a smaller, selected set of hosted early Christian passages. Each card
          names its work, section, approximate date, and linked Scripture; the connecting commentary is editorial and
          should be checked against the cited text before reuse. The selection can be exported to Google NotebookLM.
        </p>
      </header>

      <aside className="world-survival" aria-label="Featured source investigation">
        <h2>Isaiah 53 in 1 Clement 16</h2>
        <p>Read the passages together, follow each finding to its evidence, and download a dossier with exact source checks.</p>
        <Link href="/scriptures/investigations/isaiah-53-clement-16" className="textlink">
          Open the source investigation →
        </Link>
      </aside>

      <Suspense fallback={<div className="scr-loading">Loading patristic reception chain...</div>}>
        <CatenaClient initialEntries={CATENA_RECEPTION} />
      </Suspense>
    </article>
  );
}
