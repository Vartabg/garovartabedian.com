import Link from "next/link";
import type { CSSProperties } from "react";
import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import { traditionFor } from "@/lib/scriptures/server";
import type { LexiconData, LexiconTerm } from "@/lib/angels/types";
import type { Canons } from "@/lib/scriptures/types";
import { GlossSegments } from "../../_components/Gloss";

/**
 * The vocabulary — every word the hosted Hebrew and Greek use for the unseen,
 * counted from the tagged text at build time. The room shows the counts, the
 * shape of each word's use, and every verse it stands in, each verse a link
 * into the reader where the original-language underlay shows the word itself.
 *
 * Server-rendered throughout: there is nothing here a click needs to compute.
 * Occurrence lists sit in native <details> so a 200-verse word does not bury
 * a one-verse one.
 */

const EDITION_LABEL: Record<string, string> = {
  oshb: "Hebrew Bible",
  sblgnt: "Greek New Testament",
  lxx: "Greek Old Testament",
};

const LANG_ATTR: Record<LexiconTerm["lang"], { lang: string; dir?: "rtl" }> = {
  hebrew: { lang: "he", dir: "rtl" },
  greek: { lang: "grc" },
};

function ServerGlossText({ text, seen }: { text: string; seen: GlossSeen }) {
  return <GlossSegments segments={segmentText(text, seen)} />;
}

function Headword({ term, small = false }: { term: LexiconTerm; small?: boolean }) {
  const attrs = LANG_ATTR[term.lang];
  return (
    <span className={`an-lex-word${small ? " small" : ""}`}>
      <span lang={attrs.lang} dir={attrs.dir}>
        {term.headword}
      </span>{" "}
      <span className="an-lex-translit">{term.transliteration}</span>
    </span>
  );
}

/** One bar per term, widest for the most frequent — a square-root scale so a single occurrence still shows. */
function CountBars({ data }: { data: LexiconData }) {
  const max = Math.max(1, ...data.terms.map((term) => term.tokens));
  const laneOf = (term: LexiconTerm) => data.groups.find((group) => group.id === term.group)?.lane ?? "holy";
  return (
    <section className="an-lex-summary" aria-labelledby="an-lex-summary-h">
      <div className="an-demon-map-head">
        <strong id="an-lex-summary-h">How often the text says each word</strong>
        <span>
          {data.totals.tokens.toLocaleString("en-US")} occurrences · {data.totals.terms} terms ·{" "}
          {data.totals.chapters} chapters
        </span>
      </div>
      <ol className="an-lex-bars">
        {[...data.terms]
          .sort((a, b) => b.tokens - a.tokens)
          .map((term) => (
            <li key={term.id}>
              <a
                className={`an-lex-bar ${laneOf(term)}`}
                href={`#${term.id}`}
                aria-label={`${term.transliteration}, ${term.gloss}: ${term.tokens} occurrences`}
              >
                <Headword term={term} small />
                <span className="an-lex-bar-track" aria-hidden="true">
                  <span
                    className="an-lex-bar-fill"
                    style={{ "--w": `${Math.max(1.5, Math.sqrt(term.tokens / max) * 100)}%` } as CSSProperties}
                  />
                </span>
                <span className="an-lex-bar-count">{term.tokens}</span>
              </a>
            </li>
          ))}
      </ol>
    </section>
  );
}

