"use client";

import { useEffect, useRef } from "react";
import {
  PLACES,
  PLACE_BY_ID,
} from "./geo";
import { GalileeMapBackdrop } from "./GalileeMapBackdrop";

export type RoutePoint = { placeId: string; era: string };

/** Gentle hand-drawn curve between two projected points. */
function curve(ax: number, ay: number, bx: number, by: number, i: number): string {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(3.5, len / 16) * (i % 2 === 0 ? 1 : -1);
  const cx = mx - (dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

/**
 * Gospel places on contemporary Natural Earth reference geography.
 * Positions derive from real lat/lng; uncertain sites remain identified below. The Then/Now panel carries
 * modern place names; this map stays in the story's vocabulary.
 */
export default function GalileeMap({
  active,
  route = [],
  activeEra = null,
  activeStep = null,
}: {
  active: string | null;
  route?: RoutePoint[];
  activeEra?: string | null;
  activeStep?: number | null;
}) {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && liveRegionRef.current) {
      const place = PLACE_BY_ID.get(active);
      if (place) {
        liveRegionRef.current.textContent = `${place.name} highlighted on map. Modern location: ${place.modern}, ${place.today}.`;
      }
    }
  }, [active]);

  const eraStops = new Set<string>();
  for (const pt of route) {
    if (pt.era === activeEra) eraStops.add(pt.placeId);
  }

  const legs: { d: string; i: number; travelled: boolean; current: boolean }[] =
    [];
  const legAt = (i: number) => {
    const a = PLACE_BY_ID.get(route[i - 1]?.placeId);
    const b = PLACE_BY_ID.get(route[i]?.placeId);
    if (a && b) {
      legs.push({
        d: curve(a.x, a.y, b.x, b.y, i),
        i,
        travelled: activeStep != null && i <= activeStep,
        current: activeStep === i || activeStep === i - 1,
      });
    }
  };

  const eraIndices = route.flatMap((point, index) =>
    point.era === activeEra ? [index] : [],
  );
  if (eraIndices.length > 0) {
    const first = Math.max(1, eraIndices[0]);
    const last = eraIndices[eraIndices.length - 1];
    for (let index = first; index <= last; index += 1) legAt(index);
  }

  return (
    <>
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />
      <svg
        viewBox="0 0 400 560"
        className="jsu-map"
        role="img"
        aria-label="North-up coordinate map of first-century Galilee and Judea, overlaid with modern reference boundaries and cities. Use the place selector before the map to highlight a location and see its modern equivalent below."
      >
      <GalileeMapBackdrop />

      {legs.map((leg) => (
        <path
          key={leg.i}
          d={leg.d}
          className={[
            "jsu-route",
            leg.travelled ? "is-travelled" : "",
            leg.current ? "is-current" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ))}

      {PLACES.map((p) => {
        const isActive = active === p.id;
        const isLake = p.id === "sea-of-galilee";
        const inEra = eraStops.has(p.id);
        const anchor = p.side === "left" ? "end" : "start";
        const dx = p.side === "left" ? -8 : 8;
        const cls = [
          "jsu-map-place",
          isActive ? "is-active" : "",
          inEra ? "is-era" : "",
          p.anchor ? "is-anchor" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <g
            key={p.id}
            className={cls}
          >
            {isActive && <circle cx={p.x} cy={p.y} r="10" className="jsu-map-halo" />}
            {isActive && <circle cx={p.x} cy={p.y} r="6.5" className="jsu-map-halo inner" />}
            {!isLake && (
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 4 : inEra ? 3 : 2.4}
                className="jsu-map-dot"
              />
            )}
            <text
              x={p.x + (isLake ? 0 : dx)}
              y={p.y + (isLake ? 44 : 3.5)}
              textAnchor={isLake ? "middle" : anchor}
              className="jsu-map-label"
            >
              {p.name}
            </text>
            {isActive && (
              <text
                x={p.x + (isLake ? 0 : dx)}
                y={p.y + (isLake ? 58 : 16)}
                textAnchor={isLake ? "middle" : anchor}
                className="jsu-map-label-modern"
              >
                {p.modern}
              </text>
            )}
          </g>
        );
      })}
      </svg>
    </>
  );
}
