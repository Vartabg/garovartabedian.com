export type Point = { x: number; y: number };
export type ArmorPiece = 'sword' | 'coat' | 'helmet';
export type ElahPhase = 'armor' | 'brook' | 'approach' | 'sling' | 'resolved';
export type ElahActionKind =
  | 'none'
  | 'drop-sword'
  | 'drop-coat'
  | 'drop-helmet'
  | 'pick'
  | 'challenge'
  | 'release'
  | 'read'
  | 'bound'
  | 'air';

export type ElahCard = {
  heading: string;
  quote: string;
  ref: string;
  href: string;
};

export type ElahVerse = ElahCard & { status: string };

export type DroppedArmor = Point & {
  piece: ArmorPiece;
  at: number;
  side: number;
};

export type BrookStone = Point & {
  id: string;
  label: string;
  at: number | null;
};

export type ElahState = {
  time: number;
  seq: number;
  player: Point;
  facing: 1 | -1;
  stride: number;
  walking: boolean;
  armorLeft: ArmorPiece[];
  droppedArmor: DroppedArmor[];
  stones: BrookStone[];
  standoff: Point & { id: 'meet'; label: string };
  champion: Point;
  stonesDoneAt: number | null;
  challengeAt: number | null;
  releasedAt: number | null;
  actionAt: number;
  actionKind: ElahActionKind;
  selected: string | null;
  destination: Point | null;
  verseStep: 0 | 1;
  message: string;
};

export const ELAH_WIDTH = 1440;
export const ELAH_HEIGHT = 460;
export const WALK_BOUNDS = { minX: 48, maxX: 1360, minY: 238, maxY: 416 } as const;
export const ARMOR_ORDER: readonly ArmorPiece[] = ['sword', 'coat', 'helmet'];
// Walk speed scales strictly monotonically as Saul's armor is set aside: 3 -> 2 -> 1 -> 0 pieces.
export const ARMOR_SPEEDS = [256, 188, 132, 82] as const;
export const ARMOR_LABELS: Record<ArmorPiece, string> = {
  sword: 'Set aside sword',
  coat: 'Set aside coat of mail',
  helmet: 'Set aside bronze helmet',
};

export const REACH = 58;
export const MEET_REACH = 64;
export const SLING_FLIGHT_SECONDS = 0.42;

const DEPTH = 0.62;
const MAX_STEP = 0.05;
const EPSILON = 1e-6;
const STANDOFF_MARK: Point = { x: 825, y: 312 };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const elahDistance = (dx: number, dy: number) => Math.hypot(dx, dy / DEPTH);

export const CLOSING_VERSES: readonly ElahVerse[] = [
  {
    heading: 'The Valley of Elah',
    quote: '“Yahweh doesn’t save with sword and spear; for the battle is Yahweh’s.”',
    ref: '1 Samuel 17:47',
    href: '/scriptures/protestant/1SA/17?t=web#v47',
    status: '“Yahweh doesn’t save with sword and spear; for the battle is Yahweh’s.”',
  },
  {
    heading: 'The Valley of Elah',
    quote: '“So David prevailed over the Philistine with a sling and with a stone… but there was no sword in David’s hand.”',
    ref: '1 Samuel 17:50',
    href: '/scriptures/protestant/1SA/17?t=web#v50',
    status: '“So David prevailed over the Philistine with a sling and with a stone… but there was no sword in David’s hand.”',
  },
];

const INITIAL_STONES: readonly Omit<BrookStone, 'at'>[] = [
  { id: 'stone-1', label: 'Smooth stone 1', x: 558, y: 260 },
  { id: 'stone-2', label: 'Smooth stone 2', x: 536, y: 304 },
  { id: 'stone-3', label: 'Smooth stone 3', x: 582, y: 326 },
  { id: 'stone-4', label: 'Smooth stone 4', x: 548, y: 368 },
  { id: 'stone-5', label: 'Smooth stone 5', x: 592, y: 392 },
];

const DROP_OFFSETS: Record<ArmorPiece, Point> = {
  sword: { x: -24, y: 6 },
  coat: { x: 18, y: 8 },
  helmet: { x: -4, y: 18 },
};

