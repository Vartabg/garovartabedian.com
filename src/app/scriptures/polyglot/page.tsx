import { Suspense } from "react";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import type { Metadata } from "next";
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
import StudyContextBanner from "../_components/StudyContextBanner";
import { resolveStudyContext } from "@/lib/scriptures/server/study-context";
import { loadStudyPassage, selectHistoricPsalmVerses } from "@/lib/scriptures/study-passage";
import type { StudySearchParams } from "@/lib/scriptures/study-context";

export const metadata: Metadata = {
  title: "Compare translations",
  description:
    "Compare a named Hebrew or Greek edition with Brenton, Douay-Rheims, King James, and World English Bible translations, with word details and source notes.",
  alternates: { canonical: "/scriptures/polyglot" },
  openGraph: {
    title: "Compare translations",
    description:
    "Compare a named Hebrew or Greek edition with Brenton, Douay-Rheims, King James, and World English Bible translations, with word details and source notes.",
    url: "/scriptures/polyglot",
  },
};

export default async function PolyglotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { preset } = params;
  const resolved = await resolveStudyContext(params as StudySearchParams);
  if (resolved.error) return <article className="prose-wrap"><StudyPageHeader path="/scriptures/polyglot" action="Compare a passage across named editions." /><StudyContextBanner context={null} error={resolved.error} /></article>;
  const contextual = resolved.context ? await loadStudyPassage(resolved.context, { book: getBookText, original: getOriginalChapter }) : null;
  const requestedPreset = Array.isArray(preset) ? preset[0] : preset;
  const initialPreset =
    HEXAPLA_PRESETS.find((candidate) => candidate.id === requestedPreset) ??
    HEXAPLA_PRESETS[0];
  const [origChapter, brentonBook, drbBook, kjvBook, webBook] = contextual ? [null, null, null, null, null] : await Promise.all([
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

  const initialAligned = contextual?.aligned ?? alignPolyglotVerses({
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
      <StudyPageHeader
        path="/scriptures/polyglot"
        action="Choose a passage to compare its named Hebrew or Greek edition with the available English translations. Inspect a word for language details; source notes identify each witness."
      />

      <Suspense fallback={<div className="scr-loading">Loading polyglot witnesses...</div>}>
        <PolyglotClient
          key={contextual ? `${contextual.context.bookId}/${contextual.context.chapter}/${contextual.context.verse}/${contextual.context.translation}` : initialPreset.id}
          initialPreset={contextual ? null : initialPreset}
          initialSelection={contextual ? { book: contextual.context.bookId, chapter: contextual.chapter } : undefined}
          initialContext={resolved.context}
          initialSourceText={contextual?.sourceText}
          contextNote={contextual?.note}
          initialAligned={initialAligned}
          bookOrder={canons.bookOrder}
          booksMeta={canons.books}
        />
      </Suspense>
    </article>
  );
}
