import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  canons,
  getBookText,
  getOriginalChapter,
} from "@/lib/scriptures/server";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";
import {
  buildAngelsNotebookLMDossier,
  findAngelsDossierPreset,
  ANGELS_DOSSIER_PRESETS,
} from "@/lib/angels/notebooklm";
import AngelsDossierClient from "./AngelsDossierClient";

const MAX_DOSSIER_VERSES_PER_REFERENCE = 200;

export const metadata: Metadata = {
  title: "Angels & Demons NotebookLM Research Dossier Builder",
  description:
    "Build research worksheets from hosted Scripture, curated textual notes, and named Second Temple and patristic sources for NotebookLM study.",
  alternates: { canonical: "/angels/dossier" },
  openGraph: {
    title: "Angels & Demons NotebookLM Research Dossier Engine",
    description:
      "Collate hosted Scripture and curated source notes about ancient angelology into structured NotebookLM research worksheets.",
    url: "/angels/dossier",
  },
};

export default async function AngelsDossierPage({
  searchParams,
}: {
  searchParams: Promise<{
    preset?: string | string[];
    target?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedPreset = Array.isArray(params.preset)
    ? params.preset[0]
    : params.preset;
  const requestedTarget = (
    Array.isArray(params.target) ? params.target[0] : params.target
  )?.trim();
  const exactPreset = ANGELS_DOSSIER_PRESETS.find(
    (candidate) => candidate.id === requestedPreset,
  );
  const initialTarget = exactPreset?.id || requestedTarget || ANGELS_DOSSIER_PRESETS[0].id;
  const parsedTarget = parseScriptureQueryRef(initialTarget, canons);
  const resolvedPreset = exactPreset ?? (!parsedTarget
    ? findAngelsDossierPreset(initialTarget)
    : undefined);
  const sourceQuery = resolvedPreset?.query ?? initialTarget;
  const parsed = parseScriptureQueryRef(sourceQuery, canons);
  const primaryVerses: {
    ref: string;
    original?: string;
    brenton?: string;
    drb?: string;
    kjv?: string;
    web?: string;
    charles?: string;
  }[] = [];

  if (parsed) {
    const startVerse = parsed.verse || 1;
    const requestedEnd = parsed.endVerse || (parsed.verse ? parsed.verse : 4);

    if (
      requestedEnd - startVerse + 1 <= MAX_DOSSIER_VERSES_PER_REFERENCE &&
      (parsed.book === "ENO" || parsed.book === "JUB")
    ) {
      const charlesBook = await getBookText("charles", parsed.book).catch(() => null);
      const endVerse = Math.min(
        requestedEnd,
        charlesBook?.chapters[parsed.chapter - 1]?.length ?? 0,
      );
      for (let verse = startVerse; verse <= endVerse; verse += 1) {
        const text = charlesBook?.chapters[parsed.chapter - 1]?.[verse - 1];
        if (text) {
          primaryVerses.push({
            ref: `${canons.books[parsed.book]?.name || parsed.book} ${parsed.chapter}:${verse}`,
            charles: text,
          });
        }
      }
    } else if (requestedEnd - startVerse + 1 <= MAX_DOSSIER_VERSES_PER_REFERENCE) {
      const [original, brenton, drb, kjv, web] = await Promise.all([
        getOriginalChapter(parsed.book, parsed.chapter).catch(() => null),
        getBookText("brenton", parsed.book).catch(() => null),
        getBookText("drb", parsed.book).catch(() => null),
        getBookText("kjv", parsed.book).catch(() => null),
        getBookText("web", parsed.book).catch(() => null),
      ]);
      const maxVerse = Math.max(
        original?.verses.at(-1)?.number ?? 0,
        brenton?.chapters[parsed.chapter - 1]?.length ?? 0,
        drb?.chapters[parsed.chapter - 1]?.length ?? 0,
        kjv?.chapters[parsed.chapter - 1]?.length ?? 0,
        web?.chapters[parsed.chapter - 1]?.length ?? 0,
      );
      const endVerse = Math.min(requestedEnd, maxVerse);

      for (let verse = startVerse; verse <= endVerse; verse += 1) {
        const originalText = original?.verses
          .find((entry) => entry.number === verse)
          ?.words.map((word) => word.text)
          .join(" ");
        const row = {
          ref: `${canons.books[parsed.book]?.name || parsed.book} ${parsed.chapter}:${verse}`,
          original: originalText,
          brenton: brenton?.chapters[parsed.chapter - 1]?.[verse - 1],
          drb: drb?.chapters[parsed.chapter - 1]?.[verse - 1],
          kjv: kjv?.chapters[parsed.chapter - 1]?.[verse - 1],
          web: web?.chapters[parsed.chapter - 1]?.[verse - 1],
        };
        if ([row.original, row.brenton, row.drb, row.kjv, row.web].some(Boolean)) {
          primaryVerses.push(row);
        }
      }
    }
  }

  const initialDossier = buildAngelsNotebookLMDossier({
    target: initialTarget,
    canons,
    primaryVerses,
  });

  return (
    <article className="prose-wrap an-dossier-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/" className="crumb">
          Home
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <Link href="/angels" className="crumb">
          Angels &amp; Demons
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="crumb is-current">NotebookLM Dossier Engine</span>
      </nav>

      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <p className="kicker">HOSTED SCRIPTURE · CURATED SOURCE NOTES</p>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          Angels &amp; Demons Research Dossier Engine
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--muted-ink)", maxWidth: "56rem" }}>
          Build a structured Markdown worksheet from hosted Hebrew or Greek text, public-domain translations,
          and curated notes keyed to named Second Temple and early Christian sources. The export is formatted for
          Google NotebookLM™ and includes prompts for comparing the evidence. Historical notes are research aids;
          check the named work before quoting or publishing them.
        </p>
      </header>

      <Suspense fallback={<div className="scr-loading">Loading research dossier engine...</div>}>
        <AngelsDossierClient
          key={initialTarget}
          canons={canons}
          initialDossier={initialDossier}
          initialPresetId={resolvedPreset?.id ?? ""}
          initialTarget={initialTarget}
        />
      </Suspense>
    </article>
  );
}
