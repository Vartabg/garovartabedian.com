/**
 * Holy Land geography for the life-of-Jesus map.
 *
 * Coordinates are surveyed lat/lng (WGS84). Ancient labels, modern
 * equivalents, and SVG positions all derive from the same numbers so the
 * map stays honest about relative place.
 */

export type HolyLandPlace = {
  id: string;
  /** First-century / biblical label on the map. */
  name: string;
  /** Where archaeologists and locals point today (short). */
  modern: string;
  /** Present-day region for orientation. */
  today: string;
  lat: number;
  lng: number;
  /** Projected SVG position (filled by projectPlaces). */
  x: number;
  y: number;
  side?: "left" | "right";
  anchor?: boolean;
};

type ModernReferenceCity = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  side?: "left" | "right";
};

type ModernReferenceLabel = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
};

type ModernBoundaryPath = {
  id: string;
  d: string;
  kind: "border" | "territory";
};

/** Map window — Lebanon coast through Judea, Mediterranean west to Decapolis east. */
export const BOUNDS = {
  north: 33.62,
  south: 31.12,
  west: 34.52,
  east: 36.08,
};

const VIEW = { w: 400, h: 560 };
const PAD = { top: 28, right: 28, bottom: 36, left: 36 };

export function project(lat: number, lng: number): { x: number; y: number } {
  const innerW = VIEW.w - PAD.left - PAD.right;
  const innerH = VIEW.h - PAD.top - PAD.bottom;
  const x = PAD.left + ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * innerW;
  const y = PAD.top + ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * innerH;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/** Ring of lat/lng points → SVG path through projections. */
export function ringPath(points: [number, number][], close = true): string {
  const projected = points.map(([lat, lng]) => project(lat, lng));
  if (projected.length === 0) return "";
  const [first, ...rest] = projected;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) d += ` L ${p.x} ${p.y}`;
  if (close) d += " Z";
  return d;
}

function linePath(points: [number, number][]): string {
  return ringPath(points, false);
}

