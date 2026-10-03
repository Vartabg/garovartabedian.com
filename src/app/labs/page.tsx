import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "../_components/Button";
import CleanChrome from "../_components/CleanChrome";
import { PROFILE } from "@/lib/portfolio-content";
import { CORPUS_HEALTH, coveragePercent } from "@/lib/site/corpus-health";
import { WORLD_REGISTRY } from "@/lib/world-registry";
import { LAB_EMBEDS } from "@/lib/site/embeds";

/** The one-line framing each demo gets on the page, keyed by its embed URL. */
const EMBED_BLURB: Record<string, string> = {
  "https://eye-code-visualizer.vercel.app":
    "Watch code run as a graph you can drag \u2014 calls, branches, what ran when. Built for visual learners like me. The public demo is a curated sample; the full tracer runs locally.",
  "https://www.atxbro.com":
    "Full-stack web products for my neighbors, built and shipped solo \u2014 interactive 3D, long-form pieces, iteration in the open.",
};

const description =
  "How garovartabedian.com is built: live tools, versioned data, a generated Scripture corpus-health snapshot, and the checks that run on every push.";

export const metadata: Metadata = {
  title: "The Machinery — how this site is built",
  description,
  alternates: { canonical: "/labs" },
  openGraph: {
    title: "The Machinery — how this site is built",
    description,
    url: "/labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Machinery — how this site is built",
    description,
  },
};

const number = new Intl.NumberFormat("en-US");
const { corpus, coverage, validation } = CORPUS_HEALTH;

const FACTS = [
  {
    id: "worlds",
    n: String(WORLD_REGISTRY.length),
    label: "research worlds coordinated by one shared registry and common components",
  },
  {
    id: "guides",
    n: number.format(corpus.guides.files),
    label: "chapter guides — one for every book/chapter slot in the hosted union corpus",
  },
  {
    id: "traditions",
    n: String(corpus.traditions.count),
    label: "Scripture traditions side by side, with unavailable material disclosed",
  },
  {
    id: "cross-references",
    n: number.format(corpus.crossReferences.targets),
    label: "inherited Treasury of Scripture Knowledge cross-reference targets",
  },
  {
    id: "topics",
    n: number.format(corpus.topics.references),
    label: `topical references across ${number.format(corpus.topics.count)} Nave subjects`,
  },
  {
    id: "originals",
    n: number.format(corpus.originals.wordTokens),
    label: `source-language word tokens from ${corpus.originals.editions.length} pinned editions`,
  },
];

const HEALTH_FACTS = [
  {
    id: "guide-coverage",
    n: `${number.format(validation.guides.coverage.guides)} / ${number.format(validation.guides.coverage.chapterSlots)}`,
    label: "hosted chapter slots with a guide — complete structural coverage",
  },
  {
    id: "question-citations",
    n: coveragePercent(
      corpus.guides.questionsWithVerseRefs,
      corpus.guides.questions,
    ),
    label: `${number.format(corpus.guides.questionsWithVerseRefs)} of ${number.format(corpus.guides.questions)} study questions carry verse references`,
  },
  {
    id: "custom-guides",
    n: number.format(corpus.guides.customStructuredGuides),
    label: `guides without the batch-template signature; ${number.format(corpus.guides.batchTemplateGuides)} retain it, and structure is not a human-review claim`,
  },
  {
    id: "guide-v2",
    n: `${number.format(validation.guides.v2Rubric.passing)} / ${number.format(validation.guides.v2Rubric.guidesWithProvenance)}`,
    label: `guide-v2 drafts with reproducible provenance that pass the stricter ${validation.guides.v2Rubric.rubricVersion} contract`,
  },
  {
    id: "editorial-review",
    n: `${number.format(validation.guides.editorialReview.agentReviewed)} agent / ${number.format(validation.guides.editorialReview.humanReviewed)} human`,
    label: `guides carrying an editorial review record — agent panels reviewed every non-template guide; human sign-off is tracked separately and still pending`,
  },
  {
    id: "book-briefings",
    n: `${corpus.books.sourceBackedBriefings} / ${corpus.books.hostedIds}`,
    label: "hosted book identities with deeper, source-backed orientation briefings",
  },
  {
    id: "search-scope",
    n: coverage.search.translationIds.join(", ").toUpperCase(),
    label: `exact-word search coverage today; ${corpus.translations.count} translation editions are hosted`,
  },
  {
    id: "original-boundary",
    n: String(coverage.originalLanguages.editionIds.length),
    label: "source-language editions; Greek Septuagint and manuscript apparatus are not hosted yet",
  },
];

