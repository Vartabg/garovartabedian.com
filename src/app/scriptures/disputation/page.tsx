import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllDisputations } from "@/lib/scriptures/disputation";
import DisputationClient from "./DisputationClient";

export const metadata: Metadata = {
  title: "The Polyphonic Sacred Disputation Engine — Great Biblical Debates",
  description:
    "Stage the foundational theological disputations of Scripture and tradition: Suffering in Job vs Proverbs vs Qoheleth; Justification in Paul vs James vs 1 Clement; Christology in Mark vs John vs Ignatius with NotebookLM debate dossier export.",
  alternates: { canonical: "/scriptures/disputation" },
  openGraph: {
    title: "The Polyphonic Sacred Disputation Engine — Great Biblical Debates",
    description:
      "Explore the multi-vocal, dialectical depth of sacred texts without flattening them into artificial uniformity.",
    url: "/scriptures/disputation",
  },
};

export default function DisputationPage() {
  const disputations = getAllDisputations();

  return (
    <article className="prose-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/scriptures" className="crumb">
          Scriptures
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="crumb is-current">Sacred Disputations</span>
      </nav>

      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <p className="kicker">POLYPHONIC CANON · THEOLOGICAL DIALECTICS</p>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          The Polyphonic Sacred Disputation Engine
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--muted-ink)", maxWidth: "56rem" }}>
          Sacred scripture is not a flat, monotonic legal textbook; it is a living cathedral of distinct, dialectical
          voices speaking across centuries. When Proverbs&apos; moral order meets Job&apos;s agonized protest of innocence,
          or when Paul&apos;s radical unmerited justification meets James&apos;s piercing moral demand for living works,
          the canon refuses to erase either voice. This engine stages the monumental disputations of biblical and
          patristic history side-by-side, analyzing their pastoral battlegrounds and generating dialectical debate
          dossiers tailored for Google NotebookLM synthesis.
        </p>
      </header>

      <Suspense fallback={<div className="scr-loading">Loading sacred disputation engine...</div>}>
        <DisputationClient initialDisputations={disputations} />
      </Suspense>
    </article>
  );
}
