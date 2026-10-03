"use client";

import Link from "next/link";
import type { GiantsData } from "@/lib/church/types";
import GlossText from "@/app/_components/GlossText";
import InlineMediaPlate from "@/app/_components/InlineMediaPlate";
import { giantPlateFor } from "@/lib/church/giant-plates";
import ChurchDiveList from "../ChurchDiveList";
import ChurchSectionNav from "../ChurchSectionNav";

function GiantsMap({ data }: { data: GiantsData }) {
  return (
    <nav className="ch-face-map" aria-label="Giants in order">
      <div className="world-tool-head">
        <strong>{data.giants.length} giants</strong>
        <span>every fault sourced, every gift real</span>
      </div>
      <div className="ch-face-nodes">
        {data.giants.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="ch-face-node">
            <span className="ch-face-mark" aria-hidden="true" />
            <strong>{g.name}</strong>
            <span>{g.stands}</span>
            <em>{g.years}</em>
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function GiantsRoom({ data }: { data: GiantsData }) {
  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();
  const giantLinks = data.giants.map((giant) => ({
    id: giant.id,
    label: giant.name,
  }));

  return (
    <>
      <p className="kicker">
        <Link href="/church">The Church</Link>
      </p>
      <h1>The giants.</h1>
      <p className="lede">
        <GlossText text={data.intro} seen={glossSeen} />
      </p>

      <blockquote className="ch-giant-precedent">
        &ldquo;{data.precedent.text}&rdquo;
        <footer className="ch-face-years">— {data.precedent.cite}</footer>
        <p>{data.precedent.note}</p>
      </blockquote>

      <GiantsMap data={data} />
      <ChurchSectionNav
        label="Giants on this page"
        items={giantLinks}
      />

      <ChurchDiveList
        id="giants-records"
        label="Giants"
        countLabel={`${data.giants.length} records`}
        description="Scan each gift and fault, then open the full evidence only where you want to go deeper."
      >
        {data.giants.map((g) => {
          const plate = giantPlateFor(g.id);

          return (
            <details className="ch-dive ch-giant" key={g.id} id={g.id} data-church-dive>
              <summary className="ch-dive-summary">
                <span className="ch-face-culture">{g.stands}</span>
                <h2>{g.name}</h2>
                <span className="ch-face-years">
                  {g.years} · {g.place}
                </span>
                <span className="ch-giant-glance">
                  <span>
                    <strong>The gift</strong>
                    {g.giftSummary}
                  </span>
                  <span>
                    <strong>The fault</strong>
                    {g.faultSummary}
                  </span>
                </span>
                <span className="ch-dive-prompt">
                  <span className="ch-dive-open-label">Open the full record</span>
                  <span className="ch-dive-close-label">Close the full record</span>
                </span>
              </summary>
              <div className="ch-dive-body">
                {plate && (
                  <div className="ch-giant-plate">
                    <InlineMediaPlate plate={plate} />
                  </div>
                )}
                {g.quote && (
                  <blockquote>
                    &ldquo;
                    <GlossText text={g.quote.text} seen={glossSeen} />
                    &rdquo;
                    <footer className="ch-face-years">
                      {" — "}
                      {g.quote.cite}
                      {g.quote.translator ? ` · ${g.quote.translator}` : ""} ·{" "}
                      <a
                        href={g.quote.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="textlink"
                        aria-label={`Source for ${g.name} quotation`}
                      >
                        source
                      </a>
                    </footer>
                  </blockquote>
                )}
                <div className="ch-giant-cols">
                  <div className="ch-giant-gift">
                    <h3>The gift</h3>
                    <p>
                      <GlossText text={g.gift} seen={glossSeen} />
                    </p>
                  </div>
                  <div className="ch-giant-fault">
                    <h3>The fault</h3>
                    <p>
                      <GlossText text={g.fault} seen={glossSeen} />
                    </p>
                    <p className="ch-giant-fault-sources">
                      {g.faultSources.map((s, i) => (
                        <span key={s.url}>
                          {i > 0 && " · "}
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="textlink"
                          >
                            {s.label}
                          </a>
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
                {g.seeAlso && (
                  <span className="world-see-also">
                    <Link href={g.seeAlso.href}>{g.seeAlso.label} →</Link>
                  </span>
                )}
              </div>
            </details>
          );
        })}
      </ChurchDiveList>

      <p className="world-close">
        None of this is flattery, and none of it is demolition — it is the
        record. The same church that received the creed from these hands reads
        in its own scriptures that David took a man&rsquo;s wife and then his
        life, that Peter denied his Lord three times, and that Paul held the
        coats at a stoning. The treasure was never the vessel. The people
        behind each culture of the church are in{" "}
        <Link href="/church/faces" className="textlink">
          the faces
        </Link>
        ; what they decided together is in{" "}
        <Link href="/church/councils" className="textlink">
          the councils
        </Link>
        .
      </p>
    </>
  );
}
