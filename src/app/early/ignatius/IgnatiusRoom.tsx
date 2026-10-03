"use client";

import Link from "next/link";
import { useState } from "react";
import { IGNATIUS_ROAD_PLATE } from "@/lib/early/plates";
import type { IgnatiusData } from "@/lib/early/types";
import WorldImagePlate from "../../_components/WorldImagePlate";
import RoadMap from "./RoadMap";

export default function IgnatiusRoom({ data }: { data: IgnatiusData }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <p className="kicker">
        <Link href="/early">The Writings</Link>
      </p>
      <h1>Ignatius&rsquo; road</h1>
      <p className="lede">
        Around AD 107 the bishop of Antioch was marched under Roman guard to
        die in the arena. From the stops along the way he wrote seven letters
        that still exist. Touch a letter to see it fly.
      </p>

      <WorldImagePlate
        src={IGNATIUS_ROAD_PLATE.src}
        alt={IGNATIUS_ROAD_PLATE.alt}
        caption={IGNATIUS_ROAD_PLATE.caption}
      />

      <RoadMap data={data} activeLetter={active} onSelect={setActive} />
      <p className="scr-meta ew-map-note">
        A storyteller&rsquo;s map — stylized, not surveyed. Solid line: his
        escorted road. Thin arcs: the letters.
      </p>

      <h2 className="jsu-chapter">The stops</h2>
      {data.stops.map((s) => (
        <p key={s.place}>
          <strong>{s.label}.</strong> {s.note}
        </p>
      ))}

      <h2 className="jsu-chapter">The seven letters</h2>
      {data.letters.map((l) => (
        <article
          className="world-pair-block"
          key={l.textId}
          onMouseEnter={() => setActive(l.textId)}
        >
          <button
            type="button"
            className="world-pair-head"
            onClick={() => setActive(active === l.textId ? null : l.textId)}
            aria-expanded={active === l.textId}
          >
            <span>{l.title}</span>
            <span className="scr-meta world-pair-refs">{l.note}</span>
          </button>
          {active === l.textId && (
            <div className="world-panel">
              <blockquote className="world-quote">{l.quote.text}</blockquote>
              <p className="world-cite">{l.quote.cite}</p>
              <p>
                <Link className="textlink" href={`/early/${l.textId}`}>
                  Read the whole letter →
                </Link>
              </p>
            </div>
          )}
        </article>
      ))}
    </>
  );
}
