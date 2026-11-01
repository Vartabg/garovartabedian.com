import StudyPassageNotice from "../_components/StudyPassageNotice";
import type { StudySearchParams } from "@/lib/scriptures/study-context";
import { Suspense } from "react";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import type { Metadata } from "next";
import { getAllDisputations } from "@/lib/scriptures/disputation";
import DisputationClient from "./DisputationClient";

export const metadata: Metadata = {
  title: "Biblical debates",
  description:
    "Explore biblical debates through different positions, cited passages, editorial synthesis, and exportable source worksheets.",
  alternates: { canonical: "/scriptures/disputation" },
  openGraph: {
    title: "Biblical debates",
    description:
    "Explore biblical debates through different positions, cited passages, editorial synthesis, and exportable source worksheets.",
    url: "/scriptures/disputation",
  },
};

export default function DisputationPage({ searchParams }: { searchParams: Promise<StudySearchParams> }) {
  const disputations = getAllDisputations();

  return (
    <article className="prose-wrap">
      <StudyPageHeader
        path="/scriptures/disputation"
        action="Choose a question, read the positions and their cited passages, then examine the synthesis. Export the sources when you want to keep studying."
      />

      <StudyPassageNotice searchParams={searchParams} note="These debates use selected source passages. Your starting verse is kept above while you examine a question." />

      <Suspense fallback={<div className="scr-loading">Loading the debate sources…</div>}>
        <DisputationClient initialDisputations={disputations} />
      </Suspense>
    </article>
  );
}
