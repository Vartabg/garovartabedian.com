/**
 * Eastern Mediterranean projection shared by the Ignatius road and the
 * Church councils map. Cities are real lat/lng; land silhouettes are
 * simplified coast rings projected the same way so pins sit on land.
 *
 * ViewBox: 720 × 420. Equirectangular — good enough for relative place
 * accuracy across Italy → Syria without a full GIS stack.
 */

export const MED_VIEW = { w: 720, h: 420 };
export const MED_PAD = { top: 28, right: 36, bottom: 40, left: 40 };

/** Window: Alps / Trento north, southern Anatolia south, Rome west, Antioch east. */
export const MED_BOUNDS = {
  north: 47.2,
  south: 35.2,
  west: 9.5,
  east: 37.2,
};

export function medProject(lat: number, lng: number): { x: number; y: number } {
  const innerW = MED_VIEW.w - MED_PAD.left - MED_PAD.right;
  const innerH = MED_VIEW.h - MED_PAD.top - MED_PAD.bottom;
  const x =
    MED_PAD.left +
    ((lng - MED_BOUNDS.west) / (MED_BOUNDS.east - MED_BOUNDS.west)) * innerW;
  const y =
    MED_PAD.top +
    ((MED_BOUNDS.north - lat) / (MED_BOUNDS.north - MED_BOUNDS.south)) * innerH;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export function medRingPath(points: [number, number][], close = true): string {
  const projected = points.map(([lat, lng]) => medProject(lat, lng));
  if (projected.length === 0) return "";
  const [first, ...rest] = projected;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) d += ` L ${p.x} ${p.y}`;
  if (close) d += " Z";
  return d;
}

/** Italian peninsula (simplified). */
export const ITALY_LAND = medRingPath([
  [46.5, 10.5],
  [46.2, 13.2],
  [45.4, 12.3],
  [44.5, 12.2],
  [43.6, 13.5],
  [42.4, 14.3],
  [41.5, 15.8],
  [40.6, 17.9],
  [40.1, 18.4],
  [39.6, 16.5],
  [38.9, 16.6],
  [38.1, 15.65],
  [38.9, 16.2],
  [39.8, 15.9],
  [40.8, 14.3],
  [41.5, 12.9],
  [41.9, 12.0],
  [42.8, 10.8],
  [43.8, 10.2],
  [44.6, 9.2],
  [45.6, 9.0],
  [46.2, 9.5],
]);

/** Balkans / Greece / Macedonia (simplified). */
export const GREECE_LAND = medRingPath([
  [42.0, 20.0],
  [41.6, 23.5],
  [41.2, 25.5],
  [40.9, 24.6],
  [40.6, 23.0],
  [40.2, 22.5],
  [39.5, 22.9],
  [38.5, 23.7],
  [37.6, 24.0],
  [36.9, 22.4],
  [37.5, 21.4],
  [38.3, 21.0],
  [39.2, 20.4],
  [40.0, 19.6],
  [41.0, 19.5],
  [41.7, 19.8],
]);

/**
 * Anatolia + northern Levant: Aegean coast, Bosphorus, inland to Nicaea,
 * south/east to Antioch's coast. Enough land under every council/Ignatius pin.
 */
export const ANATOLIA_LAND = medRingPath([
  [41.3, 26.3],
  [41.15, 27.5],
  [41.05, 28.9],
  [41.0, 29.1],
  [40.9, 30.5],
  [40.7, 32.5],
  [40.2, 35.0],
  [38.5, 36.3],
  [36.8, 36.4],
  [36.1, 36.0],
  [36.0, 35.5],
  [36.3, 34.0],
  [36.5, 32.0],
  [36.6, 30.5],
  [36.5, 29.0],
  [36.8, 28.0],
  [37.4, 27.2],
  [38.0, 26.6],
  [38.6, 26.4],
  [39.5, 26.1],
  [40.2, 26.2],
  [40.8, 26.4],
  [41.1, 26.5],
]);

/** Real lat/lng for every city pinned on either Mediterranean map. */
export const MED_CITIES = {
  rome: { name: "Rome", modern: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  trent: { name: "Trent", modern: "Trento, Italy", lat: 46.0748, lng: 11.1217 },
  neapolis: {
    name: "Neapolis",
    modern: "Kavala, Greece",
    lat: 40.9396,
    lng: 24.4019,
  },
  philippi: {
    name: "Philippi",
    modern: "Filippoi, Greece",
    lat: 41.012,
    lng: 24.286,
  },
  troas: {
    name: "Troas",
    modern: "Alexandria Troas, Turkey",
    lat: 39.751,
    lng: 26.159,
  },
  smyrna: {
    name: "Smyrna",
    modern: "İzmir, Turkey",
    lat: 38.4192,
    lng: 27.1287,
  },
  ephesus: {
    name: "Ephesus",
    modern: "Selçuk, Turkey",
    lat: 37.9391,
    lng: 27.3419,
  },
  magnesia: {
    name: "Magnesia",
    modern: "Tekin / Magnesia on the Maeander",
    lat: 37.853,
    lng: 27.527,
  },
  tralles: {
    name: "Tralles",
    modern: "Aydın, Turkey",
    lat: 37.8444,
    lng: 27.8458,
  },
  philadelphia: {
    name: "Philadelphia",
    modern: "Alaşehir, Turkey",
    lat: 38.3506,
    lng: 28.5172,
  },
  antioch: {
    name: "Antioch",
    modern: "Antakya, Turkey",
    lat: 36.2023,
    lng: 36.1613,
  },
  constantinople: {
    name: "Constantinople",
    modern: "Istanbul, Turkey",
    lat: 41.0082,
    lng: 28.9784,
  },
  chalcedon: {
    name: "Chalcedon",
    modern: "Kadıköy, Istanbul",
    lat: 40.99,
    lng: 29.025,
  },
  nicaea: {
    name: "Nicaea",
    modern: "İznik, Turkey",
    lat: 40.4286,
    lng: 29.7211,
  },
} as const;

export type MedCityId = keyof typeof MED_CITIES;

export function medCityXY(id: MedCityId): { x: number; y: number } {
  const c = MED_CITIES[id];
  return medProject(c.lat, c.lng);
}
