import { integrateVelocity } from '../_shared/storyMotion';

export type Point = { x: number; y: number };
export type StormPhase = 'launch' | 'squall' | 'wake' | 'rebuke' | 'calm';
export type SailState = 'furled' | 'set' | 'reefed';
export type StormActionKind =
  | 'none'
  | 'sail'
  | 'oars'
  | 'reef'
  | 'bail'
  | 'wake'
  | 'still'
  | 'read';

export type StormTaskId = 'sail' | 'oars' | 'reef' | 'bail-1' | 'bail-2';

export type StormTask = Point & {
  id: StormTaskId;
  stage: 'launch' | 'squall';
  label: string;
  actionLabel: string;
  at: number | null;
};

export type StormCard = {
  heading: string;
  quote: string;
  ref: string;
  href: string;
};

export type StormVerse = StormCard & { status: string };

export type PendingRogueWave = {
  at: number;
  targetWater: number;
};

export type StormState = {
  time: number;
  seq: number;
  player: Point;
  vx: number;
  vy: number;
  facing: 1 | -1;
  stride: number;
  walking: boolean;
  sailState: SailState;
  sailSetAt: number | null;
  waterLevel: number;
  stormIntensity: number;
  calmFromIntensity: number;
  tasks: StormTask[];
  stern: Point & { id: 'stern'; label: string };
  jesusPos: Point;
  squallAt: number | null;
  lastBailAt: number;
  pendingWave: PendingRogueWave | null;
  lastWaveHitAt: number;
  waveHitSeq: number;
  wokeAt: number | null;
  calmedAt: number | null;
  actionAt: number;
  actionKind: StormActionKind;
  selected: string | null;
  destination: Point | null;
  verseStep: 0 | 1 | 2;
  message: string;
};

export const STORM_WIDTH = 1280;
export const STORM_HEIGHT = 460;
// Walkable wooden deck bounds in boat-local world coordinates.
export const DECK_BOUNDS = { minX: 432, maxX: 838, minY: 286, maxY: 326 } as const;

export const CALM_SPEED = 220;
export const WIND_EAST_SPEED = 146; // Walking forward into the driving squall wind
export const WIND_WEST_SPEED = 232; // Walking aft toward the stern with the wind at your back
export const WIND_CROSS_SPEED = 200;

export const ROGUE_WAVE_DELAY = 0.75;
export const BAIL_DROP = 0.22;
export const REACH = 56;
const DEPTH = 0.58;
const MAX_STEP = 0.05;
const EPSILON = 1e-6;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const stormDistance = (dx: number, dy: number) => Math.hypot(dx, dy / DEPTH);

export const WAKE_CARD: StormCard = {
  heading: 'In the stern',
  quote: '“Teacher, don’t you care that we are dying?”',
  ref: 'Mark 4:38',
  href: '/scriptures/protestant/MRK/4?t=web#v38',
};

export const CALM_VERSES: readonly StormVerse[] = [
  {
    heading: 'A great calm',
    quote: '“Peace! Be still!” The wind ceased and there was a great calm.',
    ref: 'Mark 4:39',
    href: '/scriptures/protestant/MRK/4?t=web#v39',
    status: '“Peace! Be still!” The wind ceased and there was a great calm.',
  },
  {
    heading: 'A great calm',
    quote: '“Why are you so afraid? How is it that you have no faith?”',
    ref: 'Mark 4:40',
    href: '/scriptures/protestant/MRK/4?t=web#v40',
    status: '“Why are you so afraid? How is it that you have no faith?”',
  },
  {
    heading: 'A great calm',
    quote: '“Who then is this, that even the wind and the sea obey him?”',
    ref: 'Mark 4:41',
    href: '/scriptures/protestant/MRK/4?t=web#v41',
    status: '“Who then is this, that even the wind and the sea obey him?”',
  },
];

