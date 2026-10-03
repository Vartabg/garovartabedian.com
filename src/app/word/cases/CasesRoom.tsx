"use client";

import Link from "next/link";
import type { CasesData, EnforcementCategory } from "@/lib/word/types";
import GlossText from "../../_components/GlossText";
import SourceBasis from "../../_components/SourceBasis";
import WorldPreview from "../../_components/WorldPreview";

const CATEGORY_LABEL: Record<EnforcementCategory, string> = {
  historical: "Historical",
  lawsuit: "Lawsuit",
  policy: "Policy reversal",
  licensing: "Licensing",
  informal: "Single-sourced",
  explainer: "Context",
  ai: "Current",
};

const CATEGORY_ORDER: EnforcementCategory[] = [
  "historical",
  "lawsuit",
  "policy",
  "licensing",
  "informal",
  "explainer",
  "ai",
];

function CaseCategoryRail({ data }: { data: CasesData }) {
  const counts = new Map<EnforcementCategory, number>();
  const firstByCategory = new Map<EnforcementCategory, string>();
  for (const c of data.cases) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  for (const c of data.cases) {
    if (!firstByCategory.has(c.category)) firstByCategory.set(c.category, c.id);
  }
  const max = Math.max(...CATEGORY_ORDER.map((c) => counts.get(c) ?? 0), 1);

  return (
    <nav className="wd-case-rail" aria-label="Case categories">
      {CATEGORY_ORDER.filter((c) => counts.has(c)).map((cat) => {
        const n = counts.get(cat) ?? 0;
        return (
          <a
            key={cat}
            href={`#${firstByCategory.get(cat)}`}
            className={`wd-case-rail-item wd-case-cat-${cat}`}
            aria-label={`${CATEGORY_LABEL[cat]} cases`}
          >
            <span className="wd-case-rail-bar" style={{ height: `${Math.max(20, (n / max) * 100)}%` }} />
            <span className="wd-case-rail-label">{CATEGORY_LABEL[cat]}</span>
            <span className="wd-case-rail-count">{n}</span>
          </a>
        );
      })}
    </nav>
  );
}

export default function CasesRoom({ data }: { data: CasesData }) {
  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();

  return (
    <>
      <p className="kicker">
        <Link href="/word">Who Owns the Word?</Link>
      </p>
      <h1>When the fence gets tested.</h1>
      <p className="lede">
        <GlossText text={data.roomIntro} seen={glossSeen} />
      </p>

      <SourceBasis id="word-cases" />

      <div className="wd-case-map" aria-hidden="true">
        <WorldPreview kind="cases" />
      </div>
      <CaseCategoryRail data={data} />

      {data.cases.map((c) => (
        <article className="wd-case" key={c.id} id={c.id}>
          <p className="wd-case-meta">
            <span className="wd-case-year">{c.year}</span>
            <span className={`wd-case-cat wd-case-cat-${c.category}`}>{CATEGORY_LABEL[c.category]}</span>
          </p>
          <h2>{c.title}</h2>
          <p>
            <GlossText text={c.summary} seen={glossSeen} />
          </p>
          {c.quote && (
            <blockquote className="world-quote">
              &ldquo;
              <GlossText text={c.quote.text} seen={glossSeen} />
              &rdquo;
              <footer className="world-cite">— {c.quote.who}</footer>
            </blockquote>
          )}
          <p className="wd-case-outcome">
            <strong>Outcome: </strong>
            <GlossText text={c.outcome} seen={glossSeen} />
          </p>
          <p className="world-cite">
            {c.sources?.length ? (
              <>
                sources:{" "}
                {c.sources.map((source, index) => (
                  <span key={source.url}>
                    {index > 0 ? " · " : null}
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="textlink">
                      {source.label}
                    </a>
                  </span>
                ))}
                {c.checked ? <> · checked {c.checked}</> : null}
              </>
            ) : (
              <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
                source
              </a>
            )}
          </p>
        </article>
      ))}
    </>
  );
}
