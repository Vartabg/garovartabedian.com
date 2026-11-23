import { scatterCoins, scatterFeathers, stirCoins, stirFeathers, type Coin, type Feather } from "./courtCoins";

export type Point = { x: number; y: number };
export type ActionKind = 'shove' | 'halt' | 'teach' | 'heal' | 'answer' | 'depart' | 'air';
export type CardKind = 'teach' | 'heal' | 'answer' | 'depart';
export type EncounterKind = 'lame' | 'blind' | 'scribes' | 'depart';
export type Box = { minX: number; maxX: number; minY: number; maxY: number };

export type CourtCard = {
  heading: string;
  quote: string;
  ref: string;
  href: string;
};

export type Fixture = Point & {
  id: string;
  label: string;
  kind: 'table' | 'seat' | 'gate';
  at: number | null;
  side: number;
  coins?: Coin[];
  feathers?: Feather[];
};

export type Encounter = Point & {
  id: string;
  label: string;
  kind: EncounterKind;
  at: number | null;
};

export type Court = {
  time: number;
  player: Point;
  facing: number;
  stride: number;
  walking: boolean;
  shoveAt: number;
  actionKind: ActionKind;
  cardKind: CardKind;
  teachingStep: 0 | 1 | 2;
  coinKickAt: number;
  departedAt: number | null;
  fixtures: Fixture[];
  encounters: Encounter[];
  route: Point[];
  destination: Point | null;
  selected: string | null;
  seq: number;
  message: string;
};

export const COURT_WIDTH = 1320;
export const COURT_HEIGHT = 460;
export const WALK_BOUNDS = { minX: 45, maxX: 1275, minY: 212, maxY: 417 } as const;

export const TEACHING_LINES = [
  {
    quote: '“My house will be called a house of prayer for all the nations.”',
    ref: 'Mark 11:17',
    href: '/scriptures/protestant/MRK/11?t=web#v17',
    status: '“My house will be called a house of prayer for all the nations.”',
  },
  {
    quote: '“But you have made it a den of robbers!”',
    ref: 'Mark 11:17',
    href: '/scriptures/protestant/MRK/11?t=web#v17',
    status: '“But you have made it a den of robbers!”',
  },
  {
    quote: 'All the multitude was astonished at his teaching.',
    ref: 'Mark 11:18',
    href: '/scriptures/protestant/MRK/11?t=web#v18',
    status: 'The crowd listens in wonder; chief priests and scribes watch from the colonnade.',
  },
] as const;

const ENCOUNTER_CARDS: Record<'heal' | 'answer' | 'depart', CourtCard> = {
  heal: {
    heading: 'A house of prayer',
    quote: '“The lame and the blind came to him in the temple, and he healed them.”',
    ref: 'Matthew 21:14',
    href: '/scriptures/protestant/MAT/21?t=web#v14',
  },
  answer: {
    heading: 'A house of prayer',
    quote: '“Yes. Did you never read, ‘Out of the mouth of children and nursing babies, you have perfected praise’?”',
    ref: 'Matthew 21:16',
    href: '/scriptures/protestant/MAT/21?t=web#v16',
  },
  depart: {
    heading: 'Evening',
    quote: '“When evening came, he went out of the city.”',
    ref: 'Mark 11:19',
    href: '/scriptures/protestant/MRK/11?t=web#v19',
  },
};

const SPEED = 245;
const DEPTH = .58;
const REACH = 62;
const MAX_STEP = .05;
const EPSILON = 1e-6;
const FACE_EPS = 1e-7;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const courtDistance = (x: number, y: number) => Math.hypot(x, y / DEPTH);

