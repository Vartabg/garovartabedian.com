/**
 * Bakes the Apostles sending-map land silhouettes from Natural Earth 50m
 * public-domain data (naturalearthdata.com) into a compact committed asset:
 *
 *   src/lib/apostles/map-land.json
 *
 * Window: Gibraltar to the Malabar coast (lng -10..84, lat 5..49) — every
 * road the record supports, on one plate. Equirectangular with a mid-latitude
 * x-scale, matching the med-geo idiom; the component projects cities with the
 * constants emitted here so the two can never drift.
 *
 * Source files (public domain, not committed — cached locally):
 *   https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
 *   https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson
 *
 * Run from the repo root:
 *   node scripts/apostles/build-map-land.mjs <dir-with-ne-geojson>
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("usage: node scripts/apostles/build-map-land.mjs <dir with ne_50m_*.geojson>");
  process.exit(1);
}

// West stops at 4°E: nobody's road runs past Rome, and the empty Atlantic was
// costing the frame ~140px that India needs. Rome keeps margin for its label.
const BOUNDS = { west: 4, east: 84, south: 5, north: 49 };
// Rounded to the same 3 decimals the JSON carries, so land here and city pins
// in SendingMap.tsx project with the *identical* scale — no sub-pixel drift.
// The projection formula itself is deliberately duplicated in SendingMap.tsx
// (the component must not import build tooling); change both together.
const XSCALE = Math.round(Math.cos(((BOUNDS.south + BOUNDS.north) / 2) * (Math.PI / 180)) * 1000) / 1000;
const SCALE = 11; // px per degree of latitude
const PAD = 30;
const VIEW = {
  w: Math.round((BOUNDS.east - BOUNDS.west) * XSCALE * SCALE + PAD * 2),
  h: Math.round((BOUNDS.north - BOUNDS.south) * SCALE + PAD * 2),
};

const r1 = (n) => Math.round(n * 10) / 10;
const project = ([lng, lat]) => [
  r1(PAD + (lng - BOUNDS.west) * XSCALE * SCALE),
  r1(PAD + (BOUNDS.north - lat) * SCALE),
];

/** Sutherland–Hodgman clip of a ring against the bbox. */
function clipRing(ring) {
  const edges = [
    { inside: (p) => p[0] >= BOUNDS.west, cross: (a, b) => lerpLng(a, b, BOUNDS.west) },
    { inside: (p) => p[0] <= BOUNDS.east, cross: (a, b) => lerpLng(a, b, BOUNDS.east) },
    { inside: (p) => p[1] >= BOUNDS.south, cross: (a, b) => lerpLat(a, b, BOUNDS.south) },
    { inside: (p) => p[1] <= BOUNDS.north, cross: (a, b) => lerpLat(a, b, BOUNDS.north) },
  ];
  let out = ring;
  for (const edge of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const curIn = edge.inside(cur);
      const prevIn = edge.inside(prev);
      if (curIn) {
        if (!prevIn) out.push(edge.cross(prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(edge.cross(prev, cur));
      }
    }
    if (out.length === 0) return [];
  }
  return out;
}
const lerpLng = (a, b, x) => {
  const t = (x - a[0]) / (b[0] - a[0]);
  return [x, a[1] + t * (b[1] - a[1])];
};
const lerpLat = (a, b, y) => {
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), y];
};

/** Douglas–Peucker in degrees. */
function simplify(ring, tol) {
  if (ring.length <= 4) return ring;
  const keep = new Array(ring.length).fill(false);
  keep[0] = keep[ring.length - 1] = true;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let maxI = -1;
    for (let i = s + 1; i < e; i++) {
      const d = pointSegDist(ring[i], ring[s], ring[e]);
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > tol) {
      keep[maxI] = true;
      stack.push([s, maxI], [maxI, e]);
    }
  }
  return ring.filter((_, i) => keep[i]);
}
function pointSegDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  const px = a[0] + t * dx;
  const py = a[1] + t * dy;
  return Math.hypot(p[0] - px, p[1] - py);
}

const ringAreaDeg = (ring) => {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s / 2);
};

function collectRings(geojson) {
  const rings = [];
  for (const f of geojson.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (const poly of polys) rings.push(poly[0]); // outer rings only at this scale
  }
  return rings;
}

function bake(rings, { tol, minArea }) {
  const paths = [];
  for (const raw of rings) {
    const clipped = clipRing(raw);
    if (clipped.length < 4) continue;
    if (ringAreaDeg(clipped) < minArea) continue;
    const simple = simplify([...clipped, clipped[0]], tol);
    if (simple.length < 4) continue;
    const pts = simple.map(project);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) d += `L${pts[i][0]} ${pts[i][1]}`;
    d += "Z";
    paths.push(d);
  }
  return paths;
}

const land = JSON.parse(readFileSync(path.join(srcDir, "land50.geojson"), "utf8"));
const lakes = JSON.parse(readFileSync(path.join(srcDir, "lakes50.geojson"), "utf8"));

const out = {
  bounds: BOUNDS,
  xscale: r1(XSCALE * 1000) / 1000,
  scale: SCALE,
  pad: PAD,
  view: VIEW,
  land: bake(collectRings(land), { tol: 0.1, minArea: 0.18 }),
  // Caspian, Aral, Urmia, Van, Sevan — the seas-within-land this window needs.
  lakes: bake(collectRings(lakes), { tol: 0.08, minArea: 0.16 }),
};

writeFileSync("src/lib/apostles/map-land.json", JSON.stringify(out));
const kb = (JSON.stringify(out).length / 1024).toFixed(1);
console.log(`map-land.json: ${out.land.length} land rings, ${out.lakes.length} lakes, ${kb} kB, view ${VIEW.w}x${VIEW.h}`);