const DROP_COPY: Record<ArmorPiece, string> = {
  sword: 'David sets aside Saul’s sword. His step already feels lighter.',
  coat: 'The heavy coat of mail falls to the slope. Only the bronze helmet remains.',
  helmet: 'David lifts off the bronze helmet and takes his shepherd’s staff. Choose five smooth stones from the brook.',
};

export function brookCenterX(y: number): number {
  return 564 + Math.sin((y - 230) * 0.022) * 14;
}

export function isInBrook(p: Point): boolean {
  return Math.abs(p.x - brookCenterX(p.y)) <= 46;
}

export function newElah(): ElahState {
  return {
    time: 0,
    seq: 0,
    player: { x: 168, y: 312 },
    facing: 1,
    stride: 0,
    walking: false,
    armorLeft: [...ARMOR_ORDER],
    droppedArmor: [],
    stones: INITIAL_STONES.map(s => ({ ...s, at: null })),
    standoff: { id: 'meet', label: 'Step into the valley', x: 785, y: 312 },
    champion: { x: 1015, y: 308 },
    stonesDoneAt: null,
    challengeAt: null,
    releasedAt: null,
    actionAt: -10,
    actionKind: 'none',
    selected: null,
    destination: null,
    verseStep: 0,
    message: '',
  };
}

export function stonesPicked(s: ElahState): number {
  let count = 0;
  for (const st of s.stones) if (st.at !== null) count++;
  return count;
}

export function elahPhase(s: ElahState): ElahPhase {
  if (s.armorLeft.length > 0) return 'armor';
  if (stonesPicked(s) < 5) return 'brook';
  if (s.challengeAt === null) return 'approach';
  if (s.releasedAt === null) return 'sling';
  return 'resolved';
}

export function currentSpeed(s: ElahState): number {
  return ARMOR_SPEEDS[s.armorLeft.length] ?? ARMOR_SPEEDS[0];
}

export function currentMaxX(s: ElahState): number {
  if (s.armorLeft.length > 0) return 495;
  if (stonesPicked(s) < 5) return 645;
  if (s.releasedAt === null) return 950;
  return WALK_BOUNDS.maxX;
}

export function nextArmorPiece(s: ElahState): ArmorPiece | undefined {
  return s.armorLeft[0];
}

export function nearbyStone(s: ElahState): BrookStone | undefined {
  if (s.armorLeft.length > 0) return undefined;
  let closest: BrookStone | undefined;
  let best = REACH + EPSILON;
  for (const st of s.stones) {
    if (st.at !== null) continue;
    const dist = elahDistance(st.x - s.player.x, st.y - s.player.y);
    if (dist <= best) {
      best = dist;
      closest = st;
    }
  }
  return closest;
}

export function nearStandoff(s: ElahState): boolean {
  if (elahPhase(s) !== 'approach') return false;
  return elahDistance(s.standoff.x - s.player.x, s.standoff.y - s.player.y) <= MEET_REACH + EPSILON;
}

export function activeCard(s: ElahState): ElahCard | null {
  const phase = elahPhase(s);
  if (phase === 'sling') {
    const v = CLOSING_VERSES[0];
    return { heading: v.heading, quote: v.quote, ref: v.ref, href: v.href };
  }
  if (phase === 'resolved') {
    const v = CLOSING_VERSES[s.verseStep] ?? CLOSING_VERSES[0];
    return { heading: v.heading, quote: v.quote, ref: v.ref, href: v.href };
  }
  return null;
}

function face(s: ElahState, dx: number) {
  if (Math.abs(dx) > EPSILON) s.facing = dx < 0 ? -1 : 1;
}

function cancelApproach(s: ElahState) {
  s.selected = null;
  s.destination = null;
}

function dropNextArmor(s: ElahState, at: number) {
  const piece = s.armorLeft.shift();
  if (!piece) return;
  cancelApproach(s);
  const off = DROP_OFFSETS[piece];
  const dropX = clamp(s.player.x + off.x * s.facing, WALK_BOUNDS.minX + 10, 480);
  const dropY = clamp(s.player.y + off.y, WALK_BOUNDS.minY + 6, WALK_BOUNDS.maxY - 6);
  s.droppedArmor.push({ piece, x: dropX, y: dropY, at, side: s.facing });
  s.actionAt = at;
  s.actionKind = piece === 'sword' ? 'drop-sword' : piece === 'coat' ? 'drop-coat' : 'drop-helmet';
  s.message = DROP_COPY[piece];
  s.seq++;
}