const fixtures: readonly Omit<Fixture, 'at'>[] = [
  { id: 'table-1', label: 'Money table 1', kind: 'table', x: 255, y: 305, side: 1 },
  { id: 'seat-1', label: 'Dove seller’s seat 1', kind: 'seat', x: 432, y: 371, side: -1 },
  { id: 'table-2', label: 'Money table 2', kind: 'table', x: 605, y: 265, side: 1 },
  { id: 'table-3', label: 'Money table 3', kind: 'table', x: 802, y: 339, side: -1 },
  { id: 'seat-2', label: 'Dove seller’s seat 2', kind: 'seat', x: 982, y: 287, side: 1 },
  { id: 'gate', label: 'East passage', kind: 'gate', x: 1185, y: 270, side: 1 },
];

// Each Act II encounter sits at elliptic distance >= 143 (> 2 * REACH) from every Act I fixture.
const encounters: readonly Omit<Encounter, 'at'>[] = [
  { id: 'heal-lame', label: 'Lame visitor', kind: 'lame', x: 162, y: 368 },
  { id: 'heal-blind', label: 'Blind visitor', kind: 'blind', x: 462, y: 232 },
  { id: 'scribes', label: 'Chief priests and scribes', kind: 'scribes', x: 884, y: 214 },
  { id: 'depart', label: 'East archway (evening)', kind: 'depart', x: 1185, y: 224 },
];

const impactCopy = {
  table: 'The money table tips and coins scatter across the court.',
  seat: 'The dove seller’s seat falls and the birds take wing.',
  gate: 'You bar the east passage. The carrier turns back.',
} as const;

const encounterCopy: Record<EncounterKind, string> = {
  lame: 'The lame visitor sets aside the staff and stands upright.',
  blind: 'The blind visitor lifts their face to the light of the court.',
  scribes: '“Yes. Did you never read, ‘Out of the mouth of children and nursing babies, you have perfected praise’?”',
  depart: 'When evening came, he went out of the city toward Bethany.',
};

export function obstacleBox(f: Fixture): Box | null {
  if (f.at !== null || f.kind === 'gate') return null;
  if (f.kind === 'table') return { minX: f.x - 32, maxX: f.x + 34, minY: f.y - 16, maxY: f.y + 4 };
  return { minX: f.x - 20, maxX: f.x + 22, minY: f.y - 12, maxY: f.y + 4 };
}

function standingBoxes(s: Court, ignoreId?: string): Box[] {
  const list: Box[] = [];
  for (const f of s.fixtures) {
    if (f.id === ignoreId) continue;
    const box = obstacleBox(f);
    if (box) list.push(box);
  }
  return list;
}

function segmentBoxHit(px: number, py: number, dx: number, dy: number, b: Box): { tEnter: number; tExit: number; axis: 'x' | 'y' } | null {
  let tx0 = -Infinity, tx1 = Infinity;
  if (Math.abs(dx) <= 1e-12) {
    if (px <= b.minX + FACE_EPS || px >= b.maxX - FACE_EPS) return null;
  } else {
    const a = (b.minX - px) / dx, c = (b.maxX - px) / dx;
    tx0 = Math.min(a, c); tx1 = Math.max(a, c);
  }
  let ty0 = -Infinity, ty1 = Infinity;
  if (Math.abs(dy) <= 1e-12) {
    if (py <= b.minY + FACE_EPS || py >= b.maxY - FACE_EPS) return null;
  } else {
    const a = (b.minY - py) / dy, c = (b.maxY - py) / dy;
    ty0 = Math.min(a, c); ty1 = Math.max(a, c);
  }
  const tEnter = Math.max(tx0, ty0), tExit = Math.min(tx1, ty1);
  if (tExit <= tEnter + 1e-9 || tExit <= 1e-9 || tEnter >= 1) return null;
  return { tEnter: Math.max(0, tEnter), tExit, axis: tx0 >= ty0 ? 'x' : 'y' };
}

