import StudyPassageNotice from "../_components/StudyPassageNotice";
import type { StudySearchParams } from "@/lib/scriptures/study-context";
import { Suspense } from "react";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import type { Metadata } from "next";
import { getAllDiachronicConcepts } from "@/lib/scriptures/diachronic";
import DiachronicClient from "./DiachronicClient";

export const metadata: Metadata = {
  title: "Words through time",
  description:
    "Explore selected biblical terms across textual traditions, with source witnesses, editorial histories, and research worksheets.",
  alternates: { canonical: "/scriptures/diachronic" },
  openGraph: {
    title: "Words through time",
    description:
    "Explore selected biblical terms across textual traditions, with source witnesses, editorial histories, and research worksheets.",
    url: "/scriptures/diachronic",
  },
};

export default function DiachronicPage({ searchParams }: { searchParams: Promise<StudySearchParams> }) {
  const concepts = getAllDiachronicConcepts();

  return (
    <article className="prose-wrap">
      <StudyPageHeader
        path="/scriptures/diachronic"
        action="Choose a term and follow its selected uses across textual traditions. Read the witnesses alongside the editorial account; an English gloss does not capture every meaning."
      />

      <StudyPassageNotice searchParams={searchParams} note="These word histories follow selected terms. Your starting verse is kept above while you explore the available histories." />

      <Suspense fallback={<div className="scr-loading">Loading word histories…</div>}>
        <DiachronicClient initialConcepts={concepts} />
      </Suspense>
    </article>
  );
}
