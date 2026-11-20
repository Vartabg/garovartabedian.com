import { scatterCoins, stirCoins, type Coin } from "./courtCoins";

export type Point = { x: number; y: number };
export type Fixture = Point & {
  id: string;
  label: string;
  kind: 'table' | 'seat' | 'gate';
  at: number | null;
  side: number;
  coins?: Coin[];
};

export type Court = {
  time: number;
  player: Point;
  facing: number;
  stride: number;
  walking: boolean;
  shoveAt: number;
  fixtures: Fixture[];
  destination: Point | null;
  selected: string | null;
  seq: number;
  message: string;
};

export const COURT_WIDTH = 1320;
export const COURT_HEIGHT = 460;
export const WALK_BOUNDS = { minX: 45, maxX: 1275, minY: 212, maxY: 417 } as const;

const SPEED = 245;
const DEPTH = .58;
const REACH = 62;
const MAX_STEP = .05;
const EPSILON = 1e-6;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const distance = (x: number, y: number) => Math.hypot(x, y / DEPTH);

const fixtures: readonly Omit<Fixture, 'at'>[] = [
  { id: 'table-1', label: 'Money table 1', kind: 'table', x: 255, y: 305, side: 1 },
  { id: 'seat-1', label: 'Dove seller’s seat 1', kind: 'seat', x: 432, y: 371, side: -1 },
  { id: 'table-2', label: 'Money table 2', kind: 'table', x: 605, y: 265, side: 1 },
  { id: 'table-3', label: 'Money table 3', kind: 'table', x: 802, y: 339, side: -1 },
  { id: 'seat-2', label: 'Dove seller’s seat 2', kind: 'seat', x: 982, y: 287, side: 1 },
  { id: 'gate', label: 'East passage', kind: 'gate', x: 1185, y: 270, side: 1 },
];

const impactCopy = {
  table: 'The money table tips and coins scatter across the court.',
  seat: 'The dove seller’s seat falls and the birds take wing.',
  gate: 'You bar the east passage. The carrier turns back.',
} as const;

export function newCourt(): Court {
  return {
    time: 0, player: { x: 205, y: 310 }, facing: 1, stride: 0, walking: false, shoveAt: -Infinity,
    fixtures: fixtures.map(fixture => ({ ...fixture, at: null })), destination: null, selected: null, seq: 0,
    message: '',
  };
}

export function courtComplete(s: Court) {
  return s.fixtures.every(fixture => fixture.at !== null);
}

export function nearby(s: Court): Fixture | undefined {
  let target: Fixture | undefined;
  let closest = REACH + EPSILON;
  for (const fixture of s.fixtures) {
    if (fixture.at !== null) continue;
    const gap = distance(fixture.x - s.player.x, fixture.y - s.player.y);
    if (gap <= closest) { closest = gap; target = fixture; }
  }
  return target;
}

function cancelApproach(s: Court) {
  s.destination = null;
  s.selected = null;
}

function face(s: Court, dx: number) {
  if (Math.abs(dx) > EPSILON) s.facing = Math.sign(dx);
}

function shove(s: Court, at: number, fixture?: Fixture) {
  cancelApproach(s);
  s.shoveAt = at;
  s.seq++;
  if (!fixture) {
    s.message = courtComplete(s) ? 'The court is clear. You can keep walking.' : 'Step closer before you shove.';
    return;
  }

  face(s, fixture.x - s.player.x);
  fixture.side = s.facing;
  fixture.at = at;
  if (fixture.kind === "table") fixture.coins = scatterCoins(fixture, fixture.side, at);
  const ending = courtComplete(s) ? ' The merchants have left. Jesus begins to teach.' : '';
  s.message = impactCopy[fixture.kind] + ending;
}

export function act(s: Court) {
  shove(s, s.time, nearby(s));
}

export function approach(s: Court, id: string) {
  const fixture = s.fixtures.find(fixture => fixture.id === id && fixture.at === null);
  if (!fixture) return;
  if (distance(fixture.x - s.player.x, fixture.y - s.player.y) <= REACH + EPSILON) {
    shove(s, s.time, fixture);
    return;
  }
  s.destination = { x: fixture.x, y: fixture.y };
  s.selected = id;
}

export function walkTo(s: Court, p: Point) {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
  s.destination = { x: clamp(p.x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX), y: clamp(p.y, WALK_BOUNDS.minY, WALK_BOUNDS.maxY) };
  s.selected = null;
}

function move(s: Court, x: number, y: number) {
  const px = s.player.x, py = s.player.y;
  s.player.x = clamp(px + x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX);
  s.player.y = clamp(py + y, WALK_BOUNDS.minY, WALK_BOUNDS.maxY);
  const dx = s.player.x - px, dy = s.player.y - py;
  const travel = distance(dx, dy);
  face(s, x);
  s.walking = travel > EPSILON;
  s.stride += travel * .055;
}

export function stepCourt(s: Court, dt: number, dx: number, dy: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const start = s.time;
  const step = Math.min(dt, MAX_STEP);
  s.time += step;
  for (const fixture of s.fixtures) {
    if (fixture.coins) stirCoins(fixture.coins, step, s.time, s.player, s.walking, s.facing);
  }
  s.walking = false;
  dx = Number.isFinite(dx) ? clamp(dx, -1, 1) : 0;
  dy = Number.isFinite(dy) ? clamp(dy, -1, 1) : 0;
  const input = Math.hypot(dx, dy);
  if (input > 0) {
    cancelApproach(s);
    const advance = SPEED * step / Math.max(1, input);
    move(s, dx * advance, dy * advance * DEPTH);
    return;
  }
  if (!s.destination) return;
  const target = s.selected ? s.fixtures.find(fixture => fixture.id === s.selected && fixture.at === null) : undefined;
  const x = s.destination.x - s.player.x, y = s.destination.y - s.player.y;
  const gap = distance(x, y);
  const remaining = Math.max(0, gap - (target ? REACH : 0));
  const advance = Math.min(remaining, SPEED * step);
  if (advance > EPSILON) move(s, x * advance / gap, y * advance / gap);
  if (advance < remaining) return;
  if (target) shove(s, start + advance / SPEED, target);
  else cancelApproach(s);
}
