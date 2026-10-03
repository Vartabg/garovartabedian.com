"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useHashScroll } from "@/lib/useHashScroll";
import type { SentData } from "@/lib/apostles/types";
import GlossText from "@/app/_components/GlossText";
import SourceLine from "../SourceLine";
import WeightPill from "../WeightPill";

/** One legend swatch drawn with the map's own stroke classes — pixel-honest. */
function LegendStroke({ grade }: { grade: "scripture" | "early" | "late" | "uncertain" }) {
  const cls = grade === "uncertain" ? "ap-smap-late" : `ap-smap-${grade}`;
  return (
    <svg viewBox="0 0 34 6" aria-hidden="true" className="ap-legend-swatch">
      <path
        d="M2 3 H32"
        className={`ap-smap-leg ${cls}${grade === "uncertain" ? " ap-smap-leg-uncertain" : ""}`}
      />
    </svg>
  );
}

/**
 * The map arrives as a server-rendered slot so its baked land JSON never
 * enters the client bundle — this room is a client component only for the
 * hash-scroll and glossary behavior.
 */
export default function SentRoom({
  data,
  map,
  illustration,
}: {
  data: SentData;
  map: ReactNode;
  illustration: ReactNode;
}) {
  useHashScroll(true);

  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();

  return (
    <>
      <p className="kicker">
        <Link href="/apostles">The Apostles</Link>
      </p>
      <h1>The sending.</h1>
      <p className="lede">
        <GlossText text={data.intro} seen={glossSeen} />
      </p>

      <div className="ap-legend" aria-label="How to read the map">
        <span className="ap-legend-item">
          <LegendStroke grade="scripture" /> scripture
        </span>
        <span className="ap-legend-item">
          <LegendStroke grade="early" /> early source
        </span>
        <span className="ap-legend-item">
          <LegendStroke grade="late" /> later tradition
        </span>
        <span className="ap-legend-item">
          <LegendStroke grade="uncertain" /> ? — even the destination is disputed
        </span>
      </div>

      {map}
      {illustration}

      <section aria-labelledby="roads-title">
        <h2 id="roads-title">The roads, claim by claim</h2>
        <div className="ap-roads">
          {data.rays.map((ray) => (
            <article className="ap-road" id={`sent-${ray.apostleId}`} key={ray.apostleId}>
              <h3>
                <Link href={`/apostles/twelve#${ray.apostleId}`} className="textlink">
                  {ray.name}
                </Link>{" "}
                <span className="ap-road-to">→ {ray.to}</span>
              </h3>
              {ray.claims.map((claim) => (
                <div className="ap-claim" key={claim.claim}>
                  <p>
                    <WeightPill weight={claim.weight} />{" "}
                    <GlossText text={claim.claim} seen={glossSeen} />
                  </p>
                  <SourceLine
                    earliest={claim.earliest}
                    sourceUrl={claim.sourceUrl}
                    name={ray.name}
                  />
                  {claim.note && <p className="ap-claim-note">{claim.note}</p>}
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="ap-unplaced" aria-labelledby="unplaced-title">
        <h2 id="unplaced-title">The seats the chart refuses to place</h2>
        <ul>
          {data.unplaced.map((entry) => (
            <li key={entry.apostleId} id={`sent-${entry.apostleId}`}>
              <Link href={`/apostles/twelve#${entry.apostleId}`} className="textlink">
                <strong>{entry.name}</strong>
              </Link>
              <span>{entry.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <aside className="ap-armenia card" aria-labelledby="armenia-title">
        <h2 id="armenia-title">{data.armenia.title}</h2>
        <p>
          <GlossText text={data.armenia.text} seen={glossSeen} />
        </p>
        <span className="world-see-also">
          <Link href={data.armenia.seeAlso.href}>{data.armenia.seeAlso.label} →</Link>
        </span>
      </aside>

      <p className="world-close">
        A chart this honest stays half-empty on purpose. The full evidence for
        every line — and for the lines this page declines to draw — is in{" "}
        <Link href="/apostles/twelve" className="textlink">
          the records
        </Link>
        ; what grew where the roads ended is in{" "}
        <Link href="/church" className="textlink">
          the church
        </Link>
        .
      </p>
    </>
  );
}
