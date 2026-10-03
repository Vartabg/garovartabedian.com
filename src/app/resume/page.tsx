import type { Metadata } from "next";
import { ButtonAnchor, ButtonLink } from "../_components/Button";
import CleanChrome from "../_components/CleanChrome";
import { ACTION_LABELS, PROFILE, RESUME } from "@/lib/portfolio-content";

export const metadata: Metadata = {
  title: "Résumé",
  description: RESUME.summary,
};

export default function Resume() {
  return (
    <CleanChrome activeHref="/resume">
      <p className="kicker">Résumé</p>
      <h1>{PROFILE.name}</h1>
      <p className="lede">{RESUME.headline}</p>
      <p className="cta-row">
        <ButtonAnchor variant="primary" href={PROFILE.links.resumePdf}>
          {ACTION_LABELS.resumePdf}
        </ButtonAnchor>
        <ButtonLink variant="ghost" href={PROFILE.links.hire}>
          {ACTION_LABELS.employmentProfile}
        </ButtonLink>
      </p>
      <h2>Summary</h2>
      <p>{RESUME.summary}</p>

      <h2 id="experience">Experience</h2>
      {RESUME.experience.map((entry) => (
        <article key={entry.id}>
          <h3>{entry.role}</h3>
          <p>
            {entry.organization}
            {entry.location ? ` · ${entry.location}` : ""} · {entry.period}
          </p>
          <p>{entry.summary}</p>
          {entry.bullets.length > 0 ? (
            <ul>
              {entry.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}

      <h2 id="education">Education</h2>
      {RESUME.education.map((education) => (
        <p key={education.id}>
          <strong>{education.school}</strong> · {education.credential} · {education.year}
        </p>
      ))}
    </CleanChrome>
  );
}
