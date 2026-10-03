"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ATTESTATION_GRADES,
  AXIS_LABEL,
  AXIS_NOTE,
  GRADE_LABEL,
  GRADE_MEANING,
  TEXTUAL_GRADES,
  type Claim,
  type ClaimBasis,
} from "@/lib/evidence/claims";

type Axis = ClaimBasis["axis"];

/**
 * Every graded claim on the site, in one filterable list.
 *
 * The Claim Lab above takes a handful of cases apart in detail. This is the
 * rest of them: the whole registry the rooms draw their pills from, so a
 * reader can ask "what does this site actually claim, and on what basis" and
 * get an answer without walking every room.
 *
 * Two axes, kept separate on purpose. "Disputed" is about whether a passage
 * says the thing; "later tradition" is about when someone first wrote it down.
 * A claim can be explicit in a late source, so merging the scales would hide
 * exactly the distinction the grades exist to make.
 */
export default function ClaimIndex({ claims }: { claims: Claim[] }) {
  const [axis, setAxis] = useState<Axis | "all">("all");
  const [grade, setGrade] = useState<string | "all">("all");

  const visible = useMemo(
    () =>
      claims.filter((claim) => {
        if (axis !== "all" && claim.basis.axis !== axis) return false;
        if (grade !== "all" && claim.basis.grade !== grade) return false;
        return true;
      }),
    [claims, axis, grade],
  );

  const grades = axis === "textual" ? TEXTUAL_GRADES : axis === "attestation" ? ATTESTATION_GRADES : [];

  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    for (const claim of claims) {
      tally.set(claim.basis.grade, (tally.get(claim.basis.grade) ?? 0) + 1);
    }
    return tally;
  }, [claims]);

  return (
    <section className="hw-claims" id="claim-index" aria-labelledby="hw-claims-title">
      <header className="hw-claims-header">
        <div>
          <p className="hw-kicker">Every graded claim</p>
          <h2 id="hw-claims-title">The whole ledger.</h2>
          <p>
            {claims.length} claims across the worlds, each carrying the grade its
            own room shows and the boundary it states. Two scales, kept apart:
            one measures how a claim stands to the text, the other how early the
            witness is. A claim can be plainly stated in a very late source, so
            collapsing them into one number would hide the thing worth knowing.
          </p>
        </div>
        <span>{visible.length} shown</span>
      </header>

      <div className="hw-claim-filters">
        <fieldset>
          <legend>Scale</legend>
          <button
            type="button"
            className={axis === "all" ? "is-on" : ""}
            aria-pressed={axis === "all"}
            onClick={() => {
              setAxis("all");
              setGrade("all");
            }}
          >
            Both
          </button>
          {(["textual", "attestation"] as Axis[]).map((option) => (
            <button
              key={option}
              type="button"
              className={axis === option ? "is-on" : ""}
              aria-pressed={axis === option}
              title={AXIS_NOTE[option]}
              onClick={() => {
                setAxis(option);
                setGrade("all");
              }}
            >
              {AXIS_LABEL[option]}
            </button>
          ))}
        </fieldset>

        {grades.length > 0 && (
          <fieldset>
            <legend>Grade</legend>
            <button
              type="button"
              className={grade === "all" ? "is-on" : ""}
              aria-pressed={grade === "all"}
              onClick={() => setGrade("all")}
            >
              Any
            </button>
            {grades.map((option) => (
              <button
                key={option}
                type="button"
                className={grade === option ? "is-on" : ""}
                aria-pressed={grade === option}
                title={GRADE_MEANING[option]}
                onClick={() => setGrade(option)}
              >
                {GRADE_LABEL[option]} ({counts.get(option) ?? 0})
              </button>
            ))}
          </fieldset>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="scr-meta">No claim carries that grade.</p>
      ) : (
        <ol className="hw-claim-rows">
          {visible.map((claim) => (
            <li key={claim.id} className="hw-claim-row">
              <div className="hw-claim-row-head">
                <Link href={claim.href}>{claim.subject}</Link>
                <span
                  className={`hw-claim-grade grade-${claim.basis.grade}`}
                  title={GRADE_MEANING[claim.basis.grade]}
                >
                  {GRADE_LABEL[claim.basis.grade]}
                </span>
              </div>
              <p className="hw-claim-text">{claim.text}</p>
              {claim.limit && <p className="hw-claim-limit">{claim.limit}</p>}
              {(claim.sources.length > 0 || claim.refs.length > 0) && (
                <p className="hw-claim-sources">
                  {claim.refs.length > 0 && <span>{claim.refs.join(" · ")}</span>}
                  {claim.sources.map((source) =>
                    source.url ? (
                      <a key={source.label} href={source.url} rel="noreferrer">
                        {source.label}
                      </a>
                    ) : (
                      <span key={source.label}>{source.label}</span>
                    ),
                  )}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
