import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../_components/CleanChrome";
import {
  ABOUT_PAGE,
  ACTION_LABELS,
  FAITH,
  PROFILE,
} from "@/lib/portfolio-content";

export const metadata: Metadata = {
  title: "About this work",
  description: ABOUT_PAGE.description,
};

export default function About() {
  return (
    <CleanChrome activeHref="/about">
      <p className="kicker">{ABOUT_PAGE.kicker}</p>
      <h1>{ABOUT_PAGE.title}</h1>
      <p className="lede">{ABOUT_PAGE.lede}</p>
      <p className="cta-row">
        <ButtonLink variant="primary" href="/jesus">
          Start with Jesus
        </ButtonLink>
        <ButtonLink variant="ghost" href="/scriptures">
          Open the Scriptures
        </ButtonLink>
        <ButtonLink variant="ghost" href="/sources">
          See the source trail
        </ButtonLink>
      </p>

      <h2>{ABOUT_PAGE.centerHeading}</h2>
      {ABOUT_PAGE.centerCopy.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h2>{ABOUT_PAGE.methodHeading}</h2>
      {ABOUT_PAGE.methodCopy.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h2>{ABOUT_PAGE.workHeading}</h2>
      {ABOUT_PAGE.workCopy.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h2>{ABOUT_PAGE.publicHeading}</h2>
      {ABOUT_PAGE.publicCopy.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h2>{ABOUT_PAGE.builderHeading}</h2>
      <p>{ABOUT_PAGE.builderLede}</p>
      <p>
        The question I keep close is: &ldquo;{FAITH.verse}&rdquo; — {FAITH.ref}
      </p>
      <p className="cta-row">
        <ButtonLink variant="primary" href="/services">
          {ACTION_LABELS.workWithGaro}
        </ButtonLink>
        <ButtonLink variant="ghost" href="/work">
          See case studies
        </ButtonLink>
        <ButtonLink variant="ghost" href="/contact">
          {ACTION_LABELS.discussProject}
        </ButtonLink>
      </p>

      <h2>Continue</h2>
      <ul className="contact-list">
        <li>
          <span className="label">
            <Link href="/services">Work with Garo</Link>
          </span>
          <span className="value">
            Start with a fixed-scope workflow diagnostic and a clear build path.
          </span>
        </li>
        <li>
          <span className="label">
            <Link href="/work">Work</Link>
          </span>
          <span className="value">
            Case studies, live demos, and the decisions behind the builds.
          </span>
        </li>
        <li>
          <span className="label">
            <Link href="/contact">Contact</Link>
          </span>
          <span className="value">Describe a project or reach me directly.</span>
        </li>
        <li>
          <span className="label">
            <Link href={PROFILE.links.hire}>Full-time employment</Link>
          </span>
          <span className="value">
            Experience, role fit, résumé PDF, and contact information.
          </span>
        </li>
        <li>
          <span className="label">
            <Link href="/resume">Résumé</Link>
          </span>
          <span className="value">The one-page web version, with a PDF download.</span>
        </li>
      </ul>
    </CleanChrome>
  );
}
