"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type ReleaseAttempt = {
  date: string | null;
  outcome: "live" | "stopped" | "interrupted";
  ran: number[];
  stop: number | null;
  minutes: number | null;
};
export type ReleaseRecordData = { schemaVersion: 1; steps: string[]; attempts: ReleaseAttempt[] };

const W = 680, H = 140, TOP = 4, BASE = H;
const dateLabel = (date: string | null) =>
  date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "date not recorded";
const stopName = (record: ReleaseRecordData, attempt: ReleaseAttempt) =>
  attempt.stop === null ? "" : record.steps[attempt.ran[attempt.stop]];
const result = (record: ReleaseRecordData, attempt: ReleaseAttempt) =>
  attempt.outcome === "live" ? "went live" :
  attempt.outcome === "stopped" ? `stopped at “${stopName(record, attempt)}”` :
  `ended early at “${stopName(record, attempt)}”`;

/** Every production release attempt before this one, drawn from the release script's own reports. */
export default function ReleaseRecord({ record }: { record: ReleaseRecordData }) {
  const { attempts } = record;
  const [selected, setSelected] = useState(attempts.length - 1);
  const svg = useRef<SVGSVGElement>(null);
  const count = (outcome: ReleaseAttempt["outcome"]) => attempts.filter((a) => a.outcome === outcome).length;
  const tallest = Math.max(...attempts.map((a) => a.ran.length), 1);
  const slot = W / attempts.length;
  const current = attempts[selected];
  const describe = (i: number) => `Attempt ${i + 1} of ${attempts.length}, ${dateLabel(attempts[i].date)}: ${attempts[i].ran.length} steps, then it ${result(record, attempts[i])}`;

  const choose = (i: number) => setSelected(Math.min(attempts.length - 1, Math.max(0, i)));
  // The nearest bar to the pointer, so a tap anywhere on a phone selects one.
  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (box && box.width > 0) choose(Math.floor(((event.clientX - box.left) / box.width) * attempts.length));
  };
  // Dragging follows the finger or a held button; plain mouse hover would flood the announced line.
  const drag = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch" || event.buttons) pick(event);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = { ArrowLeft: selected - 1, ArrowDown: selected - 1, ArrowRight: selected + 1, ArrowUp: selected + 1, Home: 0, End: attempts.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    choose(next);
  };

  return (
    <div className="release-record" data-release-attempts={attempts.length}>
      <p>
        Before the release that published this page, there were {attempts.length} release attempts since{" "}
        {dateLabel(attempts[0].date)}: {count("live")} went live, {count("stopped")} stopped before going live, and{" "}
        {count("interrupted")} ended early.
      </p>
      <p className="release-record-legend" aria-hidden="true">
        <span><i className="is-live" /> Went live (full height)</span>
        <span><i className="is-stopped" /> Stopped or ended early (height: how far it got)</span>
      </p>
      <div
        className="release-record-chart"
        tabIndex={0}
        role="slider"
        aria-label="Release attempt"
        aria-valuemin={1}
        aria-valuemax={attempts.length}
        aria-valuenow={selected + 1}
        aria-valuetext={describe(selected)}
        onKeyDown={onKeyDown}
      >
        {/* Stretched to the column so bars stay tall on a phone; labels sit in HTML below. */}
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" onPointerDown={pick} onPointerMove={drag}>
          <line x1={0} x2={W} y1={BASE} y2={BASE} className="release-record-base" vectorEffect="non-scaling-stroke" />
          {attempts.map((attempt, i) => {
            const height = attempt.outcome === "live" ? BASE - TOP : Math.max(2, (attempt.ran.length / tallest) * (BASE - TOP));
            return (
              <rect
                key={i}
                x={i * slot}
                y={BASE - height}
                width={Math.max(1, slot - 1)}
                height={height}
                className={`${attempt.outcome === "live" ? "is-live" : "is-stopped"}${i === selected ? " is-selected" : ""}`}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <p className="release-record-axis" aria-hidden="true">
          <span>{dateLabel(attempts[0].date)}</span>
          <span>{dateLabel(attempts[attempts.length - 1].date)}</span>
        </p>
      </div>
      <div className="release-record-detail" aria-live="polite">
        <p>{describe(selected)}{current.minutes === null ? "." : `, ${current.minutes} minutes.`}</p>
        <ol className="release-record-steps">
          {current.ran.map((index, position) => (
            <li key={position} className={position === current.stop ? "is-stop" : undefined}>{record.steps[index]}</li>
          ))}
        </ol>
      </div>
      <details className="release-record-table">
        <summary>Every attempt as a table</summary>
        <table>
          <thead>
            <tr><th scope="col">#</th><th scope="col">Date</th><th scope="col">Result</th><th scope="col">Steps</th><th scope="col">Minutes</th></tr>
          </thead>
          <tbody>
            {attempts.map((attempt, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{dateLabel(attempt.date)}</td>
                <td>{result(record, attempt)}</td>
                <td>{attempt.ran.length}</td>
                <td>{attempt.minutes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
