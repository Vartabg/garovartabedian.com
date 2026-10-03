import type { Metadata } from "next";
import Link from "next/link";
import { ButtonAnchor, ButtonLink } from "../_components/Button";
import CleanChrome from "../_components/CleanChrome";
import {
  ACTION_LABELS,
  CONTACT_METHOD_BY_ID,
  PROFILE,
} from "@/lib/portfolio-content";

const SITE_URL = "https://garovartabedian.com";
const inquiryHref = `${CONTACT_METHOD_BY_ID.email.href}?subject=${encodeURIComponent(
  "Workflow & Knowledge Pipeline inquiry",
)}`;

const description =
  "Independent technical help for operations and knowledge-heavy teams: $500 fixed workflow audits and verified knowledge pipelines engineered for Google NotebookLM™ and enterprise LLMs.";

export const metadata: Metadata = {
  title: "Services — Workflow Audits & Knowledge Pipelines",
  description,
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services — Workflow Audits & Knowledge Pipelines",
    description,
    url: "/services",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Services — Workflow Audits & Knowledge Pipelines",
    description,
  },
};

const GOOD_FIT = [
  {
    name: "Manual handoffs",
    note: "Customer or operations work is copied between forms, inboxes, spreadsheets, and internal tools.",
  },
  {
    name: "Recurring tool work",
    note: "A report, intake process, or status update requires the same browser and data steps every week.",
  },
  {
    name: "Unclear automation choice",
    note: "The team knows a workflow is wasteful but not whether the answer is an integration, a small tool, AI, or a simpler process.",
  },
  {
    name: "Human judgment still matters",
    note: "The useful parts should be automated without hiding the decision, approval, or exception that belongs to a person.",
  },
  {
    name: "Knowledge trapped in messy files",
    note: "SOPs, manuals, or historical records are scattered across drives, and off-the-shelf AI hallucinates without clean, structured source dossiers.",
  },
];

const DELIVERABLES = [
  {
    name: "Current workflow map",
    note: "One view of the people, tools, inputs, decisions, and handoffs visible in the supplied materials.",
  },
  {
    name: "Friction and risk diagnosis",
    note: "Where time, context, or trust is being lost — including obvious access and data-exposure concerns, without pretending this is a formal security audit.",
  },
  {
    name: "Three prioritized changes",
    note: "Three candidate improvements ranked by likely impact, effort, and risk based on the supplied evidence, including a no-build option when process cleanup is enough.",
  },
  {
    name: "First-pilot brief",
    note: "A bounded recommendation for the first useful change: outcome, inputs, exclusions, acceptance check, and what implementation would require.",
  },
  {
    name: "Review call and report",
    note: "A 45-minute call to pressure-test the recommendation, plus the complete report to keep whether or not we work together again.",
  },
];

const BOUNDARIES = [
  "One recurring workflow across up to five tools, plus the people and handoff steps around them.",
  "Inputs are one walkthrough of up to 60 minutes plus the screenshots or documents agreed during scoping.",
  "The delivery clock starts after those materials arrive; production credentials and direct system access are outside the audit.",
  "The audit diagnoses and scopes; it does not include production implementation.",
  "It is not a compliance review, penetration test, or legal opinion.",
  "No automation is recommended merely because it uses AI.",
];

const NEXT_STEPS = [
  {
    name: "Working pilot",
    note: "Build one narrow automation, integration, or internal tool and test it against an agreed outcome.",
  },
  {
    name: "Knowledge and dossier pipeline",
    note: "Clean, structure, and index proprietary documents into high-density source dossiers ready for Google NotebookLM, Claude Projects, or internal search.",
  },
  {
    name: "Production implementation",
    note: "Extend a proven pilot into a documented workflow with the failure paths and operating handoff included.",
  },
  {
    name: "Fractional technical partner",
    note: "Own a small backlog of workflow and integration improvements without requiring a full-time hire.",
  },
];

const KNOWLEDGE_PIPELINE_DELIVERABLES = [
  {
    name: "Sanitized Markdown corpus",
    note: "OCR cleanup, formatted complex tables, noise removal, and deduplication across scattered corporate PDFs, docs, and sheets.",
  },
  {
    name: "Structured YAML metadata",
    note: "Consistent schema tagging (dates, authors, versions, access boundaries, topic classification) on every dossier module.",
  },
  {
    name: "Source-linked provenance",
    note: "Paragraph-level citation anchors connect dossier passages to supplied records so reviewers can check the source of a claim.",
  },
  {
    name: "Target-optimized synthesis",
    note: "Dossiers formatted for Google NotebookLM™, Claude Projects, or private RAG, with source notes and questions for evaluating answers against the supplied material.",
  },
];

const KNOWLEDGE_PIPELINE_BOUNDARIES = [
  "Source files provided as static exports (PDFs, Markdown, docs, spreadsheets). Direct production database write-access is outside scope.",
  "Outputs are delivered as inspectable Markdown dossiers, structured manifests, and local ingestion scripts.",
  "Deliverables verify source alignment and data extraction; they do not constitute legal, medical, or regulatory compliance opinions.",
  "Source preparation supports review; it cannot guarantee that an AI answer or Audio Deep Dive is accurate. Generated outputs still need source checks.",
  "Optimized for Google NotebookLM™ and enterprise LLMs under nominative fair use; no official affiliation or endorsement by Google is implied.",
];

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Workflow Audits & Knowledge Pipelines",
  description,
  url: `${SITE_URL}/services`,
  provider: {
    "@type": "Person",
    name: PROFILE.name,
    url: SITE_URL,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Independent Engineering Services",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Workflow & Automation Audit",
        price: "500",
        priceCurrency: "USD",
        url: `${SITE_URL}/services`,
      },
      {
        "@type": "Offer",
        name: "Knowledge Pipeline Sprint",
        url: `${SITE_URL}/services`,
      },
    ],
  },
};

