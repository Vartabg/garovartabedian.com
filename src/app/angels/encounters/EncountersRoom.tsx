"use client";

import Link from "next/link";
import { useState } from "react";
import {
  angelAppearancePlateId,
  angelExorcismPlateId,
  type AngelsPlateMeta,
} from "@/lib/angels/media-plates";
import { useHashScroll } from "@/lib/useHashScroll";
import { traditionFor } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import {
  DEMON_RECOGNITION_INSIGHTS,
  ENCOUNTER_FUNCTIONS,
} from "@/lib/angels/encounter-guides";
import type { Appearance, EncountersData, Exorcism } from "@/lib/angels/types";
import type { Canons } from "@/lib/scriptures/types";
import GlossText from "../../_components/GlossText";
import InlineMediaPlate from "../../_components/InlineMediaPlate";

type EncounterLane = "all" | "holy" | "fallen";

function EncounterFunctionIndex({
  appeared,
  slug,
}: {
  appeared: Appearance[];
  slug: (ref: string) => string;
}) {
  const byRef = new Map(appeared.map((item) => [item.ref, item]));

  return (
    <section className="an-function-index" aria-labelledby="function-index-heading">
      <div className="an-function-index-head">
        <p className="an-section-kicker">The record by function</p>
        <h2 id="function-index-heading">What are the angels doing?</h2>
        <p>
          The source record remains below. This index reveals the repeated offices
          inside it—without forcing every encounter into a speculative rank.
        </p>
      </div>
      <div className="an-function-grid">
        {ENCOUNTER_FUNCTIONS.map((group) => (
          <details className="an-function-card" key={group.id}>
            <summary>
              <span>
                <strong>{group.label}</strong>
                <small>{group.note}</small>
              </span>
              <b>{group.refs.length}</b>
            </summary>
            <ul>
              {group.refs.map((ref) => {
                const appearance = byRef.get(ref);
                if (!appearance) return null;
                return (
                  <li key={ref}>
                    <a href={`#${slug(ref)}`}>
                      <span>{appearance.event}</span>
                      <small>{appearance.who}</small>
                    </a>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}

function RecognitionIndex({
  castOut,
  slug,
}: {
  castOut: Exorcism[];
  slug: (ref: string) => string;
}) {
  const byRef = new Map(castOut.map((item) => [item.ref, item]));

  return (
    <section className="an-recognition" aria-labelledby="recognition-heading">
      <div className="an-recognition-head">
        <p className="an-section-kicker">The hostile witness</p>
        <h3 id="recognition-heading">What the spirits recognize.</h3>
        <p>
          Their words are not treated as doctrine. But the recurring shape of
          the confrontations is difficult to miss.
        </p>
      </div>
      <div className="an-recognition-grid">
        {DEMON_RECOGNITION_INSIGHTS.map((insight) => (
          <article key={insight.id}>
            <strong>{insight.label}</strong>
            <p>{insight.note}</p>
            <span className="an-recognition-refs">
              {insight.refs.map((ref) => {
                const encounter = byRef.get(ref);
                if (!encounter) return null;
                return (
                  <a href={`#${slug(ref)}`} key={ref}>
                    {encounter.event}
                  </a>
                );
              })}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function EncounterNavigator({
  appeared,
  castOut,
  canons,
  slug,
}: {
  appeared: Appearance[];
  castOut: Exorcism[];
  canons: Canons;
  slug: (ref: string) => string;
}) {
  const [lane, setLane] = useState<EncounterLane>("all");
  const [query, setQuery] = useState("");
  const entries = [
    ...appeared.map((item) => ({
      ref: item.ref,
      event: item.event,
      witness: item.who,
      text: `${item.line} ${item.quote ?? ""}`,
      lane: "holy" as const,
    })),
    ...castOut.map((item) => ({
      ref: item.ref,
      event: item.event,
      witness: item.place,
      text: `${item.line} ${item.theySaid ?? ""}`,
      lane: "fallen" as const,
    })),
  ].map((item) => {
    const parsed = parseRef(item.ref);
    const book = parsed && canons.books[parsed.book]?.name;
    const reference = parsed && book
      ? `${book} ${parsed.chapter}:${parsed.verse}${parsed.endVerse ? `–${parsed.endVerse}` : ""}`
      : item.ref;
    return { ...item, reference };
  });
  const words = query.trim().toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
  const matches = entries.filter((item) => {
    if (lane !== "all" && item.lane !== lane) return false;
    const searchable = `${item.event} ${item.witness} ${item.ref} ${item.reference} ${item.text}`.toLocaleLowerCase("en-US");
    return words.every((word) => searchable.includes(word));
  });
  const filters: { id: EncounterLane; label: string; count: number }[] = [
    { id: "all", label: "All encounters", count: entries.length },
    { id: "holy", label: "Appearances", count: appeared.length },
    { id: "fallen", label: "Confrontations", count: castOut.length },
  ];

  return (
    <section className="an-enc-explorer" aria-labelledby="enc-explorer-heading">
      <div className="an-enc-explorer-head">
        <div>
          <p className="an-section-kicker">Two lanes through the record</p>
          <h2 id="enc-explorer-heading">Find the encounter.</h2>
        </div>
        <p>
          A messenger at the door. A voice from the darkness. Find a scene,
          then follow it into the text.
        </p>
      </div>
      <div className="an-enc-lane-filters" role="group" aria-label="Encounter type">
        {filters.map((filter) => (
          <button
            type="button"
            key={filter.id}
            className={`an-enc-lane-filter ${filter.id}`}
            aria-label={`${filter.label}, ${filter.count}`}
            aria-pressed={lane === filter.id}
            onClick={() => setLane(filter.id)}
          >
            <span>{filter.label}</span>
            <b>{filter.count}</b>
          </button>
        ))}
      </div>
      <div className="an-enc-search">
        <label htmlFor="encounter-search">Search the encounters</label>
        <input
          id="encounter-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Gabriel, prison, or Mark 5"
          aria-describedby="encounter-search-hint"
          aria-controls="encounter-results"
        />
        <p id="encounter-search-hint">Search a person, place, phrase, or scripture reference.</p>
      </div>
      <div className="an-enc-results-head">
        <p role="status">{matches.length} of {entries.length} encounters</p>
        {query || lane !== "all" ? (
          <button type="button" onClick={() => { setQuery(""); setLane("all"); }}>
            Reset filters
          </button>
        ) : null}
      </div>
      <nav id="encounter-results" className="an-enc-results" aria-label="Matching encounters">
        {matches.length ? (
          <ol>
            {matches.map((item) => (
              <li key={item.ref}>
                <a
                  href={`#${slug(item.ref)}`}
                  className={`an-enc-result ${item.lane}`}
                  aria-label={`${item.lane === "holy" ? "Appearance" : "Confrontation"}: ${item.event}. ${item.witness}. ${item.reference}`}
                >
                  <span className="an-enc-result-lane">
                    {item.lane === "holy" ? "Appearance" : "Confrontation"}
                  </span>
                  <strong>{item.event}</strong>
                  <span className="an-enc-result-reference">{item.witness} · {item.reference}</span>
                  <span className="an-enc-result-arrow" aria-hidden="true">↓</span>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <p className="an-enc-empty">No matching encounters. Try another word or reset the filters.</p>
        )}
      </nav>
    </section>
  );
}

export default function EncountersRoom({
  data,
  canons,
  plates,
}: {
  data: EncountersData;
  canons: Canons;
  plates: Record<string, AngelsPlateMeta>;
}) {
  useHashScroll(true);

  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();

  const slug = (ref: string) => `enc-${ref.replace(/[^A-Za-z0-9]+/g, "-")}`;

  const refLink = (ref: string) => {
    const p = parseRef(ref);
    const meta = p && canons.books[p.book];
    if (!p || !meta) return null;
    return {
      label: `${meta.name} ${p.chapter}:${p.verse}${p.endVerse ? `–${p.endVerse}` : ""}`,
      href: `/scriptures/${traditionFor(canons, p.book)}/${p.book}/${p.chapter}#v${p.verse}`,
    };
  };

  return (
    <>
      <p className="kicker">
        <Link href="/angels">Angels &amp; Demons</Link>
      </p>
      <h1>The encounters.</h1>
      <p className="lede">
        The unseen doesn&rsquo;t stay unseen. One lane for the appearances —
        messengers stepping into tents, prisons, and tombs. One lane for the
        confrontations — the collected accounts of hostile spirits, with the
        words the passages preserve.
      </p>

      <p className="an-demon-opening-note">
        {data.appeared.length} appearances, {data.castOut.length} confrontations.
        Synthesize multi-witness source dossiers and dialectical audio prompts in the{" "}
        <Link href="/angels/dossier">NotebookLM Dossier Engine →</Link>
      </p>
      <EncounterNavigator appeared={data.appeared} castOut={data.castOut} canons={canons} slug={slug} />
      <EncounterFunctionIndex appeared={data.appeared} slug={slug} />

      <h2 className="an-lane holy">They appeared</h2>
      <p className="scr-meta">
        The collected record continues below. Use the functional index above
        to follow recurring roles across books.
      </p>
      {data.appeared.map((a) => {
        const l = refLink(a.ref);
        const plate = plates[angelAppearancePlateId(a.ref)];
        return (
          <article className="an-enc" key={a.ref} id={slug(a.ref)} tabIndex={-1}>
            <h3>
              {a.event} <span>· {a.who}</span>
            </h3>
            {plate && <InlineMediaPlate plate={plate} />}
            <p>
              <GlossText text={a.line} seen={glossSeen} />
            </p>
            {a.quote && (
              <p>
                &ldquo;
                <GlossText text={a.quote} seen={glossSeen} />
                &rdquo;
              </p>
            )}
            <span className="an-refs">
              {l && <Link href={l.href}>{l.label}</Link>}
            </span>
            {a.seeAlso && (
              <span className="an-see-also">
                <Link href={a.seeAlso.href}>{a.seeAlso.label} →</Link>
              </span>
            )}
          </article>
        );
      })}

      <h2 className="an-lane fallen">He cast them out</h2>
      <p className="scr-meta">
        Notice who recognizes him first. Long before the crowds decide, the
        demons already know — and beg.
      </p>
      <RecognitionIndex castOut={data.castOut} slug={slug} />
      {data.castOut.map((x) => {
        const l = refLink(x.ref);
        const plate = plates[angelExorcismPlateId(x.ref)];
        const parallels = x.parallels.flatMap((ref) => {
          const link = refLink(ref);
          return link ? [link] : [];
        });
        return (
          <article className="an-enc" key={x.ref} id={slug(x.ref)} tabIndex={-1}>
            <h3>
              {x.event} <span>· {x.place}</span>
            </h3>
            {plate && <InlineMediaPlate plate={plate} />}
            <p>
              <GlossText text={x.line} seen={glossSeen} />
            </p>
            {x.theySaid && (
              <blockquote className="an-they-said">
                &ldquo;
                <GlossText text={x.theySaid} seen={glossSeen} />
                &rdquo;
                <em>— the spirits themselves</em>
              </blockquote>
            )}
            <span className="an-refs">
              {l && <Link href={l.href}>{l.label}</Link>}
            </span>
            {parallels.length > 0 && (
              <span className="an-parallels an-refs">
                <span>Parallel accounts</span>
                {parallels.map((parallel) => (
                  <Link key={parallel.href} href={parallel.href}>{parallel.label}</Link>
                ))}
              </span>
            )}
            {x.seeAlso && (
              <span className="an-see-also">
                <Link href={x.seeAlso.href}>{x.seeAlso.label} →</Link>
              </span>
            )}
          </article>
        );
      })}
    </>
  );
}
