"use client";

import Link from "next/link";
import { type CSSProperties } from "react";
import {
  angelDemonPlateId,
  type AngelsPlateMeta,
} from "@/lib/angels/media-plates";
import { traditionFor } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import { useHashScroll } from "@/lib/useHashScroll";
import type { DemonsData, NamedDemon } from "@/lib/angels/types";
import type { GlossSeen } from "@/lib/glossary/segment";
import type { Canons } from "@/lib/scriptures/types";
import GlossText from "../../_components/GlossText";
import InlineMediaPlate from "../../_components/InlineMediaPlate";

/** Rising embers — decoration only, deterministic, stilled by reduced motion. */
const EMBERS: { x: number; delay: number; dur: number; size: number }[] = [
  { x: 8, delay: 0, dur: 12, size: 3 },
  { x: 21, delay: 4.4, dur: 15, size: 2 },
  { x: 34, delay: 8.2, dur: 11, size: 2.5 },
  { x: 47, delay: 2.1, dur: 16, size: 2 },
  { x: 58, delay: 10.6, dur: 13, size: 3 },
  { x: 69, delay: 5.8, dur: 14, size: 2 },
  { x: 81, delay: 1.3, dur: 12.5, size: 2.5 },
  { x: 92, delay: 7.5, dur: 15.5, size: 2 },
];

