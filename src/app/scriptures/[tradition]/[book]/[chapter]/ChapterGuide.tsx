"use client";

import Link from "next/link";
import { useState } from "react";
import type { BriefingSource, ChapterGuide } from "@/lib/scriptures/types";
import GuideEvidence from "./GuideEvidence";

type Props = {
  guide: ChapterGuide | null;
  bookName: string;
  chapter: number;
  baseHref: string; // e.g. /scriptures/protestant/GEN
  open?: boolean;
  onToggle?: (next: boolean) => void;
  sources?: BriefingSource[];
};

const CATEGORY_LABEL: Record<string, string> = {
  context: "Context",
  word: "Word / term",
  theology: "Theology",
  history: "History",
  practical: "Practical",
  hard_verse: "Hard verse",
};

export default function ChapterGuide({ guide, bookName, chapter, baseHref, open: controlledOpen, onToggle, sources = [] }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [openQs, setOpenQs] = useState<Record<string, boolean>>({});
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof next === "function" ? (next as (p: boolean) => boolean)(open) : next;
    if (onToggle) onToggle(resolved);
    if (controlledOpen === undefined) setInternalOpen(resolved);
  };

  if (!guide) {
    return (
      <div className="scr-guide scr-guide--empty">
        <div className="scr-guide-head">
          <strong>Cheat Sheet — {bookName} {chapter}</strong>
          <span className="scr-guide-badge">not published</span>
        </div>
        <p className="scr-guide-empty">
          No expanded chapter guide has been published here. Read the chapter itself, use the
          cross-references and Threads view below, or return to the book overview for the larger
          setting.
        </p>
        <p className="scr-guide-source">
          <Link href={baseHref}>Book overview</Link> · <Link href="/sources">Sources</Link>
        </p>
      </div>
    );
  }

  const toggleQ = (id: string) =>
    setOpenQs((prev) => ({ ...prev, [id]: !prev[id] }));

  const reviewLabel =
    guide.reviewStatus === "human-reviewed"
      ? "Human-reviewed"
      : guide.reviewStatus === "agent-reviewed"
        ? "Agent-reviewed"
        : null;
  const guideRecordHref = `/scriptures/guides/${guide.book}/${guide.chapter}.json`;
  // Native verse anchors reload the reader's URL-driven initial edition even
  // when the destination is another verse in this same chapter.
  const edition = guide.readingContextSource?.translation;
  const editionQuery = edition ? `?t=${encodeURIComponent(edition)}` : "";

  const verseLink = (ref: string) => {
    // Guide refs may include the chapter ("3:16") or be local ranges ("1-4").
    const qualified = /^(\d+):(\d+)/.exec(ref);
    if (qualified) return `${baseHref}/${qualified[1]}${editionQuery}#v${qualified[2]}`;

    const local = /^(\d+)/.exec(ref);
    if (!local) return null;
    return `${baseHref}/${chapter}${editionQuery}#v${local[1]}`;
  };

  return (
    <div className="scr-guide">
      <button
        type="button"
        className="scr-guide-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="scr-guide-toggle-icon" aria-hidden="true">
          {open ? "–" : "+"}
        </span>
        <span>
          <strong>Cheat Sheet — {bookName} {chapter}</strong>
          <span className="scr-guide-toggle-hint">
            {open ? "Hide zero-background guide" : `What’s happening here? ${guide.questions.length} Q&A`}
          </span>
        </span>
        <span className="scr-guide-badge">{guide.questions.length} questions</span>
      </button>

      {open && (
        <div className="scr-guide-panel">
          <div className="scr-guide-section">
            <h3>Summary</h3>
            <p className="scr-guide-summary">{guide.summary}</p>
            <aside className="scr-guide-why">
              <strong>Why it matters</strong>
              <p>{guide.whyItMatters}</p>
            </aside>
          </div>

          {guide.themes.length > 0 && (
            <div className="scr-guide-themes">
              <span className="scr-guide-themes-label">Themes</span>
              {guide.themes.map((t) => (
                <span key={t} className="scr-guide-theme">
                  {t}
                </span>
              ))}
            </div>
          )}

          {(guide.context.author || guide.context.audience || guide.context.date || guide.context.setting) && (
            <dl className="scr-guide-context">
              {guide.context.author && (
                <>
                  <dt>Author</dt>
                  <dd>{guide.context.author}</dd>
                </>
              )}
              {guide.context.audience && (
                <>
                  <dt>Audience</dt>
                  <dd>{guide.context.audience}</dd>
                </>
              )}
              {guide.context.date && (
                <>
                  <dt>Date</dt>
                  <dd>{guide.context.date}</dd>
                </>
              )}
              {guide.context.setting && (
                <>
                  <dt>Setting</dt>
                  <dd>{guide.context.setting}</dd>
                </>
              )}
              {guide.context.literaryForm && (
                <>
                  <dt>Form</dt>
                  <dd>{guide.context.literaryForm}</dd>
                </>
              )}
            </dl>
          )}
          <GuideEvidence sourceIds={guide.contextSourceIds} sources={sources} />

          {guide.outline.length > 0 && (
            <div className="scr-guide-section">
              <h3>Outline</h3>
              <ol className="scr-guide-outline">
                {guide.outline.map((o, i) => {
                  const href = verseLink(o.verses);
                  return (
                    <li key={i}>
                      {href ? (
                        <a href={href} className="scr-guide-outline-link">
                          <span className="scr-guide-outline-heading">{o.heading}</span>
                          <span className="scr-guide-outline-verses">{o.verses}</span>
                        </a>
                      ) : (
                        <span className="scr-guide-outline-row">
                          <span className="scr-guide-outline-heading">{o.heading}</span>
                          <span className="scr-guide-outline-verses">{o.verses}</span>
                        </span>
                      )}
                      {o.note && <p className="scr-guide-outline-note">{o.note}</p>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {guide.keyVerses.length > 0 && (
            <div className="scr-guide-section">
              <h3>Key verses</h3>
              <ul className="scr-guide-keyverses">
                {guide.keyVerses.map((kv, i) => {
                  const href = verseLink(kv.ref);
                  return (
                    <li key={i}>
                      {href ? (
                        <a href={href} className="scr-guide-kv-ref">{kv.ref}</a>
                      ) : (
                        <span className="scr-guide-kv-ref">{kv.ref}</span>
                      )}
                      <p className="scr-guide-kv-text">{kv.text}</p>
                      <p className="scr-guide-kv-why">{kv.why}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="scr-guide-questions">
            <h3>Top questions a first-time reader asks</h3>
            <ul>
              {guide.questions.map((q) => {
                const isOpen = !!openQs[q.id];
                return (
                  <li key={q.id} className={`scr-guide-q ${isOpen ? "is-open" : ""}`}>
                    <button
                      type="button"
                      className="scr-guide-q-btn"
                      aria-expanded={isOpen}
                      onClick={() => toggleQ(q.id)}
                    >
                      <span className="scr-guide-q-cat">{CATEGORY_LABEL[q.category] || q.category}</span>
                      <span className="scr-guide-q-text">{q.question}</span>
                      <span className="scr-guide-q-icon" aria-hidden="true">
                        {isOpen ? "–" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="scr-guide-q-body">
                        <p>{q.answer}</p>
                        <GuideEvidence sourceIds={q.evidenceSourceIds} sources={sources} />
                        {q.verseRefs.length > 0 && (
                          <p className="scr-guide-q-refs">
                            {q.verseRefs.map((ref) => {
                              const href = verseLink(ref);
                              return href ? (
                                <a key={ref} href={href} className="scr-guide-q-ref">
                                  {ref}
                                </a>
                              ) : (
                                <span key={ref} className="scr-guide-q-ref">
                                  {ref}
                                </span>
                              );
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {guide.glossary && guide.glossary.length > 0 && (
            <div className="scr-guide-section">
              <h3>Glossary — words that trip up new readers</h3>
              <dl className="scr-guide-gloss">
                {guide.glossary.map((g) => (
                  <div key={g.term}>
                    <dt>{g.term}</dt>
                    <dd>{g.def}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="scr-guide-source">
            <p>
              AI-authored commentary on the hosted Scripture text. Background evidence is linked through the book briefing.{" "}
              <Link href={baseHref}>Book briefing</Link> · <Link href="/sources">Sources</Link> ·{" "}
              <Link href="/scriptures/topics">Topics</Link>
            </p>
            <p>
              {reviewLabel ? (
                <>
                  {reviewLabel}
                  {guide.reviewer ? ` by ${guide.reviewer}` : ""}
                  {guide.reviewedAt ? ` on ${guide.reviewedAt}` : ""}.
                </>
              ) : (
                <>No editorial review record.</>
              )}
              {guide.generation ? (
                <>
                  {" "}
                  {/* Measured and asserted are said differently on purpose. A
                      model name the build actually observed is a fact about this
                      file; a name a reviewer supplied afterwards is their word
                      for it, and the sentence should not let the two blur. */}
                  {guide.generation.model
                    ? `Generated by ${guide.generation.model}`
                    : guide.generation.attributedModel === "hand-authored"
                      ? "Written by hand, not generated"
                      : `Attributed to ${guide.generation.attributedModel}${
                          guide.reviewer ? ` by ${guide.reviewer}` : ""
                        }`}{" "}
                  · {guide.generation.rubricVersion} ·{" "}
                  {guide.generation.method === "direct-generation"
                    ? "direct generation prompt"
                    : "canonical grounding reviewed"}
                  .
                  {guide.generation.rebound?.length ? (
                    <>
                      {" "}
                      {/* A moved hash is said out loud. The full record — who,
                          why, previous hash, fields changed — is in the guide
                          record linked below. */}
                      Re-bound on{" "}
                      {guide.generation.rebound[guide.generation.rebound.length - 1].at.slice(0, 10)}{" "}
                      after a citation-link correction to the book briefing; no chapter text or claim changed.
                    </>
                  ) : null}
                </>
              ) : null}{" "}
              <a href={guideRecordHref}>Open guide record</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
