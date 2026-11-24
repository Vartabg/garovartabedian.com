import type { Vector3 } from 'three';
import { START, setVec, type Intent } from './motion';
import { useGame } from './store';
import { aimGain, createShooter, engaged, resetShooterInput, releaseFire } from './combat';
import { SHIELD } from './commands';
import type { LimitCue } from './limitCue';
// The landing page imports this module, so vectors stay plain objects and three.js is imported for types only; a value import would load the 3D bundle with the page.
export const runtime = {
  position: { ...START }, velocity: { x: 0, y: 0, z: 0 },
  yaw: 0, pitch: -0.12, surge: false, lift: false, land: false, keyDescendUsed: false, reset: false,
  poseEpoch: 0, cameraDistance: 0,
  turn: { lateral: 0, guard: 0 },
  clearance: { active: false, cue: '' as LimitCue, point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
  thumb: { active: false, throttle: 0, strafe: 0, edgeTurn: 0, edgePitch: 0, bank: 0 }, keys: new Set<string>(),
  tap: { forward: 0, strafe: 0, vertical: 0 },
  landTarget: null as Vector3 | null, landGoal: null as Vector3 | null,
  /** Movement is being asked for this physics step (Player writes it): the view stays on the heading while it is. */
  flown: false,
  speed: 0, altitude: START.y, frames: [] as number[], elapsed: 0, location: 'Threshold of Hermon',
  frameIndex: 0, skipSample: true, resources: { drawCalls: 0, triangles: 0, geometries: 0, textures: 0 },
  peakResources: { drawCalls: 0, triangles: 0, geometries: 0, textures: 0 },
  shooter: createShooter(),
  /** Seconds each arrow axis has been held in one direction (physics clock), and that direction. */
  keyHold: { yaw: 0, pitch: 0, yawSign: 0, pitchSign: 0 },
  /** Twin-stick touch input, written by the touch controls. rise/descend are 0 or 1; moves, climbs and lookTravel only count up.
   *  edgeTurn: the look thumb's edge rest, a signed yaw direction x depth (+ turns left), applied by edgeTurn.ts. */
  stick: { forward: 0, strafe: 0, rise: 0, descend: 0, descendUsed: false, active: false, boost: false, cruise: false,
    moves: 0, climbs: 0, lookTravel: 0, edgeTurn: 0 },
  /** Bumped by clearInput and releaseHeldInput: a touch control whose stored epoch differs is dead until its finger lifts. */
  touchEpoch: 0,
};
/** Held Descend sinks at this fraction of full flight speed (0.7 x 13 = 9.1 m/s). */
export const DESCEND_RATE = .7;
/** Rise and Descend: both held hover; a Descend already spent on a landing approach no longer sinks. */
function stickVertical() {
  const st = runtime.stick;
  return st.rise && st.descend ? 0 : st.rise - (st.descendUsed ? 0 : st.descend * DESCEND_RATE);
}
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

export function desktopDescendHeld(): boolean {
  const k = runtime.keys;
  return k.has('KeyF') || k.has('ControlLeft') || k.has('ControlRight');
}

export function readIntent(): Intent {
  const k = runtime.keys, st = runtime.stick;
  const forward = Number(k.has('KeyW')) - Number(k.has('KeyS')) + runtime.thumb.throttle + runtime.tap.forward + st.forward;
  const strafe = Number(k.has('KeyD')) - Number(k.has('KeyA')) + runtime.thumb.strafe + runtime.tap.strafe + st.strafe;
  const keyRise = Number(k.has('KeyR') || k.has('Space'));
  const keyDown = runtime.keyDescendUsed ? 0 : Number(desktopDescendHeld());
  const vertical = keyRise - keyDown + runtime.tap.vertical + stickVertical();
  return { forward: clamp1(forward), strafe: clamp1(strafe), vertical: clamp1(vertical) };
}

/** Arrow-key fine aim: while Watchers combat is engaged a fresh press turns at 30% for 150 ms. */
export const KEY_FINE = .3, KEY_RAMP = .15;
export const keyTurnRate = (held: number, blend: number, fine: boolean) =>
  aimGain(blend) * (fine && held < KEY_RAMP - 1e-9 ? KEY_FINE : 1);
const clearKeyHold = () => { const h = runtime.keyHold; h.yaw = h.pitch = h.yawSign = h.pitchSign = 0; };

export function arrowLook(dt: number) {
  const k = runtime.keys, h = runtime.keyHold, s = runtime.shooter, fine = engaged(s), a = s.aim.blend;
  const sy = Number(k.has('ArrowLeft')) - Number(k.has('ArrowRight')), sp = Number(k.has('ArrowUp')) - Number(k.has('ArrowDown'));
  if (sy !== h.yawSign) { h.yawSign = sy; h.yaw = 0; }
  if (sp !== h.pitchSign) { h.pitchSign = sp; h.pitch = 0; }
  runtime.yaw += sy * dt * 1.5 * keyTurnRate(h.yaw, a, fine);
  runtime.pitch = Math.max(-1.3, Math.min(1.25, runtime.pitch + sp * dt * 1.2 * keyTurnRate(h.pitch, a, fine)));
  if (sy) h.yaw += dt;
  if (sp) h.pitch += dt;
}

export function clearInput(stop = false, keepShooter = false) {
  if (!keepShooter) resetShooterInput(runtime.shooter);
  runtime.keys.clear(); clearKeyHold(); releaseThumb(); zeroStick();
  runtime.tap = { forward: 0, strafe: 0, vertical: 0 };
  runtime.surge = false; runtime.lift = false; runtime.land = false; runtime.keyDescendUsed = false; runtime.landGoal = null; runtime.touchEpoch++;
  useGame.setState({ landing: false });
  if (stop) setVec(runtime.velocity, 0, 0, 0);
}

/** Zeroes the live stick values; the counters (moves, climbs, lookTravel) are kept. */
function zeroStick() {
  const st = runtime.stick;
  st.forward = st.strafe = st.rise = st.descend = st.edgeTurn = 0; st.descendUsed = st.active = st.boost = st.cruise = false;
}

/** Touch-mode blur, rotation or lost gesture: releases held controls without pausing. */
export function releaseHeldInput() {
  runtime.keys.clear(); clearKeyHold(); releaseThumb(); zeroStick();
  runtime.tap = { forward: 0, strafe: 0, vertical: 0 };
  runtime.surge = false; runtime.lift = false; runtime.land = false; runtime.keyDescendUsed = false;
  const s = runtime.shooter;
  if (s.input.fireSource === 'touch' && !s.input.auto) releaseFire(s, 'touch');
  s.input.shield &= ~(SHIELD.keys | SHIELD.mouse);
  s.input.touchId = null;
  runtime.touchEpoch++;
}

/** Touch-mode window blur: drops keyboard keys only while keeping active touch gestures. */
export function releaseKeys() {
  runtime.keys.clear(); clearKeyHold(); runtime.surge = false; runtime.keyDescendUsed = false;
  const s = runtime.shooter;
  if (s.input.fireSource === 'keys') releaseFire(s, 'keys');
  s.input.shield &= ~SHIELD.keys;
}

/** Look input. The only combat effect is the ADS zoom gain (1 at blend 0): no aim-assist friction anywhere. */
export function look(dx: number, dy: number, sensitivity = 1, invertY = false) {
  const g = aimGain(runtime.shooter.aim.blend);
  runtime.yaw -= dx * g * 0.003 * sensitivity;
  const pitchDelta = (invertY ? dy : -dy) * g * 0.003 * sensitivity;
  runtime.pitch = Math.max(-1.3, Math.min(1.25, runtime.pitch + pitchDelta));
}

export function releaseThumb() {
  runtime.thumb = { active: false, throttle: 0, strafe: 0, edgeTurn: 0, edgePitch: 0, bank: 0 };
}

let unlockUntil = -Infinity;
/**
 * Our own pointer-lock exit (cancel, resize, scheme switch). A lock granted and then released at once can dispatch
 * multiple pointerlockchange events, so the exit is expected for a short window; only an unexpected Esc pauses.
 */
export function exitOwnPointerLock() {
  unlockUntil = performance.now() + 400;
  if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock();
}
export const unlockExpected = () => performance.now() < unlockUntil;
