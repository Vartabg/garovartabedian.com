"use client";

import Link from "next/link";
import { memo, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  packedState,
  unpackRow,
  type GuideChecked,
  type GuideRow,
  type PackedGuideRecord,
  type PackedRow,
} from "@/lib/site/guide-record";
import { dateLabel } from "./ReleaseRecord";

const STATE = {
  current: { mark: "is-current", label: "Passes every current check" },
  earlier: { mark: "is-earlier", label: "Passes the earlier checks only" },
  none: { mark: "is-none", label: "No guide" },
} as const;

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;
/** A tap between marks takes the nearest one. */
const NEAR = [[0, 0], [-3, 0], [3, 0], [0, -3], [0, 3]] as const;

type Lookup = Pick<PackedGuideRecord, "reviewers" | "drafters">;

function drafterLine(row: GuideChecked, { drafters }: Lookup) {
  const drafter = row.drafter === null ? null : drafters[row.drafter];
  if (!drafter) return "Drafted by: not recorded.";
  if (drafter.kind === "measured") return `Drafted by: ${drafter.label}. The run recorded the model.`;
  // "hand-authored" is the fixed marker scripts/scriptures/stamp-guide-review.mjs writes, not free text.
  if (drafter.label === "hand-authored") return "Written by hand. Stated at review, not recorded by a run.";
  return `Drafted by: ${drafter.label}. Stated at review, not recorded by a run.`;
}

function reviewLine(row: GuideChecked, { reviewers }: Lookup) {
  if (row.review === "none" || row.reviewer === null) return "Review: none recorded.";
  const reviewer = reviewers[row.reviewer];
  const date = dateLabel(row.reviewedAt);
  return row.review === "human"
    ? `Review: ${reviewer} on ${date}.`
    : `Review: agent panel on ${date}, recorded as “${reviewer}”. No person has reviewed it.`;
}

/** What the record says about one chapter. Each sentence states only what the build checked. */
export function guideLines(row: GuideRow, lookup: Lookup): string[] {
  if (row.state === "none") return ["No guide for this chapter."];
  const tail = [drafterLine(row, lookup), reviewLine(row, lookup)];
  if (row.state === "earlier") {
    return [
      "Its verse references resolve, and its key verses quote a hosted translation.",
      row.problems === null
        ? "It has no record of being drafted under the current rubric, and the rubric cannot run here: the translation it checks against does not carry this chapter."
        : row.problems === 0
          ? "It has no record of being drafted under the current rubric, so it is not counted as current. Run against it today, the rubric reports no problems."
          : `It has no record of being drafted under the current rubric. Run against it today, the rubric reports ${count(row.problems, "problem")}.`,
      ...tail,
    ];
  }
  const moved = row.rebinds === 0 ? "" : ` It was moved ${row.rebinds === 1 ? "once" : `${row.rebinds} times`} after a citation’s link or name was corrected, with the reason on file.`;
  return [
    `Key verses: ${row.keyVerses}, each a quotation from the hosted text.`,
    `Questions: ${row.questions}, each tied to a verse in this chapter.`,
    `Outline: ${count(row.outlineParts, "part")} that ${row.outlineParts === 1 ? "covers" : "cover"} all ${count(row.verses, "verse")} with no gaps.`,
    `Source lock: the saved fingerprint still matches the sources, instructions and rubric the guide was drafted from.${moved}`,
    ...tail,
  ];
}

/** One book's marks. Memoized, so choosing a chapter redraws at most the two books involved. */
const BookMarks = memo(function BookMarks({ index, rows, selected }: { index: number; rows: PackedRow[]; selected: number | null }) {
  return (
    <span className={`guide-record-book${selected === null ? "" : " is-selected"}`} data-book={index}>
      {rows.map((row, chapter) => (
        <i key={chapter} className={`${STATE[packedState(row)].mark}${chapter === selected ? " is-on" : ""}`} />
      ))}
    </span>
  );
});