export default function VocabularyRoom({ data, canons }: { data: LexiconData; canons: Canons }) {
  // Glossary: dot a foreign term once per page visit.
  const glossSeen: GlossSeen = new Map<string, string>();
  const byId = new Map(data.terms.map((term) => [term.id, term]));

  const verseHref = (book: string, chapter: number, verse: number) =>
    `/scriptures/${traditionFor(book)}/${book}/${chapter}#v${verse}`;

  return (
    <>
      <p className="kicker">
        <Link href="/angels">Angels &amp; Demons</Link>
      </p>
      <h1>The vocabulary.</h1>
      <p className="lede">
        Selected Hebrew and Greek terms for the unseen, counted in the hosted
        tagged texts. {data.totals.tokens.toLocaleString("en-US")}{" "}
        occurrences of {data.totals.terms} terms across {data.totals.chapters} chapters
        — and every one of them links to its verse.
      </p>

      <CountBars data={data} />

      <section className="an-method" aria-labelledby="an-lex-method-h">
        <div className="an-method-copy">
          <p className="an-section-kicker">How to read this room</p>
          <h2 id="an-lex-method-h">A word is not a doctrine.</h2>
          <p>
            The same Hebrew word names a human courier and a heavenly one; the
            same Greek word names a slanderer and the devil. Counting words shows
            where the vocabulary lives. It does not settle what any passage
            means — open the verse and read it.
          </p>
        </div>
      </section>

      {data.groups.map((group) => {
        const terms = data.terms.filter((term) => term.group === group.id);
        if (terms.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`an-lex-group-${group.id}`}>
            <h2 className={`an-lane ${group.lane}`} id={`an-lex-group-${group.id}`}>
              {group.title}
            </h2>
            <p className="scr-meta">{group.note}</p>
            <div className="an-names">
              {terms.map((term) => {
                const pair = term.pair ? byId.get(term.pair) : undefined;
                const editions = [...new Set(term.chapters.map((c) => c.edition))]
                  .map((edition) => EDITION_LABEL[edition] ?? edition)
                  .join(" + ");
                return (
                  <article
                    key={term.id}
                    id={term.id}
                    className={`an-name-card an-lex-card${group.lane === "fallen" ? " fallen" : ""}`}
                  >
                    <h3>
                      <Headword term={term} />
                    </h3>
                    <p className="an-name-meaning">
                      <ServerGlossText text={term.gloss} seen={glossSeen} />
                    </p>
                    <p className="an-lex-count">
                      <strong>{term.tokens}</strong> {term.tokens === 1 ? "occurrence" : "occurrences"} ·{" "}
                      {term.chapters.length} {term.chapters.length === 1 ? "chapter" : "chapters"} ·{" "}
                      {term.books} {term.books === 1 ? "book" : "books"} · {editions}
                    </p>
                    <p>
                      <ServerGlossText text={term.note} seen={glossSeen} />
                    </p>
                    {pair && (
                      <span className="an-see-also">
                        <a href={`#${pair.id}`}>
                          {pair.lang === "hebrew" ? "The Hebrew" : "The Greek"}:{" "}
                          <span lang={LANG_ATTR[pair.lang].lang} dir={LANG_ATTR[pair.lang].dir}>
                            {pair.headword}
                          </span>{" "}
                          →
                        </a>
                      </span>
                    )}
                    <details className="an-lex-occurrences">
                      <summary>
                        Every occurrence — {term.chapters.length}{" "}
                        {term.chapters.length === 1 ? "chapter" : "chapters"}
                      </summary>
                      <ul>
                        {term.chapters.map((occurrence) => {
                          const bookName = canons.books[occurrence.book]?.name ?? occurrence.book;
                          return (
                            <li key={`${occurrence.book}-${occurrence.chapter}`}>
                              <span className="an-lex-book">
                                {bookName} {occurrence.chapter}
                              </span>
                              {occurrence.verses.map((verse) => (
                                <Link
                                  key={verse}
                                  href={verseHref(occurrence.book, occurrence.chapter, verse)}
                                  aria-label={`${bookName} ${occurrence.chapter}:${verse}`}
                                >
                                  {verse}
                                </Link>
                              ))}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="scr-guide-source">
        Counted at build from the hosted {data.source.editions.map((e) => EDITION_LABEL[e] ?? e).join(", ")}{" "}
        (text snapshot {data.source.snapshot}). {data.source.method} Open any verse and switch on the
        original-language underlay to see the tagged word itself.{" "}
        <Link href="/sources#angels-demons">Sources &amp; method</Link>
      </p>
    </>
  );
}