const PIPELINE = [
  {
    name: "Versioned sources in, static JSON out",
    note: "Scripture text comes from the WEB, KJV, Douay-Rheims, and Brenton's Septuagint. Build scripts produce versioned JSON for the reader, cross-references, topics, and source-language layers. A generated corpus snapshot and freshness test make drift visible.",
  },
  {
    name: "Validation and review kept separate",
    note: "Every chapter guide receives automated identity, reference, and quotation checks. New v2 batches also lock their grounding prompt, model, rubric, outline coverage, cited questions, and template-removal checks. Editorial review stays separate: agent review and named human sign-off are different published tiers.",
  },
  {
    name: "Art provenance by lane",
    note: "Museum works record their institution, object page, and license. Generated interpretive plate manifests retain prompts, captions, and alt text instead of being presented as historical objects.",
  },
  {
    name: "Verified shipping",
    note: "Lint, types, unit and smoke tests, a full static build, browser journeys, and rendered accessibility checks run in CI on every push to master. Exact test totals come from the runner rather than hand-written page copy.",
  },
];

export default function LabsPage() {
  return (
    <CleanChrome activeHref="/labs">
      <section className="hire-hero" aria-labelledby="labs-title">
        <p className="kicker">The machinery</p>
        <h1 id="labs-title">How this site is built</h1>
        <p className="lede">
          Most sites hide how they&rsquo;re made. This one is the artifact
          &mdash; the data, the checks, and the tools are the work, so they are
          shown rather than described. Live demonstrations are mounted below;
          corpus claims come from a generated, machine-readable snapshot.
        </p>
        <p className="hire-actions">
          <ButtonLink variant="primary" href="/work/garovartabedian">
            Read the site case study
          </ButtonLink>
          <ButtonLink href="/services">Work with Garo</ButtonLink>
        </p>
      </section>

      <section aria-labelledby="labs-numbers-title">
        <h2 id="labs-numbers-title">The site by its numbers</h2>
        <dl className="labs-facts">
          {FACTS.map((f) => (
            <div className="labs-fact" key={f.id}>
              <dt>{f.n}</dt>
              <dd>{f.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="labs-health-title">
        <h2 id="labs-health-title">Corpus health, generated from the repository</h2>
        <p>
          This is a coverage ledger, not a claim that every record has received
          the same depth of review. The build regenerates it from the checked-in
          data, and a unit test fails when the public snapshot falls behind.
        </p>
        <dl className="labs-facts">
          {HEALTH_FACTS.map((fact) => (
            <div className="labs-fact" key={fact.id}>
              <dt>{fact.n}</dt>
              <dd>{fact.label}</dd>
            </div>
          ))}
        </dl>
        <p>
          <a href="/meta/corpus-health.json">Open the machine-readable snapshot</a>
          {" · "}
          <Link href="/sources">Read the source standard</Link>
          {" · "}
          <Link href="/evidence">See how claims are separated</Link>
        </p>
      </section>

      <section aria-labelledby="labs-live-title">
        <h2 id="labs-live-title">Live tools, mounted whole</h2>
        <p>
          Two of the projects behind this site run in the browser right now.
          They are embedded as they are &mdash; no screenshots, no mockups.
        </p>
        <div className="labs-embeds">
          {LAB_EMBEDS.map((embed) => (
            <figure className="labs-embed" key={embed.url}>
              <figcaption>
                <h3>
                  {embed.title} <span className="tag">{embed.tag}</span>
                </h3>
                <p>{EMBED_BLURB[embed.url]}</p>
                <p>
                  <a href={embed.url} target="_blank" rel="noopener noreferrer">
                    {embed.openLabel}
                  </a>
                </p>
              </figcaption>
              <iframe src={embed.url} title={embed.frameTitle} loading="lazy" />
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby="labs-pipeline-title">
        <h2 id="labs-pipeline-title">How the data is made</h2>
        <div className="cards">
          {PIPELINE.map((p) => (
            <article className="card" key={p.name}>
              <h3>{p.name}</h3>
              <p>{p.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="labs-next-title">
        <h2 id="labs-next-title">Where to look next</h2>
        <p>
          The case studies walk through the projects one at a time
          &mdash; <Link href="/work/eye">EYE</Link>,{" "}
          <Link href="/work/garovartabedian">this site</Link>, and{" "}
          <Link href="/work/jobpilot">JobPilot</Link>. To discuss a project,
          start with <Link href="/services">how I work</Link> or write to{" "}
          <a href={`mailto:${PROFILE.links.email}`}>{PROFILE.links.email}</a>.
          The <Link href="/hire">full-time employment profile</Link> remains
          available separately.
        </p>
      </section>
    </CleanChrome>
  );
}