function pickStone(s: ElahState, at: number, st: BrookStone) {
  cancelApproach(s);
  face(s, st.x - s.player.x);
  st.at = at;
  s.actionAt = at;
  s.actionKind = 'pick';
  const picked = stonesPicked(s);
  if (picked === 5 && s.stonesDoneAt === null) s.stonesDoneAt = at;
  s.message = picked < 5
    ? `Smooth stone ${picked} of 5 in the shepherd’s pouch.`
    : 'Five smooth stones in his pouch, sling in hand. Step into the valley to meet the Philistine.';
  s.seq++;
}

function enterStandoff(s: ElahState, at: number) {
  s.selected = null;
  s.challengeAt = at;
  s.facing = 1;
  s.actionAt = at;
  s.actionKind = 'challenge';
  s.destination = { ...STANDOFF_MARK };
  s.message = '“Yahweh doesn’t save with sword and spear; for the battle is Yahweh’s.” Your sling is ready — release when you choose.';
  s.seq++;
}

function releaseStone(s: ElahState, at: number) {
  cancelApproach(s);
  s.releasedAt = at;
  s.facing = 1;
  s.actionAt = at;
  s.actionKind = 'release';
  s.verseStep = 0;
  s.message = 'One smooth stone flies across the valley. The Philistine falls, and both hill lines stir.';
  s.seq++;
}

export function act(s: ElahState) {
  const phase = elahPhase(s);
  if (phase === 'armor') {
    dropNextArmor(s, s.time);
    return;
  }
  if (phase === 'brook') {
    const st = nearbyStone(s);
    if (st) {
      pickStone(s, s.time, st);
      return;
    }
    s.actionAt = s.time;
    s.actionKind = 'air';
    s.message = 'Step closer to the brook to pick a smooth stone.';
    s.seq++;
    return;
  }
  if (phase === 'approach') {
    if (nearStandoff(s)) {
      enterStandoff(s, s.time);
      return;
    }
    approach(s, 'meet');
    return;
  }
  if (phase === 'sling') {
    releaseStone(s, s.time);
    return;
  }
  // Resolved phase: cycle closing Scripture verses while valley remains open to roam.
  s.verseStep = ((s.verseStep + 1) % CLOSING_VERSES.length) as 0 | 1;
  s.actionAt = s.time;
  s.actionKind = 'read';
  s.message = CLOSING_VERSES[s.verseStep].status;
  s.seq++;
}

export function approach(s: ElahState, id: string) {
  if (id === 'armor') {
    if (s.armorLeft.length > 0) dropNextArmor(s, s.time);
    return;
  }
  if (id === 'release') {
    if (elahPhase(s) === 'sling') releaseStone(s, s.time);
    return;
  }
  if (id === 'meet') {
    if (elahPhase(s) !== 'approach') return;
    if (nearStandoff(s)) {
      enterStandoff(s, s.time);
      return;
    }
    s.selected = 'meet';
    s.destination = { x: s.standoff.x, y: s.standoff.y };
    return;
  }
  // Brook stone targets are locked until Saul's armor is set aside.
  if (s.armorLeft.length > 0) return;
  const st = s.stones.find(item => item.id === id && item.at === null);
  if (!st) return;
  if (elahDistance(st.x - s.player.x, st.y - s.player.y) <= REACH + EPSILON) {
    pickStone(s, s.time, st);
    return;
  }
  s.selected = st.id;
  s.destination = { x: st.x, y: st.y };
}

export function walkTo(s: ElahState, p: Point) {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
  s.selected = null;
  s.destination = {
    x: clamp(p.x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX),
    y: clamp(p.y, WALK_BOUNDS.minY, WALK_BOUNDS.maxY),
  };
}

