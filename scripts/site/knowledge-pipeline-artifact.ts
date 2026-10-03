import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTACT_METHOD_BY_ID,
  PROFILE,
} from "../../src/lib/portfolio-content";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const ONEPAGER_PDF_PATH = path.join(
  ROOT,
  "public/Enterprise-Knowledge-Pipeline-OnePager.pdf",
);
export const ONEPAGER_MANIFEST_PATH = path.join(
  ROOT,
  "public/meta/knowledge-pipeline-onepager-manifest.json",
);
export const PDF_CONVERTER_PATH = path.join(
  ROOT,
  "scripts/site/make-pdf.sh",
);

const SITE_URL = "https://garovartabedian.com";
export const GENERATED_BY = "scripts/site/build-knowledge-pipeline-onepager.ts";

export type OnePagerArtifactManifest = {
  schemaVersion: 1;
  generatedBy: typeof GENERATED_BY;
  pdfSha256: string;
  htmlSha256: string;
  normalizedTextSha256: string;
  pageCount: number;
  urls: string[];
};

export type OnePagerPdfInspection = {
  pdfSha256: string;
  normalizedText: string;
  normalizedTextSha256: string;
  renderer: string;
  pageCount: number;
  urls: string[];
};

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizePdfText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\u00ad/g, "")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function anchor(href: string, text: string): string {
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

function runTextCommand(command: string, args: string[]): string {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} failed (${result.status}): ${(result.stderr || result.stdout).trim()}`,
    );
  }
  return result.stdout;
}

function parsePdfInfoField(pdfInfo: string, field: string): string {
  const match = pdfInfo.match(new RegExp(`^${field}:\\s+(.+)$`, "m"));
  if (!match) throw new Error(`pdfinfo did not report ${field}`);
  return match[1].trim();
}

function parsePageCount(pdfInfo: string): number {
  return Number.parseInt(parsePdfInfoField(pdfInfo, "Pages"), 10);
}

function parsePdfUrls(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*\d+\s+\S+\s+(\S.*)$/)?.[1]?.trim())
    .filter((url): url is string => Boolean(url))
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .sort();
}

export const ONEPAGER_DATA = {
  title: "Grounded Knowledge Architecture & AI Dossier Pipelines",
  subtitle: "Turn messy enterprise archives into high-density, verified source dossiers engineered for Google NotebookLM™ and enterprise LLMs.",
  problemHeading: "The 'Garbage In, Garbage Out' Barrier in Enterprise AI",
  problemCopy: "Teams want to use generative tools and Google NotebookLM™ to synthesize company knowledge, but raw corporate files are messy: scanned PDFs, fragmented SOPs, contradictory spreadsheets, and disjointed manuals. Off-the-shelf AI hallucinates, drops critical nuance, and loses source context when fed uncurated files.",
  solutionHeading: "The 4-Stage Knowledge Pipeline",
  pipelineStages: [
    {
      title: "1. Ingestion & Sanitization",
      desc: "Cleans OCR errors, extracts complex tables into readable Markdown, and strips formatting noise from proprietary PDFs, Word documents, and manuals.",
    },
    {
      title: "2. Structural Chunking & Metadata",
      desc: "Organizes raw documents into coherent modules stamped with structured YAML frontmatter (dates, authors, document version, access boundaries, and topic tags).",
    },
    {
      title: "3. Source-Linked Provenance",
      desc: "Connects dossier passages to supplied records with paragraph-level citation anchors so reviewers can check the source of a claim.",
    },
    {
      title: "4. Target-Optimized Synthesis",
      desc: "Formats dossiers for Google NotebookLM™, Claude Projects, or private RAG, with source notes and questions for evaluating answers against supplied material. Generated outputs still need source checks.",
    },
  ],
  proofHeading: "Live Engineering Proof",
  proofCopy: "An independent research project on garovartabedian.com demonstrates the approach with multilingual texts, commentary, and historical sources. Its Dossier Engine compiles curated research into downloadable, source-attributed Markdown for review before upload to NotebookLM.",
  proofUrl: `${SITE_URL}/scriptures/dossier`,
  engagementHeading: "How We Work Together",
  tracks: [
    {
      name: "Workflow & Knowledge Diagnostic ($500 fixed)",
      details: "A bounded, one-week diagnostic of your document archives: identifying friction, hallucination risks, tool handoffs, and delivering a proof-of-concept sample dossier.",
    },
    {
      name: "Knowledge Pipeline Sprint (Custom Scope)",
      details: "A focused one-week sprint converting up to 50 complex corporate documents into an indexed, tagged, and verified source dossier library ready for NotebookLM or internal LLM search.",
    },
  ],
};

export function renderOnePagerHtml(): string {
  const d = ONEPAGER_DATA;
  const stages = d.pipelineStages
    .map(
      (stage) => `
      <div class="card">
        <h3>${escapeHtml(stage.title)}</h3>
        <p>${escapeHtml(stage.desc)}</p>
      </div>`,
    )
    .join("");

  const tracks = d.tracks
    .map(
      (t) => `
      <div class="track-item">
        <strong>${escapeHtml(t.name)}</strong>
        <p>${escapeHtml(t.details)}</p>
      </div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(d.title)} — ${escapeHtml(PROFILE.name)}</title>
  <style>
    @page { size: Letter; margin: 0.45in 0.5in; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { color: #20262d; font: 11px/1.24 Arial, Helvetica, sans-serif; }
    a { color: #173f63; text-decoration: none; }
    header { border-bottom: 2px solid #173f63; padding-bottom: 5px; margin-bottom: 7px; }
    .header-top { display: flex; justify-content: space-between; align-items: baseline; }
    h1 { color: #173f63; font-size: 18px; letter-spacing: 0.02em; margin: 0 0 2px; font-weight: 700; }
    .author { font-size: 11.5px; font-weight: 700; color: #35485a; }
    .subtitle { color: #35485a; font-size: 11.5px; font-weight: 700; margin: 2px 0 3px; line-height: 1.2; }
    .contact-bar { color: #52606b; font-size: 9.8px; margin-top: 2px; }
    .contact-bar a { color: #173f63; }
    h2 { color: #173f63; font-size: 10.5px; letter-spacing: 0.06em; line-height: 1.1; margin: 6px 0 2px; text-transform: uppercase; border-bottom: 1px solid #d8e5f0; padding-bottom: 1px; }
    p { margin: 0 0 3px; }
    .lede-box { background: #f4f8fb; border-left: 3px solid #173f63; padding: 5px 8px; margin-bottom: 5px; }
    .grid-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px; }
    .card { background: #fafbfc; border: 1px solid #e1e7ec; border-radius: 3px; padding: 4px 6px; }
    .card h3 { color: #173f63; font-size: 10.5px; margin: 0 0 1px; font-weight: 700; }
    .card p { margin: 0; font-size: 10px; color: #35485a; line-height: 1.2; }
    .proof-box { background: #fdfdfd; border: 1px solid #d8e5f0; border-radius: 3px; padding: 5px 8px; margin-bottom: 5px; }
    .tracks-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px; }
    .track-item { border: 1px solid #c2d6e5; border-radius: 3px; padding: 5px 7px; background: #fff; }
    .track-item strong { color: #173f63; font-size: 10.5px; display: block; margin-bottom: 1px; }
    .track-item p { margin: 0; font-size: 9.8px; color: #35485a; line-height: 1.2; }
    footer { border-top: 1px solid #d8e5f0; padding-top: 4px; font-size: 9.5px; color: #52606b; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <header>
    <div class="header-top">
      <h1>Executive Brief</h1>
      <span class="author">${escapeHtml(PROFILE.name)} · Solutions Engineer</span>
    </div>
    <div class="subtitle">${escapeHtml(d.title)}</div>
    <p style="margin: 0; font-size: 10.5px; color: #35485a;">${escapeHtml(d.subtitle)}</p>
    <div class="contact-bar">
      ${anchor(CONTACT_METHOD_BY_ID.email.href, CONTACT_METHOD_BY_ID.email.display)} | 
      ${anchor(CONTACT_METHOD_BY_ID.phone.href, CONTACT_METHOD_BY_ID.phone.display)} | 
      ${escapeHtml(PROFILE.location)} | 
      ${anchor(`${SITE_URL}/services`, "garovartabedian.com/services")} | 
      ${anchor(`${SITE_URL}/work/garovartabedian`, "Case Study")}
    </div>
  </header>

  <section class="lede-box">
    <h2 style="border: none; margin: 0 0 2px; padding: 0;">${escapeHtml(d.problemHeading)}</h2>
    <p style="margin: 0; font-size: 10.2px; color: #20262d;">${escapeHtml(d.problemCopy)}</p>
  </section>

  <section>
    <h2>${escapeHtml(d.solutionHeading)}</h2>
    <div class="grid-2x2">
      ${stages}
    </div>
  </section>

  <section class="proof-box">
    <h2>${escapeHtml(d.proofHeading)}</h2>
    <p style="font-size: 10px; margin-bottom: 2px;">${escapeHtml(d.proofCopy)}</p>
    <p style="font-size: 9.5px; margin: 0; color: #52606b;">
      Inspect the live Dossier Engine: ${anchor(d.proofUrl, d.proofUrl)}
    </p>
  </section>

  <section>
    <h2>${escapeHtml(d.engagementHeading)}</h2>
    <div class="tracks-grid">
      ${tracks}
    </div>
  </section>

  <footer>
    <span>Garo Vartabedian · U.S. Navy veteran · Former field service engineer</span>
    <span>Ready to turn trapped company knowledge into working intelligence? ${anchor(`${SITE_URL}/services`, "garovartabedian.com/services")}</span>
  </footer>
</body>
</html>`;
}

export function inspectKnowledgePipelinePdf(
  pdfPath = ONEPAGER_PDF_PATH,
): OnePagerPdfInspection {
  const pdf = readFileSync(pdfPath);
  if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error(`${pdfPath} does not begin with a PDF signature`);
  }

  const normalizedText = normalizePdfText(
    runTextCommand("pdftotext", [pdfPath, "-"]),
  );
  const info = runTextCommand("pdfinfo", [pdfPath]);
  const urls = parsePdfUrls(runTextCommand("pdfinfo", ["-url", pdfPath]));

  return {
    pdfSha256: sha256(pdf),
    normalizedText,
    normalizedTextSha256: sha256(normalizedText),
    renderer: parsePdfInfoField(info, "Creator"),
    pageCount: parsePageCount(info),
    urls,
  };
}
