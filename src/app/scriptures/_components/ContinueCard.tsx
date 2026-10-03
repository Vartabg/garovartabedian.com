"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readContinue,
  readStudyTrail,
  type StudyTrailEntry,
} from "@/lib/scriptures/prefs";

/** A private, on-device trail back into the chapters this reader opened. */
export default function ContinueCard() {
  const [entries, setEntries] = useState<StudyTrailEntry[]>([]);

  useEffect(() => {
    const trail = readStudyTrail();
    const fallback = readContinue();
    setEntries(trail.length ? trail : fallback ? [fallback] : []);
  }, []);

  if (!entries.length) return null;

  const [current, ...recent] = entries;

  return (
    <section className="scr-trail" aria-labelledby="study-trail-title">
      <header className="scr-trail-head">
        <div>
          <p className="scr-continue-kicker">Your study path</p>
          <h3 id="study-trail-title">Continue where the text led you.</h3>
        </div>
        <span>Stored only on this device</span>
      </header>

      <div className="scr-trail-grid">
        <Link href={current.href} className="scr-continue">
          <span className="scr-continue-kicker">Continue reading</span>
          <strong>
            {current.bookName} {current.chapter}
          </strong>
          <span className="scr-continue-cta">Open chapter →</span>
        </Link>

        {recent.length > 0 ? (
          <nav className="scr-trail-recent" aria-label="Recently opened chapters">
            {recent.slice(0, 3).map((entry) => (
              <Link
                key={`${entry.traditionId}-${entry.bookId}-${entry.chapter}`}
                href={entry.href}
              >
                <span>
                  {entry.bookName} {entry.chapter}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
