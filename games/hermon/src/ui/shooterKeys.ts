import { pressFire, releaseAim, releaseFire, type LookSource, type ShooterState } from '../game/combat';
import { SHIELD } from '../game/commands';
// Pure Strike/Shield routing for keyboard and mouse. Presses are gated; releases are not, so a hold can always end.
export type ShooterEnv = { enabled: boolean; started: boolean; paused: boolean; aimToggle: boolean; locked: boolean };
export type ShooterKey = { code: string; repeat: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean; targetTag: string };
const live = (env: ShooterEnv) => env.enabled && env.started && !env.paused;

/** A locked primary click strikes when Watchers mode is active and pointer-locked. */
export const lockedClickFire = (env: ShooterEnv) => live(env) && env.locked;

/** Gate for capture-phase pointerdown: swallows locked primary combat clicks before they reach the flight surface. */
export const swallowsPress = (e: { button: number; ctrlKey: boolean; metaKey: boolean; altKey: boolean }, env: ShooterEnv) =>
  e.button === 0 && !e.ctrlKey && !e.metaKey && !e.altKey && lockedClickFire(env);

const HAND_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyC']);

export function keyDown(e: ShooterKey, env: ShooterEnv, s: ShooterState) {
  if (!live(env) || e.metaKey || e.ctrlKey || e.altKey || e.repeat || /^(INPUT|SELECT|TEXTAREA)$/.test(e.targetTag)) return false;
  if (HAND_KEYS.has(e.code)) s.input.lookSource = lookSourceFor('keyboard');
  if (e.code === 'KeyC') { pressFire(s, 'keys'); return true; }
  return false;
}

export function keyUp(code: string, env: ShooterEnv, s: ShooterState) {
  if (code === 'KeyC') releaseFire(s, 'keys');
  else if (code === 'KeyQ' && !env.aimToggle) releaseAim(s);
}

export function mouseDown(button: number, env: ShooterEnv, s: ShooterState) {
  if (!lockedClickFire(env)) return false;
  if (button === 0) { pressFire(s, 'click'); return true; }
  if (button === 2) { s.input.shield |= SHIELD.mouse; return true; }
  return false;
}

export function mouseUp(button: number, env: ShooterEnv, s: ShooterState) {
  if (button === 0) releaseFire(s, 'click');
  else if (button === 2) {
    s.input.shield &= ~SHIELD.mouse;
    if (!env.aimToggle) releaseAim(s);
  }
}

/** Touch is always 'touch'; a pen counts as touch only on a touch-capable device; desktop pointers are 'mouse'. */
export function lookSourceFor(pointerType: string, capable = true): LookSource {
  return pointerType === 'touch' || (pointerType === 'pen' && capable) ? 'touch' : 'mouse';
}

/** Pointers inside the tap accessibility pad set lookSource themselves. */
export const OWN_LOOK_SELECTOR = '[aria-label="Tap flight controls"]';
