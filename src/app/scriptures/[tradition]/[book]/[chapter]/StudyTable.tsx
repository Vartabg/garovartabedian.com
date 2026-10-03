import Link from "next/link";
import React from "react";
import { pickTranslation, traditionFor } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import type { Canons, ChapterGuide, Tradition, TranslationId } from "@/lib/scriptures/types";
import { getParallelForChapter } from "@/lib/parallels/lookup";

export type StudyIntent = "read" | "understand" | "connect" | "source";

type Props = {
  bookId?: string;
  bookName: string;
  chapter: number;
  chapterCount: number;
  verseCount: number;
  traditionName: string;
  translationName: string;
  translation?: TranslationId;
  translationLicense: string;
  guide: ChapterGuide | null;
  originalAvailable: boolean;
  showOriginal: boolean;
  compareName: string | null;
  activeIntent: StudyIntent;
  onIntent: (intent: StudyIntent) => void;
  /** Needed to turn a cross-reference like "GEN 1:1" into a link. */
  canons?: Canons;
  tradition?: Tradition;
  /** The verse whose study tools are open, and its cross-references. */
  openVerse?: number | null;
  openRefs?: string[];
  hasConnections?: boolean;
};

const INTENTS: Array<{
  id: StudyIntent;
  label: string;
  note: string;
}> = [
  { id: "read", label: "Read", note: "Return to the chapter" },
  { id: "understand", label: "Understand", note: "Context and questions" },
  { id: "connect", label: "Trace connections", note: "Follow cross-references" },
  { id: "source", label: "Source", note: "Language and versions" },
];

/** How many of an open verse's threads the margin lists before deferring to the verse panel. */
const MARGIN_REF_CAP = 8;

function refLink(canons: Canons | undefined, tradition: Tradition | undefined, ref: string, translation?: TranslationId) {
  if (!canons || !tradition) return null;
  const parsed = parseRef(ref);
  if (!parsed || !canons.books[parsed.book]) return null;
  const label = `${canons.books[parsed.book].name} ${parsed.chapter}:${parsed.verse}${
    parsed.endVerse ? `–${parsed.endVerse}` : ""
  }`;
  const traditionId = tradition.books.includes(parsed.book)
    ? tradition.id
    : traditionFor(canons, parsed.book);
  const edition = translation && canons.books[parsed.book].trans.includes(translation) ? translation : pickTranslation(canons, tradition.transPreference, parsed.book);
  return { label, href: `/scriptures/${traditionId}/${parsed.book}/${parsed.chapter}${edition ? `?t=${edition}` : ""}#v${parsed.verse}` };
}

/**
 * The margin: a chapter's study notes set beside the text, the way a glossed
 * Bible carries its apparatus. On a phone it is a compact strip of four ways
 * into the chapter above the text; from 1000px it becomes a sticky gloss
 * margin with rubric headings — Understand, Connect, Source — and the Connect
 * gloss follows whichever verse is open.
 */