const RAW_PLACES: Omit<HolyLandPlace, "x" | "y">[] = [
  {
    id: "tyre-sidon",
    name: "Tyre & Sidon",
    modern: "Sour & Sidon",
    today: "Lebanon",
    // Midpoint of the two coastal cities (gospel pair, not one pin each)
    lat: 33.418,
    lng: 35.281,
    side: "right",
  },
  {
    id: "caesarea-philippi",
    name: "Caesarea Philippi",
    modern: "Banias",
    today: "Golan Heights",
    lat: 33.2486,
    lng: 35.6944,
    side: "left",
  },
  {
    id: "bethsaida",
    name: "Bethsaida",
    modern: "el-Araj / et-Tell",
    today: "North shore, Israel",
    // el-Araj (stronger lake-shore candidate) ~32.90 N, 35.62 E
    lat: 32.9,
    lng: 35.62,
    side: "right",
  },
  {
    id: "capernaum",
    name: "Capernaum",
    modern: "Kfar Nahum",
    today: "Sea of Galilee, Israel",
    lat: 32.8809,
    lng: 35.5753,
    side: "left",
    anchor: true,
  },
  {
    id: "sea-of-galilee",
    name: "Sea of Galilee",
    modern: "Lake Kinneret",
    today: "Israel",
    lat: 32.81,
    lng: 35.59,
    anchor: true,
  },
  {
    id: "cana",
    name: "Cana",
    modern: "Kafr Kanna (trad.)",
    today: "Lower Galilee, Israel",
    lat: 32.748,
    lng: 35.342,
    side: "left",
  },
  {
    id: "nazareth",
    name: "Nazareth",
    modern: "Nazareth",
    today: "Lower Galilee, Israel",
    lat: 32.6996,
    lng: 35.3035,
    side: "left",
    anchor: true,
  },
  {
    id: "galilee-mountain",
    name: "A mountain in Galilee",
    modern: "Galilee highlands",
    today: "Northern Israel",
    // Generic highland between Nazareth and the lake — not a fixed summit
    lat: 32.78,
    lng: 35.42,
    side: "right",
  },
  {
    id: "gerasa",
    // Gospel event is traditionally on the east shore (Gergesa/Kursi), not
    // inland Jerash — keep life.json id, correct the map pin.
    name: "Gerasenes",
    modern: "Kursi (Gergesa, trad.)",
    today: "East shore, Israel",
    lat: 32.8258,
    lng: 35.6514,
    side: "left",
  },
  {
    id: "samaria",
    name: "Sychar (Samaria)",
    modern: "Askar / Nablus area",
    today: "West Bank",
    lat: 32.221,
    lng: 35.261,
    side: "right",
    anchor: true,
  },
  {
    id: "jordan-river",
    name: "The Jordan",
    modern: "Al-Maghtas (Bethany beyond the Jordan)",
    today: "Jordan River, Israel/Jordan",
    lat: 31.837,
    lng: 35.552,
    side: "right",
  },
  {
    id: "jericho",
    name: "Jericho",
    modern: "Jericho",
    today: "West Bank",
    lat: 31.855,
    lng: 35.461,
    side: "right",
  },
  {
    id: "wilderness",
    name: "Judean wilderness",
    modern: "Judaean Desert",
    today: "West Bank / Israel",
    lat: 31.55,
    lng: 35.38,
    side: "right",
  },
  {
    id: "emmaus",
    name: "Emmaus",
    modern: "Emmaus Nicopolis (trad.)",
    today: "Israel",
    lat: 31.8392,
    lng: 34.9895,
    side: "left",
  },
  {
    id: "jerusalem",
    name: "Jerusalem",
    modern: "Old City",
    today: "Jerusalem",
    lat: 31.778,
    lng: 35.2354,
    side: "left",
    anchor: true,
  },
  {
    id: "bethany",
    name: "Bethany",
    modern: "Al-Eizariya",
    today: "West Bank",
    lat: 31.77,
    lng: 35.261,
    side: "right",
  },
  {
    id: "bethlehem",
    name: "Bethlehem",
    modern: "Bethlehem",
    today: "West Bank",
    lat: 31.7054,
    lng: 35.2024,
    side: "left",
    anchor: true,
  },
  {
    id: "egypt",
    name: "toward Egypt",
    modern: "via Gaza / Sinai",
    today: "Egypt",
    // SW of the map frame — direction of the flight, not a city pin
    lat: 31.2,
    lng: 34.6,
    side: "right",
  },
];

export const PLACES: HolyLandPlace[] = RAW_PLACES.map((p) => {
  const { x, y } = project(p.lat, p.lng);
  return { ...p, x, y };
});

export const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));

const RAW_REFERENCE_CITIES: Omit<ModernReferenceCity, "x" | "y">[] = [
  {
    id: "haifa",
    name: "Haifa",
    lat: 32.794,
    lng: 34.989,
    side: "right",
  },
  {
    id: "tel-aviv-jaffa",
    name: "Tel Aviv-Jaffa",
    lat: 32.0853,
    lng: 34.7818,
    side: "right",
  },
  {
    id: "amman",
    name: "Amman",
    lat: 31.9539,
    lng: 35.9106,
    side: "left",
  },
];

export const MODERN_REFERENCE_CITIES: ModernReferenceCity[] = RAW_REFERENCE_CITIES.map((p) => {
  const { x, y } = project(p.lat, p.lng);
  return { ...p, x, y };
});

const RAW_REFERENCE_LABELS: Omit<ModernReferenceLabel, "x" | "y">[] = [
  { id: "lebanon", label: "LEBANON", lat: 33.42, lng: 35.48, anchor: "middle" },
  { id: "israel", label: "ISRAEL", lat: 32.36, lng: 34.98, anchor: "middle" },
  { id: "golan", label: "GOLAN", lat: 33.08, lng: 35.78, anchor: "middle" },
  { id: "west-bank", label: "WEST BANK", lat: 31.98, lng: 35.28, anchor: "middle" },
  { id: "jordan", label: "JORDAN", lat: 32.18, lng: 35.82, anchor: "middle" },
];