export default function Services() {
  return (
    <CleanChrome activeHref="/services">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />

      <p className="kicker">Work with Garo</p>
      <h1>Practical help for messy workflows and company knowledge.</h1>
      <p className="lede">
        Independent technical help for operations and knowledge-heavy teams.
        Start with a bounded diagnostic — whether untangling a manual operations
        workflow or structuring trapped corporate files into verified dossiers
        for Google NotebookLM™ and internal LLMs.
      </p>

      <p className="cta-row">
        <ButtonAnchor variant="primary" href={inquiryHref}>
          {ACTION_LABELS.discussProject}
        </ButtonAnchor>
        <ButtonAnchor
          variant="ghost"
          href={PROFILE.links.knowledgePipelinePdf}
          target="_blank"
          rel="noopener noreferrer"
        >
          Knowledge Pipeline One-Pager (PDF)
        </ButtonAnchor>
        <ButtonLink variant="ghost" href="/work">
          Inspect the work
        </ButtonLink>
      </p>

      <h2>Track 1: Workflow &amp; Automation Audit — $500 fixed</h2>
      <p>
        <strong>
          One working week, one bounded workflow, one practical report.
        </strong>{" "}
        The price and scope are posted upfront. You begin with a bounded
        diagnostic instead of an open-ended consulting commitment.
      </p>

      <h2>Good fit for the audit</h2>
      <ul className="contact-list">
        {GOOD_FIT.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>What you get from the audit</h2>
      <ul className="contact-list">
        {DELIVERABLES.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>Track 2: Enterprise Knowledge &amp; Dossier Pipeline</h2>
      <p>
        <strong>
          Turn messy corporate files into high-density, verified source dossiers
          engineered for Google NotebookLM™ and internal LLMs.
        </strong>
      </p>
      <p>
        Teams want to use generative AI and NotebookLM to synthesize internal
        knowledge, but raw corporate files are messy: scanned PDFs, fragmented
        SOPs, contradictory spreadsheets, and disjointed manuals. Off-the-shelf
        tools hallucinate, drop critical nuance, and lose source context when
        fed uncurated files.
      </p>
      <p>
        I build pipelines to prepare and check source material: cleaning OCR errors,
        extracting complex tables, structuring modules with YAML frontmatter,
        and embedding paragraph-level citation anchors throughout. The output is
        an inspectable Markdown dossier library with extraction checks, source
        links, and evaluation questions for use with NotebookLM or private RAG.
      </p>
      <ul className="contact-list">
        {KNOWLEDGE_PIPELINE_DELIVERABLES.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>
      <p className="cta-row">
        <ButtonLink variant="primary" href="/scriptures/dossier">
          Try the live Dossier Engine
        </ButtonLink>
        <ButtonAnchor
          variant="ghost"
          href={PROFILE.links.knowledgePipelinePdf}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download Executive Brief (PDF)
        </ButtonAnchor>
      </p>

      <h2>If a build makes sense</h2>
      <p>
        The report is useful on its own. If the first change is bounded enough,
        we can scope a separate working pilot with its outcome, timeline, price,
        and limits written down before implementation begins. If the right
        answer is a spreadsheet, a process change, or software you already own,
        I will say that instead.
      </p>
      <ul className="contact-list">
        {NEXT_STEPS.map((step) => (
          <li key={step.name}>
            <span className="label">{step.name}</span>
            <span className="value">{step.note}</span>
          </li>
        ))}
      </ul>

      <h2>Why work with me</h2>
      <p>
        I did field service on live customer sites, where the system had to work
        and the handoff had to make sense to the people operating it. Now I
        build full-stack applications, browser automation, API integrations,
        grounded data pipelines, and human-in-the-loop workflows in Python and
        TypeScript. <Link href="/work">The case studies are public</Link>, and
        they name what is shipped, what is local, and what is not being claimed.
      </p>

      <h2>Workflow audit boundaries</h2>
      <ul className="contact-list">
        {BOUNDARIES.map((boundary) => (
          <li key={boundary}>
            <span className="label">Boundary</span>
            <span className="value">{boundary}</span>
          </li>
        ))}
      </ul>

      <h2>Knowledge pipeline boundaries</h2>
      <ul className="contact-list">
        {KNOWLEDGE_PIPELINE_BOUNDARIES.map((boundary) => (
          <li key={boundary}>
            <span className="label">Boundary</span>
            <span className="value">{boundary}</span>
          </li>
        ))}
      </ul>

      <h2>Tell me what is slowing the team down</h2>
      <p>
        Two plain sentences are enough: what the workflow is, who touches it,
        and where it gets stuck. I will reply with whether this audit fits
        before asking you to commit to anything.
      </p>
      <p>
        <ButtonAnchor variant="primary" href={inquiryHref}>
          {ACTION_LABELS.discussProject}
        </ButtonAnchor>
      </p>

      <p className="note">
        Hiring for a full-time Solutions, Implementation, or Customer
        Engineering role? <Link href="/hire">View the employment profile</Link>.
      </p>
    </CleanChrome>
  );
}
