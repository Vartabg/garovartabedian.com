import { Suspense } from "react";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import type { Metadata } from "next";
import { canons, getBookText, getOriginalChapter } from "@/lib/scriptures/server";
import { buildNotebookLMDossier, DOSSIER_PRESETS } from "@/lib/site/notebooklm";
import DossierClient from "./DossierClient";
import StudyContextBanner from "../_components/StudyContextBanner";
import { resolveStudyContext } from "@/lib/scriptures/server/study-context";
import { loadStudyPassage } from "@/lib/scriptures/study-passage";
import type { StudySearchParams } from "@/lib/scriptures/study-context";

export const metadata: Metadata = {
  title: "Build a research dossier",
  description:
    "Gather named editions, English translations, and early Christian reception notes into research worksheets for NotebookLM.",
  alternates: { canonical: "/scriptures/dossier" },
  openGraph: {
    title: "Build a research dossier",
    description:
    "Gather named editions, English translations, and early Christian reception notes into research worksheets for NotebookLM.",
    url: "/scriptures/dossier",
  },
};

export default async function DossierPage({ searchParams }: { searchParams: Promise<StudySearchParams> }) {
  const resolved = await resolveStudyContext(await searchParams);
  if (resolved.error) return <article className="prose-wrap"><StudyPageHeader path="/scriptures/dossier" action="Build a research worksheet for your passage." /><StudyContextBanner context={null} error={resolved.error} /></article>;
  const contextual = resolved.context ? await loadStudyPassage(resolved.context, { book: getBookText, original: getOriginalChapter }) : null;
  const initialPreset = DOSSIER_PRESETS[0]; // Isaiah 53
  const initialDossier = buildNotebookLMDossier({
    target: contextual?.target ?? initialPreset.query,
    canons,
    primaryVerses: contextual?.primaryVerses,
    theologicalContext: contextual?.note,
    includeReception: contextual?.includeReception,
  });

  return (
    <article className="prose-wrap">
      <StudyPageHeader
        path="/scriptures/dossier"
        action="Choose a preset or enter a passage, inspect the gathered sources, then copy or download a Markdown worksheet for further study in NotebookLM."
      />

      <Suspense fallback={<div className="scr-loading">Loading the research worksheet…</div>}>
        <DossierClient
          key={contextual ? `${contextual.context.bookId}/${contextual.context.chapter}/${contextual.context.verse}/${contextual.context.translation}` : initialPreset.id}
          canons={canons}
          initialDossier={initialDossier}
          initialTarget={contextual?.target ?? initialPreset.query}
          initialContext={resolved.context}
          initialSourceText={contextual?.sourceText}
          contextNote={contextual?.note}
        />
      </Suspense>
    </article>
  );
}