const INITIAL_TASKS: readonly Omit<StormTask, 'at'>[] = [
  { id: 'sail', stage: 'launch', label: 'Set the sail', actionLabel: 'Set sail', x: 590, y: 298 },
  { id: 'oars', stage: 'launch', label: 'Pull the oars', actionLabel: 'Pull oars', x: 695, y: 312 },
  { id: 'reef', stage: 'squall', label: 'Drop the sail', actionLabel: 'Drop sail', x: 590, y: 298 },
  { id: 'bail-1', stage: 'squall', label: 'Bail bow water', actionLabel: 'Bail bow', x: 785, y: 306 },
  { id: 'bail-2', stage: 'squall', label: 'Bail midship water', actionLabel: 'Bail water', x: 645, y: 316 },
];

function waveTargetForDone(done: number): number {
  if (done <= 1) return 0.62;
  if (done === 2) return 0.78;
  return 0.90;
}

export function newStorm(): StormState {
  return {
    time: 0,
    seq: 0,
    player: { x: 618, y: 308 },
    vx: 0,
    vy: 0,
    facing: 1,
    stride: 0,
    walking: false,
    sailState: 'furled',
    sailSetAt: null,
    waterLevel: 0.06,
    stormIntensity: 0,
    calmFromIntensity: 0,
    tasks: INITIAL_TASKS.map(t => ({ ...t, at: null })),
    stern: { id: 'stern', label: 'Wake Jesus', x: 454, y: 304 },
    jesusPos: { x: 406, y: 304 },
    squallAt: null,
    lastBailAt: -10,
    pendingWave: null,
    lastWaveHitAt: -10,
    waveHitSeq: 0,
    wokeAt: null,
    calmedAt: null,
    actionAt: -10,
    actionKind: 'none',
    selected: null,
    destination: null,
    verseStep: 0,
    message: '',
  };
}

export function launchDoneCount(s: StormState): number {
  let n = 0;
  for (const t of s.tasks) if (t.stage === 'launch' && t.at !== null) n++;
  return n;
}

export function squallDoneCount(s: StormState): number {
  let n = 0;
  for (const t of s.tasks) if (t.stage === 'squall' && t.at !== null) n++;
  return n;
}

export function stormPhase(s: StormState): StormPhase {
  if (s.calmedAt !== null) return 'calm';
  if (s.wokeAt !== null) return 'rebuke';
  if (squallDoneCount(s) >= 3) return 'wake';
  if (launchDoneCount(s) >= 2) return 'squall';
  return 'launch';
}

export function moveSpeed(s: StormState, dx: number): number {
  if (s.stormIntensity <= 0) return CALM_SPEED;
  if (dx > EPSILON) return WIND_EAST_SPEED;
  if (dx < -EPSILON) return WIND_WEST_SPEED;
  return WIND_CROSS_SPEED;
}

export function activeTasks(s: StormState): StormTask[] {
  const phase = stormPhase(s);
  if (phase === 'launch') return s.tasks.filter(t => t.stage === 'launch' && t.at === null);
  if (phase === 'squall') return s.tasks.filter(t => t.stage === 'squall' && t.at === null);
  return [];
}

export function nearbyTask(s: StormState): StormTask | undefined {
  let best: StormTask | undefined;
  let dist = REACH + EPSILON;
  for (const t of activeTasks(s)) {
    const d = stormDistance(t.x - s.player.x, t.y - s.player.y);
    if (d <= dist) {
      dist = d;
      best = t;
    }
  }
  return best;
}

export function nearStern(s: StormState): boolean {
  if (stormPhase(s) !== 'wake') return false;
  return stormDistance(s.stern.x - s.player.x, s.stern.y - s.player.y) <= REACH + EPSILON;
}

export function activeCard(s: StormState): StormCard | null {
  const phase = stormPhase(s);
  if (phase === 'rebuke') return WAKE_CARD;
  if (phase === 'calm') {
    const v = CALM_VERSES[s.verseStep] ?? CALM_VERSES[0];
    return { heading: v.heading, quote: v.quote, ref: v.ref, href: v.href };
  }
  return null;
}

