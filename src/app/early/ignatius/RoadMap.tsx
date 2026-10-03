"use client";

import {
  ANATOLIA_LAND,
  GREECE_LAND,
  ITALY_LAND,
  medProject,
} from "@/lib/maps/med-geo";
import { MAP_PLACES, ROUTE } from "./places";
import type { IgnatiusData } from "@/lib/early/types";

const place = (id: string) => MAP_PLACES.find((p) => p.id === id);
const mareLabel = medProject(38.2, 18.5);

function curve(fromId: string, toId: string, lift = 0.18): string {
  const a = place(fromId);
  const b = place(toId);
  if (!a || !b) return "";
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Perpendicular offset so arcs bow instead of overlapping the route.
  const cx = mx - dy * lift;
  const cy = my + dx * lift;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

/**
 * A storyteller's map of Ignatius' road from Antioch to Rome. His one
 * escorted journey is drawn whole (that's the story); the seven letters
 * stay quiet until chosen, then the one arc flies from where it was written
 * to who received it. Names surface by relevance — the journey's ends and
 * main writing-stops always, the rest on hover. A native place picker supplies
 * the non-overlapping keyboard and touch target for this dense geography.
 */
export default function RoadMap({
  data,
  activeLetter,
  onSelect,
}: {
  data: IgnatiusData;
  activeLetter: string | null;
  onSelect?: (letterId: string | null) => void;
}) {
  const letter = data.letters.find((l) => l.textId === activeLetter) ?? null;
  const activePlaces = letter ? new Set([letter.writtenAt, letter.to]) : new Set<string>();
  // First letter written at each place — clicking the place selects it.
  const letterAt = new Map<string, string>();
  for (const l of data.letters) {
    if (!letterAt.has(l.writtenAt)) letterAt.set(l.writtenAt, l.textId);
  }

  return (
    <>
      <label className="ew-visual-picker">
        <span>Choose a place on Ignatius&apos; road</span>
        <select
          data-ui-target="standard"
          value={letter?.writtenAt ?? ""}
          onChange={(event) => {
            onSelect?.(letterAt.get(event.currentTarget.value) ?? null);
          }}
        >
          <option value="">Road overview</option>
          {MAP_PLACES.map((mapPlace) => (
            <option key={mapPlace.id} value={mapPlace.id}>
              {mapPlace.name}
            </option>
          ))}
        </select>
      </label>
      <div className="ew-map-scroll">
        <svg
        viewBox="0 0 720 420"
        className="ew-map"
        role="img"
        aria-label="Map of Ignatius' journey from Antioch to Rome with places positioned from real geography, and his seven letters drawn from where each was written to its recipient"
      >
        <rect x="0" y="0" width="720" height="420" className="ew-map-sea" />

        {/* Land masses — simplified coasts, same lat/lng projection as the pins */}
        <path d={ITALY_LAND} className="ew-map-land" />
        <path d={GREECE_LAND} className="ew-map-land" />
        <path d={ANATOLIA_LAND} className="ew-map-land" />

        <text x={mareLabel.x} y={mareLabel.y} className="ew-map-region" textAnchor="middle">
          MARE NOSTRUM
        </text>

        {/* The escorted road — the one journey, drawn whole */}
        {ROUTE.map((leg) => (
          <path
            key={`${leg.from}-${leg.to}`}
            d={curve(leg.from, leg.to, leg.sea ? 0.12 : 0.05)}
            className={leg.sea ? "ew-map-route sea" : "ew-map-route"}
            fill="none"
          />
        ))}

        {/* Letter arcs — hidden until the letter is chosen, then it flies */}
        {data.letters.map((l) => {
          if (l.writtenAt === l.to) return null;
          return (
            <path
              key={l.textId}
              d={curve(l.writtenAt, l.to, -0.22)}
              className={
                activeLetter === l.textId ? "ew-map-letter active" : "ew-map-letter"
              }
              fill="none"
            />
          );
        })}

        {/* Places */}
        {MAP_PLACES.map((p) => {
          const isActive = activePlaces.has(p.id);
          const onRoute = data.route.includes(p.id);
          const lx = p.side === "left" ? p.x - 9 : p.side === "right" ? p.x + 9 : p.x;
          const ly = p.side === "above" ? p.y - 9 : p.side === "below" ? p.y + 15 : p.y + 4;
          const anchor = p.side === "left" ? "end" : p.side === "right" ? "start" : "middle";
          const cls = [
            "ew-map-place",
            isActive ? "active" : "",
            p.anchor ? "is-anchor" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <g
              key={p.id}
              className={cls}
            >
              {isActive && <circle cx={p.x} cy={p.y} r="10" className="ew-map-ring" />}
              <circle
                cx={p.x}
                cy={p.y}
                r={onRoute ? 4 : 3}
                className={onRoute ? "ew-map-dot route" : "ew-map-dot"}
              />
              <text x={lx} y={ly} textAnchor={anchor} className="ew-map-label">
                {p.name}
              </text>
            </g>
          );
        })}
        </svg>
      </div>
    </>
  );
}
