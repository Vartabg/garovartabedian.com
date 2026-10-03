import type { Metadata } from "next";
import Link from "next/link";
import { ButtonAnchor, ButtonLink } from "../_components/Button";
import CleanChrome from "../_components/CleanChrome";
import ProjectLink from "../_components/ProjectLink";
import {
  ACTION_LABELS,
  CONTACT_METHOD_BY_ID,
  CONTACT_METHODS,
  HIRE_PAGE,
  PROFILE,
  PROJECTS,
  PROJECT_STATUS_LABEL,
  RESUME,
} from "@/lib/portfolio-content";

const SITE_URL = "https://garovartabedian.com";

const mailtoHref = `${CONTACT_METHOD_BY_ID.email.href}?subject=${encodeURIComponent(
  "Solutions Engineering role"
)}`;
const telHref = CONTACT_METHOD_BY_ID.phone.href;

const description =
  "Full-time employment profile for Garo Vartabedian: experience, résumé, work samples, and contact information for Solutions, Implementation, and Customer Engineering roles.";

export const metadata: Metadata = {
  title: "Employment profile — Garo Vartabedian",
  description,
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Employment profile — Garo Vartabedian",
    description,
    url: "/hire",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Employment profile — Garo Vartabedian",
    description,
  },
};

const hirePageLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: "Employment profile — Garo Vartabedian",
  url: `${SITE_URL}${PROFILE.links.hire}`,
  description,
  // The same claims as data, each one anchored to the page on this site that
  // shows its basis. A research agent can read the JSON instead of inferring
  // the facts from marketing prose.
  subjectOf: {
    "@type": "Dataset",
    name: "Machine-readable profile facts with evidence anchors",
    encodingFormat: "application/json",
    url: `${SITE_URL}/meta/profile-facts.json`,
  },
  mainEntity: {
    "@type": "Person",
    name: PROFILE.name,
    jobTitle: PROFILE.role,
    url: SITE_URL,
    email: CONTACT_METHOD_BY_ID.email.href,
    telephone: telHref.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Austin",
      addressRegion: "TX",
      addressCountry: "US",
    },
    sameAs: [
      CONTACT_METHOD_BY_ID.linkedin.href,
      CONTACT_METHOD_BY_ID.github.href,
      PROFILE.links.atxbro,
    ],
    knowsAbout: [
      "Solutions Engineering",
      "Implementation Engineering",
      "Customer Engineering",
      "Field service engineering",
      "Python",
      "TypeScript",
      "Browser automation",
      "API integrations",
      "Human-in-the-loop LLM workflows",
    ],
  },
};

export default function Hire() {
  return (
    <CleanChrome showWorldSwitcher={false} activeHref="/hire">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hirePageLd) }}
      />

      <section className="hire-hero" aria-labelledby="hire-title">
        <p className="kicker">{HIRE_PAGE.kicker}</p>
        <h1 id="hire-title">{HIRE_PAGE.headline}</h1>
        <p className="lede">{RESUME.summary}</p>

        <p className="cta-row">
          <ButtonAnchor variant="primary" href={PROFILE.links.resumePdf}>
            {ACTION_LABELS.resumePdf}
          </ButtonAnchor>
          <ButtonAnchor variant="ghost" href={mailtoHref}>
            {ACTION_LABELS.email}
          </ButtonAnchor>
          <ButtonLink variant="ghost" href="/work/jobpilot">
            Read JobPilot case study
          </ButtonLink>
        </p>

        <p className="note">
          Need an independent technical partner instead?{" "}
          <Link href="/services">Work with Garo</Link>.
        </p>

        <nav className="hire-jump" aria-label="Employment profile sections">
          <a href="#fit">Role fit</a>
          <a href="#proof">Work samples</a>
          <a href="#resume">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
      </section>

      <section className="hire-facts" aria-label="Employment quick facts">
        {HIRE_PAGE.quickFacts.map((fact) => (
          <div key={fact.label}>
            <span className="label">{fact.label}</span>
            <span className="value">{fact.value}</span>
          </div>
        ))}
      </section>

      <section id="fit" aria-labelledby="fit-title">
        <h2 id="fit-title">What to verify first</h2>
        <ul className="contact-list">
          {HIRE_PAGE.signals.map((signal) => (
            <li key={signal.label}>
              <span className="label">{signal.label}</span>
              <span className="value">{signal.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="translation-title">
        <h2 id="translation-title">Why it translates</h2>
        <div className="hire-reasons">
          {HIRE_PAGE.translation.map((reason) => (
            <article key={reason.label}>
              <h3>{reason.label}</h3>
              <p>{reason.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="proof" aria-labelledby="proof-title">
        <h2 id="proof-title">Proof</h2>
        <div className="cards">
          {PROJECTS.map((project) => (
            <article className="card" key={project.name}>
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
              <p className="hire-proof-links">
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
              <div className="stack">
                {project.stack.map((item) => (
                  <span className="tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <p className="hire-proof-more">
          Want the machinery instead of the summary?{" "}
          <Link href="/labs">See how this site is built</Link> — the live
          tools, the data pipeline, and the checks that run on every push.
        </p>
      </section>

      <section id="resume" aria-labelledby="resume-title">
        <h2 id="resume-title">Experience snapshot</h2>
        <ul className="contact-list">
          {RESUME.experience.map((entry) => (
            <li key={entry.id}>
              <span className="label">{entry.period}</span>
              <span className="value">
                <strong>{entry.role}</strong> — {entry.organization}
                {entry.location ? ` · ${entry.location}` : ""}. {entry.summary}
              </span>
            </li>
          ))}
        </ul>
        <p className="cta-row">
          <ButtonAnchor variant="primary" href={PROFILE.links.resumePdf}>
            {ACTION_LABELS.resumePdf}
          </ButtonAnchor>
          <ButtonLink variant="ghost" href={PROFILE.links.resume}>
            View web résumé
          </ButtonLink>
        </p>
      </section>

      <section id="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">Contact</h2>
        <ul className="contact-list">
          {CONTACT_METHODS.map((method) => (
            <li key={method.id}>
              <span className="label">{method.label}</span>
              <a
                className="value textlink"
                href={method.id === "email" ? mailtoHref : method.href}
                target={method.external ? "_blank" : undefined}
                rel={method.external ? "noopener noreferrer" : undefined}
              >
                {method.display}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </CleanChrome>
  );
}
