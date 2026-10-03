import { EARLY_TEXTS } from "@/lib/early/client";
import { getEarlyTimeline } from "@/lib/public-json";
import Timeline from "./Timeline";
import EarlyCatalog from "./EarlyCatalog";
import WorldEntry from "../_components/WorldEntry";
import WorldHomeHero from "../_components/WorldHomeHero";
import Link from "next/link";

/** World home — timeline from disk at request/build time. */
export default function WritingsHome() {
  const timeline = getEarlyTimeline();

  return (
    <>
      <WorldHomeHero
        world="early"
        eyebrow="The writings"
        title="The writing kept going."
        facets={[`${EARLY_TEXTS.length} original shelf texts`, "Expanded edition library", "Text + sources"]}
      >
        Scripture has a border; the writing never stopped at it. Before the
        church, Jewish visionaries were already at work; after the apostles,
        their heirs kept on — letters, manuals, defenses, and apocalypses. These
        writings have been received differently across traditions. Read the
        original shelf or explore the expanded library of attributed editions,
        fragments, historical works and source records.
      </WorldHomeHero>

      <WorldEntry
        eyebrow="Open the shelf"
        href="#catalog"
        title={`Browse all ${EARLY_TEXTS.length} writings`}
        note="Filter by era, or open any text on the shelf below."
        action="Browse the complete catalog"
        paths={[
          {
            href: "#timeline",
            label: "See when each text appeared",
            note:
              "Place the writings beside New Testament texts and the world around them.",
            meta: "Timeline",
          },
        ]}
      />

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
