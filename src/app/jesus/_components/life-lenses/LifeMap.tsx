"use client";

import type { LifeLensesIndex } from "@/lib/jesus/life-lenses";
import MapGuide from "@/app/_components/MapGuide";

/**
 * Where each moment happened. The map is a picture for assistive technology
 * (as on /jesus/life); the place picker mirrors its pointer interaction, and
 * the moments at the chosen place are listed below as buttons for everyone.
 */
export default function LifeMap({
  data,
  at,
  onChoose,
}: {
  data: LifeLensesIndex;
  /** Index of the chosen moment, or -1. */
  at: number;
  onChoose: (id: string) => void;
}) {
  const place = (id: string) => data.places.find((p) => p.id === id);
  const current = at >= 0 ? data.moments[at] : null;
  const here = current ? place(current.place) : undefined;
  const before = at > 0 ? place(data.moments[at - 1].place) : undefined;
  const visited = new Set(data.moments.slice(0, at + 1).map((m) => m.place));
  const momentsHere = here ? data.moments.filter((m) => m.place === here.id) : [];
  const placesWithMoments = data.places.filter((p) => data.moments.some((m) => m.place === p.id));

  // A place chosen on the map opens its next moment after the current one, so
  // repeated choices walk through everything that happened there.
  const choosePlace = (id: string) => {
    const there = data.moments.filter((m) => m.place === id);
    const next = current?.place === id ? there.find((m) => data.moments.indexOf(m) > at) : undefined;
    const pick = next ?? there[0];
    if (pick) onChoose(pick.id);
  };
  const labelLeft = here ? here.x > 260 : false;

  return (
    <figure className="jl-map">
      <MapGuide title="Explore by place" description="Choose a place, then a moment. The map and reading panel follow the same selection.">
        <label className="map-picker">
          <span>Place</span>
          <select value={here?.id ?? ""} onChange={(event) => choosePlace(event.currentTarget.value)}>
            <option value="" disabled>Choose a place</option>
            {placesWithMoments.map((p) => {
              const count = data.moments.filter((m) => m.place === p.id).length;
              return <option key={p.id} value={p.id}>{p.name} · {count} {count === 1 ? "moment" : "moments"}</option>;
            })}
          </select>
        </label>
      </MapGuide>
      <svg viewBox="0 0 400 560" role="img" aria-label={here ? `Map showing ${here.name}` : "Map of the places in his life"}>
        <rect className="jl-sea" width="400" height="560" />
        <path className="jl-land" d={data.map.land} />
        <path className="jl-water" d={data.map.water} />
        <path className="jl-river" d={data.map.jordan} />
        {before && here && before.id !== here.id ? (
          <line className="jl-leg" x1={before.x} y1={before.y} x2={here.x} y2={here.y} />
        ) : null}
        {data.places.map((p) => (
          <g
            key={p.id}
            className={`jl-place${visited.has(p.id) ? " is-visited" : ""}${p.id === here?.id ? " is-here" : ""}`}
            onClick={() => choosePlace(p.id)}
          >
            <title>{p.name}</title>
            <circle className="jl-hit" cx={p.x} cy={p.y} r={14} />
            {p.id === here?.id ? <circle className="jl-selected-ring" cx={p.x} cy={p.y} r={11} /> : null}
            <circle cx={p.x} cy={p.y} r={5.5} />
          </g>
        ))}
        {here ? (
          <text className="jl-label" x={here.x + (labelLeft ? -12 : 12)} y={here.y + 4} textAnchor={labelLeft ? "end" : "start"}>
            {here.name}
          </text>
        ) : null}
      </svg>
      <figcaption>
        {here ? (
          <>
            <p className="map-status" role="status">
              <strong>{here.name}</strong>
              {here.modern && here.modern !== here.name ? <> · today {here.modern}</> : null}
              {" · "}{momentsHere.length} {momentsHere.length === 1 ? "moment" : "moments"}
            </p>
            <ul className="jl-here" aria-label={`Moments at ${here.name}`}>
              {momentsHere.map((m) => (
                <li key={m.id}>
                  <button type="button" aria-current={m.id === current?.id ? "true" : undefined} onClick={() => onChoose(m.id)}>
                    {m.title}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="map-status" role="status">{placesWithMoments.length} places. Choose one to see what happened there.</p>
        )}
        <p className="map-reading-note">Ring: selected place. Filled pins: places reached on the timeline. The dashed line connects consecutive moments; it is not a surveyed route.</p>
      </figcaption>
    </figure>
  );
}
