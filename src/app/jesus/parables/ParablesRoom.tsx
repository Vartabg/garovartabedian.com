"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getPassageVerses, type PassageVerses } from "@/lib/jesus/client";
import { parseRef } from "@/lib/scriptures/refs";
import type { ScriptureFigure, Parable, ParableAccount, ThomasParable } from "@/lib/jesus/types";
import { SYNOPTIC_FIGURES } from "@/lib/jesus/synoptic-figures";
import { JOHN_FIGURES } from "@/lib/jesus/john-figures";
import type { ThomasTexts } from "@/lib/jesus/thomas-parallels-server";
import { JAMES_PARABLES, jamesHref, type JamesParable } from "@/lib/jesus/james-parables";
import type { JamesTexts } from "@/lib/jesus/james-parables-server";
import { EARLY_FIGURES, earlyFigureHref, earlyFigureParts, earlyDisplayBlocks, type EarlyFigure } from "@/lib/jesus/early-figures";
import type { EarlyFigureTexts } from "@/lib/jesus/early-figures-server";
import type { Canons } from "@/lib/scriptures/types";
import GlossText from "@/app/_components/GlossText";
import OriginalLine from "@/app/_components/OriginalLine";

type RoomEntry = Parable | ScriptureFigure;

type Texts = Map<string, PassageVerses | null>;
type Result = Texts | "error";
type PassageLoader = (ref: string) => Promise<PassageVerses | null>;

/** How often a Gospel uses the Greek words, counted in the hosted SBLGNT. */
export type ParableWordCounts = Record<string, { parabole: number; paroimia: number }>;

const accountRefs = (account: ParableAccount) =>
  [account.setting, account.ref, account.explanation].filter((ref): ref is string => Boolean(ref));

/**
 * The parables room. The list comes from the server; a parable's passages load
 * when it is opened, one panel per Gospel that tells it. Nothing here explains
 * a parable: the setting is the Gospel's own verses, and an explanation appears
 * only where the Gospel records his.
 */