function face(s: StormState, dx: number) {
  if (Math.abs(dx) > EPSILON) s.facing = dx < 0 ? -1 : 1;
}

function cancelApproach(s: StormState) {
  s.selected = null;
  s.destination = null;
}

function completeTask(s: StormState, at: number, task: StormTask) {
  cancelApproach(s);
  s.vx = 0;
  s.vy = 0;
  face(s, task.x - s.player.x);
  task.at = at;
  s.actionAt = at;

  if (task.id === 'sail') {
    s.sailState = 'set';
    s.sailSetAt = at;
    s.actionKind = 'sail';
    if (launchDoneCount(s) >= 2) {
      s.squallAt = at;
      s.stormIntensity = 0.65;
      s.waterLevel = 0.42;
      s.message = 'The sail fills and the shore recedes — then a sudden wind storm sweeps down onto the lake.';
    } else {
      s.message = 'The linen sail climbs the mast and catches the evening breeze. Pull the oars to leave the shore.';
    }
    s.seq++;
    return;
  }

  if (task.id === 'oars') {
    s.actionKind = 'oars';
    if (launchDoneCount(s) >= 2) {
      s.squallAt = at;
      s.stormIntensity = 0.65;
      s.waterLevel = 0.42;
      s.message = 'The boat clears the shore — and a fierce wind storm drops out of the hills onto the lake.';
    } else {
      s.message = 'Deep oar strokes pull the boat out into the dusk. Set the sail to catch the breeze.';
    }
    s.seq++;
    return;
  }

  // Squall tasks: bailing visibly relieves the hull before an incoming rogue wave surges it higher.
  const done = squallDoneCount(s);
  const targetWater = waveTargetForDone(done);
  s.stormIntensity = Math.min(1, 0.65 + done * 0.12);

  if (task.id === 'reef') {
    s.sailState = 'reefed';
    s.actionKind = 'reef';
    if (s.pendingWave) {
      s.pendingWave = {
        at: s.pendingWave.at,
        targetWater: Math.max(s.pendingWave.targetWater, targetWater),
      };
    } else {
      s.waterLevel = Math.max(s.waterLevel, targetWater);
    }
    s.message = done >= 3
      ? 'The sail is down, yet waves still fill the boat. Jesus is asleep on the cushion in the stern.'
      : 'You drop the straining sail before the wind splits it, yet waves keep breaking over the bow.';
  } else {
    s.actionKind = 'bail';
    s.lastBailAt = at;
    // If another rogue wave was already inbound, settle its surge first before dipping the new bail.
    if (s.pendingWave) {
      s.waterLevel = Math.max(s.waterLevel, s.pendingWave.targetWater);
    }
    s.waterLevel = Math.max(0.14, s.waterLevel - BAIL_DROP);
    s.pendingWave = { at: at + ROGUE_WAVE_DELAY, targetWater };
    s.message = done >= 3
      ? 'Water arcs over the gunwale, yet swells rise faster than you can bail. Wake Jesus in the stern.'
      : 'You heave bilge water overboard — then another steep swell gathers off the bow.';
  }
  s.seq++;
}

function wakeJesus(s: StormState, at: number) {
  cancelApproach(s);
  s.vx = 0;
  s.vy = 0;
  // Settle any inbound rogue swell silently so the boat is visibly filled without shaking over the Mark 4:38 card.
  if (s.pendingWave) {
    s.waterLevel = Math.max(s.waterLevel, s.pendingWave.targetWater);
    s.pendingWave = null;
  }
  s.wokeAt = at;
  s.facing = -1;
  s.actionAt = at;
  s.actionKind = 'wake';
  s.message = '“Teacher, don’t you care that we are dying?” Jesus rises in the stern facing the wind.';
  s.seq++;
}

