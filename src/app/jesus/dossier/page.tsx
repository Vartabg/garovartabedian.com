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
  buildJesusNotebookLMDossier,
  findJesusDossierPreset,
  JESUS_DOSSIER_PRESETS,
  splitJesusSourceQueries,
} from "@/lib/jesus/notebooklm";
import JesusDossierClient from "./JesusDossierClient";

const MAX_DOSSIER_VERSES_PER_REFERENCE = 200;

export const metadata: Metadata = {
  title: "Jesus Christ NotebookLM Research Dossier Builder",
  description:
    "Build research worksheets from hosted Scripture and curated notes keyed to named Jewish, Roman, and early Christian sources for NotebookLM study.",
  alternates: { canonical: "/jesus/dossier" },
  openGraph: {
    title: "Jesus Christ NotebookLM Research Dossier Engine",
    description:
      "Collate hosted Scripture and curated historical source notes into structured NotebookLM research worksheets about Jesus.",
    url: "/jesus/dossier",
  },
};

export default async function JesusDossierPage({
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
  const exactPreset = JESUS_DOSSIER_PRESETS.find(
    (candidate) => candidate.id === requestedPreset,
  );
  const initialTarget = exactPreset?.id || requestedTarget || JESUS_DOSSIER_PRESETS[0].id;
  const targetParts = splitJesusSourceQueries(initialTarget);
  const targetIsScriptureQuery = targetParts.length > 0 && targetParts.every(
    (part) => Boolean(parseScriptureQueryRef(part, canons)),
  );
  const resolvedPreset = exactPreset ?? (!targetIsScriptureQuery
    ? findJesusDossierPreset(initialTarget)
    : undefined);
  const sourceQuery = resolvedPreset?.query ?? initialTarget;
  const sourceParts = splitJesusSourceQueries(sourceQuery);
  const parsedCandidates = sourceParts.map((part) =>
    parseScriptureQueryRef(part, canons),
  );
  const parsedRefs = parsedCandidates.every(Boolean)
    ? parsedCandidates.filter(
        (parsed): parsed is NonNullable<typeof parsed> => Boolean(parsed),
      )
    : [];
  const primaryVerses: {
    ref: string;
    original?: string;
    brenton?: string;
    drb?: string;
    kjv?: string;
    web?: string;
  }[] = [];

  const verseGroups = await Promise.all(
    parsedRefs.map(async (parsed) => {
      const rows: typeof primaryVerses = [];
      const startVerse = parsed.verse || 1;
      const requestedEnd = parsed.endVerse || (parsed.verse ? parsed.verse : 4);
      if (requestedEnd - startVerse + 1 > MAX_DOSSIER_VERSES_PER_REFERENCE) {
        return rows;
      }
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
          rows.push(row);
        }
      }
      return rows;
    }),
  );
  primaryVerses.push(...verseGroups.flat());

  const initialDossier = buildJesusNotebookLMDossier({
    target: initialTarget,
    canons,
    primaryVerses,
  });

  return (
    <article className="prose-wrap jsu-dossier-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/" className="crumb">
          Home
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <Link href="/jesus" className="crumb">
          Jesus Christ
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="crumb is-current">NotebookLM Dossier Engine</span>
      </nav>

      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <p className="kicker">HOSTED SCRIPTURE · CURATED SOURCE NOTES</p>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          Historical Jesus Research Dossier Engine
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--muted-ink)", maxWidth: "56rem" }}>
          Build a structured Markdown worksheet from hosted Hebrew or Greek text, public-domain translations,
          and curated notes keyed to named Jewish, Roman, and early Christian sources. The export is formatted for
          Google NotebookLM™ and includes prompts for comparing the evidence. Historical notes are research aids;
          check the named work before quoting or publishing them.
        </p>
      </header>

      <Suspense fallback={<div className="scr-loading">Loading research dossier engine...</div>}>
        <JesusDossierClient
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
