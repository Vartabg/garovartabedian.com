import StudyPassageNotice from "../_components/StudyPassageNotice";
import type { StudySearchParams } from "@/lib/scriptures/study-context";
import { Suspense } from "react";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { CATENA_RECEPTION } from "@/lib/scriptures/catena";
import CatenaClient from "./CatenaClient";

export const metadata: Metadata = {
  title: "Catena · early readers",
  description:
    "Follow selected Scripture passages into early Christian writings, with named sources, dates, source-attributed excerpts, and editorial notes.",
  alternates: { canonical: "/scriptures/catena" },
  openGraph: {
    title: "Catena · early readers",
    description:
    "Follow selected Scripture passages into early Christian writings, with named sources, dates, source-attributed excerpts, and editorial notes.",
    url: "/scriptures/catena",
  },
};

export default function CatenaPage({ searchParams }: { searchParams: Promise<StudySearchParams> }) {
  return (
    <article className="prose-wrap">
      <StudyPageHeader
        path="/scriptures/catena"
        action="Choose a passage or an early writer. Each result names the writing, its date, and the source text. Editorial connections remain separate from the quoted passages."
      />

      <aside className="world-survival" aria-label="Featured source investigation">
        <h2>Isaiah 53 in 1 Clement 16</h2>
        <p>Read the passages together, follow each finding to its evidence, and download a dossier with exact source checks.</p>
        <Link href="/scriptures/investigations/isaiah-53-clement-16" className="textlink">
          Open the source investigation →
        </Link>
      </aside>

      <StudyPassageNotice searchParams={searchParams} note="These early readings cover selected passages. Your starting verse is kept above; choose an entry below or return to reading." />

      <Suspense fallback={<div className="scr-loading">Loading early readings…</div>}>
        <CatenaClient initialEntries={CATENA_RECEPTION} />
      </Suspense>
    </article>
  );
}
