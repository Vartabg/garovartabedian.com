import { readFileSync } from "node:fs";
import path from "node:path";
import ResearchAudio from "../_components/ResearchAudio";
import { EARLY_TEXTS } from "@/lib/early/client";
import { getEarlyTimeline } from "@/lib/public-json";
import Timeline from "./Timeline";
import EarlyCatalog from "./EarlyCatalog";
import WorldHomeHero from "../_components/WorldHomeHero";
import WorldHeroActions from "../_components/WorldHeroActions";
import Link from "next/link";
import XrayTag from "@/app/_components/xray/XrayTag";
import { getLibrary } from "@/lib/early/library-server";
import { getIgnatius } from "@/lib/public-json";
import { earlyFacts, worldXrayTag } from "@/lib/site/world-xray";

/** The first hosted sentence of a writing, with critical brackets removed. */
function hostedOpening(id: string, sectionIndex: number): { title: string; text: string } {
  const file = path.join(process.cwd(), "public", "early", "texts", `${id}.json`);
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    title: string;
    sections: { paragraphs: string[] }[];
  };
  const paragraph = (data.sections[sectionIndex]?.paragraphs[0] ?? "").replace(/[⌈⌉]/g, "");
  const body = paragraph.replace(/^(?:\d+\.\s*)+/, "");
  const sentence = body.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]?.trim() ?? body.trim();
  return { title: data.title, text: sentence };
}

/** World home — timeline from disk at request/build time. */
export default async function WritingsHome() {
  const timeline = getEarlyTimeline();
  const library = await getLibrary();
  const ignatius = getIgnatius();
  const letter = ignatius.letters[0];
  const enoch = hostedOpening("enoch", 1);
  const quadratus = hostedOpening("quadratus", 0);
  const writtenAt = ignatius.stops.find((stop) => stop.place === letter?.writtenAt);
  const nextStop = writtenAt
    ? ignatius.stops[ignatius.stops.indexOf(writtenAt) + 1]
    : undefined;

  return (
    <>
      <XrayTag {...worldXrayTag("early", earlyFacts(EARLY_TEXTS.length, timeline, library))} />
      <WorldHomeHero
        world="early"
        title="The writing kept going."
        // The buttons already say what the grey facts line said ("23 original
        // shelf texts", "Expanded edition library"), so the line is gone.
        facets={[]}
        actions={
          <WorldHeroActions
            label="Explore early writings"
            links={[
              { href: "/early/ignatius", label: "Walk Ignatius’ road" },
              { href: "#catalog", label: `Browse all ${EARLY_TEXTS.length} writings` },
              { href: "/early/library", label: "Expanded library" },
              { href: "#timeline", label: "Timeline" },
            ]}
          />
        }
      >
        Scripture has a border; the writing never stopped at it. Before the
        church, Jewish visionaries were already at work; after the apostles,
        their heirs kept on — letters, manuals, defenses, and apocalypses. These
        writings have been received differently across traditions. Read the
        original shelf or explore the expanded library of attributed editions,
        fragments, historical works and source records.
      </WorldHomeHero>

      <aside className="world-survival" aria-label="One line from 1 Enoch and from Quadratus">
        <h2 className="jsu-chapter">{enoch.title}</h2>
        <blockquote className="world-quote"><p>{enoch.text}</p></blockquote>
        <p><Link href="/early/enoch" className="textlink">Read 1 Enoch →</Link></p>
        <h2 className="jsu-chapter">{quadratus.title}</h2>
        <blockquote className="world-quote"><p>{quadratus.text}</p></blockquote>
        <p><Link href="/early/quadratus" className="textlink">Read the fragment →</Link></p>
      </aside>

      {letter && (
        <aside className="world-survival" aria-label="One letter on Ignatius’ road">
          <h2 className="jsu-chapter">{letter.title}</h2>
          <blockquote className="world-quote">
            <p>{letter.quote.text}</p>
            <footer className="world-cite">{letter.quote.cite}</footer>
          </blockquote>
          {writtenAt && <p><strong>{writtenAt.label}.</strong> {writtenAt.note}</p>}
          {nextStop && <p><strong>Next, {nextStop.label}.</strong> {nextStop.note}</p>}
          <p>
            <Link href="/early/ignatius" className="textlink">Walk the road →</Link>
            {" "}
            <Link href={`/early/${letter.textId}`} className="textlink">Read the letter →</Link>
          </p>
        </aside>
      )}

      <ResearchAudio id="early-writings" />

      <aside className="world-survival" aria-label="Expanded scripture and early-writings library">
        <h2 className="jsu-chapter">The expanded library</h2>
        <p>Lightfoot’s complete 1 Clement, Philo, Josephus, early interpreters,
          apocrypha and church orders — with editions, commentary and coverage
          limits kept visible.</p>
        <p><Link href="/early/library" className="textlink">Browse works and editions →</Link></p>
        <p><Link href="/early/search" className="textlink">Search texts and edition notes →</Link></p>
      </aside>

      <section
        id="timeline"
        className="world-focus-anchor"
        aria-label="Timeline of early writings"
      >
        <Timeline data={timeline} />
      </section>
      <p className="scr-meta">
        The chart runs from 1 Enoch (c. 300 BC) through the Apocalypse of Paul
        (c. AD 400). Bars are scholarly date ranges, not certainties — and a few
        additional witnesses appear for context. The expanded library has its
        own edition records; this timeline continues to describe the original shelf.
      </p>

      <section id="catalog" className="ew-catalog-section" aria-label="Complete catalog">
        <h2 className="jsu-chapter">The original shelf</h2>
        <p className="ew-era-blurb">
          The original {EARLY_TEXTS.length} texts — search or filter by era, then
          open any card.
        </p>
        <EarlyCatalog />
      </section>
    </>
  );
}