function projectOutside(p: Point, boxes: Box[]): Point {
  let x = clamp(p.x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX);
  let y = clamp(p.y, WALK_BOUNDS.minY, WALK_BOUNDS.maxY);
  for (const b of boxes) {
    if (x > b.minX && x < b.maxX && y > b.minY && y < b.maxY) {
      const candidates: Point[] = [
        { x: b.minX - 1, y },
        { x: b.maxX + 1, y },
        { x, y: b.minY - 1 },
        { x, y: b.maxY + 1 },
      ].map(c => ({ x: clamp(c.x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX), y: clamp(c.y, WALK_BOUNDS.minY, WALK_BOUNDS.maxY) }));
      candidates.sort((a, c) => courtDistance(a.x - x, a.y - y) - courtDistance(c.x - x, c.y - y));
      x = candidates[0].x; y = candidates[0].y;
    }
  }
  return { x, y };
}

function slideMove(px: number, py: number, vx: number, vy: number, boxes: Box[]): Point {
  let x = px, y = py, rem = 1;
  for (let iter = 0; iter < 8 && rem > 1e-9; iter++) {
    let blockedX: Box | undefined, blockedY: Box | undefined;
    for (const b of boxes) {
      if (y > b.minY + FACE_EPS && y < b.maxY - FACE_EPS) {
        if (vx > 0 && Math.abs(x - b.minX) <= FACE_EPS) blockedX = b;
        else if (vx < 0 && Math.abs(x - b.maxX) <= FACE_EPS) blockedX = b;
      }
      if (x > b.minX + FACE_EPS && x < b.maxX - FACE_EPS) {
        if (vy > 0 && Math.abs(y - b.minY) <= FACE_EPS) blockedY = b;
        else if (vy < 0 && Math.abs(y - b.maxY) <= FACE_EPS) blockedY = b;
      }
    }
    if (blockedX && blockedY) break;
    if (blockedX) {
      if (Math.abs(vy) <= 1e-12) break;
      const dy = vy * rem;
      const targetY = vy < 0 ? blockedX.minY : blockedX.maxY;
      let tStep = clamp((targetY - y) / dy, 0, 1);
      for (const b of boxes) {
        if (b === blockedX) continue;
        const hit = segmentBoxHit(x, y, 0, dy, b);
        if (hit && hit.tEnter < tStep) tStep = hit.tEnter;
      }
      y += dy * tStep;
      if (Math.abs(y - targetY) <= FACE_EPS) y = targetY;
      rem *= 1 - tStep;
      continue;
    }
    if (blockedY) {
      if (Math.abs(vx) <= 1e-12) break;
      const dx = vx * rem;
      const targetX = vx < 0 ? blockedY.minX : blockedY.maxX;
      let tStep = clamp((targetX - x) / dx, 0, 1);
      for (const b of boxes) {
        if (b === blockedY) continue;
        const hit = segmentBoxHit(x, y, dx, 0, b);
        if (hit && hit.tEnter < tStep) tStep = hit.tEnter;
      }
      x += dx * tStep;
      if (Math.abs(x - targetX) <= FACE_EPS) x = targetX;
      rem *= 1 - tStep;
      continue;
    }
    const dx = vx * rem, dy = vy * rem;
    let bestT = 1;
    let bestBox: Box | undefined;
    let bestAxis: 'x' | 'y' = 'x';
    for (const b of boxes) {
      const hit = segmentBoxHit(x, y, dx, dy, b);
      if (hit && hit.tEnter < bestT) {
        bestT = hit.tEnter; bestBox = b; bestAxis = hit.axis;
      }
    }
    x += dx * bestT;
    y += dy * bestT;
    if (!bestBox) { rem = 0; break; }
    if (bestAxis === 'x') x = dx > 0 ? bestBox.minX : bestBox.maxX;
    else y = dy > 0 ? bestBox.minY : bestBox.maxY;
    rem *= 1 - bestT;
  }
  return { x: clamp(x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX), y: clamp(y, WALK_BOUNDS.minY, WALK_BOUNDS.maxY) };
}