/** Every hosted chapter as one mark, and the record of the chosen one. */
export default function GuideRecord({ data }: { data: PackedGuideRecord }) {
  const { books } = data;
  // Where each book's first chapter sits in the whole run of marks.
  const starts = useMemo(
    () => books.reduce<number[]>((out, _, index) => [...out, index === 0 ? 0 : out[index - 1] + books[index - 1].rows.length], []),
    [books],
  );
  const total = starts[starts.length - 1] + books[books.length - 1].rows.length;
  const [selected, setSelected] = useState(0);
  const map = useRef<HTMLDivElement>(null);

  let bookIndex = starts.length - 1;
  while (starts[bookIndex] > selected) bookIndex -= 1;
  const book = books[bookIndex];
  const chapterIndex = selected - starts[bookIndex];
  const row = unpackRow(book.rows[chapterIndex], chapterIndex + 1, data.dates);
  const name = `${book.name} ${row.chapter}`;
  const tradition = row.tradition === null ? null : data.traditions[row.tradition];

  const choose = (index: number) => setSelected(Math.min(total - 1, Math.max(0, index)));
  const pick = (point: { clientX: number; clientY: number }) => {
    for (const [dx, dy] of NEAR) {
      const mark = document.elementFromPoint(point.clientX + dx, point.clientY + dy);
      const group = mark?.parentElement;
      if (mark && group instanceof HTMLElement && group.parentElement === map.current) {
        choose(starts[Number(group.dataset.book)] + Array.prototype.indexOf.call(group.children, mark));
        return;
      }
    }
  };
  // A tap or click selects. A mouse drag follows the pointer; a touch does not, so a
  // finger that starts a page scroll on the map neither traps it nor changes the chapter.
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.buttons) pick(event);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = {
      ArrowLeft: selected - 1,
      ArrowDown: selected - 1,
      ArrowRight: selected + 1,
      ArrowUp: selected + 1,
      Home: 0,
      End: total - 1,
      PageUp: starts[Math.min(bookIndex + 1, books.length - 1)],
      PageDown: starts[Math.max(bookIndex - 1, 0)],
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    choose(next);
  };

  return (
    <>
      <p className="guide-record-legend" aria-hidden="true">
        <span><i className={STATE.current.mark} /> {STATE.current.label}</span>
        <span><i className={STATE.earlier.mark} /> {STATE.earlier.label}</span>
        <span><i className={STATE.none.mark} /> {STATE.none.label}</span>
      </p>
      <div
        ref={map}
        className="guide-record-map"
        tabIndex={0}
        role="slider"
        aria-label="Chapter"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={selected + 1}
        aria-valuetext={`${name}: ${STATE[row.state].label.toLowerCase()}`}
        onKeyDown={onKeyDown}
        onClick={pick}
        onPointerMove={drag}
      >
        {books.map((entry, index) => (
          <BookMarks key={entry.id} index={index} rows={entry.rows} selected={index === bookIndex ? chapterIndex : null} />
        ))}
      </div>
      <div className="guide-record-step">
        <label>
          Book{" "}
          <select value={bookIndex} onChange={(event) => choose(starts[Number(event.target.value)])}>
            {books.map((entry, index) => (
              <option key={entry.id} value={index}>{entry.name}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => choose(selected - 1)}>Previous chapter</button>
        <button type="button" onClick={() => choose(selected + 1)}>Next chapter</button>
      </div>
      <div className="guide-record-detail" aria-live="polite">
        <h3>{name}</h3>
        <p className="guide-record-state"><i className={STATE[row.state].mark} aria-hidden="true" /> {STATE[row.state].label}</p>
        <ul>
          {guideLines(row, data).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {tradition ? (
          <p><Link href={`/scriptures/${tradition}/${book.id}/${row.chapter}`}>Open {name}</Link></p>
        ) : null}
      </div>
    </>
  );
}
