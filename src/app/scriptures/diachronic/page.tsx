import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllDiachronicConcepts } from "@/lib/scriptures/diachronic";
import DiachronicClient from "./DiachronicClient";

export const metadata: Metadata = {
  title: "The Diachronic Semantic Evolution Tracker — 1,500-Year Sacred Lexicon",
  description:
    "Trace the 1,500-year linguistic migration of core biblical concepts (Ruach, Sheol, Tzedakah, Berith, Logos, Son of Man) from ancient Biblical Hebrew into the Septuagint, Dead Sea Scrolls, New Testament, and Latin Vulgate with NotebookLM dossier export.",
  alternates: { canonical: "/scriptures/diachronic" },
  openGraph: {
    title: "The Diachronic Semantic Evolution Tracker — 1,500-Year Sacred Lexicon",
    description:
      "Witness how biblical concepts shifted as they migrated from Semitic kinetic roots to Hellenistic philosophy and Roman law.",
    url: "/scriptures/diachronic",
  },
};

export default function DiachronicPage() {
  const concepts = getAllDiachronicConcepts();

  return (
    <article className="prose-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/scriptures" className="crumb">
          Scriptures
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="crumb is-current">Diachronic Semantic Evolution</span>
      </nav>

      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <p className="kicker">HISTORICAL LINGUISTICS · 1,500-YEAR SEMANTIC SHIFTS</p>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          The Diachronic Semantic Evolution Tracker
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--muted-ink)", maxWidth: "56rem" }}>
          Theological words are not static mathematical points; they are living rivers that shifted fundamentally as
          ancient Semitic concepts were translated into Hellenistic philosophy and Roman jurisprudence. When Hebrew{" "}
          <em>Ruach</em> (physical wind and blast of the nostrils) became Greek <em>Pneuma</em> and Latin <em>Spiritus</em>
          , or when <em>Tzedakah</em> (covenant rescue of the destitute) became Latin <em>Iustitia</em> (courtroom forensic
          equity), the worldview of believers was radically reshaped. This interactive tracker maps the 1,500-year journey
          of seven core sacred concepts across six eras, complete with manuscript witnesses and NotebookLM synthesis dossiers.
        </p>
      </header>

      <Suspense fallback={<div className="scr-loading">Loading diachronic semantic tracker...</div>}>
        <DiachronicClient initialConcepts={concepts} />
      </Suspense>
    </article>
  );
}
