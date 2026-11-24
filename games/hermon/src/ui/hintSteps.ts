// Progressive controls hints: pure track selection, copy and step completion.
import { HINT_STEPS, type HintSeries } from '@/game/store';

export type HintTrack = HintSeries | 'tap' | 'classic' | 'drag' | 'none';
/** scheme: the touch scheme ('twin' or 'classic'); only used on a coarse pointer. */
export type HintEnv = { shooter: boolean; coarse: boolean; tapControls: boolean; scheme: string };

export function hintTrack(env: HintEnv): HintTrack {
  if (env.tapControls) return env.shooter ? 'tap' : env.coarse && env.scheme === 'classic' ? 'drag' : 'none';
  if (env.coarse) return env.scheme === 'classic' ? env.shooter ? 'classic' : 'drag' : 'touch';
  return 'none';
}

export const HINT_TEXT = {
  touch: ['Left thumb: move', 'Right thumb: look', 'Tap Lift off to fly'] as [string, string, string],
  touchStrike: 'Fire: next step',
  touchLand: 'Hold Descend to land',
  mouse: ['Click the scene to start', 'Move the mouse to look', 'Click: strike', 'WASD to fly · Space lifts'],
  tap: 'Tap pad: Fire and Aim toggle',
  classic: 'Drag to look · hold Fly',
  drag: 'Drag to look · hold Fly',
};

export type HintTextOptions = { captured: boolean; shooter?: boolean };

export function hintText(track: HintTrack, step: number, o: HintTextOptions): string | null {
  if (track === 'none') return null;
  if (track === 'tap' || track === 'classic' || track === 'drag') return HINT_TEXT[track];
  if (step >= HINT_STEPS[track]) return null;
  if (track === 'touch') {
    if (step < 3) return HINT_TEXT.touch[step];
    return o.shooter === false ? HINT_TEXT.touchLand : HINT_TEXT.touchStrike;
  }
  const copy = HINT_TEXT[track];
  if (step === 0) return o.captured ? copy[1] : copy[0];
  return o.captured || step >= 3 ? copy[step] : copy[0];
}

export type HintObs = {
  flying: boolean; captured: boolean; look: number; hits: number; shots: number; moved: boolean;
  moves: number; climbs: number; touchLook: number; landed: boolean;
};
export const MIN_VISIBLE = 1, LOOK_TRAVEL = .2, SHOTS_FALLBACK = 5, STEP_TIMEOUT = 20, LINE_MS = 6000;
export type HintVerdict = false | 'done' | 'timeout';

export function actionDone(series: HintSeries, step: number, now: HintObs, since: HintObs, shooter = true): boolean {
  const hit = now.hits > since.hits, shot = hit || now.shots - since.shots >= SHOTS_FALLBACK;
  if (series === 'touch') {
    if (step === 0) return now.moves > since.moves;
    if (step === 1) return now.touchLook - since.touchLook >= LOOK_TRAVEL || hit;
    if (step === 2) return now.climbs > since.climbs || (now.flying && !since.flying);
    return shooter ? shot : now.landed;
  }
  if (step === 0) return now.captured;
  if (step === 1) return now.look - since.look >= LOOK_TRAVEL || hit;
  if (step === 2) return shot;
  return now.moved;
}

export function hintDone(series: HintSeries, step: number, now: HintObs, since: HintObs, visibleFor: number, shooter = true): HintVerdict {
  if (series !== 'touch' && step === 0) return now.captured ? 'done' : false;
  if (visibleFor < MIN_VISIBLE) return false;
  if (actionDone(series, step, now, since, shooter)) return 'done';
  return step >= 2 && visibleFor >= STEP_TIMEOUT ? 'timeout' : false;
}

export function nextStep(series: HintSeries, from: number, now: HintObs, since: HintObs, shooter = true): number {
  let k = from;
  while (k < HINT_STEPS[series] && k > 0 && actionDone(series, k, now, since, shooter)) k++;
  return k;
}

export const progressToSave = (reached: number, firstTimeout: number) => firstTimeout >= 0 ? Math.min(reached, firstTimeout) : reached;
