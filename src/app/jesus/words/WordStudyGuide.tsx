"use client";

import Link from "next/link";
import { useState } from "react";
import { traditionFor } from "@/lib/scriptures/client";
import type { Canons } from "@/lib/scriptures/types";
import {
  WORD_STUDIES,
  WORD_STUDY_THEMES,
  type StudyReference,
  type WordStudy,
} from "@/lib/jesus/word-studies";

type StudyAnchor = { book: string; chapter: number; verse: number };

function referenceParts(ref: string) {
  const [book, location] = ref.split(" ");
  const [chapter, verse] = location.split(":").map(Number);
  return { book, chapter, verse };
}

/** The reader, at the verse the term occurs in, with the original open. */
function greekHref(canons: Canons, study: WordStudy) {
  const { book, chapter } = study.anchor;
  const verse = study.language.verse ?? study.anchor.verse;
  return `/scriptures/${traditionFor(canons, book)}/${book}/${chapter}?o=1#v${verse}`;
}

function ContextLink({ item, canons }: { item: StudyReference; canons: Canons }) {
  const { book, chapter, verse } = referenceParts(item.ref);
  const tradition = traditionFor(canons, book);
  return (
    <li>
      <Link href={`/scriptures/${tradition}/${book}/${chapter}#v${verse}`}>{item.label}</Link>
      <span>{item.note}</span>
    </li>
  );
}

export default function WordStudyGuide({
  canons,
  onReadSaying,
}: {
  canons: Canons;
  onReadSaying: (anchor: StudyAnchor) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(WORD_STUDY_THEMES[0].id);
  const study = WORD_STUDIES.find((item) => item.theme === activeTheme) ?? WORD_STUDIES[0];
  const tradition = traditionFor(canons, study.anchor.book);

  return (
    <details className="jsu-study-guide" open={open}>
      <summary
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
      >
        <span>
          <strong>Go deeper into a saying</strong>
          <small>Context, Gospel parallels, scriptural roots, and key language</small>
        </span>
        <span className="jsu-study-summary-action" aria-hidden="true">{open ? "Close" : "Explore"}</span>
      </summary>

      {open && (
        <div className="jsu-study-body">
          <div className="jsu-study-intro">
            <div>
              <p className="jsu-study-eyebrow">Choose a way in</p>
              <h2>Follow one idea across the Gospels</h2>
            </div>
            <p>These are reading paths, not final answers. Each one keeps the saying connected to its scene and gives you the passages needed to test the interpretation yourself.</p>
          </div>

          <div className="jsu-study-themes" role="group" aria-label="Study themes">
            {WORD_STUDY_THEMES.map((theme) => (
              <button
                type="button"
                key={theme.id}
                aria-pressed={activeTheme === theme.id}
                onClick={() => setActiveTheme(theme.id)}
              >
                {theme.label}
              </button>
            ))}
          </div>

          <article className="jsu-study-card" aria-live="polite">
            <header>
              <div>
                <p className="jsu-study-eyebrow">{study.themeLabel} · {study.anchor.label}</p>
                <h3>{study.title}</h3>
              </div>
              <Link
                className="jsu-study-context-link"
                href={`/scriptures/${tradition}/${study.anchor.book}/${study.anchor.chapter}#v${study.anchor.verse}`}
              >
                Read {study.anchor.label} in context
              </Link>
            </header>

            <blockquote>{study.saying}</blockquote>

            <div className="jsu-study-grid">
              <section>
                <h4>In the scene</h4>
                <p>{study.scene}</p>
              </section>
              <section>
                <h4>Language lens</h4>
                <p className="jsu-study-term"><span lang="grc">{study.language.term}</span> · {study.language.transliteration}</p>
                <p>{study.language.note}</p>
                {/* The hosted critical edition, not an outside lookup: the
                    site already carries SBLGNT with lemma and morphology, and
                    a reader should not have to leave to see the word. */}
                <Link href={greekHref(canons, study)}>
                  Open the Greek at{" "}
                  {canons.books[study.anchor.book]?.name ?? study.anchor.book}{" "}
                  {study.anchor.chapter}:{study.language.verse ?? study.anchor.verse}
                </Link>
              </section>
              <section>
                <h4>Gospel parallels</h4>
                <ul>{study.parallels.map((item) => <ContextLink key={item.ref} item={item} canons={canons} />)}</ul>
              </section>
              <section>
                <h4>Scriptural roots</h4>
                <ul>{study.roots.map((item) => <ContextLink key={item.ref} item={item} canons={canons} />)}</ul>
              </section>
            </div>

            <div className="jsu-study-thread">
              <h4>Keep following the thread</h4>
              <div>
                {study.thread.map((item) => {
                  const ref = referenceParts(item.ref);
                  const itemTradition = traditionFor(canons, ref.book);
                  return (
                    <Link key={item.ref} href={`/scriptures/${itemTradition}/${ref.book}/${ref.chapter}#v${ref.verse}`}>
                      <strong>{item.label}</strong><span>{item.note}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <footer>
              <p><strong>Read for:</strong> {study.question}</p>
              <button type="button" onClick={() => onReadSaying(study.anchor)}>
                Read it in the red-letter text
              </button>
            </footer>
          </article>
        </div>
      )}
    </details>
  );
}
