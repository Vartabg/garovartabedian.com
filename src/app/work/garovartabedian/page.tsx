import type { Metadata } from "next";
import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../../_components/CleanChrome";
import {
  ACTION_LABELS,
  PROFILE,
  SITE_CASE_STUDY,
  type CaseStudyItem,
} from "@/lib/portfolio-content";

const SITE_URL = "https://garovartabedian.com";

export const metadata: Metadata = {
  title: "garovartabedian.com — self-funded research platform",
  description: SITE_CASE_STUDY.description,
  alternates: { canonical: "/work/garovartabedian" },
  openGraph: {
    title: "garovartabedian.com — self-funded research platform",
    description: SITE_CASE_STUDY.description,
    url: "/work/garovartabedian",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "garovartabedian.com — self-funded research platform",
    description: SITE_CASE_STUDY.description,
  },
};

function DetailList({ items }: { items: CaseStudyItem[] }) {
  return (
    <ul className="contact-list">
      {items.map((item) => (
        <li key={item.name}>
          <span className="label">{item.name}</span>
          <span className="value">{item.note}</span>
        </li>
      ))}
    </ul>
  );
}

function CardGrid({ items }: { items: CaseStudyItem[] }) {
  return (
    <div className="cards case-cards">
      {items.map((item) => (
        <article className="card" key={item.name}>
          <h3>{item.name}</h3>
          <p>{item.note}</p>
        </article>
      ))}
    </div>
  );
}

export default function WorkGaroVartabedian() {
  const caseStudyLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: SITE_CASE_STUDY.title,
    url: `${SITE_URL}/work/garovartabedian`,
    description: SITE_CASE_STUDY.description,
    author: {
      "@type": "Person",
      name: PROFILE.name,
      url: SITE_URL,
    },
    about: [
      "Next.js",
      "React",
      "TypeScript",
      "Static site architecture",
      "Data provenance",
      "Browser verification",
    ],
    sameAs: [SITE_URL, `${SITE_URL}/sources`],
  };

  return (
    <CleanChrome showWorldSwitcher={false} activeHref="/work">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudyLd) }}
      />

      <p className="kicker">{SITE_CASE_STUDY.kicker}</p>
      <h1>{SITE_CASE_STUDY.title}</h1>
      <p className="lede">{SITE_CASE_STUDY.lede}</p>

      <p className="cta-row">
        <ButtonAnchor
          variant="primary"
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the live site
        </ButtonAnchor>
        <ButtonLink variant="ghost" href="/sources">
          View the source trail
        </ButtonLink>
        <ButtonLink variant="ghost" href="/services">
          {ACTION_LABELS.workWithGaro}
        </ButtonLink>
      </p>

      <h2>What it proves</h2>
      <DetailList items={SITE_CASE_STUDY.facts} />

      <h2>Architecture</h2>
      <p>
        The site is built as a product surface, not a pile of pages. The worlds
        have their own visual systems, but the durable behavior lives in shared
        data, typed route components, and common navigation/source primitives.
      </p>
      <CardGrid items={SITE_CASE_STUDY.architecture} />

      <h2>Data and generation</h2>
      <p>
        The Scripture world is the clearest example: source files are processed
        into static JSON, then the reader, search, topics, and canon shelves use
        that generated shape. The same pattern carries through the other worlds
        with smaller domain datasets.
      </p>
      <DetailList items={SITE_CASE_STUDY.dataPipeline} />

      <h2>Computational Research &amp; AI Dossier Suite</h2>
      <p>
        To demonstrate what happens when deep domain scholarship meets modern data
        engineering, the platform features five production-grade research
        engines — including one-click dossier generation optimized for Google
        NotebookLM™ and enterprise LLMs.
      </p>
      <CardGrid items={SITE_CASE_STUDY.scholarshipSuite} />
      <p className="cta-row">
        <ButtonLink variant="primary" href="/scriptures/dossier">
          Dossier Engine
        </ButtonLink>
        <ButtonLink variant="ghost" href="/scriptures/polyglot">
          Digital Hexapla
        </ButtonLink>
        <ButtonLink variant="ghost" href="/scriptures/catena">
          Catena Aurea
        </ButtonLink>
        <ButtonLink variant="ghost" href="/scriptures/diachronic">
          Semantic Evolution
        </ButtonLink>
        <ButtonLink variant="ghost" href="/scriptures/disputation">
          Disputation Engine
        </ButtonLink>
      </p>

      <h2>From Ancient Manuscripts to Enterprise Knowledge</h2>
      <p>
        The technical challenges of classical scholarship — multilingual variants,
        dense commentary graphs, and multi-era provenance — mirror the exact
        friction modern companies face when preparing internal knowledge for AI.
      </p>
      <DetailList items={SITE_CASE_STUDY.enterpriseBridge} />

      <h2>Credibility layer</h2>
      <p>
        The latest source pass made the trust model explicit. Readers can land
        on a human source page, see how each room handles evidence, and still
        find exact source links beside individual claims.
      </p>
      <CardGrid items={SITE_CASE_STUDY.credibility} />

      <h2>Shipping discipline</h2>
      <p>
        The build process matters because this site is meant to be maintained by
        agents as well as by me. A completed pass is not complete until the
        checks pass, browser behavior is sane where UI changed, the work is
        committed, pushed, and the tree is clean.
      </p>
      <DetailList items={SITE_CASE_STUDY.verification} />

      <h2>Truth boundaries</h2>
      <ul className="contact-list">
        {SITE_CASE_STUDY.boundaries.map((item) => (
          <li key={item}>
            <span className="label">Boundary</span>
            <span className="value">{item}</span>
          </li>
        ))}
      </ul>

      <h2>Where to look</h2>
      <p>
        Start with the live worlds if you want the research experience. Open
        the source trail if you want the evidence model. If your organization
        has a workflow, information system, or interface problem with similar
        complexity, start with how I work.
      </p>
      <p className="cta-row">
        <ButtonLink variant="primary" href="/services">
          {ACTION_LABELS.workWithGaro}
        </ButtonLink>
        <ButtonLink variant="ghost" href="/sources">
          Source trail
        </ButtonLink>
        <ButtonLink variant="ghost" href="/work">
          View all work
        </ButtonLink>
      </p>
    </CleanChrome>
  );
}