function planRoute(start: Point, end: Point, boxes: Box[]): Point[] {
  const padded = boxes.map(b => ({ minX: b.minX - 1, maxX: b.maxX + 1, minY: b.minY - 1, maxY: b.maxY + 1 }));
  const hits: { b: Box; t: number }[] = [];
  const dx = end.x - start.x, dy = end.y - start.y;
  for (let i = 0; i < boxes.length; i++) {
    const hit = segmentBoxHit(start.x, start.y, dx, dy, padded[i]);
    if (hit) hits.push({ b: boxes[i], t: hit.tEnter });
  }
  if (!hits.length) return [];
  hits.sort((a, c) => a.t - c.t);
  const route: Point[] = [];
  let cur = start;
  for (const { b } of hits) {
    if (!segmentBoxHit(cur.x, cur.y, end.x - cur.x, end.y - cur.y, { minX: b.minX - 1, maxX: b.maxX + 1, minY: b.minY - 1, maxY: b.maxY + 1 })) {
      continue;
    }
    const topY = clamp(b.minY - 3, WALK_BOUNDS.minY, WALK_BOUNDS.maxY);
    const botY = clamp(b.maxY + 3, WALK_BOUNDS.minY, WALK_BOUNDS.maxY);
    const topCost = Math.abs(cur.y - topY) + Math.abs(end.y - topY);
    const botCost = Math.abs(cur.y - botY) + Math.abs(end.y - botY);
    const laneY = topCost <= botCost ? topY : botY;
    const goingRight = end.x >= cur.x;
    const enterX = clamp(goingRight ? b.minX - 3 : b.maxX + 3, WALK_BOUNDS.minX, WALK_BOUNDS.maxX);
    const exitX = clamp(goingRight ? b.maxX + 3 : b.minX - 3, WALK_BOUNDS.minX, WALK_BOUNDS.maxX);
    const needEnter = goingRight ? cur.x < enterX - 1 : cur.x > enterX + 1;
    const needExit = goingRight ? end.x > exitX + 1 : end.x < exitX - 1;
    if (needEnter) {
      const p1 = { x: enterX, y: laneY };
      route.push(p1); cur = p1;
    }
    if (needExit) {
      const p2 = { x: exitX, y: laneY };
      route.push(p2); cur = p2;
    } else if (!needEnter) {
      const pMid = { x: clamp(cur.x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX), y: laneY };
      route.push(pMid); cur = pMid;
    }
  }
  return route;
}

export function newCourt(): Court {
  return {
    time: 0, player: { x: 205, y: 310 }, facing: 1, stride: 0, walking: false, shoveAt: -Infinity,
    actionKind: 'shove', cardKind: 'teach', teachingStep: 0, coinKickAt: -Infinity, departedAt: null,
    fixtures: fixtures.map(fixture => ({ ...fixture, at: null })),
    encounters: encounters.map(enc => ({ ...enc, at: null })),
    route: [], destination: null, selected: null, seq: 0,
    message: '',
  };
}

export function courtComplete(s: Court) {
  return s.fixtures.every(fixture => fixture.at !== null);
}

export function courtCompletedAt(s: Court): number | null {
  let latest = -Infinity;
  for (const f of s.fixtures) {
    if (f.at === null) return null;
    if (f.at > latest) latest = f.at;
  }
  return latest;
}

export function actTwoCount(s: Court): number {
  return s.encounters.filter(e => e.kind !== 'depart' && e.at !== null).length;
}

export function eveningAt(s: Court): number | null {
  let latest = -Infinity;
  for (const e of s.encounters) {
    if (e.kind === 'depart') continue;
    if (e.at === null) return null;
    if (e.at > latest) latest = e.at;
  }
  return latest;
}

export function eveningReady(s: Court): boolean {
  return eveningAt(s) !== null && s.departedAt === null;
}

export function activeEncounters(s: Court): Encounter[] {
  if (!courtComplete(s) || s.departedAt !== null) return [];
  const dusk = eveningAt(s) !== null;
  return s.encounters.filter(e => {
    if (e.at !== null) return false;
    return e.kind === 'depart' ? dusk : true;
  });
}

