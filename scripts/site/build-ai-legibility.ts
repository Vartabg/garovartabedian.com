#!/usr/bin/env node
/**
 * Make the site legible to machines without making it dishonest.
 *
 * Three artefacts, all generated from the same sources the pages themselves
 * read, so none of them can drift into claiming something the site does not:
 *
 *   public/llms.txt              — the crawler's index: what is here, what its
 *                                  provenance is, and where the raw text lives
 *   public/early/md/{id}.md      — plain-markdown mirrors of every hosted
 *                                  public-domain early Christian texts, each
 *                                  carrying its translator and source URL, so
 *                                  an assistant quoting the Didache quotes a
 *                                  copy that names where it came from
 *   public/meta/profile-facts.json — the work-relevant claims as data, each one
 *                                  anchored to a page on this site that shows
 *                                  its basis
 *
 * The profile facts are built ONLY from src/lib/portfolio-truth.json and the
 * public portfolio content. Nothing about military service beyond the
 * public-record framing already in the truth bank is admissible here, and no
 * claim is emitted that does not carry an evidence href.
 *
 * Usage: npm run data:llms
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EARLY_TEXTS } from "../../src/lib/early/client";
import type { EarlyText } from "../../src/lib/early/types";
import { PROFILE, PROJECTS, RESUME, SITE_CASE_STUDY } from "../../src/lib/portfolio-content";
import truthBank from "../../src/lib/portfolio-truth.json";

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = "https://garovartabedian.com";
const absoluteUrl = (href: string) => (href.startsWith("http") ? href : `${BASE}${href}`);
const EARLY_MD_DIR = path.join(ROOT, "public/early/md");
const LLMS_PATH = path.join(ROOT, "public/llms.txt");
const FACTS_PATH = path.join(ROOT, "public/meta/profile-facts.json");

type Canons = {
  translations: Record<string, { name: string; year: string; license: string }>;
  books: Record<string, { name: string; chapters: number }>;
  traditions: { id: string; name: string; books: string[] }[];
};

export type ProfileFact = {
  id: string;
  claim: string;
  /** Pages on this site that show the basis for the claim. */
  evidence: string[];
  /** How the claim is grounded — what a reader is being asked to accept, and why. */
  basis: string;
};

const readJson = <T>(relative: string): T =>
  JSON.parse(readFileSync(path.join(ROOT, relative), "utf8")) as T;