function reportSoftBound(s: ElahState) {
  let msg = '';
  if (s.armorLeft.length > 0) {
    msg = 'I can’t go with these, for I have not tested them.';
  } else if (stonesPicked(s) < 5) {
    msg = 'Choose five smooth stones from the brook first.';
  } else {
    return;
  }
  if (s.message !== msg) {
    s.message = msg;
    s.actionKind = 'bound';
    s.actionAt = s.time;
    s.seq++;
  }
}

function moveDelta(s: ElahState, dx: number, dy: number): { travel: number; blockedEast: boolean } {
  const maxX = currentMaxX(s);
  const px = s.player.x;
  const py = s.player.y;
  const wantedX = px + dx;
  const nextX = clamp(wantedX, WALK_BOUNDS.minX, maxX);
  const nextY = clamp(py + dy, WALK_BOUNDS.minY, WALK_BOUNDS.maxY);
  const blockedEast = dx > EPSILON && wantedX > maxX + EPSILON;
  s.player.x = nextX;
  s.player.y = nextY;
  const movedX = nextX - px;
  const movedY = nextY - py;
  const travel = elahDistance(movedX, movedY);
  face(s, Math.abs(movedX) > EPSILON ? movedX : dx);
  if (travel > EPSILON) {
    s.walking = true;
    // Heavier armor gives slower, shorter steps visually.
    const strideScale = s.armorLeft.length > 0 ? 0.048 : 0.056;
    s.stride += travel * strideScale;
  }
  return { travel, blockedEast };
}

export function stepElah(s: ElahState, dt: number, dx: number, dy: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const start = s.time;
  const step = Math.min(dt, MAX_STEP);
  s.time += step;
  s.walking = false;

  const speed = currentSpeed(s);
  const ix = Number.isFinite(dx) ? clamp(dx, -1, 1) : 0;
  const iy = Number.isFinite(dy) ? clamp(dy, -1, 1) : 0;
  const input = Math.hypot(ix, iy);
  if (input > 0) {
    cancelApproach(s);
    const advance = (speed * step) / Math.max(1, input);
    const res = moveDelta(s, ix * advance, iy * advance * DEPTH);
    if (res.blockedEast) reportSoftBound(s);
    return;
  }

  if (!s.destination) return;

  let budget = speed * step;
  let walked = 0;

  const targetStone = s.selected && s.armorLeft.length === 0
    ? s.stones.find(item => item.id === s.selected && item.at === null)
    : undefined;
  const targetMeet = s.selected === 'meet' && elahPhase(s) === 'approach';

  const reach = targetStone ? REACH : targetMeet ? MEET_REACH : 0;
  const gx = s.destination.x - s.player.x;
  const gy = s.destination.y - s.player.y;
  const gap = elahDistance(gx, gy);
  const remaining = Math.max(0, gap - reach);
  const advance = Math.min(remaining, budget);

  if (advance > EPSILON && gap > EPSILON) {
    const res = moveDelta(s, (gx * advance) / gap, (gy * advance) / gap);
    walked += res.travel;
    budget -= advance;
    if (res.blockedEast) {
      reportSoftBound(s);
      if (!targetStone && !targetMeet && Math.abs(s.player.y - s.destination.y) <= EPSILON) {
        cancelApproach(s);
        return;
      }
    }
    if (!targetStone && !targetMeet && res.travel <= EPSILON) {
      cancelApproach(s);
      return;
    }
  }

  if (advance < remaining - EPSILON) return;

  const arrivalTime = start + walked / speed;
  if (targetStone) {
    pickStone(s, arrivalTime, targetStone);
    return;
  }
  if (targetMeet) {
    enterStandoff(s, arrivalTime);
    // Spend any leftover frame budget moving smoothly onto STANDOFF_MARK so 30 Hz and 120 Hz match strictly.
    if (budget > EPSILON && s.destination) {
      const mx = s.destination.x - s.player.x;
      const my = s.destination.y - s.player.y;
      const mGap = elahDistance(mx, my);
      if (mGap > EPSILON) {
        const leg = Math.min(mGap, budget);
        moveDelta(s, (mx * leg) / mGap, (my * leg) / mGap);
        if (leg >= mGap - EPSILON) s.destination = null;
      } else {
        s.destination = null;
      }
    }
    return;
  }
  cancelApproach(s);
}