function speakStillness(s: StormState, at: number) {
  cancelApproach(s);
  s.vx = 0;
  s.vy = 0;
  s.calmFromIntensity = Math.max(s.stormIntensity, 0.85);
  s.pendingWave = null;
  s.calmedAt = at;
  s.stormIntensity = 0;
  s.waterLevel = 0;
  s.actionAt = at;
  s.actionKind = 'still';
  s.verseStep = 0;
  s.message = CALM_VERSES[0].status;
  s.seq++;
}

/** Attempts an immediate in-reach interaction without triggering fallback auto-walk (used by 140 ms ActionBuffer). */
export function tryImmediateAct(s: StormState): boolean {
  const phase = stormPhase(s);
  if (phase === 'launch' || phase === 'squall') {
    const near = nearbyTask(s);
    if (!near) return false;
    completeTask(s, s.time, near);
    return true;
  }
  if (phase === 'wake') {
    if (!nearStern(s)) return false;
    wakeJesus(s, s.time);
    return true;
  }
  if (phase === 'rebuke') {
    speakStillness(s, s.time);
    return true;
  }
  act(s);
  return true;
}

export function act(s: StormState) {
  const phase = stormPhase(s);
  if (phase === 'launch' || phase === 'squall') {
    const near = nearbyTask(s);
    if (near) {
      completeTask(s, s.time, near);
      return;
    }
    const next = activeTasks(s).sort(
      (a, b) => stormDistance(a.x - s.player.x, a.y - s.player.y) - stormDistance(b.x - s.player.x, b.y - s.player.y),
    )[0];
    if (next) approach(s, next.id);
    return;
  }
  if (phase === 'wake') {
    if (nearStern(s)) {
      wakeJesus(s, s.time);
      return;
    }
    approach(s, 'stern');
    return;
  }
  if (phase === 'rebuke') {
    speakStillness(s, s.time);
    return;
  }
  // Calm phase: cycle verbatim Mark 4:39–41 verses.
  s.verseStep = ((s.verseStep + 1) % CALM_VERSES.length) as 0 | 1 | 2;
  s.actionAt = s.time;
  s.actionKind = 'read';
  s.message = CALM_VERSES[s.verseStep].status;
  s.seq++;
}

export function approach(s: StormState, id: string) {
  const phase = stormPhase(s);
  if (id === 'still') {
    if (phase === 'rebuke') speakStillness(s, s.time);
    return;
  }
  if (id === 'stern') {
    if (phase !== 'wake') return;
    if (nearStern(s)) {
      wakeJesus(s, s.time);
      return;
    }
    s.vx = 0;
    s.vy = 0;
    s.selected = 'stern';
    s.destination = { x: s.stern.x, y: s.stern.y };
    return;
  }
  const task = activeTasks(s).find(t => t.id === id);
  if (!task) return;
  if (stormDistance(task.x - s.player.x, task.y - s.player.y) <= REACH + EPSILON) {
    completeTask(s, s.time, task);
    return;
  }
  s.vx = 0;
  s.vy = 0;
  s.selected = task.id;
  s.destination = { x: task.x, y: task.y };
}

export function walkTo(s: StormState, p: Point) {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
  s.vx = 0;
  s.vy = 0;
  s.selected = null;
  s.destination = {
    x: clamp(p.x, DECK_BOUNDS.minX, DECK_BOUNDS.maxX),
    y: clamp(p.y, DECK_BOUNDS.minY, DECK_BOUNDS.maxY),
  };
}

