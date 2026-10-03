"use client";

import { useEffect, useState } from "react";
import type { TreeBranch, TreeData } from "@/lib/church/types";

const W = 760;
const PLOT_L = 30;
const PLOT_R = 640;
const LANES: Record<string, number> = {
  east: 40,
  oriental: 95,
  orthodox: 155,
  one: 215,
  catholic: 275,
  lutheran: 335,
  reformed: 390,
  anabaptist: 445,
  anglican: 500,
  baptist: 555,
  methodist: 610,
  pentecostal: 665,
};
const H = 700;
const TICKS = [100, 500, 1000, 1500, 2000];

/**
 * One church becoming many, drawn: a trunk from Pentecost, and every limb a
 * communion that still lives today. Forks are dated; the native selector
 * supplies a non-overlapping way to inspect every branch.
 */
export default function Tree({ data }: { data: TreeData }) {
  const [selected, setSelected] = useState<TreeBranch | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const branch = hash ? data.branches.find((b) => b.id === hash) : null;
    if (branch) setSelected(branch);
  }, [data]);

  const { start, end } = data.range;
  const x = (year: number) => PLOT_L + ((year - start) / (end - start)) * (PLOT_R - PLOT_L);

  const branchPath = (b: TreeBranch) => {
    const y = LANES[b.id] ?? 215;
    const xEnd = b.id === "one" ? x(1054) : PLOT_R;
    if (!b.parent) return `M ${x(b.from)} ${y} L ${xEnd} ${y}`;
    const py = LANES[b.parent] ?? 215;
    const xf = x(b.from);
    return `M ${xf} ${py} C ${xf + 26} ${py}, ${xf + 10} ${y}, ${xf + 44} ${y} L ${xEnd} ${y}`;
  };

  const nameById = new Map(data.branches.map((b) => [b.id, b.name]));

  return (
    <div className={`ch-tree${selected ? " has-selection" : ""}`}>
      <p className="ch-tree-swipe" id="church-tree-instructions">
        Swipe horizontally to follow every living branch, then choose one below
        to read its story.
      </p>
      <label className="ch-tree-picker">
        <span>Choose a living branch</span>
        <select
          data-ui-target="standard"
          value={selected?.id ?? ""}
          onChange={(event) => {
            setSelected(
              data.branches.find(
                (branch) => branch.id === event.currentTarget.value,
              ) ?? null,
            );
          }}
        >
          <option value="">Church family-tree overview</option>
          {data.branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} · from AD {branch.from}
            </option>
          ))}
        </select>
      </label>
      <div className="ch-tree-viewport">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-describedby="church-tree-instructions"
          aria-label="The family tree of the church: one trunk from Pentecost dividing into the Church of the East (431), Oriental Orthodox (451), Eastern Orthodox and Catholic (1054), and the Protestant branches (from 1517)"
        >
          {TICKS.map((year) => (
            <g key={year}>
              <line x1={x(year)} y1="16" x2={x(year)} y2={H - 14} className="ch-tick" />
              <text x={x(year)} y="11" textAnchor="middle" className="ch-tick-year">
                {year}
              </text>
            </g>
          ))}

          {data.branches.map((b) => {
            const isSel = selected?.id === b.id;
            const y = LANES[b.id] ?? 215;
            return (
              <g
                key={b.id}
                className={`ch-branch${isSel ? " active" : ""}${b.id === "one" ? " trunk" : ""}`}
              >
                <path d={branchPath(b)} fill="none" className="ch-limb">
                  <title>
                    {b.parent
                      ? `${b.name} — split from ${nameById.get(b.parent) ?? b.parent} in AD ${b.from}`
                      : `${b.name} — from AD ${b.from}`}
                  </title>
                </path>
                {b.parent && (
                  <>
                    <circle cx={x(b.from)} cy={LANES[b.parent] ?? 215} r="4" className="ch-fork" />
                    <text x={x(b.from)} y={y - 8} textAnchor="middle" className="ch-fork-year">
                      {b.from}
                    </text>
                  </>
                )}
                <text
                  x={b.id === "one" ? x(540) : PLOT_R + 8}
                  y={b.id === "one" ? y - 8 : y + 4}
                  textAnchor={b.id === "one" ? "middle" : "start"}
                  className="ch-limb-label"
                >
                  {b.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected ? (
        <div className="world-detail">
          <strong>
            {selected.name} · {selected.parent ? `from AD ${selected.from}` : "AD 33"}
          </strong>
          <p>{selected.note}</p>
          {selected.includes && <p className="scr-meta">{selected.includes}</p>}
        </div>
      ) : (
        <p className="scr-meta">
          Choose a branch above. Every branch on this tree is alive today — the
          tree loses no living wood.
        </p>
      )}

      {/* The chart's WCAG-clean twin: the same lineage without colour, hover,
          or a pointing device — and it carries each branch's note, which the
          drawing can only show one at a time. */}
      <details className="ch-tree-table">
        <summary>Read the same tree as a table</summary>
        <div className="ch-tree-table-body">
          <table>
            <caption className="sr-fallback">
              Every living branch of the church, what it split from, and when
            </caption>
            <thead>
              <tr>
                <th scope="col">Branch</th>
                <th scope="col">From</th>
                <th scope="col">Split from</th>
                <th scope="col">What it is</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map((b) => (
                <tr key={b.id}>
                  <th scope="row">{b.name}</th>
                  <td>AD {b.from}</td>
                  <td>{b.parent ? (nameById.get(b.parent) ?? b.parent) : "—"}</td>
                  <td>{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
