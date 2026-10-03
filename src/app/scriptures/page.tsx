import Link from "next/link";
import { canons } from "@/lib/scriptures/server/canons";
import { DEFAULT_TRADITION, START_HERE } from "@/lib/scriptures/prefs";
import WorldHomeHero from "../_components/WorldHomeHero";
import AskBox from "./_components/AskBox";
import ContinueCard from "./_components/ContinueCard";
import FindBook from "./_components/FindBook";
import CanonsMatrix from "./_components/CanonsMatrix";

/** World home — read-first entry, study tools secondary. */
export default function ScripturesHome() {
  const tradition =
    canons.traditions.find((t) => t.id === DEFAULT_TRADITION) ??
    canons.traditions[0];

  return (
    <>
      <WorldHomeHero
        world="scriptures"
        eyebrow="The hosted record"
        title="Read the Bible."
        facets={["Read by book", "Search passages", "Explore topics"]}
      >
        Large text. Clear navigation. Listen aloud on your phone. Every hosted
        translation is public domain, with the text ready to inspect for
        yourself.
      </WorldHomeHero>

      <nav className="scr-intent-index" aria-label="Choose how to enter Scripture">
        <div className="scr-intent-index-head">
          <p className="kicker">Enter by purpose</p>
          <h2>I want to&hellip;</h2>
        </div>
        <div className="scr-intent-index-links">
          <a href="#read">
            <span aria-hidden="true">01</span>
            <strong>Read</strong>
            <small>Open a chapter without setup</small>
          </a>
          <a href="#find">
            <span aria-hidden="true">02</span>
            <strong>Find</strong>
            <small>Search words, references, or questions</small>
          </a>
          <Link href={`/scriptures/${tradition.id}/JHN/1#study`}>
            <span aria-hidden="true">03</span>
            <strong>Understand</strong>
            <small>See context, themes, and connections</small>
          </Link>
          <a href="#study">
            <span aria-hidden="true">04</span>
            <strong>Compare</strong>
            <small>Inspect traditions, editions, and sources</small>
          </a>
        </div>
      </nav>

      <section className="scr-home-start" aria-labelledby="scripture-start-title">
        <header className="scr-home-section-head">
          <p className="kicker">Reader&rsquo;s desk</p>
          <h2 id="scripture-start-title">Start with the text.</h2>
          <p>
            Open a chapter, find a passage, or return to the place you left off.
          </p>
        </header>

        <ContinueCard />

        <div className="scr-home-start-grid">
          <article id="read" className="scr-home-action scr-home-read">
            <div>
              <p className="scr-home-action-kicker">Read</p>
              <h3>Open a chapter</h3>
              <p>
                New here? John is a clear first doorway into the life and words
                of Jesus.
              </p>
            </div>

            <Link
              className="scr-home-primary"
              href={`/scriptures/${tradition.id}/JHN/1`}
            >
              <span>Begin with John 1</span>
              <span aria-hidden="true">→</span>
            </Link>

            <nav
              className="scr-home-reading-paths"
              aria-label="Suggested reading paths"
            >
              {START_HERE.slice(1).map((item) => {
                const name = canons.books[item.bookId]?.name ?? item.label;
                const ch = item.chapter ?? 1;
                return (
                  <Link
                    key={`${item.bookId}-${ch}`}
                    href={`/scriptures/${tradition.id}/${item.bookId}/${ch}`}
                  >
                    <strong>{item.label}</strong>
                    <span>
                      {name} {ch}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </article>

          <article id="find" className="scr-home-action scr-home-search">
            <div>
              <p className="scr-home-action-kicker">Find</p>
              <h3>Search Scripture</h3>
              <p>
                Enter a reference, exact words, or an everyday question. Results
                stay anchored to the hosted text.
              </p>
            </div>

            <AskBox />

            <nav
              className="scr-home-tool-links"
              aria-label="Scripture study tools"
            >
              <Link href="/scriptures/parallels">
                <strong>Abrahamic parallel matrices</strong>
                <span>Comparative slot-diffs across Jewish, Christian, and Islamic witnesses</span>
              </Link>
              <Link href="/scriptures/topics">
                <strong>Browse Bible topics</strong>
                <span>Follow 5,000+ indexed subjects</span>
              </Link>
              <Link href="/scriptures/graph">
                <strong>Trace cross-reference paths</strong>
                <span>Follow verse links, centrality, citation flows, and threads</span>
              </Link>
              <Link href="/scriptures/protestant/GEN/1?t=web&o=1">
                <strong>Read original languages</strong>
                <span>Hebrew and Greek beside the translation</span>
              </Link>
            </nav>
          </article>
        </div>
      </section>

      <FindBook canons={canons} traditionId={tradition.id} />

      <section
        id="study"
        className="scr-browse-section"
        aria-labelledby="study-title"
      >
        <header className="scr-home-section-head">
          <p className="kicker">Compare</p>
          <h2 id="study-title">Explore five canon traditions.</h2>
          <p>
            See which books each tradition receives, read its sourced history,
            and open every public-domain text this site can host.
          </p>
        </header>

        <div className="scr-cards scr-tradition-cards">
          {canons.traditions.map((t) => (
            <Link
              key={t.id}
              href={`/scriptures/${t.id}`}
              className="scr-card scr-tradition-card"
            >
              <h3>{t.name}</h3>
              <p>{t.blurb}</p>
              <span className="scr-tradition-card-foot">
                <span>{t.books.length} hosted books</span>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>

        <CanonsMatrix />
      </section>
    </>
  );
}