export function visibleEncounters(s: Court): Encounter[] {
  if (!courtComplete(s)) return [];
  const dusk = eveningAt(s) !== null;
  return s.encounters.filter(e => e.kind !== 'depart' || dusk);
}

export function nearby(s: Court): Fixture | undefined {
  let target: Fixture | undefined;
  let closest = REACH + EPSILON;
  for (const fixture of s.fixtures) {
    if (fixture.at !== null) continue;
    const gap = courtDistance(fixture.x - s.player.x, fixture.y - s.player.y);
    if (gap <= closest) { closest = gap; target = fixture; }
  }
  return target;
}

export function nearbyEncounter(s: Court): Encounter | undefined {
  let target: Encounter | undefined;
  let closest = REACH + EPSILON;
  for (const enc of activeEncounters(s)) {
    const gap = courtDistance(enc.x - s.player.x, enc.y - s.player.y);
    if (gap <= closest) { closest = gap; target = enc; }
  }
  return target;
}

export function activeCard(s: Court): CourtCard {
  if (s.cardKind === 'teach') {
    const line = TEACHING_LINES[s.teachingStep] ?? TEACHING_LINES[0];
    return { heading: 'A house of prayer', quote: line.quote, ref: line.ref, href: line.href };
  }
  return ENCOUNTER_CARDS[s.cardKind];
}

function cancelApproach(s: Court) {
  s.route = [];
  s.destination = null;
  s.selected = null;
}

function face(s: Court, dx: number) {
  if (Math.abs(dx) > EPSILON) s.facing = Math.sign(dx);
}

function resolveEncounter(s: Court, at: number, enc: Encounter) {
  cancelApproach(s);
  s.shoveAt = at;
  s.seq++;
  enc.at = at;
  if (enc.kind === 'depart') {
    s.facing = 1;
    s.walking = false;
    s.departedAt = at;
    s.actionKind = 'depart';
    s.cardKind = 'depart';
    s.message = encounterCopy.depart;
    return;
  }
  face(s, enc.x - s.player.x);
  if (enc.kind === 'scribes') {
    s.actionKind = 'answer';
    s.cardKind = 'answer';
  } else {
    s.actionKind = 'heal';
    s.cardKind = 'heal';
  }
  const duskEnding = eveningReady(s)
    ? ' Evening settles over the court. Walk out through the east archway, or keep teaching.'
    : '';
  s.message = encounterCopy[enc.kind] + duskEnding;
}

function shove(s: Court, at: number, fixture?: Fixture) {
  if (s.departedAt !== null) return;
  cancelApproach(s);
  s.shoveAt = at;
  s.seq++;
  if (!fixture) {
    if (courtComplete(s)) {
      s.actionKind = 'teach';
      s.cardKind = 'teach';
      s.teachingStep = ((s.teachingStep + 1) % TEACHING_LINES.length) as 0 | 1 | 2;
      s.message = TEACHING_LINES[s.teachingStep].status;
      return;
    }
    s.actionKind = 'air';
    s.message = 'Step closer before you shove.';
    return;
  }

  face(s, fixture.x - s.player.x);
  fixture.side = s.facing;
  fixture.at = at;
  s.actionKind = fixture.kind === 'gate' ? 'halt' : 'shove';
  if (fixture.kind === "table") fixture.coins = scatterCoins(fixture, fixture.side, at);
  if (fixture.kind === "seat") fixture.feathers = scatterFeathers(fixture, fixture.side, at);
  const ending = courtComplete(s)
    ? ' The merchants have left. Jesus begins to teach.'
    : '';
  s.message = impactCopy[fixture.kind] + ending;
}

export function act(s: Court) {
  if (s.departedAt !== null) return;
  if (courtComplete(s)) {
    const enc = nearbyEncounter(s);
    if (enc) {
      resolveEncounter(s, s.time, enc);
      return;
    }
    shove(s, s.time);
    return;
  }
  shove(s, s.time, nearby(s));
}

