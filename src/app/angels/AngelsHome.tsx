import Link from "next/link";
import Image from "next/image";
import { ANGEL_REALMS } from "@/lib/angels/realms";
import type { AngelsPlateMeta } from "@/lib/angels/media-plates";
import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import { traditionFor } from "@/lib/scriptures/server";
import { parseRef } from "@/lib/scriptures/refs";
import type { OrderData, TeachingData } from "@/lib/angels/types";
import type { Canons } from "@/lib/scriptures/types";
import { GlossSegments } from "../_components/Gloss";
import WorldDisclosure from "../_components/WorldDisclosure";
import WorldHomeHero from "../_components/WorldHomeHero";
import Descent from "./Descent";
import FeaturedAngelStory from "./FeaturedAngelStory";
import { EvidenceLegend } from "./EvidenceNote";

export type AngelsWorldStats = {
  fallFragments: number;
  appearances: number;
  confrontations: number;
  namedDemons: number;
  vocabularyTerms: number;
  vocabularyOccurrences: number;
};

function ServerGlossText({ text, seen }: { text: string; seen: GlossSeen }) {
  return <GlossSegments segments={segmentText(text, seen)} />;
}

function AngelsFieldGuide({
  data,
  stats,
}: {
  data: OrderData;
  stats: AngelsWorldStats;
}) {
  const gates = [
    {
      number: "01",
      question: "What are they?",
      title: "The order",
      note: "Follow the names, forms, and offices the text actually gives—from the throne to the deep.",
      meta: `${data.bands.length} bands · ${data.named.length} named figures`,
      href: "#order-ladder",
      lane: "holy",
    },
    {
      number: "02",
      question: "What happened?",
      title: "The fall",
      note: "Set the scattered passages beside one another and mark every interpretive step.",
      meta: `${stats.fallFragments} fragments · text by text`,
      href: "/angels/fall",
      lane: "fallen",
    },
    {
      number: "03",
      question: "When do they appear?",
      title: "The encounters",
      note: "Walk the record by function: announcement, deliverance, judgment, revelation, and service.",
      meta: `${stats.appearances} appearances · ${stats.confrontations} confrontations`,
      href: "/angels/encounters",
      lane: "holy",
    },
    {
      number: "04",
      question: "Who is being named?",
      title: "The demons",
      note: "Read spirits, collective names, ruler titles, and Watchers in their own source settings.",
      meta: `${stats.namedDemons} source entries · ${data.enemyNames.length} adversary titles`,
      href: "/angels/demons",
      lane: "fallen",
    },
    {
      number: "05",
      question: "What words?",
      title: "The vocabulary",
      note: "Explore selected Hebrew and Greek terms in the tagged text, with links to their verses.",
      meta: `${stats.vocabularyTerms} terms · ${stats.vocabularyOccurrences.toLocaleString("en-US")} occurrences`,
      href: "/angels/vocabulary",
      lane: "holy",
    },
    {
      number: "06",
      question: "How to synthesize?",
      title: "The dossiers",
      note: "Compile multi-witness research dossiers and dialectical audio prompts for Google NotebookLM.",
      meta: "8 landmark inquiries · NotebookLM export",
      href: "/angels/dossier",
      lane: "holy",
    },
  ] as const;

  return (
    <section className="an-field-guide" aria-labelledby="an-field-guide-heading">
      <div className="an-field-guide-head">
        <p className="an-section-kicker">Choose your next question</p>
        <h2 id="an-field-guide-heading">Keep following the thread.</h2>
        <p>
          Begin with the question you are actually asking. Every path keeps the
          passage, the interpretation, and the later tradition visibly distinct.
        </p>
      </div>
      <nav className="an-field-gates" aria-label="Angels and demons field guide">
        {gates.map((gate) => {
          const content = (
            <>
            <span className="an-field-gate-number" aria-hidden="true">
              {gate.number}
            </span>
            <span className="an-field-gate-question">{gate.question}</span>
            <strong>{gate.title}</strong>
            <span className="an-field-gate-note">{gate.note}</span>
            <span className="an-field-gate-meta">
              {gate.meta}
              <span aria-hidden="true">↗</span>
            </span>
            </>
          );

          return gate.href.startsWith("#") ? (
            <a
              className={`an-field-gate ${gate.lane}`}
              href={gate.href}
              key={gate.number}
            >
              {content}
            </a>
          ) : (
            <Link
              className={`an-field-gate ${gate.lane}`}
              href={gate.href}
              key={gate.number}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

function RealmNavigation() {
  return (
    <nav className="an-hero-realms" aria-label="Explore the four realms">
      <span className="an-hero-realms-label">Follow the descent</span>
      {ANGEL_REALMS.map((realm) => (
        <a key={realm.id} href={`#${realm.anchor}`} className={realm.id}>
          <span aria-hidden="true">{realm.number}</span>
          <strong>{realm.label}</strong>
          <span aria-hidden="true">↓</span>
        </a>
      ))}
    </nav>
  );
}

function StartHere({ plates }: { plates: Record<string, AngelsPlateMeta> }) {
  const stories = [
    { title: "Why six wings?", note: "Stand with Isaiah before the throne.", href: "#band-throne-seraphim", plate: "appearance-isa-6-1-7", label: "The vision" },
    { title: "Who is Lucifer?", note: "Read the poem before the interpretation.", href: "/angels/fall#isa-14-12-15", plate: "fall-isa-14-12-15", label: "The disputed reading" },
    { title: "Why does Legion beg?", note: "Follow the confrontation by the sea.", href: "/angels/demons#legion", plate: "demon-legion", label: "The encounter" },
  ];
  return (
    <nav className="an-start-here" aria-label="Three places to begin">
      {stories.map((story) => {
        const plate = plates[story.plate];
        return (
          <Link className="an-story-door" href={story.href} key={story.title}>
            {plate && <Image src={plate.src} alt="" width={1280} height={720} sizes="(min-width: 761px) 384px, (min-width: 451px) 45vw, 100vw" quality={70} />}
            <span>
              <small>{story.label}</small>
              <strong>{story.title}</strong>
              <span>{story.note}</span>
            </span>
            <span className="an-story-arrow" aria-hidden="true">↗</span>
          </Link>
        );
      })}
    </nav>
  );
}

function TeachingSection({ data, canons, glossSeen }: { data: TeachingData; canons: Canons; glossSeen: GlossSeen }) {
  const refLink = (ref: string) => {
    const p = parseRef(ref);
    const meta = p && canons.books[p.book];
    if (!p || !meta) return null;
    return {
      label: `${meta.name} ${p.chapter}:${p.verse}${p.endVerse ? `–${p.endVerse}` : ""}`,
      href: `/scriptures/${traditionFor(p.book)}/${p.book}/${p.chapter}#v${p.verse}`,
    };
  };

  return (
    <section aria-labelledby="teaching-heading" className="an-teaching">
      <h2 className="an-lane holy" id="teaching-heading">What the text teaches</h2>
      <p className="scr-meta">
        Doctrinal verses about angels and demons — each in the text&rsquo;s own words.
      </p>
      <div className="an-teaching-grid">
        {data.entries.map((t) => {
          const l = refLink(t.ref);
          return (
            <article key={t.id} id={t.id} className="an-teaching-card">
              <h3>{t.title}</h3>
              <blockquote>
                &ldquo;
                <ServerGlossText text={t.quote} seen={glossSeen} />
                &rdquo;
              </blockquote>
              <p>
                <ServerGlossText text={t.line} seen={glossSeen} />
              </p>
              {l && <Link className="scr-ref" href={l.href}>{l.label}</Link>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EvidenceMethod() {
  return (
    <section className="an-method" aria-labelledby="an-method-heading">
      <div className="an-method-copy">
        <p className="an-section-kicker">Evidence before hierarchy</p>
        <h2 id="an-method-heading">Know where the text ends.</h2>
        <p>
          A named being is not the same thing as a complete angelic rank. A
          prophetic taunt is not automatically a biography of Satan. This room
          preserves the connections, but labels how much weight each one can carry.
        </p>
      </div>
      <EvidenceLegend />
    </section>
  );
}

function WorldSynthesis() {
  return (
    <section className="an-synthesis" aria-labelledby="an-synthesis-heading">
      <p className="an-section-kicker">After the names and visions</p>
      <h2 id="an-synthesis-heading">What the record will—and will not—say.</h2>
      <div className="an-synthesis-grid">
        <article>
          <span className="an-synthesis-mark holy" aria-hidden="true">+</span>
          <h3>It says consistently</h3>
          <p>
            Angels are created servants, messengers, worshipers, and agents of
            judgment. Hostile spirits recognize Jesus&rsquo; identity and authority.
            The adversary&rsquo;s story ends in defeat, not rivalry between equals.
          </p>
          <Link href="/angels/encounters">Follow the encounters →</Link>
        </article>
        <article>
          <span className="an-synthesis-mark unresolved" aria-hidden="true">?</span>
          <h3>It leaves unresolved</h3>
          <p>
            The exact heavenly hierarchy, the full mechanics and timing of the
            fall, the identity of Genesis 6&rsquo;s sons of God, and how every title
            for an unseen ruler relates to every other.
          </p>
          <Link href="/angels/fall">Weigh the fragments →</Link>
        </article>
        <article>
          <span className="an-synthesis-mark fallen" aria-hidden="true">≠</span>
          <h3>Tradition begins here</h3>
          <p>
            Fixed nine-choir systems, elaborate angel and demon catalogues, and
            &ldquo;Lucifer&rdquo; as an unqualified personal name are later syntheses.
            They can be studied without being folded silently into the text.
          </p>
          <Link href="/sources#angels-demons">See sources &amp; method →</Link>
        </article>
      </div>
      <blockquote>
        The center of the record is not fascination with spirits. It is the
        authority of the one before whom every power is finally made subject.
      </blockquote>
    </section>
  );
}

/** Server-rendered world body; glossary disclosures remain narrow client islands. */
export default function AngelsHome({
  data,
  teaching,
  canons,
  stats,
  plates,
}: {
  data: OrderData;
  teaching: TeachingData;
  canons: Canons;
  stats: AngelsWorldStats;
  plates: Record<string, AngelsPlateMeta>;
}) {
  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();

  /** Pretty label + reader link for a site-format ref. */
  const refLink = (ref: string) => {
    const p = parseRef(ref);
    const meta = p && canons.books[p.book];
    if (!p || !meta) return null;
    return {
      label: `${meta.name} ${p.chapter}:${p.verse}${p.endVerse ? `–${p.endVerse}` : ""}`,
      href: `/scriptures/${traditionFor(p.book)}/${p.book}/${p.chapter}#v${p.verse}`,
    };
  };

  const Refs = ({ refs }: { refs: string[] }) => (
    <span className="an-refs">
      {refs.map((r) => {
        const l = refLink(r);
        return l ? (
          <Link key={r} href={l.href}>
            {l.label}
          </Link>
        ) : (
          <span key={r}>{r}</span>
        );
      })}
    </span>
  );

  return (
    <>
      <WorldHomeHero
        world="angels"
        eyebrow="A field guide to the unseen"
        title="Angels & Demons."
        facets={[]}
        actions={
          <>
            <div className="an-hero-actions">
              <Link href="/angels/stories/open-his-eyes">Begin the story <span aria-hidden="true">↗</span></Link>
              <a href="#order-ladder">Explore the record <span aria-hidden="true">↓</span></a>
              <Link href="/angels/encounters">Find an encounter <span aria-hidden="true">↗</span></Link>
            </div>
            <RealmNavigation />
            <p className="an-hero-footnote">Text · interpretation · tradition <span>Each kept in view.</span></p>
          </>
        }
      >
        Six wings above a throne. A stranger at the door. A voice from the abyss.
        Follow the beings, the encounters, and the words that name them.
      </WorldHomeHero>

      <FeaturedAngelStory />
      <StartHere plates={plates} />

      <section id="order-ladder" className="an-order-atlas world-focus-anchor" aria-labelledby="an-order-heading">
        <header className="an-atlas-heading">
          <div>
            <p className="an-section-kicker">01 / The order</p>
            <h2 id="an-order-heading">From the throne to the deep.</h2>
          </div>
          <p>
            Four realms, {data.bands.length} groups of passages. A reading path through
            scripture&rsquo;s images, not a fixed hierarchy. Each connection carries
            its sources and an evidence label.
          </p>
        </header>
        <nav className="an-atlas-nav" aria-label="Jump to a realm">
          {ANGEL_REALMS.map((realm) => (
            <a key={realm.id} href={`#${realm.anchor}`}><span>{realm.number}</span> {realm.label}</a>
          ))}
        </nav>
        <Descent bands={data.bands} canons={canons} seen={glossSeen} plates={plates} />
      </section>

      <AngelsFieldGuide data={data} stats={stats} />

      <section className="an-named-section" aria-labelledby="named-ones">
      <h2 className="an-lane holy" id="named-ones">The named ones</h2>
      <p className="scr-meta">
        For all its hosts, scripture gives remarkably few names.
      </p>
      <div className="an-names">
        {data.named.map((n) => {
          const q = refLink(n.quoteRef);
          return (
            <article className="an-name-card" key={n.name} id={n.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
              <h3>{n.name}</h3>
              <p className="an-name-meaning">
                <ServerGlossText text={n.meaning} seen={glossSeen} />
              </p>
              <blockquote>
                &ldquo;
                <ServerGlossText text={n.quote} seen={glossSeen} />
                &rdquo;{" "}
                {q && (
                  <Link className="scr-ref" href={q.href}>
                    — {q.label}
                  </Link>
                )}
              </blockquote>
              <p>
                <ServerGlossText text={n.line} seen={glossSeen} />
              </p>
              <Refs refs={n.refs} />
              {n.canonNote && (
                <p className="an-canon-note">
                  <ServerGlossText text={n.canonNote} seen={glossSeen} />
                </p>
              )}
              {n.seeAlso && (
                <span className="an-see-also">
                  <Link href={n.seeAlso.href}>{n.seeAlso.label} →</Link>
                </span>
              )}
            </article>
          );
        })}
      </div>

      </section>

      <EvidenceMethod />
      <WorldDisclosure
        label="The adversary’s titles"
        note="Accuser, deceiver, destroyer: follow each title to its passage."
      >
      <h2 className="an-lane fallen" id="enemy-titles">The names he goes by</h2>
      <p className="scr-meta">
        The enemy is named by what he does — accuser, deceiver, destroyer.
        Every title, in the text&rsquo;s own words.
      </p>
      <div className="an-enemy">
        {data.enemyNames.map((e) => {
          const l = refLink(e.ref);
          return (
            <div className="an-enemy-item" key={e.title}>
              <strong>{e.title}</strong>
              <q>
                <ServerGlossText text={e.quote} seen={glossSeen} />
              </q>
              {l && <Link href={l.href}>{l.label}</Link>}
            </div>
          );
        })}
      </div>

      </WorldDisclosure>
      <WorldDisclosure
        label="What the text teaches"
        note={`${teaching.entries.length} passages about angels and demons, with quotations and context.`}
      >
        <TeachingSection data={teaching} canons={canons} glossSeen={glossSeen} />
      </WorldDisclosure>
      <WorldSynthesis />
    </>
  );
}
