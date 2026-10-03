"use client";

import Link from "next/link";
import type { Apostle, TwelveData } from "@/lib/apostles/types";
import { APOSTLE_PLATES, PAUL_PLATE } from "@/lib/apostles/plates";
import GlossText from "@/app/_components/GlossText";
import InlineMediaPlate from "@/app/_components/InlineMediaPlate";
import ApostlesDiveList from "../ApostlesDiveList";
import ApostlesSectionNav from "../ApostlesSectionNav";
import RefLinks from "../RefLinks";
import SourceLine from "../SourceLine";
import WeightPill from "../WeightPill";

function TwelveMap({ data }: { data: TwelveData }) {
  return (
    <nav className="ap-map" aria-label="The twelve in order">
      <div className="world-tool-head">
        <strong>Thirteen records</strong>
        <span>the Twelve, the traitor, the replacement — every claim graded</span>
      </div>
      <div className="ap-map-nodes">
        {data.apostles.map((a) => (
          <a key={a.id} href={`#${a.id}`} className="ap-map-node">
            <span className="ap-map-mark" aria-hidden="true" />
            <strong>{a.name}</strong>
            <span>{a.aka.split("·")[0].trim()}</span>
            <em>{a.id === "matthias" ? "Seat 12, restored" : `Seat ${a.seat}`}</em>
          </a>
        ))}
      </div>
    </nav>
  );
}

function ApostleRecord({
  apostle,
  glossSeen,
}: {
  apostle: Apostle;
  glossSeen: Map<string, string>;
}) {
  const a = apostle;
  const plate = APOSTLE_PLATES[a.id];
  return (
    <details className="ap-dive" id={a.id} data-apostles-dive>
      {/* The summary names itself concisely for AT; the glance stays visual —
          its full text lives in the record body and the data. */}
      <summary
        className="ap-dive-summary"
        aria-label={`${a.name} — open the full record`}
      >
        <span className="ap-seat">
          {a.id === "matthias" ? "Seat 12 · restored" : `Seat ${a.seat}`}
        </span>
        <h2>{a.name}</h2>
        <span className="ap-aka">
          {a.aka} · <em>{a.meaning}</em>
        </span>
        <span className="ap-glance">
          <span>
            <strong>The call</strong>
            {a.glanceCall}
          </span>
          <span>
            <strong>The cost</strong>
            {a.glanceCost}
          </span>
        </span>
        <span className="ap-dive-prompt">
          <span className="ap-dive-open-label">Open the full record</span>
          <span className="ap-dive-close-label">Close the full record</span>
        </span>
      </summary>
      <div className="ap-dive-body">
        <p className="ap-band">{a.band}</p>
        {plate && (
          <div className="ap-record-plate">
            <InlineMediaPlate plate={plate} />
          </div>
        )}
        <p>
          <GlossText text={a.before} seen={glossSeen} />
        </p>

        <section className="ap-part">
          <h3>The call</h3>
          <h4>{a.call.title}</h4>
          <p>
            <GlossText text={a.call.note} seen={glossSeen} />
          </p>
          <RefLinks refs={a.call.refs} />
        </section>

        <section className="ap-part">
          <h3>On the record</h3>
          {a.record.map((scene) => (
            <div className="ap-scene" key={scene.title}>
              <h4>{scene.title}</h4>
              <p>
                <GlossText text={scene.note} seen={glossSeen} />
              </p>
              <RefLinks refs={scene.refs} />
            </div>
          ))}
        </section>

        <section className="ap-part ap-human">
          <h3>The human moment</h3>
          <p>
            <GlossText text={a.human.text} seen={glossSeen} />
          </p>
          <RefLinks refs={a.human.refs} />
        </section>

        <section className="ap-part">
          <h3>After the upper room</h3>
          <p>
            <GlossText text={a.after.text} seen={glossSeen} />
          </p>
          <RefLinks refs={a.after.refs} />
        </section>

        {a.sent.length > 0 && (
          <section className="ap-part">
            <h3>The road</h3>
            {a.sent.map((claim) => (
              <div className="ap-claim" key={claim.claim}>
                <p>
                  <WeightPill weight={claim.weight} />{" "}
                  <GlossText text={claim.claim} seen={glossSeen} />
                </p>
                <SourceLine earliest={claim.earliest} sourceUrl={claim.sourceUrl} name={a.name} />
                {claim.note && <p className="ap-claim-note">{claim.note}</p>}
              </div>
            ))}
          </section>
        )}

        <section className="ap-part">
          <h3>The end</h3>
          <div className="ap-claim">
            <p>
              <WeightPill weight={a.death.weight} />{" "}
              <GlossText text={a.death.claim} seen={glossSeen} />
            </p>
            <SourceLine earliest={a.death.earliest} sourceUrl={a.death.sourceUrl} name={a.name} />
            {a.death.note && <p className="ap-claim-note">{a.death.note}</p>}
          </div>
        </section>

        {a.writings && (
          <section className="ap-part">
            <h3>The writings</h3>
            <p>
              <GlossText text={a.writings} seen={glossSeen} />
            </p>
          </section>
        )}

        {a.seeAlso && (
          <span className="world-see-also">
            <Link href={a.seeAlso.href}>{a.seeAlso.label} →</Link>
          </span>
        )}
      </div>
    </details>
  );
}

export default function TwelveRoom({ data }: { data: TwelveData }) {
  // Hash scrolling is owned by ApostlesDiveList (open + scroll in one step),
  // so the room deliberately does not also call useHashScroll.

  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();
  const apostleLinks = data.apostles.map((apostle) => ({
    id: apostle.id,
    label: apostle.name,
  }));

  return (
    <>
      <p className="kicker">
        <Link href="/apostles">The Apostles</Link>
      </p>
      <h1>The twelve records.</h1>
      <p className="lede">
        <GlossText text={data.intro} seen={glossSeen} />
      </p>

      <blockquote className="ap-precedent">
        &ldquo;{data.precedent.text}&rdquo;
        <p>{data.precedent.note}</p>
        <footer className="ap-cite">— {data.precedent.cite}</footer>
      </blockquote>

      <TwelveMap data={data} />
      <ApostlesSectionNav label="Records on this page" items={apostleLinks} />

      <ApostlesDiveList
        id="apostle-records"
        label="Records"
        countLabel="Thirteen records"
        description="Scan each man's call and cost, then open the full evidence only where you want to go deeper."
      >
        {data.apostles.map((a) => (
          <ApostleRecord key={a.id} apostle={a} glossSeen={glossSeen} />
        ))}
      </ApostlesDiveList>

      <blockquote className="ap-paul" id="paul">
        <div className="ap-paul-plate">
          <InlineMediaPlate plate={PAUL_PLATE} />
        </div>
        <p>
          <GlossText text={data.paul.text} seen={glossSeen} />
        </p>
        <footer className="ap-cite">
          <RefLinks refs={data.paul.refs} />
        </footer>
      </blockquote>

      <p className="world-close">
        None of this is embroidery — where the record is four lines, this room
        says four lines. The same church that kept Peter&rsquo;s denial and
        Thomas&rsquo;s demand in its own scriptures kept the quiet seats quiet.
        Where each road went is drawn in{" "}
        <Link href="/apostles/sent" className="textlink">
          the sending
        </Link>
        ; what the next generation wrote is in{" "}
        <Link href="/early" className="textlink">
          the Writings
        </Link>
        .
      </p>
    </>
  );
}
