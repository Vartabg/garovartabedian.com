"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getPassage, type Passage } from "@/lib/jesus/client";
import { parseRef } from "@/lib/scriptures/refs";
import type { ProphecyPair } from "@/lib/jesus/types";
import type { Canons } from "@/lib/scriptures/types";
import GlossText from "@/app/_components/GlossText";
import OriginalLine from "@/app/_components/OriginalLine";
import { ProphecyThemeMap, themeId } from "./ProphecyThemeMap";
import ProphecyThemeGraph from "./ProphecyThemeGraph";

type Resolved = { prophecyText: Passage | null; fulfillmentTexts: Passage[] };
type Result = Resolved | "error";
type PassageLoader = (ref: string) => Promise<Passage | null>;

const CONNECTION_LABEL: Record<ProphecyPair["connection"], string> = {
  explicit: "Explicit New Testament claim",
  echo: "Textual echo or application",
  typology: "Christian typological reading",
};

/** Interactive prophecy room — pair index from the server; verse text on open. */
export default function ProphecyRoom({
  pairs,
  canons,
  originalEditions,
  passageLoader = getPassage,
}: {
  pairs: ProphecyPair[];
  canons: Canons;
  /** Book id to hosted edition id, from the server manifest. */
  originalEditions: Record<string, string>;
  passageLoader?: PassageLoader;
}) {

  const [open, setOpen] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Map<string, Result>>(new Map());
  const inFlight = useRef<Set<string>>(new Set());

  /**
   * The wording on each side of a pair, in the language it was written in.
   * A pair is a claim that two texts stand in some relation, and a reader who
   * wants to weigh it should be able to see the Hebrew of the prophecy and the
   * Greek of the fulfilment rather than two English renderings of them.
   *
   * Only books with a hosted critical edition offer the toggle. The site hosts
   * the Masoretic text for the Hebrew canon and SBLGNT for the New Testament;
   * it does not host a Greek Septuagint for the Hebrew-canon books, so where a
   * pair turns on a Septuagint reading this shows the Hebrew and stays silent
   * about the Greek rather than implying it is here.
   */
  const originalFor = (ref: string) => {
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

  /** A readable label from canon metadata alone — no book-text fetch. */
  const label = (ref: string) => {
    const p = parseRef(ref);
    const meta = p && canons.books[p.book];
    if (!p || !meta) return ref;
    return `${meta.name} ${p.chapter}:${p.verse}${p.endVerse ? `–${p.endVerse}` : ""}`;
  };

  const resolvePair = (pair: ProphecyPair) => {
    if (inFlight.current.has(pair.id)) return;
    setResolved((current) => {
      const next = new Map(current);
      next.delete(pair.id);
      return next;
    });
    inFlight.current.add(pair.id);
    Promise.all([
      passageLoader(pair.prophecy.ref),
      ...pair.fulfillment.map((fulfillment) => passageLoader(fulfillment.ref)),
    ]).then(
      ([prophecyText, ...fulfillment]) => {
        inFlight.current.delete(pair.id);
        setResolved((prev) => {
          const next = new Map(prev);
          next.set(pair.id, {
            prophecyText: prophecyText ?? null,
            fulfillmentTexts: fulfillment.filter((x): x is Passage => x !== null),
          });
          return next;
        });
      },
      () => {
        inFlight.current.delete(pair.id);
        setResolved((current) => {
          const next = new Map(current);
          next.set(pair.id, "error");
          return next;
        });
      },
    );
  };

  const toggle = (pair: ProphecyPair) => {
    if (open === pair.id) {
      setOpen(null);
      return;
    }
    setOpen(pair.id);
    if (!resolved.has(pair.id)) resolvePair(pair);
  };

  const themes = [...new Set(pairs.map((p) => p.theme))];
  const themeCounts = new Map(themes.map((t) => [t, pairs.filter((p) => p.theme === t).length]));
  // Glossary: dot a foreign term once per page render.
  const glossSeen = new Map<string, string>();

  return (
    <>
      <p className="kicker">
        <Link href="/jesus">Jesus Christ</Link>
      </p>
      <h1>Prophecy → fulfillment</h1>
      <p className="lede">
        Written centuries apart. The prophecy on the left, the passage that
        claims it on the right — both in full, both linked to their context.
        The connection is yours to weigh.
      </p>

      <aside className="jsu-connection-key" aria-label="How the connections are classified">
        <strong>How to read the labels</strong>
        <span><b>Explicit</b> means the New Testament names the older text.</span>
        <span><b>Echo</b> marks a verbal or thematic application.</span>
        <span><b>Typology</b> names a later Christian reading rather than a direct claim.</span>
      </aside>

      <ProphecyThemeGraph className="my-8" />

      <ProphecyThemeMap themes={themes} counts={themeCounts} />

      {themes.map((theme) => (
        <section key={theme} id={themeId(theme)}>
          <h2 className="jsu-chapter">{theme}</h2>
          {pairs
            .filter((p) => p.theme === theme)
            .map((p) => {
              const r = resolved.get(p.id);
              const isSufferingServant =
                p.id === "pierced-hands-feet" ||
                p.id === "carried-sicknesses" ||
                p.id === "silent-before-accusers" ||
                p.id === "wounded-for-transgressions" ||
                p.id === "grave-with-the-rich";

              return (
                <article className="jsu-pair-block" key={p.id}>
                  <button
                    type="button"
                    className="jsu-pair-head"
                    onClick={() => toggle(p)}
                    aria-expanded={open === p.id}
                    aria-controls={`prophecy-pair-${p.id}`}
                  >
                    <span>{p.line}</span>
                    <span className={`jsu-connection is-${p.connection}`}>
                      {CONNECTION_LABEL[p.connection]}
                    </span>
                    <span className="scr-meta jsu-pair-refs">
                      {label(p.prophecy.ref)} →{" "}
                      {p.fulfillment.map((f) => label(f.ref)).join("; ")}
                    </span>
                  </button>
                  {open === p.id && (
                    <div id={`prophecy-pair-${p.id}`}>
                      {r === "error" ? (
                        <div className="jsu-inline-error" role="alert">
                          <p>
                            The passages couldn&rsquo;t load. Check the
                            connection and try again.
                          </p>
                          <button
                            type="button"
                            className="scr-btn"
                            onClick={() => resolvePair(p)}
                          >
                            Try again
                          </button>
                        </div>
                      ) : !r ? (
                        <p className="scr-empty" role="status">
                          Turning to the passages…
                        </p>
                      ) : (
                        <div className="jsu-pair">
                          <div className="jsu-panel">
                            {r.prophecyText ? (
                              <>
                                <Link
                                  className="scr-ref"
                                  href={r.prophecyText.href}
                                >
                                  {r.prophecyText.label}
                                </Link>
                                <p>
                                  <GlossText
                                    text={r.prophecyText.text}
                                    seen={glossSeen}
                                  />
                                </p>
                                {originalFor(r.prophecyText.ref)}
                              </>
                            ) : (
                              <p className="scr-empty">
                                No hosted text is available for this reference.
                              </p>
                            )}
                          </div>
                          <div className="jsu-panel">
                            {r.fulfillmentTexts.map((f) => (
                              <div key={f.ref}>
                                <Link className="scr-ref" href={f.href}>
                                  {f.label}
                                </Link>
                                <p>
                                  <GlossText text={f.text} seen={glossSeen} />
                                </p>
                                {originalFor(f.ref)}
                              </div>
                            ))}
                            {r.fulfillmentTexts.length === 0 && (
                              <p className="scr-empty">
                                No hosted fulfillment text is available.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {isSufferingServant && (
                        <div className="scr-hit" style={{ marginTop: "1rem", borderLeft: "3px solid var(--accent)", padding: "0.75rem 1rem", background: "var(--surface)" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontFamily: "monospace", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>
                            NotebookLM Textual Critical Dossier
                          </span>
                          <p style={{ fontSize: "0.8125rem", color: "var(--ink)", margin: 0 }}>
                            Collate the Dead Sea Scroll readings (1QIsaᵃ, 5/6HevPs), Septuagint LXX, and patristic citations for this passage in the{" "}
                            <Link href="/jesus/dossier?preset=messianic-servant-isaiah53" style={{ color: "var(--accent)", fontWeight: 600 }}>
                              Suffering Servant &amp; Pierced One Research Dossier →
                            </Link>
                          </p>
                        </div>
                      )}

                      {p.id === "son-of-man" && (
                        <div className="scr-hit" style={{ marginTop: "1rem", borderLeft: "3px solid var(--accent)", padding: "0.75rem 1rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--ink)", fontFamily: "monospace", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>
                            Second Temple Apocalyptic &amp; NotebookLM Dossier
                          </span>
                          <p style={{ fontSize: "0.8125rem", color: "var(--ink)", margin: 0 }}>
                            Examine how Daniel 7, the Similitudes of 1 Enoch (chapters 46 &amp; 71), and Jesus’ confession before the Sanhedrin align in the{" "}
                            <Link href="/scriptures/parallels/son-of-man" style={{ color: "var(--accent)", fontWeight: 600 }}>
                              Son of Man Comparative Matrix →
                            </Link>
                            {" "}or synthesize into an AI podcast in the{" "}
                            <Link href="/jesus/dossier?preset=son-of-man-daniel7" style={{ color: "var(--accent)", fontWeight: 600 }}>
                              Son of Man Research Dossier →
                            </Link>
                          </p>
                        </div>
                      )}

                      {p.id === "seed-of-abraham" && (
                        <div className="scr-hit" style={{ marginTop: "1rem", borderLeft: "3px solid var(--accent)", padding: "0.75rem 1rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--ink)", fontFamily: "monospace", display: "block", marginBottom: "0.25rem" }}>
                            Abrahamic Comparative Witness
                          </span>
                          <p style={{ fontSize: "0.8125rem", color: "var(--ink)", margin: 0 }}>
                            Compare the testing of Abraham across Genesis 22, Jubilees 17–18, and Qur’an 37 in the{" "}
                            <Link href="/scriptures/parallels/sacrifice-of-the-son" style={{ color: "var(--accent)", fontWeight: 600 }}>
                              Sacrifice of the Son Matrix →
                            </Link>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
        </section>
      ))}

      <section
        className="jsu-prophecy-dossier-callout"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "1.75rem",
          margin: "2.5rem 0 1rem",
        }}
      >
        <p className="jsu-history-answer-kicker" style={{ margin: "0 0 0.4rem" }}>
          NotebookLM Source Ingestion &amp; Audio Overviews
        </p>
        <h3 style={{ margin: "0 0 0.5rem", fontFamily: "Cinzel, serif", fontSize: "1.25rem", color: "var(--ink)" }}>
          Synthesize Messianic Prophecy in Google NotebookLM
        </h3>
        <p style={{ margin: "0 0 1rem", color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
          Generate multi-witness dossiers comparing hosted Isaiah, Psalm, Daniel, and Gospel passages with curated source notes,
          Septuagint Greek vs Masoretic Hebrew variants, and early sub-apostolic patristic interpretations
          formatted for dialectical AI podcast hosts.
        </p>
        <div>
          <Link
            href="/jesus/dossier?preset=messianic-servant-isaiah53"
            className="jsu-station-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              background: "var(--accent)",
              color: "var(--accent-ink, #ffffff)",
              textDecoration: "none",
            }}
          >
            <span>Open Messianic Prophecy Research Dossiers</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
