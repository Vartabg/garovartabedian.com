"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { RoadData } from "@/lib/church/types";
import { EARLY_TEXTS } from "@/lib/early/client";
import { firstYear, handForYear, type Hand } from "@/lib/hands";
import HandChange from "../_components/HandChange";
import GlossText from "../_components/GlossText";
import WorldDisclosure from "../_components/WorldDisclosure";
import WorldHeroActions from "../_components/WorldHeroActions";
import WorldHomeHero from "../_components/WorldHomeHero";
import ChurchSectionNav from "./ChurchSectionNav";
import EraSpine from "./EraSpine";

/** Interactive body for the Church world home — data arrives from the server. */
export type RoadStepLinks = {
  era: string;
  title: string;
  refs: { label: string; href: string }[];
  textIds: string[];
};

export default function ChurchHome({
  data,
  forks,
  links,
}: {
  data: RoadData;
  forks: number[];
  /** Where a step opens something else on this site. Built, not hand-typed. */
  links: RoadStepLinks[];
}) {
  const linksByStep = new Map(links.map((entry) => [`${entry.era}::${entry.title}`, entry]));
  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();
  const eraLinks = useMemo(
    () => data.eras.map((era) => ({ id: era.id, label: era.name })),
    [data.eras],
  );
  // Each era's heading is set in the hand of its time; where the hand turns,
  // the heading changes hands as it scrolls in (HandChange).
  const eraHands = useMemo(() => {
    const hands: Hand[] = data.eras.map((era) => handForYear(firstYear(era.years) ?? 30));
    return hands.map((hand, i) => ({ hand, from: i > 0 ? hands[i - 1] : undefined }));
  }, [data.eras]);

  return (
    <>
      <WorldHomeHero
        world="church"
        title="The road from the upper room."
        facets={["Two thousand years", "Every major fork", "Sources inline"]}
        actions={
          <WorldHeroActions
            label="Explore church history"
            links={[
              { href: "#upper-room", label: "Open the historical road" },
              { href: "/church/tree", label: "The tree" },
              { href: "/church/councils", label: "The councils" },
              { href: "/church/faces", label: "The faces" },
              { href: "/church/giants", label: "The giants" },
            ]}
          />
        }
      >
        The church begins with about a hundred and twenty people praying in a
        borrowed room. This page walks from there to today — every step dated
        and sourced, the dark chapters stated as plainly as the bright ones.
        And at every era, the same question: who held the power, and what did
        they do with it?
      </WorldHomeHero>

      <WorldDisclosure
        label="Open the full church-history road"
        note="Walk every sourced era from the upper room to today."
        variant="deep"
      >
        <EraSpine data={data} forks={forks} />

        <ChurchSectionNav
          label="Church history eras"
          items={eraLinks}
        />

        <HandChange />
        <div className="ch-road">
          {data.eras.map((era, eraIndex) => (
            <section className="ch-era" key={era.id} id={era.id}>
              <header className="ch-era-head">
                <h2 data-hand={eraHands[eraIndex].hand} data-hand-from={eraHands[eraIndex].from}>
                  {era.name}
                </h2>
                <span className="ch-era-years">{era.years}</span>
              </header>
              <p className="ch-era-intro">
                <GlossText text={era.intro} seen={glossSeen} />
              </p>
              <p className="ch-power">
                <span>Who held the power:</span>{" "}
                <GlossText text={era.power} seen={glossSeen} />
              </p>

              {(() => {
                const renderStep = (s: (typeof era.steps)[number]) => {
                const stepLinks = linksByStep.get(`${era.id}::${s.title}`);
                return (
                <article className="ch-step" key={s.year + s.title}>
                  <span className="ch-step-year">{s.year}</span>
                  <div className="ch-step-body">
                    <h3>{s.title}</h3>
                    <p>
                      <GlossText text={s.note} seen={glossSeen} />
                    </p>
                    {s.quote && (
                      <blockquote className="world-quote">
                        <GlossText text={s.quote.text} seen={glossSeen} />
                        <footer className="world-cite">
                          — {s.quote.cite}
                          {s.quote.translator ? ` · ${s.quote.translator}` : ""} ·{" "}
                          <a
                            href={s.quote.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="textlink"
                            aria-label={`Source for the quotation in ${s.title}`}
                          >
                            source
                          </a>
                        </footer>
                      </blockquote>
                    )}
                    {stepLinks && (
                      // The road used to be a closed timeline: sixty-two steps
                      // and no way into the texts they are about. These open
                      // the hosted reader and the hosted writings.
                      <p className="ch-step-links">
                        <span>Read it here:</span>
                        {stepLinks.refs.map((ref) => (
                          <Link key={ref.href} href={ref.href} prefetch={false}>
                            {ref.label}
                          </Link>
                        ))}
                        {stepLinks.textIds.map((textId) => (
                          <Link key={textId} href={`/early/${textId}`} prefetch={false}>
                            {EARLY_TEXTS.find((text) => text.id === textId)?.title ?? textId}
                          </Link>
                        ))}
                      </p>
                    )}
                    <p className="world-cite">
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="textlink"
                        aria-label={`Source for ${s.title}`}
                      >
                        source
                      </a>
                    </p>
                  </div>
                </article>
                );
                };
                const [first, ...rest] = era.steps;
                return (
                  <>
                    {first && renderStep(first)}
                    {rest.length > 0 && (
                      <details className="ch-era-rest">
                        <summary>The rest of {era.name}</summary>
                        {rest.map(renderStep)}
                      </details>
                    )}
                  </>
                );
              })()}
            </section>
          ))}
        </div>

        <p className="world-close">
          The road runs through persecution, thrones, schisms, and reformations —
          and the church it carries is still walking. The apostles who first
          carried it fill the{" "}
          <Link href="/apostles" className="textlink">
            Apostles world
          </Link>
          ; where its scriptures came from is the{" "}
          <Link href="/scriptures" className="textlink">
            Scriptures world
          </Link>
          ; what its first generations wrote is in{" "}
          <Link href="/early" className="textlink">
            The Writings
          </Link>
          .
        </p>
      </WorldDisclosure>
    </>
  );
}