function EmberDrift() {
  return (
    <div className="an-embers" aria-hidden="true">
      {EMBERS.map((e, i) => (
        <span
          key={i}
          style={
            {
              left: `${e.x}%`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.dur}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

type SourceGroup = {
  id: string;
  marker: string;
  title: string;
  note: string;
  entryIds: readonly string[];
};

/** Reading groups describe the records, not a hierarchy of spirits. */
const SOURCE_GROUPS: readonly SourceGroup[] = [
  {
    id: "encountered-spirits",
    marker: "01",
    title: "Spirits in encounters",
    note: "Tobit, the Gospels, and Acts describe spirits being driven out or bound. A personal name, a collective answer, and a description do different work.",
    entryIds: ["asmodaeus", "legion", "spirit-of-python"],
  },
  {
    id: "titles-and-rulers",
    marker: "02",
    title: "Titles and unseen rulers",
    note: "An angel of the abyss, a ruler of demons, opposing princes, and Paul's name for the adversary. Read the title before deciding what kind of being it describes.",
    entryIds: ["abaddon-apollyon", "beelzebul", "princes-of-persia-and-greece", "belial"],
  },
  {
    id: "enoch-watchers",
    marker: "03",
    title: "Watchers & spirits in Second Temple texts",
    note: "Azazel and Semjâzâ belong to Enoch's account of the Watchers. Mastema in Jubilees leads the surviving unclean spirits allowed to test mankind.",
    entryIds: ["azazel", "semjaza", "mastema"],
  },
];

/** Condensed from the identity distinctions already recorded in demons.json. */
const ENTRY_IDENTITY: Record<string, { label: string; note: string }> = {
  asmodaeus: {
    label: "Named evil spirit",
    note: "Tobit names the spirit and tells how Raphael binds him.",
  },
  legion: {
    label: "Collective name",
    note: "The answer is “we are many”: Legion does not identify a single spirit.",
  },
  "spirit-of-python": {
    label: "Descriptive phrase",
    note: "Acts describes a spirit of divination; the Greek wording is “a spirit of Python”.",
  },
  "abaddon-apollyon": {
    label: "Angel of the abyss",
    note: "Revelation calls this figure an angel and king over the locusts.",
  },
  beelzebul: {
    label: "Ruler title",
    note: "The name appears in the charge that Jesus casts out demons by their prince.",
  },
  "princes-of-persia-and-greece": {
    label: "Territorial titles",
    note: "Daniel names opposing princes by their kingdoms, without identifying them as Satan.",
  },
  belial: {
    label: "Adversary name",
    note: "Paul sets Belial against Christ; the Hebrew word means worthlessness.",
  },
  azazel: {
    label: "Disputed identification",
    note: "Leviticus leaves the term's meaning disputed; 1 Enoch names a fallen angel.",
  },
  semjaza: {
    label: "Named Watcher",
    note: "1 Enoch names the leader of the Watchers and tells of his binding.",
  },
  mastema: {
    label: "Prince of evil spirits",
    note: "Jubilees names him chief of the surviving spirits who test mankind.",
  },
};

function dossierPresetForDemon(id: string): string | null {
  switch (id) {
    case "azazel":
      return "azazel-scapegoat";
    case "semjaza":
    case "mastema":
      return "watchers-nephilim-enoch";
    case "legion":
    case "beelzebul":
      return "synoptic-exorcisms";
    case "asmodaeus":
    case "abaddon-apollyon":
    case "spirit-of-python":
      return null;
    case "princes-of-persia-and-greece":
      return "territorial-princes";
    default:
      return null;
  }
}

function referenceLink(ref: string, canons: Canons) {
  const parsed = parseRef(ref);
  const book = parsed && canons.books[parsed.book];
  if (!parsed || !book) return null;
  return {
    label: `${book.name} ${parsed.chapter}:${parsed.verse}${parsed.endVerse ? `–${parsed.endVerse}` : ""}`,
    href: `/scriptures/${traditionFor(canons, parsed.book)}/${parsed.book}/${parsed.chapter}#v${parsed.verse}`,
  };
}

function DemonSourceIndex({
  groups,
  canons,
}: {
  groups: { group: SourceGroup; entries: NamedDemon[] }[];
  canons: Canons;
}) {
  return (
    <nav className="an-demon-source-index" aria-labelledby="demon-source-index-heading">
      <div className="an-demon-source-intro">
        <p className="an-section-kicker">Begin with the distinction</p>
        <h2 id="demon-source-index-heading">What does the source call them?</h2>
        <p>These entries preserve names, titles, and disputed identifications. The reading groups follow those differences.</p>
      </div>
      <div className="an-demon-source-grid">
        {groups.map(({ group, entries }) => (
          <div className="an-demon-source-group" key={group.id}>
            <a className="an-demon-group-link" href={`#${group.id}`}>
              <span className="an-demon-group-marker" aria-hidden="true">{group.marker}</span>
              <strong>{group.title}</strong>
              <span aria-hidden="true">↓</span>
            </a>
            <ul>
              {entries.map((entry) => {
                const bookId = entry.quoteRef.split(" ")[0];
                const source = canons.books[bookId]?.name ?? bookId;
                const identity = ENTRY_IDENTITY[entry.id]?.label ?? "Source entry";
                return (
                  <li key={entry.id}>
                    <a href={`#${entry.id}`} aria-label={`${entry.name} · ${identity} · ${source}`}>
                      <strong>{entry.name}</strong>
                      <span>{identity}</span>
                      <small>{source}</small>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function DemonRecord({
  demon,
  canons,
  plate,
  seen,
}: {
  demon: NamedDemon;
  canons: Canons;
  plate?: AngelsPlateMeta;
  seen: GlossSeen;
}) {
  const quoteLink = referenceLink(demon.quoteRef, canons);
  const identity = ENTRY_IDENTITY[demon.id];
  const dossierPreset = dossierPresetForDemon(demon.id);
  return (
    <article className="an-name-card fallen an-demon-entry" id={demon.id}>
      <header className="an-demon-entry-head">
        {identity && <p className="an-demon-identity-label">{identity.label}</p>}
        <h3>{demon.name}</h3>
        {demon.altNames.length > 0 && <p className="an-demon-alternate">Also {demon.altNames.join(", ")}</p>}
      </header>
      {identity && <p className="an-demon-identity-note">{identity.note}</p>}
      <blockquote>
        &ldquo;<GlossText text={demon.quote} seen={seen} />&rdquo;
        {quoteLink && (
          <Link className="scr-ref" href={quoteLink.href}>— {quoteLink.label}</Link>
        )}
      </blockquote>
      {plate && <InlineMediaPlate plate={plate} />}
      <p><GlossText text={demon.line} seen={seen} /></p>
      <p className="an-name-meaning"><GlossText text={demon.meaning} seen={seen} /></p>
      <div className="an-demon-source-refs">
        <span className="an-demon-ref-label">Read the passages</span>
        <span className="an-refs">
          {demon.refs.map((ref) => {
            const link = referenceLink(ref, canons);
            return link ? <Link key={ref} href={link.href}>{link.label}</Link> : <span key={ref}>{ref}</span>;
          })}
        </span>
      </div>
      {demon.canonNote && (
        <aside className="an-demon-canon-note" aria-label="Canon context">
          <strong>Canon context</strong>
          <p><GlossText text={demon.canonNote} seen={seen} /></p>
        </aside>
      )}
      <div className="an-demon-dossier-row" style={{ marginTop: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        {demon.seeAlso && (
          <span className="an-see-also">
            <Link href={demon.seeAlso.href}>{demon.seeAlso.label} →</Link>
          </span>
        )}
        {dossierPreset && (
          <span className="an-see-also">
            <Link href={`/angels/dossier?preset=${dossierPreset}`}>
              NotebookLM Research Dossier ↗
            </Link>
          </span>
        )}
      </div>
    </article>
  );
}

export default function DemonsRoom({
  data,
  canons,
  plates,
}: {
  data: DemonsData;
  canons: Canons;
  plates: Record<string, AngelsPlateMeta>;
}) {
  useHashScroll(true);

  const glossSeen: GlossSeen = new Map<string, string>();
  const groupedIds = new Set(SOURCE_GROUPS.flatMap((group) => group.entryIds));
  const groups = SOURCE_GROUPS.map((group) => ({
    group,
    entries: group.entryIds.flatMap((id) => {
      const entry = data.demons.find((demon) => demon.id === id);
      return entry ? [entry] : [];
    }),
  })).filter(({ entries }) => entries.length > 0);
  const additionalEntries = data.demons.filter((demon) => !groupedIds.has(demon.id));
  if (additionalEntries.length > 0) {
    groups.push({
      group: {
        id: "additional-source-entries",
        marker: "04",
        title: "Further source entries",
        note: "Read each entry's source passages and identity notes.",
        entryIds: additionalEntries.map((entry) => entry.id),
      },
      entries: additionalEntries,
    });
  }

  return (
    <>
      <EmberDrift />
      <p className="kicker">
        <Link href="/angels">Angels &amp; Demons</Link>
      </p>
      <h1>The demons.</h1>
      <p className="lede">
        A name spoken from the tombs. An angel over the abyss. Princes opposing
        a messenger. The sources describe different kinds of figures, and
        their words matter: begin with what each passage actually calls them.
      </p>
      <p className="an-demon-opening-note">
        {data.demons.length} entries, with quotations and source passages. The
        adversary&rsquo;s titles have their own <Link href="/angels#enemy-titles">record in the order →</Link>
      </p>

      <DemonSourceIndex groups={groups} canons={canons} />

      {groups.map(({ group, entries }) => (
        <section className="an-demon-reading-group" key={group.id} aria-labelledby={group.id}>
          <header className="an-demon-reading-head">
            <span className="an-demon-group-marker" aria-hidden="true">{group.marker}</span>
            <div>
              <h2 id={group.id}>{group.title}</h2>
              <p>{group.note}</p>
            </div>
            <a href="#demon-source-index-heading" className="an-demon-back-index">Index ↑</a>
          </header>
          <div className="an-demon-entries">
            {entries.map((demon) => (
              <DemonRecord
                key={demon.id}
                demon={demon}
                canons={canons}
                plate={plates[angelDemonPlateId(demon.id)]}
                seen={glossSeen}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
