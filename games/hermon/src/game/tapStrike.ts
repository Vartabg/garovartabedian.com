// Mobile one-finger tap-to-strike target pick: which Watcher a tap at (px, py, t) hits, if any.
// Uses generous finger radius (R_eff = max(silhouette + R_EFF_PAD, R_EFF_MIN)) and also checks where each Watcher was
// GHOST_MS ago so a tap trailing a moving target still lands. Pure, allocation-free; reads WatcherTrack history (screenRay.ts).
import type { DroneTarget } from './combat';
import { runtime } from './runtime';
import { banish } from './banishState';
import { droneTrack, trackAt, TRACK_DRONES, type DroneTrack, type TrackSample } from './screenRay';

export const GHOST_MS = 80;
export const R_EFF_MIN = 28;
export const R_EFF_PAD = 18;

/** Effective tap radius (px) for a projected silhouette radius (px). */
export const rEff = (silhouettePx: number) => Math.max(silhouettePx + R_EFF_PAD, R_EFF_MIN);

const now: TrackSample = { x: 0, y: 0, r: 0 }, past: TrackSample = { x: 0, y: 0, r: 0 };
const scoreOf = (s: TrackSample, px: number, py: number) => Math.hypot(px - s.x, py - s.y) / rEff(s.r);

/**
 * The Watcher the tap picks, or -1. Candidates are targets with alive && los right now; each is scored at time t and at
 * t - GHOST_MS, and the smallest d / R_eff <= 1 wins.
 */
export function pick(px: number, py: number, t: number, targets: readonly DroneTarget[], count: number, tr: DroneTrack = droneTrack, excluded?: Uint8Array): number {
  let best = -1, bestScore = Infinity;
  const n = Math.min(count, targets.length, TRACK_DRONES);
  for (let i = 0; i < n; i++) {
    const g = targets[i];
    if (!g.alive || !g.los || (excluded && excluded[i] >= 2)) continue;
    const a = trackAt(tr, i, t, now) ? scoreOf(now, px, py) : Infinity;
    const b = trackAt(tr, i, t - GHOST_MS, past) ? scoreOf(past, px, py) : Infinity;
    const s = Math.min(a, b);
    if (s <= 1 && s < bestScore) { best = i; bestScore = s; }
  }
  return best;
}

/** The Watcher under a screen point at time t (performance.now ms), or -1. Reads WatcherTrack history (empty: -1). */
export const pickAt = (x: number, y: number, t: number) => pick(x, y, t, runtime.shooter.targets, runtime.shooter.drones.count, undefined, banish.mode);
