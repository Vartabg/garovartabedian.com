"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { describeOriginalWord } from "@/lib/scriptures/morphology";
import { loadBridgeVerse, refWord, type BridgeChapter, type BridgeVerse } from "@/lib/scriptures/word-bridge";
import type { TranslationId } from "@/lib/scriptures/types";

/**
 * Word by word: the World English Bible verse above, the Hebrew or Greek
 * below, a thread between each English word and the word it translates.
 * Tapping a word shows the original, its dictionary meaning, its grammar, and
 * whether the link checks out — the checker's verdict, made at build time
 * against public-domain dictionaries (scripts/scriptures/bridge/check.mjs).
 * Availability, loading and retry states remain visible for every edition.
 */
export default function WordBridge({ bookId, chapter, n, translation, webHref, webAvailable }: { bookId: string; chapter: number; n: number; translation: TranslationId; webHref: string; webAvailable: boolean }) {
  const [data, setData] = useState<{ chapter: BridgeChapter; verse: BridgeVerse } | null>(null);
  const [status, setStatus] = useState<"loading" | "unavailable" | "error" | "ready">("loading");
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  // Links the checker could not support stay hidden until asked for, so the
  // threads a reader sees by default are the ones the dictionaries back.
  const [showReview, setShowReview] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const threads = useRef<SVGSVGElement>(null);
  const enRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ogRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let live = true;
    setData(null);
    setSelected(null);
    setShowReview(false);
    if (translation !== "web") return;
    setStatus("loading");
    void loadBridgeVerse(bookId, chapter, n).then((loaded) => {
      if (!live) return;
      setData(loaded);
      setStatus(loaded ? "ready" : "unavailable");
    }, () => {
      if (live) setStatus("error");
    });
    return () => {
      live = false;
    };
  }, [bookId, chapter, n, translation, attempt]);

  const draw = useCallback(() => {
    const svg = threads.current;
    const box = stage.current?.getBoundingClientRect();
    if (!svg || !box || !data) return;
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    data.verse.links.forEach((link, i) => {
      if (link.status === "flag" && !showReview && i !== selected) return;
      for (const e of link.en) {
        for (const o of link.og) {
          const a = enRefs.current[e]?.getBoundingClientRect();
          const b = ogRefs.current[refWord(o)]?.getBoundingClientRect();
          if (!a || !b) continue;
          const x1 = a.left + a.width / 2 - box.left;
          const y1 = a.bottom - 3 - box.top;
          const x2 = b.left + b.width / 2 - box.left;
          const y2 = b.top + 3 - box.top;
          const mid = (y1 + y2) / 2;
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`);
          path.setAttribute("class", `scr-bridge-thread${link.status === "flag" ? " is-flag" : ""}${i === selected ? " is-on" : ""}`);
          svg.appendChild(path);
        }
      }
    });
  }, [data, selected, showReview]);

  useLayoutEffect(() => {
    draw();
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(el);
    void document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, [draw]);

  const headingId = `bridge-${bookId}-${chapter}-${n}`;
  if (translation !== "web" || !data) return <section className="scr-bridge" aria-labelledby={headingId}>
    <h3 id={headingId} className="scr-bridge-h">Word Bridge</h3>
    {translation !== "web" ? <>
      <p>{webAvailable ? "Word Bridge uses the World English Bible. Open this same verse in WEB to inspect its word connections." : "Word Bridge is not available for this book in the World English Bible."}</p>
      {webAvailable ? <a className="scr-btn" href={webHref}>Open this verse in WEB</a> : <Link href="/scriptures/polyglot">Compare available translations</Link>}
    </> : status === "error" ? <div role="alert">
      <p>Word Bridge could not load. Check your connection and try again.</p>
      <button type="button" className="scr-btn" onClick={() => setAttempt(value => value + 1)}>Retry Word Bridge</button>
    </div> : status === "unavailable" ? <p role="status">Word Bridge has no alignment for this verse in the selected source edition. Your Scripture text remains above. <Link href="/scriptures/word-bridge">Choose another verse</Link>.</p>
      : <p role="status">Loading Word Bridge…</p>}
  </section>;
  const { chapter: ch, verse } = data;
  const linkOfEnglish = new Map<number, number>();
  const linksOfOriginal = new Map<number, number[]>();
  verse.links.forEach((link, i) => {
    link.en.forEach((e) => linkOfEnglish.set(e, i));
    link.og.forEach((o) => linksOfOriginal.set(refWord(o), [...(linksOfOriginal.get(refWord(o)) ?? []), i]));
  });
  const counts = { ok: 0, plain: 0, flag: 0 };
  verse.links.forEach((l) => (counts[l.status] += 1));
  const lang = ch.lang === "hebrew" ? "he" : "grc";
  const link = selected === null ? null : verse.links[selected];

  return (
    <section className="scr-bridge" aria-labelledby={headingId}>
      <h3 id={headingId} className="scr-bridge-h">
        Word Bridge
      </h3>
      <div ref={stage} className={`scr-bridge-stage${link ? " has-focus" : ""}`}>
        <svg ref={threads} className="scr-bridge-threads" aria-hidden="true" />
        <span className="scr-bridge-label">World English Bible</span>
        <div className="scr-bridge-row">
          {verse.english.map((token, i) => {
            const li = linkOfEnglish.get(i);
            const l = li === undefined ? null : verse.links[li];
            return (
              <button
                key={i}
                ref={(el) => {
                  enRefs.current[i] = el;
                }}
                type="button"
                className={[
                  "scr-bridge-word",
                  l?.kind === "supplied" ? "is-supplied" : "",
                  l?.status === "flag" ? (showReview ? "is-flag" : "is-unlinked") : "",
                  l?.status === "plain" && l.kind === "supplied" ? "is-unlinked" : "",
                  li !== undefined && li === selected ? "is-on" : "",
                ].join(" ")}
                aria-pressed={li !== undefined && li === selected}
                onClick={() => li !== undefined && setSelected(li)}
                disabled={li === undefined}
              >
                {token}
              </button>
            );
          })}
        </div>
        <span className="scr-bridge-label scr-bridge-label--original">
          {ch.lang === "hebrew" ? "Hebrew · Open Scriptures Hebrew Bible" : "Greek · SBL Greek New Testament"}
        </span>
        <div className="scr-bridge-row" lang={lang} dir={ch.direction}>
          {verse.original.map((word, i) => {
            const lis = linksOfOriginal.get(i) ?? [];
            const untranslated = lis.length > 0 && lis.every((x) => verse.links[x].kind === "untranslated");
            const on = selected !== null && lis.includes(selected);
            return (
              <button
                key={i}
                ref={(el) => {
                  ogRefs.current[i] = el;
                }}
                type="button"
                className={["scr-bridge-word", untranslated ? "is-supplied" : "", on ? "is-on" : ""].join(" ")}
                aria-pressed={on}
                onClick={() => lis.length && setSelected(lis[0])}
                disabled={!lis.length}
              >
                {word.t}
              </button>
            );
          })}
        </div>
      </div>

      <p className="scr-bridge-tally">
        {counts.ok} supported by the dictionaries
        {counts.flag > 0 && (
          <>
            {" · "}
            <button type="button" className="scr-bridge-toggle" aria-pressed={showReview} onClick={() => setShowReview((v) => !v)}>
              {showReview ? `Hide the ${counts.flag} that need review` : `Show ${counts.flag} that need review`}
            </button>
          </>
        )}
      </p>

      <div className={`scr-bridge-detail${link?.status === "flag" ? " is-flag" : ""}`} aria-live="polite">
        {link ? (
          <>
            <p className="scr-bridge-pair">
              <span>{link.en.map((e) => verse.english[e]).join(" ") || "—"}</span>
              <span aria-hidden="true"> ↔ </span>
              <span lang={lang} dir={ch.direction}>
                {link.og
                  .map((o) => {
                    const [w, p] = o.split(".").map(Number);
                    const word = verse.original[w];
                    return Number.isNaN(p) || p === undefined || word.parts.length === 1 ? word.t : word.parts[p].lemma;
                  })
                  .join(" ") || "—"}
              </span>
            </p>
            <dl>
              <dt>Check</dt>
              <dd>
                <span className={`scr-bridge-status is-${link.status}`}>{link.label}</span> {link.why}
              </dd>
              {link.og.map((o) => {
                const [w, p] = o.split(".").map(Number);
                const word = verse.original[w];
                const whole = Number.isNaN(p) || p === undefined;
                const parts = whole ? word.parts : [word.parts[p]];
                const grammar = describeOriginalWord({ text: word.t, lemma: word.lemma, morph: word.morph }, ch.edition).segments;
                return (
                  <div key={o} className="scr-bridge-entry">
                    {parts.map((part, j) => {
                      const entry = part.dict ? ch.dictionary[part.dict] : null;
                      return (
                        <Fragment key={j}>
                          <dt>Dictionary</dt>
                          <dd>
                            <span className="scr-bridge-lemma" lang={lang} dir={ch.direction}>
                              {part.lemma}
                            </span>
                            {part.dict && !part.dict.startsWith("prefix:") ? ` · ${part.dict}` : ""}
                            {entry ? ` · ${entry.gloss}` : " · not in the dictionary"}
                          </dd>
                        </Fragment>
                      );
                    })}
                    <dt>Grammar</dt>
                    <dd>{(whole ? grammar : [grammar[p]]).filter(Boolean).join(" + ") || "Not parsed"}</dd>
                  </div>
                );
              })}
              {link.note && (
                <>
                  <dt>Note</dt>
                  <dd>{link.note}</dd>
                </>
              )}
            </dl>
          </>
        ) : (
          <p className="scr-bridge-hint">Tap a word to see what stands behind it.</p>
        )}
      </div>
      <p className="scr-bridge-source">
        {verse.source}. <Link href="/sources#word-bridge">How the links are made</Link>
      </p>
      <p className="scr-bridge-source"><a href={webHref}>Link to this Word Bridge</a></p>
    </section>
  );
}