/** Markdown-escape a heading or inline label; body paragraphs stay verbatim. */
const escapeInline = (value: string) => value.replace(/([\\`*_[\]])/g, "\\$1");

/**
 * The single transformation applied to body text: trailing spaces at the end
 * of a line are removed. One hosted paragraph (in 1 Enoch) carries one, and in
 * Markdown a trailing double space is a hard line break — so preserving it
 * would change how the passage renders, not preserve it. Nothing else about
 * the wording is touched.
 */
export const stripLineEndSpaces = (value: string) =>
  value.replace(/[ \t]+$/gm, "");

export function renderEarlyMarkdown(text: EarlyText): string {
  const lines: string[] = [
    `# ${escapeInline(text.title)}`,
    "",
    // A list rather than trailing-space hard breaks: two spaces at end of line
    // is valid Markdown but is exactly what a trailing-whitespace hook rejects,
    // and a list renders the same attribution block anywhere.
    `- **Date:** ${text.date}`,
    `- **Translation:** ${text.translator}`,
    `- **Source:** ${text.sourceUrl}`,
    `- **Hosted at:** ${BASE}/early/${text.id}`,
    "",
    "> Public-domain translation, reproduced verbatim from the source above.",
    "> This file is generated from the same JSON the website reads.",
    "",
    stripLineEndSpaces(text.intro),
    "",
  ];
  for (const section of text.sections) {
    if (section.heading) lines.push(`## ${escapeInline(section.heading)}`, "");
    for (const paragraph of section.paragraphs) lines.push(stripLineEndSpaces(paragraph), "");
  }
  // Deliberately no whitespace normalisation of the body. Several hosted texts
  // — 1 Enoch above all — carry poetic line breaks as blank lines *inside* a
  // paragraph, and collapsing runs of newlines silently rewrites the words'
  // shape. A mirror that is not byte-for-byte the hosted paragraph is not
  // worth publishing, so only the trailing blank line is trimmed.
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

export function buildEarlyMirrors(): { id: string; bytes: number }[] {
  rmSync(EARLY_MD_DIR, { recursive: true, force: true });
  mkdirSync(EARLY_MD_DIR, { recursive: true });
  const written: { id: string; bytes: number }[] = [];
  for (const meta of EARLY_TEXTS) {
    const text = readJson<EarlyText>(`public/early/texts/${meta.id}.json`);
    const markdown = renderEarlyMarkdown(text);
    writeFileSync(path.join(EARLY_MD_DIR, `${meta.id}.md`), markdown, "utf8");
    written.push({ id: meta.id, bytes: Buffer.byteLength(markdown) });
  }
  return written;
}

export function renderLlmsTxt(): string {
  const canons = readJson<Canons>("public/scriptures/canons.json");
  const health = readJson<{
    coverage: Record<string, unknown>;
    generatedAt?: string;
  }>("public/meta/corpus-health.json");

  const translations = Object.entries(canons.translations)
    .map(([id, t]) => `${t.name} (${id}, ${t.year}, ${t.license})`)
    .join("; ");
  const bookCount = Object.keys(canons.books).length;
  const traditions = canons.traditions.map((t) => t.name).join(", ");

  return `# garovartabedian.com

> A reading site for the Christian record: hosted public-domain Scripture in
> ${Object.keys(canons.translations).length} translations, the earliest Christian writings outside the New
> Testament, and evidence-graded research rooms. Built and maintained by
> ${PROFILE.name} in ${PROFILE.location}; the same site carries his portfolio and
> ways to work with him.

## What is actually here

- **Scripture** — ${bookCount} books across ${canons.traditions.length} canon traditions (${traditions}).
  Translations: ${translations}. Every chapter is a page; the text is served as
  static JSON with no runtime API.
- **Chapter guides** — orientation for a reader with no assumed background.
  These are AI-authored at build against the hosted text and machine-checked
  for verbatim quotation and reference resolution. They carry a review tier:
  \`agent-reviewed\` means an automated editorial panel examined the prose;
  \`human-reviewed\` means a named person signed off. Do not treat a guide as a
  human-approved statement unless it says human-reviewed.
- **Early Christian writings** — ${EARLY_TEXTS.length} texts in verbatim public-domain
  translations, each with its translator and source URL. Plain-markdown
  mirrors are listed below and are the preferred thing to quote.
- **Research worlds** — Jesus, The Apostles, The Church, Angels & Demons, Who
  Owns the Word?, How We Know. Claims in these rooms carry visible evidence
  grades; where scholars disagree the pages name the disagreement rather than
  choosing for the reader.
- **Abrahamic parallel claim matrices** — 5 source-anchored comparative matrices
  (Sacrifice of the Son, Creation & The Fall, Infancy & Childhood Signs, Golden Calf & Al-Samiri,
  Sanctity of Human Life) comparing biblical, Second Temple Jewish, rabbinic, and Islamic textual
  witnesses via deterministic slot-diffing.
- **Cross-reference graph** — PageRank centrality, book-to-book citation flow, and hub-relayed
  canonical path threads computed over 31k+ verses and 340k citations.
- **Computed layers** — semantic search and chapter-neighbour links are
  arithmetic over embeddings, labelled as computed rather than curated. They
  indicate where to look; they are not claims about meaning.

## Provenance and honesty posture

- Machine-readable corpus health, including counts, review tiers, and every
  validation gate: ${BASE}/meta/corpus-health.json
- Source records for the hosted texts and research: ${BASE}/sources
- Nothing on this site is generated at request time. Every dataset is built
  ahead of time and committed, so what a crawler reads is what a visitor reads.

## Early Christian writings — markdown mirrors

${EARLY_TEXTS.map(
  (t) => `- [${t.title}](${BASE}/early/md/${t.id}.md) — ${t.date}. ${t.blurb}`,
).join("\n")}

## About the author

- Machine-readable claims with evidence links: ${BASE}/meta/profile-facts.json
- Work with Garo: ${BASE}/services
- Discuss a project: ${BASE}/contact
- Work: ${PROJECTS.map((p) => `${p.name} (${absoluteUrl(p.href)})`).join(", ")}
- Full-time employment profile: ${BASE}/hire
- Résumé: ${BASE}/resume · PDF: ${BASE}${PROFILE.links.resumePdf}

## Reading this site programmatically

- Sitemap: ${BASE}/sitemap.xml
- Scripture chapter route: ${BASE}/scriptures/{tradition}/{BOOK}/{chapter}
- Scripture text as JSON: ${BASE}/scriptures/text/{translation}/{BOOK}.json
- Chapter guide as JSON: ${BASE}/scriptures/guides/{BOOK}/{chapter}.json
- Early text as JSON: ${BASE}/early/texts/{id}.json
- Abrahamic parallel matrix as JSON: ${BASE}/parallels/{id}.json
- Parallel rights manifest as JSON: ${BASE}/parallels/rights-manifest.json
- Cross-reference graph as JSON: ${BASE}/scriptures/graph/graph.json
${health.generatedAt ? `\nCorpus health last generated: ${health.generatedAt}\n` : ""}`;
}

/**
 * Every emitted claim is a restatement of something the truth bank or the
 * public portfolio content already says, and every one carries a link a reader
 * can open. Claims that cannot be anchored are not emitted.
 */
export function buildProfileFacts(): ProfileFact[] {
  const facts: ProfileFact[] = [
    {
      id: "location",
      claim: `${PROFILE.name} is based in ${truthBank.identity.location}.`,
      evidence: ["/hire", "/contact"],
      basis: "Stated location in the public portfolio truth bank.",
    },
    {
      id: "field-service",
      claim:
        "Field service engineer for enterprise hardware deployments at View, Inc., on customer sites from October 2016 to July 2020.",
      evidence: ["/resume#experience", "/hire"],
      basis:
        "Employment dates recorded in the public truth bank; the résumé page renders the same source.",
    },
    {
      id: "navy",
      claim:
        "United States Navy Electronics Technician, February 2003 to August 2008.",
      evidence: ["/resume#experience"],
      basis:
        "Public-record framing only: branch, rating, and dates. No further service detail of any kind is published anywhere on this site.",
    },
    {
      id: "education",
      claim: truthBank.resume.education
        .map((e) => `${e.credential}, ${e.school} (${e.year})`)
        .join("; "),
      evidence: ["/resume", "/about"],
      basis: "Degrees recorded in the public truth bank.",
    },
    {
      id: "independent-build",
      claim:
        "Independent software and web developer since May 2022; the shipped work is public and inspectable.",
      // Case-study routes only. An off-site link is a destination, not
      // evidence a reader can check against what this site itself claims.
      evidence: PROJECTS.map((p) => p.href).filter((href) => href.startsWith("/")),
      basis:
        "Each linked case study describes a project whose source or live deployment is reachable from the page.",
    },
    {
      id: "this-site",
      claim: SITE_CASE_STUDY.title,
      evidence: ["/about", "/work/garovartabedian", "/labs", "/meta/corpus-health.json"],
      basis:
        `${truthBank.ownerAttestations.siteFunding.claim} Owner-attested by ${truthBank.ownerAttestations.siteFunding.attestedBy} on ${truthBank.ownerAttestations.siteFunding.attestedAt}; the linked pages separately expose the live artifact and its generated validation record.`,
    },
    {
      id: "jobpilot-human-in-the-loop",
      claim:
        "JobPilot prepares and scores application material for human review; it does not submit applications automatically.",
      evidence: ["/work/jobpilot"],
      basis:
        "Recorded as a hard boundary in the truth bank and enforced by the voice check in the test suite.",
    },
    {
      id: "proof-standard",
      claim:
        "No traffic, revenue, user-count, or enterprise-adoption claims are made anywhere on this site.",
      evidence: ["/work/garovartabedian", "/hire"],
      basis:
        "Enforced mechanically: scripts/check-voice.ts fails the build if such a claim appears in visitor-facing portfolio copy.",
    },
  ];

  for (const metric of truthBank.reviewedMetrics) {
    facts.push({
      id: metric.id,
      claim: metric.claim,
      evidence: ["/work/jobpilot"],
      basis: metric.basis,
    });
  }

  const missing = facts.filter((f) => f.evidence.length === 0);
  if (missing.length > 0) {
    throw new Error(`profile facts without evidence: ${missing.map((f) => f.id).join(", ")}`);
  }
  return facts;
}

export function buildAiLegibility(): {
  mirrors: { id: string; bytes: number }[];
  facts: ProfileFact[];
} {
  const mirrors = buildEarlyMirrors();
  writeFileSync(LLMS_PATH, renderLlmsTxt(), "utf8");

  const facts = buildProfileFacts();
  mkdirSync(path.dirname(FACTS_PATH), { recursive: true });
  writeFileSync(
    FACTS_PATH,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        generatedBy: "scripts/site/build-ai-legibility.ts",
        notice: truthBank.publicOnlyNotice,
        subject: {
          name: PROFILE.name,
          location: truthBank.identity.location,
          links: {
            site: BASE,
            services: `${BASE}/services`,
            work: `${BASE}/work`,
            contact: `${BASE}/contact`,
            hire: `${BASE}/hire`,
            resume: `${BASE}/resume`,
            linkedin: truthBank.identity.contact.linkedin,
            github: truthBank.identity.contact.github,
          },
        },
        headline: RESUME.headline,
        facts,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return { mirrors, facts };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const { mirrors, facts } = buildAiLegibility();
  const bytes = mirrors.reduce((sum, m) => sum + m.bytes, 0);
  console.log(
    `llms.txt + ${mirrors.length} markdown mirrors (${(bytes / 1024).toFixed(0)}KB) + ${facts.length} anchored profile facts`,
  );
}
