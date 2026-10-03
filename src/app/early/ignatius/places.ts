/**
 * Ignatius' escorted journey (c. AD 107–110) on real lat/lng.
 * Positions come from {@link medCityXY} so relative place is accurate;
 * the land silhouette is simplified for reading, not a survey chart.
 */

import { MED_CITIES, medCityXY, type MedCityId } from "@/lib/maps/med-geo";

export type MapPlace = {
  id: string;
  name: string;
  x: number;
  y: number;
  side?: "left" | "right" | "above" | "below";
  /** Always-labelled orientation point (journey ends + main writing stops). */
  anchor?: boolean;
};

/** Label sides chosen after projection to reduce collisions. */
const LABEL_SIDE: Partial<
  Record<MedCityId, "left" | "right" | "above" | "below">
> = {
  rome: "left",
  neapolis: "below",
  philippi: "above",
  troas: "left",
  smyrna: "left",
  ephesus: "left",
  magnesia: "below",
  tralles: "right",
  philadelphia: "right",
  antioch: "left",
};

const ON_MAP: { id: MedCityId; anchor?: boolean }[] = [
  { id: "rome", anchor: true },
  { id: "neapolis" },
  { id: "philippi" },
  { id: "troas", anchor: true },
  { id: "smyrna", anchor: true },
  { id: "ephesus" },
  { id: "magnesia" },
  { id: "tralles" },
  { id: "philadelphia" },
  { id: "antioch", anchor: true },
];

export const MAP_PLACES: MapPlace[] = ON_MAP.map(({ id, anchor }) => {
  const { x, y } = medCityXY(id);
  const meta = MED_CITIES[id];
  return {
    id,
    name: meta.name,
    x,
    y,
    side: LABEL_SIDE[id],
    anchor,
  };
});

/**
 * Escorted road in traditional order (inland Asia Minor → Smyrna → Troas →
 * Macedonia → Rome). Philadelphia sits east of Smyrna on a plausible inland
 * approach from Syrian Antioch; letter arcs still show which cities he wrote
 * to without requiring every recipient to lie on the road.
 */
export const ROUTE: { from: string; to: string; sea?: boolean }[] = [
  { from: "antioch", to: "philadelphia" },
  { from: "philadelphia", to: "smyrna" },
  { from: "smyrna", to: "troas" },
  { from: "troas", to: "neapolis", sea: true },
  { from: "neapolis", to: "philippi" },
  { from: "philippi", to: "rome", sea: true },
];