export default function ParablesRoom({
  parables,
  thomasStories,
  counts,
  canons,
  originalEditions,
  thomasTexts = {},
  jamesTexts = {},
  earlyFigureTexts = {},
  passageLoader = getPassageVerses,
}: {
  parables: Parable[];
  thomasStories: ThomasParable[];
  counts: ParableWordCounts;
  canons: Canons;
  /** Book id to hosted edition id, from the server manifest. */
  originalEditions: Record<string, string>;
  thomasTexts?: ThomasTexts;
  jamesTexts?: JamesTexts;
  earlyFigureTexts?: EarlyFigureTexts;
  passageLoader?: PassageLoader;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Map<string, Result>>(new Map());
  const inFlight = useRef<Set<string>>(new Set());
  const earlyFold = useRef<HTMLDetailsElement>(null);

  const bookName = (book: string) => canons.books[book]?.name ?? book;

  /** A readable label from canon metadata alone — no book-text fetch. */
  const label = (ref: string) => {
    const p = parseRef(ref);
    if (!p) return ref;
    return `${bookName(p.book)} ${p.chapter}:${p.verse}${p.endVerse ? `–${p.endVerse}` : ""}`;
  };

  const readerHref = (ref: string) => {
    const p = parseRef(ref);
    if (!p) return "/scriptures";
    const tradition = canons.traditions.find((t) => t.books.includes(p.book))?.id ?? "protestant";
    return `/scriptures/${tradition}/${p.book}/${p.chapter}#v${p.verse}`;
  };

  const load = (parable: RoomEntry) => {
    if (inFlight.current.has(parable.id)) return;
    setResolved((current) => {
      const next = new Map(current);
      next.delete(parable.id);
      return next;
    });
    inFlight.current.add(parable.id);
    const refs = parable.accounts.flatMap(accountRefs);
    Promise.all(refs.map((ref) => passageLoader(ref))).then(
      (passages) => {
        inFlight.current.delete(parable.id);
        setResolved((current) => {
          const next = new Map(current);
          next.set(parable.id, new Map(refs.map((ref, index) => [ref, passages[index]])));
          return next;
        });
      },
      () => {
        inFlight.current.delete(parable.id);
        setResolved((current) => {
          const next = new Map(current);
          next.set(parable.id, "error");
          return next;
        });
      },
    );
  };

  const toggle = (parable: RoomEntry) => {
    if (open === parable.id) {
      setOpen(null);
      return;
    }
    setOpen(parable.id);
    if (!resolved.has(parable.id)) load(parable);
  };

  /** Opens a parable named in the address and brings it into view. */
  const openParable = (id: string) => {
    const parable = [...parables, ...SYNOPTIC_FIGURES, ...JOHN_FIGURES].find((p) => p.id === id);
    const early = thomasStories.some((story) => story.id === id) || JAMES_PARABLES.some(story => story.id === id) || EARLY_FIGURES.some(figure => figure.id === id);
    if (!parable && !early) return;
    // Early writings sit in a closed fold; open it so the entry can scroll into view.
    if (early && earlyFold.current) earlyFold.current.open = true;
    setOpen(id);
    if (parable && !resolved.has(parable.id)) load(parable);
    document
      .getElementById(`parable-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Find and other rooms link to /jesus/parables#parable-<id>; open that
  // parable on arrival, and again if the address changes while the room is open.
  useEffect(() => {
    const openFromHash = () => {
      const match = /^#parable-(.+)$/.exec(window.location.hash);
      if (match) openParable(match[1]);
    };
    const openFromFind = (event: Event) => {
      const id: unknown = (event as CustomEvent).detail;
      if (typeof id === "string") openParable(id);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    window.addEventListener("parables:open", openFromFind);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("parables:open", openFromFind);
    };
    // One listener for the room's life. Its openParable may see an old cache
    // and fetch a parable again, which is harmless; load skips in-flight ones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Glossary: dot a foreign term once per page render.
  const glossSeen = new Map<string, string>();

  const verses = (passage: PassageVerses | null | undefined) =>
    passage ? (
      <p>
        {passage.verses.map((verse) => (
          <span key={verse.number}>
            <sup className="jsu-parable-vn">{verse.number}</sup>
            <GlossText text={verse.text} seen={glossSeen} />{" "}
          </span>
        ))}
      </p>
    ) : (
      <p className="scr-empty">No hosted text is available for this reference.</p>
    );

  const original = (ref: string) => {
    const p = parseRef(ref);
    if (!p || !originalEditions[p.book]) return null;
    return (
      <OriginalLine
        book={p.book}
        chapter={p.chapter}
        verse={p.verse}
        endVerse={p.endVerse}
        edition={originalEditions[p.book]}
      />
    );
  };

  const sources = (parable: RoomEntry) => {
    if (parable.kind === "figure") return parable.id.startsWith("synoptic-") ? "A parable or figure of speech in Matthew, Mark or Luke." : "A figure of speech in John.";
    const quoted = (titles: string[]) => titles.map((title) => `“${title}”`).join(" and ");
    if (parable.kind === "saying") {
      return "In neither book. The Gospel itself calls it a parable.";
    }
    const snodgrass = parable.snodgrass ? `In Snodgrass as ${quoted([parable.snodgrass])}.` : "Not in Snodgrass.";
    const trench = parable.trench.length ? `In Trench as ${quoted(parable.trench)}.` : "Not in Trench.";
    return `${snodgrass} ${trench}`;
  };

  const thomasLinks = (parable: Pick<Parable, "thomas">) => (
    <ul>
      {parable.thomas?.map(({ saying, note }) => (
        <li key={saying}>
          <Link className="textlink jsu-thomas-link" href={`/early/library/gospel-thomas/saying-${saying}`}>Saying {saying}</Link>
          {note && <> · {note}</>}
        </li>
      ))}
    </ul>
  );

  const thomasPanel = (saying: number, note?: string) => (
    <section className="jsu-panel jsu-parable-thomas" key={`thomas-${saying}`}>
      <h3 className="jsu-parable-gospel">Gospel of Thomas · Saying {saying} · outside the canon</h3>
      <p className="scr-meta">Mark M. Mattison · translation from the Coptic</p>
      <p className="jsu-parable-label">
        <Link className="textlink jsu-thomas-link" href={`/early/library/gospel-thomas/saying-${saying}`}>Saying {saying}</Link>
        {note && <> · {note}</>}
      </p>
      {thomasTexts[saying]?.length ? thomasTexts[saying]!.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      )) : <p className="scr-empty">This saying could not be loaded here. Follow the link to the full reader.</p>}
    </section>
  );

  const jamesPanel = (story: JamesParable) => (
    <section className="jsu-panel jsu-parable-james" key={story.id}>
      <h3 className="jsu-parable-gospel">Secret Book of James · {story.locator} · outside the canon</h3>
      <p className="scr-meta">Mark M. Mattison · translation from the Coptic</p>
      <p className="jsu-parable-label"><Link className="textlink" href={jamesHref(story)}>Read in the edition</Link>{story.note && <> · {story.note}</>}</p>
      {jamesTexts[story.id] ? jamesTexts[story.id]!.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="scr-empty">This passage could not be loaded here. Follow the link to the full reader.</p>}
    </section>
  );

  const jamesEntry = (story: JamesParable) => {
    const isOpen = open === story.id;
    return <article className="jsu-pair-block" key={story.id} id={`parable-${story.id}`}>
      <button type="button" className="jsu-pair-head" onClick={() => setOpen(isOpen ? null : story.id)} aria-expanded={isOpen} aria-controls={`parable-${story.id}-text`}>
        <span>{story.title}</span><span className="scr-meta jsu-pair-refs">Secret Book of James {story.locator}</span>
      </button>
      {isOpen && <div id={`parable-${story.id}-text`}><div className="jsu-parable-accounts">{jamesPanel(story)}</div>{story.related && <p><Link className="textlink" href={`#parable-${story.related}`}>Compare the related Gospel passage →</Link></p>}</div>}
    </article>;
  };

  const earlyPanel = (figure: EarlyFigure) => (
    <section className="jsu-panel jsu-parable-early" key={figure.id}>
      <h3 className="jsu-parable-gospel">{figure.work} · {figure.locator} · outside the canon</h3>
      <p className="scr-meta">{figure.speaker} · {figure.translator}</p>
      <p className="jsu-parable-label"><Link className="textlink" href={earlyFigureHref(figure)}>{figure.excerpt ? "Read the source" : "Read in the edition"}</Link>{figure.note && <> · {figure.note}</>}</p>
      {earlyFigureParts(figure).length > 1 && <p className="jsu-parable-label">{earlyFigureParts(figure).slice(1).map((part, index) => <span key={part.section}> · <Link className="textlink" href={earlyFigureHref(figure, part)}>Read part {index + 2} in the edition</Link></span>)}</p>}
      {earlyFigureTexts[figure.id] ? earlyDisplayBlocks(figure, earlyFigureTexts[figure.id]!).map((paragraph, index) => <p key={index} style={figure.poetry || figure.preserveLines ? { whiteSpace: "pre-line" } : undefined}>{paragraph}</p>) : <p className="scr-empty">This passage could not be loaded here. Follow the {figure.excerpt ? "source link" : "link to the full reader"}.</p>}
    </section>
  );

  const earlyEntry = (figure: EarlyFigure) => {
    const isOpen = open === figure.id;
    return <article className="jsu-pair-block" key={figure.id} id={`parable-${figure.id}`}>
      <button type="button" className="jsu-pair-head" onClick={() => setOpen(isOpen ? null : figure.id)} aria-expanded={isOpen} aria-controls={`parable-${figure.id}-text`}>
        <span>{figure.title}</span><span className="scr-meta jsu-pair-refs">{figure.work} · {figure.speaker}</span>
      </button>
      {isOpen && <div id={`parable-${figure.id}-text`}><div className="jsu-parable-accounts">{earlyPanel(figure)}{figure.earlyComparisons?.map(id => {
        const matches = EARLY_FIGURES.filter(candidate => candidate.id === id);
        return id !== figure.id && matches.length === 1 && figure.earlyComparisons?.filter(value => value === id).length === 1
          ? earlyPanel(matches[0]) : <p key={id} className="scr-empty">The comparison could not be loaded.</p>;
      })}{figure.thomas?.map(({ saying, note }) => thomasPanel(saying, note))}</div>{[figure.related, ...(figure.relatedAlso ?? [])].filter((id): id is string => Boolean(id)).map(id => <p key={id}><Link className="textlink" href={`#parable-${id}`}>Compare the related Gospel passage →</Link></p>)}{figure.compareFrom && <p><Link className="textlink" href={`#parable-${figure.compareFrom}`}>Compare the related early passage →</Link></p>}</div>}
    </article>;
  };

  const entry = (parable: RoomEntry) => {
    const result = resolved.get(parable.id);
    const isOpen = open === parable.id;
    const thomas = parable.thomas;
    const james = JAMES_PARABLES.filter(story => story.related === parable.id);
    const early = EARLY_FIGURES.filter(figure => figure.related === parable.id || figure.relatedAlso?.includes(parable.id));
    // The row names who tells it; the verses appear when it opens.
    const gospels = [...new Set(parable.accounts.map((account) => bookName(parseRef(account.ref)?.book ?? "")))];
    const writings = [...new Set([
      ...(thomas?.length ? ["Gospel of Thomas"] : []),
      ...(james.length ? ["Secret Book of James"] : []),
      ...early.map(figure => figure.work),
    ])];
    return (
      <article className="jsu-pair-block" key={parable.id} id={`parable-${parable.id}`}>
        <button
          type="button"
          className="jsu-pair-head"
          onClick={() => toggle(parable)}
          aria-expanded={isOpen}
          aria-controls={`parable-${parable.id}-text`}
        >
          <span>{parable.title}</span>
          <span className="scr-meta jsu-pair-refs">
            {gospels.join(" · ")}
            {writings.length ? ` + ${writings.length} early writing${writings.length > 1 ? "s" : ""}` : ""}
          </span>
        </button>
        {isOpen && (
          <div id={`parable-${parable.id}-text`}>
            {parable.kind === "figure" && parable.note && <p className="scr-meta">{parable.note}</p>}
            <div className="jsu-parable-accounts">
              {result === "error" ? (
                <div className="jsu-inline-error" role="alert">
                  <p>The passages couldn&rsquo;t load. Check the connection and try again.</p>
                  <button type="button" className="scr-btn" onClick={() => load(parable)}>
                    Try again
                  </button>
                </div>
              ) : !result ? (
                <p className="scr-empty" role="status">
                  Turning to the passages…
                </p>
              ) : (
                parable.accounts.map((account) => {
                  const book = parseRef(account.ref)?.book ?? "";
                  const main = result.get(account.ref);
                  return (
                    <section className="jsu-panel jsu-parable-account" key={account.ref}>
                      <h3 className="jsu-parable-gospel">{bookName(book)}{parable.kind === "figure" && parable.speaker ? ` · ${parable.speaker}` : ""}</h3>
                      {account.setting && (
                        <div className="jsu-parable-setting">
                          <p className="jsu-parable-label">
                            Setting ·{" "}
                            <Link href={readerHref(account.setting)}>{label(account.setting)}</Link>
                          </p>
                          {verses(result.get(account.setting))}
                        </div>
                      )}
                      <p className="jsu-parable-label">
                        <Link href={main?.href ?? readerHref(account.ref)}>{label(account.ref)}</Link>
                      </p>
                      {verses(main)}
                      {original(account.ref)}
                      {account.explanation && (
                        <>
                          <p className="jsu-parable-label">
                            His explanation ·{" "}
                            <Link href={readerHref(account.explanation)}>{label(account.explanation)}</Link>
                          </p>
                          {verses(result.get(account.explanation))}
                        </>
                      )}
                      {account.called && (
                        <p className="scr-meta">
                          Called a parable in{" "}
                          <Link href={readerHref(account.called)}>{label(account.called)}</Link>
                        </p>
                      )}
                    </section>
                  );
                })
              )}
            </div>
            {writings.length > 0 && (
              <details className="jsu-parable-fold jsu-parable-also">
                <summary>
                  <span>Also in early writings outside the canon</span>
                  <small>{writings.join(" · ")}</small>
                </summary>
                <div className="jsu-parable-accounts">
                  {thomas?.map(({ saying, note }) => thomasPanel(saying, note))}
                  {james.map(jamesPanel)}
                  {early.map(earlyPanel)}
                </div>
              </details>
            )}
            {result && result !== "error" && <p className="scr-meta jsu-parable-sources">{sources(parable)}</p>}
          </div>
        )}
      </article>
    );
  };

  const stories = parables.filter((p) => p.kind === "story");
  const sayings = parables.filter((p) => p.kind === "saying");
  const inBoth = stories.filter((p) => p.snodgrass && p.trench.length).length;
  const split = stories.filter((p) => p.snodgrass && p.trench.length > 1).length;
  const snodgrassOnly = stories.filter((p) => p.snodgrass && !p.trench.length).length;
  const trenchOnly = stories.filter((p) => !p.snodgrass && p.trench.length).length;
  const count = (book: string) => counts[book] ?? { parabole: 0, paroimia: 0 };

  return (
    <>
      <p className="kicker">
        <Link href="/jesus">Jesus Christ</Link>
      </p>
      <h1>Parables</h1>
      <p className="lede">
        Read parables and figures of speech from Matthew, Mark, Luke and John, with related
        accounts side by side, with selected passages from early writings outside the canon.
      </p>

      <noscript>
        <section aria-labelledby="thomas-no-script">
          <h2 className="jsu-chapter" id="thomas-no-script">Gospel of Thomas · outside the canon</h2>
          <p>Related sayings in the hosted translation:</p>
          {[...parables, ...SYNOPTIC_FIGURES].filter((parable) => parable.thomas?.length).map((parable) => (
            <div key={parable.id}>
              <h3>{parable.title}</h3>
              {thomasLinks(parable)}
            </div>
          ))}
          {thomasStories.map((story) => (
            <div key={story.id}>
              <h3>{story.title}</h3>
              <p><Link className="textlink jsu-thomas-link" href={`/early/library/gospel-thomas/saying-${story.saying}`}>Saying {story.saying}</Link></p>
            </div>
          ))}
        </section>
        <section aria-labelledby="james-no-script">
          <h2 className="jsu-chapter" id="james-no-script">Secret Book of James · outside the canon</h2>
          <ul>{JAMES_PARABLES.map(story => <li key={story.id}><Link href={jamesHref(story)}>{story.title} · {story.locator}</Link></li>)}</ul>
        </section>
        <section aria-labelledby="early-figures-no-script">
          <h2 className="jsu-chapter" id="early-figures-no-script">Other early writings · outside the canon</h2>
          <ul>{EARLY_FIGURES.map(figure => <li key={figure.id}>{earlyFigureParts(figure).map((part, index) => <span key={part.section}><Link href={earlyFigureHref(figure, part)}>{figure.title} · {figure.work} · {figure.locator}{index ? ` · part ${index + 1}` : ""}</Link>{" "}</span>)}{figure.thomas?.map(({ saying }) => <Link key={saying} href={`/early/library/gospel-thomas/saying-${saying}`}>Thomas {saying} · outside the canon</Link>)}<span> · {figure.speaker}{figure.note && <> · {figure.note}</>}</span></li>)}</ul>
        </section>
      </noscript>

      <section aria-labelledby="parables-stories">
        <h2 className="jsu-chapter" id="parables-stories">Stories</h2>
        {stories.map(entry)}
      </section>

      <section aria-labelledby="parables-sayings">
        <h2 className="jsu-chapter" id="parables-sayings">Short sayings the Gospels call parables</h2>
        {sayings.map(entry)}
      </section>

      <section aria-labelledby="parables-synoptic-figures">
        <h2 className="jsu-chapter" id="parables-synoptic-figures">More parables and figures of speech</h2>
        <p>These passages add stories and shorter figures from Matthew, Mark and Luke. Scholars differ on which figures to call parables.</p>
        {SYNOPTIC_FIGURES.map(entry)}
      </section>

      <section aria-labelledby="parables-john-figures">
        <h2 className="jsu-chapter" id="parables-john-figures">Figures of speech in John</h2>
        <p>John uses figures of speech; scholars differ on which to call parables. This is a selection, not a list of every figure in John.</p>
        {JOHN_FIGURES.map(entry)}
      </section>

      {/* The Gospels come first; the early writings wait in one fold, said once to be outside the canon. */}
      <section aria-labelledby="parables-early-writings">
        <details className="jsu-parable-fold" ref={earlyFold}>
          <summary className="jsu-chapter">
            <h2 id="parables-early-writings">Early writings outside the canon</h2>
            <small>{thomasStories.length + JAMES_PARABLES.length + EARLY_FIGURES.length} passages</small>
          </summary>

          <section aria-labelledby="parables-thomas-stories">
            <h3 className="jsu-chapter" id="parables-thomas-stories">Stories in the Gospel of Thomas</h3>
            <p>These stories appear in Thomas and have no matching story in Matthew, Mark or Luke.</p>
            {thomasStories.map((story) => {
              const isOpen = open === story.id;
              return (
                <article className="jsu-pair-block" key={story.id} id={`parable-${story.id}`}>
                  <button type="button" className="jsu-pair-head" onClick={() => setOpen(isOpen ? null : story.id)}
                    aria-expanded={isOpen} aria-controls={`parable-${story.id}-text`}>
                    <span>{story.title}</span>
                    <span className="scr-meta jsu-pair-refs">Thomas {story.saying}</span>
                  </button>
                  {isOpen && <div className="jsu-parable-accounts" id={`parable-${story.id}-text`}>{thomasPanel(story.saying, story.note)}</div>}
                </article>
              );
            })}
          </section>

          <section aria-labelledby="parables-james-stories">
            <h3 className="jsu-chapter" id="parables-james-stories">Passages in the Secret Book of James</h3>
            <p>Three parabolic images attributed to Jesus in this writing. References use Nag Hammadi Codex I,2 page and line numbers. Related images in the Gospels differ in wording and setting.</p>
            {JAMES_PARABLES.filter(story => story.kind !== "figure").map(jamesEntry)}
          </section>

          <section aria-labelledby="parables-james-figures">
            <h3 className="jsu-chapter" id="parables-james-figures">Figures of speech in the Secret Book of James</h3>
            <p>These references use section titles and paragraph numbers from the hosted translation.</p>
            {JAMES_PARABLES.filter(story => story.kind === "figure").map(jamesEntry)}
          </section>

          <section aria-labelledby="parables-early-figures">
            <h3 className="jsu-chapter" id="parables-early-figures">Other early writings</h3>
            <p>These passages distinguish speakers in the writings from images used by their authors. Each selection identifies its source and translation.</p>
            {EARLY_FIGURES.map(earlyEntry)}
          </section>
        </details>
      </section>

      <section aria-labelledby="parables-method" className="jsu-parable-method">
        <details className="jsu-parable-fold">
          <summary className="jsu-chapter">
            <h2 id="parables-method">How this list was made</h2>
          </summary>
          <p>
            The original {stories.length} stories are drawn from Klyne Snodgrass,{" "}
            <a
              className="textlink"
              href="https://catdir.loc.gov/catdir/toc/ecip086/2007049335.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <cite>Stories with Intent</cite> (2008)
            </a>
            , and Richard Chenevix Trench,{" "}
            <a
              className="textlink"
              href="https://archive.org/details/notesonparableso00treniala"
              target="_blank"
              rel="noopener noreferrer"
            >
              <cite>Notes on the Parables of Our Lord</cite> (1882)
            </a>
            . Both books treat {inBoth}; {snodgrassOnly} are in Snodgrass only and {trenchOnly} in
            Trench only. In {split} cases Trench treats as two parables what Snodgrass treats as
            one; each appears here once, with both Gospels&rsquo; texts.
          </p>
          <p>
            The {sayings.length} short sayings are in neither book. Each is here because the
            Gospel text calls it a parable, in the verse marked on it.
          </p>
          <p>
            Several additional Matthew, Mark and Luke passages follow <a href="https://church.catholic-resources.org/Bible/Parables.htm">Felix Just’s comparison of parables and images</a>,
            the <a href="https://wsproject.org/archive/books/snodgrass.html">index to Snodgrass</a>,
            <a href="https://scielo.org.za/scielo.php?pid=S2305-08532015000100012&amp;script=sci_arttext"> Jacob Scholtz on the householder</a>,
            and <a href="https://www.sbl-site.org/wp-content/uploads/2024/12/Burkett_vol2.pdf">Delbert Burkett on Matthew and Luke</a>.
            Luke calls “Physician, heal yourself” a <i lang="el">parabolē</i>, often translated “proverb.”
            Further figures are included for comparison with early writings. This is a selection rather than every figure in these Gospels.
          </p>
          <p>
            The John section includes twelve passages attributed to A. M. Hunter in
            <a href="https://archive.gci.org/articles/what-jesus-parables-reveal/"> “What Jesus’ Parables Reveal”</a>,
            and additional passages listed by Ruben Zimmermann in <a href="https://doi.org/10.1163/174551911X612818">“Are There Parables in John?”</a> (2011), p. 269.
            Annang Asumang also identifies the lamp and working by day as figures in <a href="https://www.sats.edu.za/wp-content/uploads/2020/02/Asumang-Bearing-Witness-Nicodemusly.pdf">“Bearing Witness Nicodemusly”</a> (2017), p. 25.
            Hunter’s sheepfold passage is John 10:1–5; here it extends to verse 18 to include
            the door and good shepherd images described by <a href="https://www.scielo.org.za/scielo.php?lng=en&amp;nrm=iso&amp;pid=S2305-08532019000100042&amp;script=sci_arttext&amp;tlng=en">Francois Viljoen</a>.
            The bridegroom’s friend is spoken by John the Baptist.
          </p>
          <p>
            Some entries show and link to related sayings in the <Link href="/early/library/gospel-thomas">Gospel of Thomas</Link>,
            a writing outside the canon. Parallels can differ in wording and setting; a link does not establish dependence.
          </p>
          <p>The three parabolic passages from the <Link href="/early/library/secret-book-james">Secret Book of James</Link> are identified by Francis Watson in <a href="https://www.peeters-leuven.be/download_OA.php?id=9789042943902&amp;name=Texts+in+Context"><cite>Texts in Context</cite></a>, p. 226, note 58. Jean-Claude Loba Mkole compares the grain images with Mark in <a href="https://scielo.org.za/scielo.php?pid=S0259-94222022000400056&amp;script=sci_arttext">“Jesus: The apex of biblical canons”</a>. The title list in James 8 names parables without retelling them. The additional figures are selected from <a href="https://www.gospels.net/james">Mark M. Mattison’s translation</a>.</p>
          <p>Other selections use the site’s hosted editions of the <Link href="/early/epistula-apostolorum">Epistula Apostolorum</Link>, <Link href="/early/library/2-clement">2 Clement</Link>, <Link href="/early/library/gospel-philip">Gospel of Philip</Link>, <Link href="/early/library/gospel-truth">Gospel of Truth</Link>, <Link href="/early/library/shepherd-hermas">Shepherd of Hermas</Link>, <Link href="/early/didache">Didache</Link>, <Link href="/early/library/barnabas">Barnabas</Link>, <Link href="/early/library/1-clement">1 Clement</Link>, and <Link href="/early/library/diognetus">Diognetus</Link>. Their speakers and relationships to Gospel passages are identified with each selection. R. McL. Wilson notes the axe comparison in <a href="https://gnosis.study/library/%D0%93%D0%BD%D0%BE%D0%B7%D0%B8%D1%81/%D0%98%D1%81%D1%81%D0%BB%D0%B5%D0%B4%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F/ENG/Wilson%20R.McL.%20-%20The%20Gospel%20of%20Philip.%20Translated%20from%20the%20Coptic%20text%2C%20with%20an%20Introduction%20and%20Commentary.pdf"><cite>The Gospel of Philip</cite></a>.</p>
          <p>The Eusebius report and Acts of Thomas excerpts are from M. R. James, <a href="https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf"><cite>The Apocryphal New Testament</cite></a> (1924), p. 3 and the Acts of Thomas, pp. 365–435. Eusebius reports a gospel in Hebrew letters; its identification is debated. The Hymn of the Pearl appears in some manuscripts of the Acts of Thomas.</p>
          <p>
            The three Thomas stories are listed by Simon Gathercole, <a href="https://brill.com/abstract/title/19205"><cite>The Gospel of Thomas: Introduction and Commentary</cite></a> (2014), p. 234,
            and Ernest van Eck, <a href="https://www.scielo.org.za/pdf/stj/v7n1/13.pdf">“The land is ours, not yours”</a>, <cite>Stellenbosch Theological Journal</cite> 7 (2021), p. 10.
          </p>
          <details className="jsu-thomas-source-list">
            <summary>Sources for the Thomas comparisons</summary>
            <ul>
              <li>Mahlon H. Smith, Synoptic Gospels Primer: <a href="https://virtualreligion.net/primer/outlines/parables.html">parables</a>, <a href="https://virtualreligion.net/primer/outlines/repute.html">reputation</a>, <a href="https://virtualreligion.net/primer/outlines/journey.html">journey</a>, <a href="https://virtualreligion.net/primer/outlines/judea.html">Jerusalem</a>, <a href="https://virtualreligion.net/forum/RLQ/q_powers.html">strong man</a> and <a href="https://virtualreligion.net/primer/harvest_4.html">harvest</a>.</li>
              <li>Richard Bauckham, <a href="https://www.cambridge.org/core/journals/new-testament-studies/article/abs/synoptic-parousia-parables-again/AF875ECAF707C39D6A977A5FEFF19E67">“Synoptic Parousia Parables Again”</a>, <i>New Testament Studies</i> 29 (1983), 129–134.</li>
              <li><a href="https://doi.org/10.17570/stj.2025.v11n1.15">J. Gertrud Tönsing, “Mending clothes and making wine”</a>, <i>Stellenbosch Theological Journal</i>, and the <a href="https://www.intratext.com/IXT/ENG0103/_P5.HTM">IntraText Thomas cross references</a>.</li>
              <li>André Gagné, <a href="https://www.brepols.net/products/IS-9782503584904-1"><cite>The Gospel According to Thomas</cite></a> (2019), pp. 185–186, and Arland J. Hultgren, <a href="https://intertextual.bible/text/luke-14.31/gospel-of-thomas-1.98"><cite>The Parables of Jesus: A Commentary</cite></a> (2000), p. 444.</li>
              <li>Stephen J. Patterson, <a href="https://doi.org/10.1163/9789004256217"><cite>The Gospel of Thomas and Christian Origins</cite></a> (2013), pp. 99–100; David J. Downs, <a href="https://www.mdpi.com/2077-1444/9/7/201">“Almsgiving and Competing Soteriologies”</a> (2018); and <a href="https://mail.sermononthemount.org.uk/Background/ParallelPassages.html">parallel passages in the Sermon on the Mount</a>.</li>
            </ul>
        </details>
        <p>
          Matthew uses the Greek word for parable, <i lang="el">parabolē</i>,{" "}
          {count("MAT").parabole} times, Mark {count("MRK").parabole}, and Luke{" "}
          {count("LUK").parabole}.{" "}
          {count("JHN").parabole === 0 ? "John never uses it" : `John uses it ${count("JHN").parabole} times`};
          he uses <i lang="el">paroimia</i>, &ldquo;figure of speech,&rdquo;{" "}
          {count("JHN").paroimia} times. Counted in the SBL Greek New Testament hosted on this site.
        </p>
        </details>
      </section>
    </>
  );
}
