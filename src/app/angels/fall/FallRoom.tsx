"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  angelFallPlateId,
  type AngelsPlateMeta,
} from "@/lib/angels/media-plates";
import { useHashScroll } from "@/lib/useHashScroll";
import { traditionFor } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import type { FallData, FallStep } from "@/lib/angels/types";
import type { Canons } from "@/lib/scriptures/types";
import GlossText from "../../_components/GlossText";
import InlineMediaPlate from "../../_components/InlineMediaPlate";
import EvidenceNote, { EvidenceLegend } from "../EvidenceNote";
import OriginalLine from "../../_components/OriginalLine";

/** Steps from Job onward speak of the adversary — they take the ember edge. */
const EMBER_FROM = 2;

/** The descent, drawn in one color: the court's gold at the top fading to
 *  the fire's ember at the bottom. Each step's node takes its place on it. */
const GOLD = [210, 169, 79];
const EMBER = [156, 65, 38];
const nodeColor = (t: number) => {
  const c = GOLD.map((g, i) => Math.round(g + (EMBER[i] - g) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

const FALL_PHASES = [
  {
    id: "watchers",
    label: "Watchers",
    range: "Genesis + Enoch",
    stepIds: ["gen-6-1-4", "enoch-6-3-6"],
  },
  {
    id: "court",
    label: "Accuser",
    range: "Job to Luke",
    stepIds: ["job-1-6-12", "sa-ch-census", "zec-3-1-2", "luk-22-31"],
  },
  {
    id: "lament",
    label: "Laments",
    range: "Isaiah + Ezekiel",
    stepIds: ["isa-14-12-15", "ezk-28-12-17"],
  },
  {
    id: "casting",
    label: "Cast out",
    range: "Luke + John",
    stepIds: ["luk-10-18", "jhn-12-31"],
  },
  {
    id: "judgment",
    label: "Judgment",
    range: "Jude to Revelation",
    stepIds: [
      "jud-6-2pe-4",
      "rev-12-7-9",
      "rev-12-10-12",
      "rev-20-abyss-end",
    ],
  },
] as const;

function dossierPresetForFallStep(id: string): string {
  if (id === "gen-6-1-4" || id === "enoch-6-3-6") {
    return "watchers-nephilim-enoch";
  }
  if (id === "luk-10-18" || id === "jhn-12-31") {
    return "synoptic-exorcisms";
  }
  return "adversary-evolution";
}

const phaseForStep = (stepId: string) =>
  FALL_PHASES.find((phase) =>
    (phase.stepIds as readonly string[]).includes(stepId),
  ) ?? FALL_PHASES[0];

function orderedFallSteps(data: FallData): FallStep[] {
  const byId = new Map(data.steps.map((step) => [step.id, step]));
  return FALL_PHASES.flatMap((phase) =>
    phase.stepIds.flatMap((id) => {
      const step = byId.get(id);
      return step ? [step] : [];
    }),
  );
}

function FallFragmentMap({ data }: { data: FallData }) {
  const steps = orderedFallSteps(data);
  const byId = new Map(steps.map((step) => [step.id, step]));
  const indexById = new Map(steps.map((step, index) => [step.id, index]));
  const hosted = steps.filter((s) => s.ref).length;
  const paired = steps.filter((s) => s.second).length;
  const external = steps.length - hosted;

  return (
    <nav className="an-fall-map" aria-label="Fall fragments overview">
      <div className="an-demon-map-head">
        <strong>The fragments, by movement</strong>
        <span>
          {hosted} hosted texts · {paired} paired comparisons
          {external > 0 ? ` · ${external} external ${external === 1 ? "witness" : "witnesses"}` : ""}
        </span>
      </div>
      <span className="an-fall-horizon top">the court of heaven</span>
      <div className="an-fall-descent">
        {FALL_PHASES.map((phase) => {
          const nodes = phase.stepIds.flatMap((id) => {
            const step = byId.get(id);
            const index = indexById.get(id);
            return step && index !== undefined ? [{ s: step, i: index }] : [];
          });
          const first = nodes[0]?.s;
          return (
            <div key={phase.id} className={`an-fall-drow ${phase.id}`}>
              <a className="an-fall-drow-name" href={first ? `#${first.id}` : "#"}>
                {phase.label}
              </a>
              <span className="an-fall-drow-range">{phase.range}</span>
              <span className="an-fall-drow-nodes">
                {nodes.map(({ s, i }) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`an-fall-dnode${s.second ? " paired" : ""}${s.ref ? "" : " external"}`}
                    style={{ "--node": nodeColor(steps.length > 1 ? i / (steps.length - 1) : 0) } as React.CSSProperties}
                    aria-label={`${i + 1}. ${s.title}`}
                  >
                    {i + 1}
                  </a>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      <span className="an-fall-horizon bottom">the lake of fire</span>
      <p className="an-fall-map-key">
        {external > 0 ? "Hollow nodes link to sources outside the hosted text. " : ""}
        Doubled nodes compare two passages.
      </p>
    </nav>
  );
}

function FallProgress({ steps }: { steps: FallStep[] }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const els = steps.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const first = els[0];
        const last = els[els.length - 1];
        if (!first || !last) return;
        const positions = els.map((element) => element.getBoundingClientRect());
        const top = positions[0].top;
        const bottom = positions[positions.length - 1].bottom;
        const readingLine = window.innerHeight * 0.4;
        const t = Math.max(0, Math.min(1, (readingLine - top) / Math.max(1, bottom - top)));
        let current = 0;
        for (let index = 0; index < positions.length; index++) {
          if (positions[index].top <= readingLine) current = index;
        }
        setActive(current);
        setProgress(t);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const resizeObserver = new ResizeObserver(onScroll);
    els.forEach((element) => resizeObserver.observe(element));
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [steps]);

  return (
    <nav className="an-fall-progress" aria-label="Fall reading progress">
      <div className="an-fall-progress-track">
        <div className="an-fall-progress-fill" style={{ height: `${progress * 100}%` }} />
        {steps.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className={`an-fall-progress-dot${i === active ? " active" : ""}${i >= EMBER_FROM ? " fallen" : ""}`} style={{ top: `${steps.length > 1 ? (i / (steps.length - 1)) * 100 : 0}%`, ["--node" as string]: nodeColor(steps.length > 1 ? i / (steps.length - 1) : 0) } as React.CSSProperties} aria-label={`${i + 1}. ${s.title}`} aria-current={i === active ? "step" : undefined} />
        ))}
      </div>
      <span className="an-fall-progress-label" aria-hidden="true">{active + 1} / {steps.length}</span>
    </nav>
  );
}

export default function FallRoom({
  data,
  canons,
  plates,
  originalEditions,
}: {
  data: FallData;
  canons: Canons;
  plates: Record<string, AngelsPlateMeta>;
  /** Book id to hosted edition id, from the server manifest. */
  originalEditions: Record<string, string>;
}) {
  useHashScroll(true);


  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();
  const steps = orderedFallSteps(data);

  /**
   * The wording behind a fragment, in the language it was written in.
   *
   * Several of these steps are labelled disputed precisely because the
   * argument turns on a phrase — "God's sons" in Genesis 6, "day star" in
   * Isaiah 14 — and a reader who can only see the English has to take the
   * dispute on trust. Opening the Hebrew or Greek shows the working. Only
   * books with a hosted critical edition offer it; the rest stay silent.
   */
  const originalFor = (ref?: string) => {
    if (!ref) return null;
    const parsed = parseRef(ref);
    if (!parsed || !originalEditions[parsed.book]) return null;
    return (
      <OriginalLine
        book={parsed.book}
        chapter={parsed.chapter}
        verse={parsed.verse}
        edition={originalEditions[parsed.book]}
      />
    );
  };

  const readerLink = (ref: string, trans?: string) => {
    const p = parseRef(ref);
    const meta = p && canons.books[p.book];
    if (!p || !meta) return null;
    const t = trans ? `?t=${trans}` : "";
    return `/scriptures/${traditionFor(canons, p.book)}/${p.book}/${p.chapter}${t}#v${p.verse}`;
  };

  return (
    <>
      <p className="kicker">
        <Link href="/angels">Angels &amp; Demons</Link>
      </p>
      <h1>The fall.</h1>
      <p className="lede">
        Scripture never tells the adversary&rsquo;s story in one place — it
        surfaces in fragments, written centuries apart. Here are the fragments
        grouped by theme, each in its own words, with the interpretive steps flagged as
        exactly that.
      </p>

      <section className="an-fall-method" aria-labelledby="fall-method-heading">
        <div>
          <p className="an-section-kicker">Read the label before the connection</p>
          <h2 id="fall-method-heading">Not every fragment bears the same weight.</h2>
          <p>
            Direct statements, editorial connections, disputed readings, and
            sources outside most canons remain visible as different kinds of
            evidence throughout the descent.
          </p>
        </div>
        <EvidenceLegend />
      </section>

      <FallFragmentMap data={data} />

      <div className="an-fall-rail-wrap">
        <FallProgress steps={steps} />
        <div className="an-fall-rail">
          <span className="an-fall-horizon top">the court of heaven</span>
          {steps.map((s, i) => {
        const href = s.ref ? readerLink(s.ref) : null;
        const t = steps.length > 1 ? i / (steps.length - 1) : 0;
        const phase = phaseForStep(s.id);
        const plate = plates[angelFallPlateId(s.id)];
        return (
          <article
            className={`an-fall-step phase-${phase.id}${i >= EMBER_FROM ? " fallen" : ""}`}
            key={s.id}
            id={s.id}
            tabIndex={-1}
            style={{ "--node": nodeColor(t) } as React.CSSProperties}
          >
            <span className={`an-fall-phase-tag ${phase.id}`} style={{ position: "sticky", top: 74, zIndex: 1 }}>{phase.label}</span>
            <h2>{s.title}</h2>
            <span className="an-fall-cite">{s.cite}</span>
            <EvidenceNote evidence={s.evidence} />
            {plate && <InlineMediaPlate plate={plate} />}
            <blockquote>
              &ldquo;
              <GlossText text={s.quote} seen={glossSeen} />
              &rdquo;
              {originalFor(s.ref)}
            </blockquote>
            {s.second && (
              <>
                <span className="an-fall-cite">{s.second.cite}</span>
                <blockquote>
                  &ldquo;
                  <GlossText text={s.second.quote} seen={glossSeen} />
                  &rdquo;
                  {originalFor(s.second.ref)}
                </blockquote>
              </>
            )}
            <p>
              <GlossText text={s.note} seen={glossSeen} />
            </p>
            <span className="an-refs">
              {href && <Link href={href}>Read it in context</Link>}
              {s.second &&
                (() => {
                  const h2 = readerLink(
                    s.second.ref,
                    // The Lucifer verse must open in the translation that has it.
                    /Douay/.test(s.second.cite) ? "drb" : undefined,
                  );
                  return h2 ? <Link href={h2}>The second telling</Link> : null;
                })()}
              {s.sourceUrl && (
                <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Source
                </a>
              )}
              {phase.id === "watchers" && (
                <Link href="/scriptures/parallels/the-watchers" style={{ color: "#fbbf24" }}>
                  Watchers Comparative Matrix →
                </Link>
              )}
              {s.readMore && <Link href={s.readMore.href}>{s.readMore.label}</Link>}
              <Link href={`/angels/dossier?preset=${dossierPresetForFallStep(s.id)}`} style={{ color: "var(--accent)" }}>
                NotebookLM Dossier ↗
              </Link>
            </span>
          </article>
        );
          })}
          <span className="an-fall-horizon bottom">the lake of fire</span>
        </div>
      </div>

      <p className="world-note">
        The record ends where it ends: the accuser thrown down, the abyss, the
        lake of fire. However the fragments are weighed, scripture&rsquo;s last
        word on the enemy is his defeat — &ldquo;They overcame him because of
        the Lamb&rsquo;s blood.&rdquo;
      </p>
    </>
  );
}