export const MODERN_REFERENCE_LABELS: ModernReferenceLabel[] = RAW_REFERENCE_LABELS.map((p) => {
  const { x, y } = project(p.lat, p.lng);
  return { ...p, x, y };
});

/** Subtle coordinate grid so readers can transpose the atlas onto a modern map. */
export const GRATICULE_LINES = [
  {
    id: "lat-33",
    d: linePath([[33, BOUNDS.west], [33, BOUNDS.east]]),
    label: "33 N",
    labelX: project(33, BOUNDS.west).x + 8,
    labelY: project(33, BOUNDS.west).y - 4,
  },
  {
    id: "lat-32",
    d: linePath([[32, BOUNDS.west], [32, BOUNDS.east]]),
    label: "32 N",
    labelX: project(32, BOUNDS.west).x + 8,
    labelY: project(32, BOUNDS.west).y - 4,
  },
  {
    id: "lng-35",
    d: linePath([[BOUNDS.north, 35], [BOUNDS.south, 35]]),
    label: "35 E",
    labelX: project(BOUNDS.south, 35).x - 8,
    labelY: project(BOUNDS.south, 35).y - 8,
  },
  {
    id: "lng-35-5",
    d: linePath([[BOUNDS.north, 35.5], [BOUNDS.south, 35.5]]),
    label: "35.5 E",
    labelX: project(BOUNDS.south, 35.5).x - 10,
    labelY: project(BOUNDS.south, 35.5).y - 8,
  },
];

/**
 * Present-day reference outlines only. They orient the reader against a
 * familiar map; they are intentionally simplified and are not first-century
 * boundaries or legal boundary claims.
 */
export const MODERN_BOUNDARY_PATHS: ModernBoundaryPath[] = [
  {
    id: "lebanon-israel",
    kind: "border",
    d: linePath([
      [33.31, 35.16],
      [33.27, 35.33],
      [33.23, 35.48],
      [33.16, 35.64],
    ]),
  },
  {
    id: "golan-reference",
    kind: "territory",
    d: ringPath([
      [33.3, 35.61],
      [33.23, 35.86],
      [32.89, 35.92],
      [32.73, 35.75],
      [32.82, 35.62],
      [33.08, 35.63],
    ]),
  },
  {
    id: "west-bank-reference",
    kind: "territory",
    d: ringPath([
      [32.52, 35.18],
      [32.38, 35.42],
      [32.05, 35.52],
      [31.76, 35.5],
      [31.35, 35.38],
      [31.33, 35.12],
      [31.55, 34.98],
      [31.86, 34.96],
      [32.18, 35.03],
      [32.42, 35.08],
    ]),
  },
];

const scaleStart = project(31.31, 35.24);
const scaleEnd = project(31.31, 35.77);

export const SCALE_BAR = {
  x1: scaleStart.x,
  x2: scaleEnd.x,
  y: scaleStart.y,
  labelX: Math.round(((scaleStart.x + scaleEnd.x) / 2) * 10) / 10,
  labelY: scaleStart.y - 8,
  label: "50 km / 31 mi",
};

/** Jordan River — outlet of Galilee (~32.71 N) south to Dead Sea. */
const JORDAN_LINE: [number, number][] = [
  [32.72, 35.58], // south of Kinneret outlet
  [32.55, 35.57],
  [32.35, 35.56],
  [32.1, 35.56],
  [31.95, 35.555],
  [31.85, 35.55],
  [31.78, 35.52], // into Dead Sea north
];

export function jordanRiverPath(): string {
  const projected = JORDAN_LINE.map(([lat, lng]) => project(lat, lng));
  const [first, ...rest] = projected;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) d += ` L ${p.x} ${p.y}`;
  return d;
}
