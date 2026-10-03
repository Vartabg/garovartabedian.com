"use client";

import Link from "next/link";

/**
 * The reading bar: the reader's whole control surface, pinned to the bottom
 * of the phone where a thumb already is, and out of the way of the text.
 *
 * Everything here used to sit *above* verse 1 — breadcrumb, title block,
 * prev/next row, a "More" accordion, a dot ribbon, a Wander/journey strip and
 * a neighbouring-books strip, which together pushed the first word of John 3
 * down to 1,068px on a 390x844 phone: more than a full screen of controls
 * before a single word of scripture. Reading comes first now; the controls
 * come to the thumb.
 */
export default function ReaderBar({
  label,
  prevHref,
  nextHref,
  onPick,
  onSettings,
  onListen,
  listening,
  canListen,
  pickOpen,
  settingsOpen,
}: {
  /** Short current position, e.g. "John 3". */
  label: string;
  prevHref: string | null;
  nextHref: string | null;
  onPick: () => void;
  onSettings: () => void;
  onListen: () => void;
  listening: boolean;
  canListen: boolean;
  pickOpen: boolean;
  settingsOpen: boolean;
}) {
  return (
    <nav className="scr-bar" aria-label="Reading controls">
      {prevHref ? (
        <Link className="scr-bar-btn" href={prevHref} rel="prev" aria-label="Previous chapter">
          <span aria-hidden="true">&larr;</span>
        </Link>
      ) : (
        <span className="scr-bar-btn is-off" aria-hidden="true">
          &larr;
        </span>
      )}

      <button
        type="button"
        className="scr-bar-where"
        onClick={onPick}
        aria-expanded={pickOpen}
        aria-label={`${label} — go to another chapter or book`}
      >
        {label}
        <span className="scr-bar-caret" aria-hidden="true">
          &#9662;
        </span>
      </button>

      {nextHref ? (
        <Link className="scr-bar-btn" href={nextHref} rel="next" aria-label="Next chapter">
          <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : (
        <span className="scr-bar-btn is-off" aria-hidden="true">
          &rarr;
        </span>
      )}

      {canListen && (
        <button
          type="button"
          className={`scr-bar-btn${listening ? " is-on" : ""}`}
          onClick={onListen}
          aria-label={
            listening ? "Stop reading aloud" : "Listen — read this chapter aloud"
          }
        >
          {listening ? "Stop" : "Listen"}
        </button>
      )}

      <button
        type="button"
        className="scr-bar-btn scr-bar-aa"
        onClick={onSettings}
        aria-expanded={settingsOpen}
        aria-label="Aa — Reading settings: size, spacing, face, version"
      >
        Aa
      </button>

      <Link
        className="scr-bar-btn scr-bar-worlds"
        href="/#worlds"
        aria-label="Open all eight worlds"
      >
        Worlds
      </Link>
    </nav>
  );
}
