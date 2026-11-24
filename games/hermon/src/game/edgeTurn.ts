// Edge turns in the physics step: Twin-stick look thumb edge rest (runtime.stick.edgeTurn; + turns left) slews linearly
// (0 to full in EDGE.easeS) at 3.5 rad/s (2.5 under reduced motion), scaled by ADS gain when Watchers combat is active.
// Classic one-thumb edge hold stays direct rate control via thumbTurn below.
import { runtime } from './runtime';
import { aimGain } from './combat';
export const EDGE = { yaw: 3.5, yawRM: 2.5, easeS: .15 } as const;
/** Classic one thumb: yaw 1.5 rad/s at the edge (about 4.2 s per 360), pitch 1 rad/s, no slew, no ADS scaling. */
export const THUMB = { yaw: 1.5, pitch: 1.0 } as const;
type EdgePrefs = { reduced: boolean; shooter: boolean };
let stickLevel = 0;
const slew = (level: number, target: number, dt: number) => {
  const step = dt / EDGE.easeS;
  return level + Math.max(-step, Math.min(step, target - level));
};
export function applyEdgeTurns(dt: number, g: EdgePrefs, rt = runtime): void {
  stickLevel = slew(stickLevel, rt.stick.edgeTurn || 0, dt);
  if (stickLevel === 0) return;
  const rate = (g.reduced ? EDGE.yawRM : EDGE.yaw) * (g.shooter ? aimGain(rt.shooter.aim.blend) : 1);
  rt.yaw += stickLevel * rate * dt;
}
/** Classic one-thumb edge hold: direct rate control, no slew, gain 1. */
export function thumbTurn(dt: number, rt = runtime): void {
  if (!rt.thumb.active) return;
  rt.yaw -= rt.thumb.edgeTurn * dt * THUMB.yaw;
  rt.pitch = Math.max(-1.3, Math.min(1.25, rt.pitch + rt.thumb.edgePitch * dt * THUMB.pitch));
}
/** Tests and a new flight: drop the slewed level. */
export function resetEdgeTurns(): void { stickLevel = 0; }
