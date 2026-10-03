"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TimelineData, TimelineItem } from "@/lib/early/types";

const LANES: { id: TimelineItem["lane"]; label: string }[] = [
  { id: "event", label: "The world" },
  { id: "nt", label: "New Testament" },
  { id: "writing", label: "Early writings" },
];

const W = 720;
const PLOT_L = 24;
const PLOT_R = 708;
const AXIS_H = 30;
const ROW_H = 24;
const LANE_HEAD = 20;
const LANE_GAP = 16;
const CHAR_W = 5.7;
const MAX_LABEL = 30;

/** Axis label for years that may fall before Christ. */
function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year === 0) return "1";
  return `AD ${year}`;
}

/** Compact range for the detail panel. */
function yearRangeLabel(start: number, end: number): string {
  if (start === end) return yearLabel(start);
  if (start < 0 && end < 0) return `${Math.abs(start)}–${Math.abs(end)} BC`;
  if (start > 0 && end > 0) return `AD ${start}–${end}`;
  return `${yearLabel(start)} – ${yearLabel(end)}`;
}

/** Tick step scales with the chart window so a 700-year span stays readable. */
function tickStep(start: number, end: number): number {
  const span = end - start;
  if (span > 500) return 100;
  if (span > 250) return 50;
  return 20;
}

type Placed = {
  item: TimelineItem;
  x1: number;
  barW: number;
  isPoint: boolean;
  label: string;
  labelLeft: boolean;
  y: number;
};

/**
 * Seven centuries in three lanes — the world, the New Testament, and the early
 * writings — from 300 BC to AD 400, the span timeline.json actually covers.
 * Rows are packed per lane so no bar or label can collide; each item's
 * horizontal extent includes its text.
 */
export default function Timeline({ data }: { data: TimelineData }) {
  const [selected, setSelected] = useState<TimelineItem | null>(null);

  const { start, end } = data.range;

  const { placed, laneTops, height, x } = useMemo(() => {
    const x = (year: number) => PLOT_L + ((year - start) / (end - start)) * (PLOT_R - PLOT_L - 10);
    const placed: Placed[] = [];
    const laneTops: { label: string; y: number }[] = [];
    let cursor = AXIS_H;

    for (const lane of LANES) {
      laneTops.push({ label: lane.label, y: cursor + 12 });
      const laneTop = cursor + LANE_HEAD;

      const items = data.items
        .filter((i) => i.lane === lane.id)
        .sort((a, b) => a.start - b.start || a.end - b.end);

      const rows: number[] = []; // right edge of the last extent per row
      for (const item of items) {
        const x1 = x(item.start);
        const barW = Math.max(x(Math.min(item.end, end)) - x1, 7);
        const isPoint = item.end - item.start <= 2;
        const display = item.short ?? item.label;
        const label =
          display.length > MAX_LABEL ? display.slice(0, MAX_LABEL - 1) + "…" : display;
        const labelW = label.length * CHAR_W + 12;
        const rightIfRight = (isPoint ? x1 + 8 : x1 + barW + 6) + labelW;
        const labelLeft = rightIfRight > PLOT_R;
        const extentL = labelLeft ? x1 - 8 - labelW : x1 - 4;
        const extentR = labelLeft ? x1 + barW + 4 : rightIfRight;

        let row = rows.findIndex((right) => extentL > right + 10);
        if (row === -1) {
          row = rows.length;
          rows.push(-Infinity);
        }
        rows[row] = extentR;

        placed.push({
          item,
          x1,
          barW,
          isPoint,
          label,
          labelLeft,
          y: laneTop + row * ROW_H + ROW_H / 2,
        });
      }
      cursor = laneTop + rows.length * ROW_H + LANE_GAP;
    }
    return { placed, laneTops, height: cursor, x };
  }, [data, start, end]);

  const step = tickStep(start, end);
  const ticks: number[] = [];
  const firstTick = Math.ceil(start / step) * step;
  for (let y = firstTick; y <= end; y += step) ticks.push(y);

  return (
    <div className="ew-timeline">
      <label className="ew-visual-picker">
        <span>Choose a timeline entry</span>
        <select
          data-ui-target="standard"
          value={selected?.id ?? ""}
          onChange={(event) => {
            setSelected(
              data.items.find((item) => item.id === event.currentTarget.value) ??
                null,
            );
          }}
        >
          <option value="">Timeline overview</option>
          {LANES.map((lane) => (
            <optgroup key={lane.id} label={lane.label}>
              {data.items
                .filter((item) => item.lane === lane.id)
                .sort((a, b) => a.start - b.start || a.end - b.end)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} · {yearRangeLabel(item.start, item.end)}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="group"
        aria-label={`Timeline of early Christian writings from ${yearLabel(start)} to ${yearLabel(end)} across three lanes: world events, New Testament writings, and early Christian writings`}
      >
        {ticks.map((year) => (
          <g key={year}>
            <line x1={x(year)} y1="26" x2={x(year)} y2={height - 6} className="ew-tl-tick" />
            <text x={x(year)} y="18" textAnchor="middle" className="ew-tl-year">
              {yearLabel(year)}
            </text>
          </g>
        ))}

        {laneTops.map((l) => (
          <text key={l.label} x="6" y={l.y} className="ew-tl-lane">
            {l.label}
          </text>
        ))}

        {placed.map((p) => {
          const isSel = selected?.id === p.item.id;
          return (
            <g
              key={p.item.id}
              className={isSel ? "ew-tl-item active" : "ew-tl-item"}
            >
              {p.isPoint ? (
                <circle cx={p.x1} cy={p.y} r={isSel ? 5.5 : 4} className="ew-tl-dot" />
              ) : (
                <rect x={p.x1} y={p.y - 5} width={p.barW} height="10" rx="5" className="ew-tl-bar" />
              )}
              <text
                x={p.labelLeft ? p.x1 - 8 : p.isPoint ? p.x1 + 8 : p.x1 + p.barW + 6}
                y={p.y + 3.5}
                textAnchor={p.labelLeft ? "end" : "start"}
                className="ew-tl-label"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="ew-tl-detail-slot" aria-live="polite">
        {selected ? (
          <div className="ew-tl-detail">
            <strong>
              {selected.label} · {yearRangeLabel(selected.start, selected.end)}
            </strong>
            <p>{selected.note}</p>
            {selected.textId && (
              <Link className="textlink" href={`/early/${selected.textId}`}>
                Read it →
              </Link>
            )}
          </div>
        ) : (
          <p className="scr-meta">
            Choose an entry above to inspect it. Bars are scholarly date ranges,
            not certainties. On a small screen, swipe sideways to see the full
            chart.
          </p>
        )}
      </div>
    </div>
  );
}