function moveDelta(s: StormState, dx: number, dy: number): number {
  const px = s.player.x;
  const py = s.player.y;
  const wantX = px + dx;
  const wantY = py + dy;
  s.player.x = clamp(wantX, DECK_BOUNDS.minX, DECK_BOUNDS.maxX);
  s.player.y = clamp(wantY, DECK_BOUNDS.minY, DECK_BOUNDS.maxY);
  if (s.player.x !== wantX) s.vx = 0;
  if (s.player.y !== wantY) s.vy = 0;
  const mx = s.player.x - px;
  const my = s.player.y - py;
  const travel = stormDistance(mx, my);
  face(s, Math.abs(mx) > EPSILON ? mx : dx);
  if (travel > EPSILON) {
    s.walking = true;
    s.stride += travel * 0.062;
  }
  return travel;
}

function resolvePendingWave(s: StormState) {
  if (!s.pendingWave || s.calmedAt !== null) return;
  if (s.time + EPSILON < s.pendingWave.at) return;
  s.waterLevel = Math.max(s.waterLevel, s.pendingWave.targetWater);
  s.lastWaveHitAt = s.pendingWave.at;
  s.waveHitSeq++;
  s.seq++;
  s.pendingWave = null;
  if (stormPhase(s) === 'wake') {
    s.message = 'A steep swell crashes over the bow — the boat is filling! Wake Jesus in the stern.';
  } else {
    s.message = 'A breaking wave slams across the prow and pours back into the hull.';
  }
}

export function stepStorm(s: StormState, dt: number, dx: number, dy: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const start = s.time;
  const step = Math.min(dt, MAX_STEP);
  s.time += step;
  s.walking = false;

  resolvePendingWave(s);

  const ix = Number.isFinite(dx) ? clamp(dx, -1, 1) : 0;
  const iy = Number.isFinite(dy) ? clamp(dy, -1, 1) : 0;
  const input = Math.hypot(ix, iy);
  const accel = s.stormIntensity > 0 ? 18 : 26;

  if (input > 0) {
    cancelApproach(s);
    const speed = moveSpeed(s, ix);
    const norm = Math.max(1, input);
    const targetVx = (ix / norm) * speed;
    const targetVy = (iy / norm) * speed * DEPTH;
    const sx = integrateVelocity(s.vx, targetVx, accel, step);
    const sy = integrateVelocity(s.vy, targetVy, accel, step);
    s.vx = sx.v;
    s.vy = sy.v;
    moveDelta(s, sx.dx, sy.dx);
    return;
  }

  if (!s.destination) {
    // Gentle coast-down to rest when releasing manual keys.
    if (Math.abs(s.vx) > 0.5 || Math.abs(s.vy) > 0.5) {
      const decel = 22;
      const sx = integrateVelocity(s.vx, 0, decel, step);
      const sy = integrateVelocity(s.vy, 0, decel, step);
      s.vx = sx.v;
      s.vy = sy.v;
      moveDelta(s, sx.dx, sy.dx);
    } else {
      s.vx = 0;
      s.vy = 0;
    }
    return;
  }

  const targetTask = s.selected ? activeTasks(s).find(t => t.id === s.selected) : undefined;
  const targetStern = s.selected === 'stern' && stormPhase(s) === 'wake';
  const hasTarget = Boolean(targetTask || targetStern);
  const reach = hasTarget ? REACH : 0;

  const gx = s.destination.x - s.player.x;
  const gy = s.destination.y - s.player.y;
  const gap = stormDistance(gx, gy);
  const speed = moveSpeed(s, gx);
  const budget = speed * step;
  const remaining = Math.max(0, gap - reach);
  const advance = Math.min(remaining, budget);
  let walked = 0;

  if (advance > EPSILON && gap > EPSILON) {
    walked = moveDelta(s, (gx * advance) / gap, (gy * advance) / gap);
    if (!hasTarget && walked <= EPSILON) {
      cancelApproach(s);
      return;
    }
  }

  if (advance < remaining - EPSILON) return;

  const arrivalTime = start + walked / speed;
  if (targetTask) {
    completeTask(s, arrivalTime, targetTask);
  } else if (targetStern) {
    wakeJesus(s, arrivalTime);
  } else {
    cancelApproach(s);
  }
}