export function approach(s: Court, id: string) {
  if (s.departedAt !== null) return;
  const fixture = s.fixtures.find(item => item.id === id && item.at === null);
  if (fixture) {
    if (courtDistance(fixture.x - s.player.x, fixture.y - s.player.y) <= REACH + EPSILON) {
      shove(s, s.time, fixture);
      return;
    }
    const dest = { x: fixture.x, y: fixture.y };
    s.route = planRoute(s.player, dest, standingBoxes(s, id));
    s.destination = dest;
    s.selected = id;
    return;
  }
  const enc = activeEncounters(s).find(item => item.id === id);
  if (!enc) return;
  if (courtDistance(enc.x - s.player.x, enc.y - s.player.y) <= REACH + EPSILON) {
    resolveEncounter(s, s.time, enc);
    return;
  }
  s.route = [];
  s.destination = { x: enc.x, y: enc.y };
  s.selected = id;
}

export function walkTo(s: Court, p: Point) {
  if (s.departedAt !== null) return;
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
  const boxes = standingBoxes(s);
  const dest = projectOutside(p, boxes);
  s.route = planRoute(s.player, dest, boxes);
  s.destination = dest;
  s.selected = null;
}

function move(s: Court, x: number, y: number, ignoreId?: string) {
  const px = s.player.x, py = s.player.y;
  const next = slideMove(px, py, x, y, standingBoxes(s, ignoreId));
  s.player.x = next.x;
  s.player.y = next.y;
  const dx = s.player.x - px, dy = s.player.y - py;
  const travel = courtDistance(dx, dy);
  face(s, Math.abs(dx) > EPSILON ? dx : x);
  s.walking = travel > EPSILON;
  s.stride += travel * .055;
  return travel;
}

export function stepCourt(s: Court, dt: number, dx: number, dy: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const start = s.time;
  const step = Math.min(dt, MAX_STEP);
  s.time += step;
  for (const fixture of s.fixtures) {
    if (fixture.coins && stirCoins(fixture.coins, step, s.time, s.player, s.walking, s.facing)) {
      s.coinKickAt = s.time;
    }
    if (fixture.feathers) {
      stirFeathers(fixture.feathers, step, s.time, s.player, s.walking, s.facing);
    }
  }
  s.walking = false;
  if (s.departedAt !== null) return;
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
  const targetFixture = s.selected ? s.fixtures.find(item => item.id === s.selected && item.at === null) : undefined;
  const targetEncounter = !targetFixture && s.selected ? activeEncounters(s).find(item => item.id === s.selected) : undefined;
  const target = targetFixture ?? targetEncounter;
  let budget = SPEED * step;
  let walked = 0;
  while (budget > EPSILON && s.route.length > 0) {
    const wp = s.route[0];
    const wx = wp.x - s.player.x, wy = wp.y - s.player.y;
    const wGap = courtDistance(wx, wy);
    if (wGap <= EPSILON) { s.route.shift(); continue; }
    const leg = Math.min(wGap, budget);
    const moved = move(s, wx * leg / wGap, wy * leg / wGap, targetFixture?.id);
    walked += moved;
    budget -= leg;
    if (moved < leg - 1e-4) {
      s.route = [];
      break;
    }
    if (leg >= wGap - EPSILON) s.route.shift();
  }
  if (s.route.length > 0 || budget <= EPSILON) return;
  const x = s.destination.x - s.player.x, y = s.destination.y - s.player.y;
  const gap = courtDistance(x, y);
  const remaining = Math.max(0, gap - (target ? REACH : 0));
  const advance = Math.min(remaining, budget);
  if (advance > EPSILON) {
    const moved = move(s, x * advance / gap, y * advance / gap, targetFixture?.id);
    walked += moved;
    if (!target && moved <= EPSILON) {
      cancelApproach(s);
      return;
    }
  }
  if (advance < remaining) return;
  if (targetFixture) shove(s, start + walked / SPEED, targetFixture);
  else if (targetEncounter) resolveEncounter(s, start + walked / SPEED, targetEncounter);
  else cancelApproach(s);
}
