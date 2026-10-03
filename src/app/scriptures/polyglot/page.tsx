import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  canons,
  getBookText,
  getOriginalChapter,
} from "@/lib/scriptures/server";
import {
  HEXAPLA_PRESETS,
  alignPolyglotVerses,
} from "@/lib/scriptures/polyglot";
import PolyglotClient from "./PolyglotClient";

type HistoricPsalmLocation = {
  chapter: number;
  leadingItems: number;
};

// The hosted Brenton and Douay-Rheims Psalters use Greek/Latin numbering here.
// Keep this table narrow: combined and divided Psalms need passage-specific
// alignment rather than a blanket chapter offset.
const HISTORIC_PSALM_LOCATIONS: Partial<Record<number, HistoricPsalmLocation>> = {
  22: { chapter: 21, leadingItems: 1 },
  110: { chapter: 109, leadingItems: 0 },
};

function selectHistoricPsalmVerses(
  chapters: string[][] | undefined,
  book: string,
  hebrewChapter: number,
): string[] | null {
  const location = book === "PSA" ? HISTORIC_PSALM_LOCATIONS[hebrewChapter] : undefined;
  const verses = chapters?.[(location?.chapter ?? hebrewChapter) - 1] ?? null;

  return verses && location?.leadingItems
    ? verses.slice(location.leadingItems)
    : verses;
}

export const metadata: Metadata = {
  title: "The Living Digital Hexapla & Multi-Witness Polyglot",
  description:
    "Compare hosted original-language editions with Brenton's English Septuagint, Douay-Rheims, the 1769 King James text, and the World English Bible, with morphology, source notes, and NotebookLM export.",
  alternates: { canonical: "/scriptures/polyglot" },
  openGraph: {
    title: "The Living Digital Hexapla & Multi-Witness Polyglot",
    description:
      "A digital comparison of named original-language editions and four public-domain English translations with textual notes.",
    url: "/scriptures/polyglot",
  },
};

export default async function PolyglotPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string | string[] }>;
}) {
  const { preset } = await searchParams;
  const requestedPreset = Array.isArray(preset) ? preset[0] : preset;
  const initialPreset =
    HEXAPLA_PRESETS.find((candidate) => candidate.id === requestedPreset) ??
    HEXAPLA_PRESETS[0];
  const [origChapter, brentonBook, drbBook, kjvBook, webBook] = await Promise.all([
    getOriginalChapter(initialPreset.book, initialPreset.chapter),
    getBookText("brenton", initialPreset.book),
    getBookText("drb", initialPreset.book),
    getBookText("kjv", initialPreset.book),
    getBookText("web", initialPreset.book),
  ]);

  const brentonVerses = selectHistoricPsalmVerses(
    brentonBook?.chapters,
    initialPreset.book,
    initialPreset.chapter,
  );
  const drbVerses = selectHistoricPsalmVerses(
    drbBook?.chapters,
    initialPreset.book,
    initialPreset.chapter,
  );
  const kjvVerses = kjvBook?.chapters[initialPreset.chapter - 1] ?? null;
  const webVerses = webBook?.chapters[initialPreset.chapter - 1] ?? null;

  const initialAligned = alignPolyglotVerses({
    originalChapter: origChapter,
    brentonVerses,
    drbVerses,
    kjvVerses,
    webVerses,
    startVerse: initialPreset.startVerse,
    endVerse: initialPreset.endVerse,
    presetDivergence: initialPreset.textualDivergence,
  });

  return (
    <article className="prose-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/scriptures" className="crumb">
          Scriptures
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="crumb is-current">Digital Hexapla</span>
      </nav>

      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <p className="kicker">COMPUTATIONAL SCHOLARSHIP · MULTI-WITNESS APPARATUS</p>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          The Living Digital Hexapla
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--muted-ink)", maxWidth: "56rem" }}>
          In ca. 240 CE, Origen of Alexandria compiled the <em>Hexapla</em>—a 6-column manuscript comparing the Hebrew
          scriptures with Greek translations. In 1657, Brian Walton published the <em>London Polyglot</em>. Both projects
          sought what was physically impossible in print: universal, simultaneous collation across ancient traditions.
          This computational apparatus aligns named Hebrew or Greek editions with Brenton&apos;s English Septuagint,
          Douay-Rheims English, the hosted 1769 King James text, and the World English Bible, with word-level morphology and source notes.
        </p>
      </header>

      <Suspense fallback={<div className="scr-loading">Loading polyglot witnesses...</div>}>
        <PolyglotClient
          initialPreset={initialPreset}
          initialAligned={initialAligned}
          bookOrder={canons.bookOrder}
          booksMeta={canons.books}
        />
      </Suspense>
    </article>
  );
}
