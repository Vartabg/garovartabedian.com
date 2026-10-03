import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../_components/CleanChrome";
import ProjectLink from "../_components/ProjectLink";
import {
  ACTION_LABELS,
  PROFILE,
  PROJECTS,
  PROJECT_STATUS_LABEL,
  WORK_PAGE,
} from "@/lib/portfolio-content";

const SITE_URL = "https://garovartabedian.com";

const description =
  "Inspectable case studies showing how Garo Vartabedian builds workflow tools, research systems, integrations, and practical interfaces.";

function absoluteUrl(href: string) {
  return href.startsWith("http") ? href : `${SITE_URL}${href}`;
}

export const metadata: Metadata = {
  title: "Work - case studies",
  description,
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work - Garo Vartabedian",
    description,
    url: "/work",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Work - Garo Vartabedian",
    description,
  },
};

const workPageLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Work - Garo Vartabedian",
  url: `${SITE_URL}/work`,
  description,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: PROJECTS.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: project.name,
        url: absoluteUrl(project.href),
        description: `${project.tagline} ${project.desc}`,
        author: {
          "@type": "Person",
          name: PROFILE.name,
        },
        sameAs: [project.sourceHref, project.demoUrl].filter(Boolean),
      },
    })),
  },
};

export default function Work() {
  return (
    <CleanChrome showWorldSwitcher={false} activeHref="/work">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(workPageLd) }}
      />

      <p className="kicker">{WORK_PAGE.kicker}</p>
      <h1>{WORK_PAGE.headline}</h1>
      <p className="lede">{WORK_PAGE.lede}</p>
      <p className="cta-row">
        <ButtonLink variant="primary" href="/services">
          {ACTION_LABELS.workWithGaro}
        </ButtonLink>
        <ButtonLink variant="ghost" href="/contact">
          {ACTION_LABELS.discussProject}
        </ButtonLink>
      </p>

      <section aria-labelledby="proof-index-title">
        <h2 id="proof-index-title">Featured proof</h2>
        <p>{WORK_PAGE.proofLine}</p>
        <div className="cards work-cards">
          {PROJECTS.map((project) => (
            <article className="card work-card" key={project.name}>
              <h3>
                <span>{project.name}</span>
                {project.status ? (
                  <span className="tag">
                    {PROJECT_STATUS_LABEL[project.status]}
                  </span>
                ) : null}
              </h3>
              <p>
                <strong>{project.tagline}</strong> {project.desc}
              </p>
              <p className="work-links">
                <ProjectLink href={project.href}>
                  {project.hrefLabel}
                </ProjectLink>
                {project.sourceHref ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <a
                      href={project.sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.sourceLabel ?? ACTION_LABELS.source}
                    </a>
                  </>
                ) : null}
                {project.demoUrl && project.demoUrl !== project.href ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ACTION_LABELS.liveDemo}
                    </a>
                  </>
                ) : null}
              </p>
              <div className="stack" aria-label={`${project.name} stack`}>
                {project.stack.map((item) => (
                  <span className="tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className="note">
        Considering me for a full-time role?{" "}
        <Link href={PROFILE.links.hire}>{ACTION_LABELS.employmentProfile}</Link>.
      </p>
    </CleanChrome>
  );
}
