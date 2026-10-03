import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { canons } from "@/lib/scriptures/server";
import { buildNotebookLMDossier, DOSSIER_PRESETS } from "@/lib/site/notebooklm";
import DossierClient from "./DossierClient";

export const metadata: Metadata = {
  title: "Universal NotebookLM Research Dossier Engine — Grounded Classical Synthesis",
  description:
    "Compile named original-language editions, public-domain English translations, and source-attributed early Christian reception notes into research worksheets for Google NotebookLM.",
  alternates: { canonical: "/scriptures/dossier" },
  openGraph: {
    title: "Universal NotebookLM Research Dossier Engine — Grounded Classical Synthesis",
    description:
      "Bridge ancient scholarship and modern AI: collate multi-witness textual divergence and patristic reception into NotebookLM dossiers.",
    url: "/scriptures/dossier",
  },
};

export default function DossierPage() {
  const initialPreset = DOSSIER_PRESETS[0]; // Isaiah 53
  const initialDossier = buildNotebookLMDossier({
    target: initialPreset.query,
    canons,
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
        <span className="crumb is-current">NotebookLM Dossier Engine</span>
      </nav>

      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <p className="kicker">SOURCE-ATTRIBUTED TEXTS · EDITORIAL NOTES LABELED</p>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          Universal NotebookLM Research Dossier Engine
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--muted-ink)", maxWidth: "56rem" }}>
          Google NotebookLM is a breakthrough in grounded synthetic research, but gathering and translating ancient
          multilingual editions alongside early Christian reception material can require extensive manual archival work.
          This engine compiles hosted Hebrew or Greek morphology, public-domain English translations, and source-attributed
          reception notes into structured Markdown worksheets, with prompts that ask NotebookLM to distinguish text from interpretation.
        </p>
      </header>

      <Suspense fallback={<div className="scr-loading">Loading research dossier engine...</div>}>
        <DossierClient
          canons={canons}
          initialDossier={initialDossier}
          initialTarget={initialPreset.query}
        />
      </Suspense>
    </article>
  );
}
