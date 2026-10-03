"use client";

import Link from "next/link";
import type { CouncilPlateMeta } from "@/lib/church/media-plates";
import type { CouncilsData } from "@/lib/church/types";
import GlossText from "../../_components/GlossText";
import InlineMediaPlate from "../../_components/InlineMediaPlate";
import ChurchDiveList from "../ChurchDiveList";
import ChurchSectionNav from "../ChurchSectionNav";
import CouncilMap from "./CouncilMap";

export default function CouncilsRoom({
  data,
  plates,
}: {
  data: CouncilsData;
  plates: Record<string, CouncilPlateMeta>;
}) {
  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();
  const councilLinks = data.councils.map((council) => ({
    id: council.id,
    label: council.name,
  }));

  return (
    <>
      <p className="kicker">
        <Link href="/church">The Church</Link>
      </p>
      <h1>The councils.</h1>
      <p className="lede">
        <GlossText text={data.intro} seen={glossSeen} />
      </p>

      <CouncilMap data={data} />
      <ChurchSectionNav
        label="Councils on this page"
        items={councilLinks}
      />

      <ChurchDiveList
        id="council-records"
        label="Councils"
        countLabel={`${data.councils.length} councils`}
        description="Scan the date, place, and caller; open a council for its decision, primary text, and consequence."
      >
        {data.councils.map((c) => {
          const plate = plates[c.id];
          return (
            <details className="ch-dive ch-council" key={c.id} id={c.id} data-church-dive>
              <summary className="ch-dive-summary">
                <span className="ch-council-meta">
                  {c.year} · {c.place}
                </span>
                <h2>{c.name}</h2>
                <span className="ch-dive-subline">
                  <strong>Called by:</strong> {c.calledBy}
                </span>
                <span className="ch-dive-prompt">
                  <span className="ch-dive-open-label">Open decision + consequence</span>
                  <span className="ch-dive-close-label">Close council</span>
                </span>
              </summary>
              <div className="ch-dive-body">
                {plate && <InlineMediaPlate plate={plate} />}
                <p className="ch-council-called">
                  <strong>Called by:</strong>{" "}
                  <GlossText text={c.calledBy} seen={glossSeen} />
                </p>
                <p>
                  <GlossText text={c.decision} seen={glossSeen} />
                </p>
                {c.quote && (
                  <blockquote>
                    &ldquo;
                    <GlossText text={c.quote.text} seen={glossSeen} />
                    &rdquo;
                    <footer>
                      {" — "}
                      <a href={c.quote.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
                        {c.quote.cite}
                      </a>
                    </footer>
                  </blockquote>
                )}
                <p className="ch-council-consequence">
                  <strong>Consequence: </strong>
                  <GlossText text={c.consequence} seen={glossSeen} />
                </p>
                {c.seeAlso && (
                  <span className="world-see-also">
                    <Link href={c.seeAlso.href}>{c.seeAlso.label} →</Link>
                  </span>
                )}
              </div>
            </details>
          );
        })}
      </ChurchDiveList>
    </>
  );
}