export default function StudyTable({
  bookId,
  bookName,
  chapter,
  chapterCount,
  verseCount,
  traditionName,
  translationName,
  translation,
  translationLicense,
  guide,
  originalAvailable,
  showOriginal,
  compareName,
  activeIntent,
  onIntent,
  canons,
  tradition,
  openVerse = null,
  openRefs = [],
  hasConnections = true,
}: Props) {
  const progress = Math.max(2, Math.round((chapter / chapterCount) * 100));
  const parallel = bookId ? getParallelForChapter(bookId, chapter) : null;
  const shownRefs = openRefs.slice(0, MARGIN_REF_CAP);
  const sourceAction = showOriginal
    ? "Original language in view ↓"
    : originalAvailable
      ? "Show the original language"
      : "Versions and languages";

  return (
    <aside className="scr-gloss" aria-label={`${bookName} ${chapter} study notes`}>
      <header className="scr-gloss-head">
        <h2 className="scr-rubric">In the margin</h2>
        <p className="scr-gloss-where">
          Chapter {chapter} of {chapterCount} · {verseCount} verses
        </p>
        <span className="scr-gloss-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
      </header>

      {/* Phone: four ways in, one tap each. Hidden from 1000px, where the
          glosses below carry the same actions in context. */}
      <nav className="scr-gloss-intents" aria-label="Ways to study this chapter">
        {INTENTS.filter(intent => intent.id !== "connect" || hasConnections || parallel).map((intent) => (
          <button
            key={intent.id}
            type="button"
            className={activeIntent === intent.id ? "is-active" : undefined}
            aria-pressed={activeIntent === intent.id}
            onClick={() => onIntent(intent.id)}
          >
            <strong>{intent.label}</strong>
            <small>{intent.note}</small>
          </button>
        ))}
      </nav>

      <p className="scr-gloss-mobile-trust">
        {translationName} · {traditionName} · source details below
      </p>

      <div className="scr-gloss-body">
        <section aria-labelledby="gloss-understand">
          <h3 id="gloss-understand" className="scr-rubric">
            Understand
          </h3>
          <p>
            {guide?.summary ??
              "Read the hosted text first, then open a verse number for its connections and source-aware study tools."}
          </p>
          {guide?.themes.length ? (
            <p className="scr-gloss-themes">
              <span>Themes</span> {guide.themes.slice(0, 4).join(" · ")}
            </p>
          ) : null}
          <button type="button" className="scr-gloss-act" onClick={() => onIntent("understand")}>
            {guide?.questions.length
              ? `Open the cheat sheet, ${guide.questions.length} questions ↓`
              : "Open the cheat sheet ↓"}
          </button>
        </section>

        <section aria-labelledby="gloss-connect">
          <h3 id="gloss-connect" className="scr-rubric">
            Connect{openVerse !== null ? ` · ${bookName} ${chapter}:${openVerse}` : ""}
          </h3>
          <div aria-live="polite">
            {openVerse === null ? (
              <p>Tap a verse number and its cross-references gather here.</p>
            ) : openRefs.length === 0 ? (
              <p>No cross-references recorded for this verse.</p>
            ) : (
              <ul className="scr-gloss-refs">
                {shownRefs.map((ref) => {
                  const link = refLink(canons, tradition, ref, translation);
                  return (
                    <li key={ref}>
                      {link ? <Link href={link.href}>{link.label}</Link> : <span>{ref}</span>}
                    </li>
                  );
                })}
                {openRefs.length > shownRefs.length ? (
                  <li className="scr-gloss-more">
                    and {openRefs.length - shownRefs.length} more beneath the verse
                  </li>
                ) : null}
              </ul>
            )}
          </div>
          <button type="button" className="scr-gloss-act" onClick={() => onIntent("connect")}>
            Open the cross-reference map {"↓"}
          </button>
        </section>

        {parallel && (
          <section className="scr-gloss-parallel" aria-labelledby="abrahamic-parallel-title">
            <h3 id="abrahamic-parallel-title" className="scr-rubric">
              Parallels
            </h3>
            <p>
              <strong>{parallel.title}</strong> {parallel.subtitle}
            </p>
            <p className="scr-gloss-themes">
              <span>Witnesses</span> {parallel.traditionBadges.join(" · ")}
            </p>
            <Link href={parallel.href}>Inspect the Abrahamic slot-diff {"→"}</Link>
          </section>
        )}

        <section className="scr-gloss-source" aria-labelledby="gloss-source">
          <h3 id="gloss-source" className="scr-rubric">
            Source
          </h3>
          <dl className="scr-gloss-dl">
            <div>
              <dt>Text</dt>
              <dd>
                {translationName} · {translationLicense}
              </dd>
            </div>
            <div>
              <dt>Canon</dt>
              <dd>{traditionName}</dd>
            </div>
            <div>
              <dt>Guide</dt>
              <dd>{guide ? "Static chapter guide; no live generation" : "No authored guide loaded"}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                {originalAvailable
                  ? showOriginal
                    ? "Original-language layer in view"
                    : "Original-language layer available"
                  : "Translation and edition details available"}
              </dd>
            </div>
            {compareName ? (
              <div>
                <dt>Compare</dt>
                <dd>{compareName}</dd>
              </div>
            ) : null}
            <div>
              <dt>Graph</dt>
              <dd>
                <Link href="/scriptures/graph">Cross-reference PageRank centrality</Link>
              </dd>
            </div>
          </dl>
          <a href="/sources#scripture-texts">Inspect editions and licenses</a>
          <br />
          <button type="button" className="scr-gloss-act" onClick={() => onIntent("source")}>
            {sourceAction}
          </button>
        </section>
      </div>
    </aside>
  );
}
