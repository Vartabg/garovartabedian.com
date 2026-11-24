// Forearm / sword hand link and aim-pose alignment frame for the angel rig (archangel.glb).
// Type-only three import so landing chunks never pull in three.js.
import type { Object3D } from 'three';

export type V3 = { x: number; y: number; z: number };
export const FOREARM = 7;

/** Unit forearm aim axis used by aimPose.ts. */
export const BARREL_AXIS: Readonly<V3> = { x: .12090, y: -.96213, z: -.24431 };
/** Reference tip offset along BARREL_AXIS used by aimPose.ts. */
export const MUZZLE: Readonly<V3> = { x: .0359, y: -.4868, z: -.1119 };

/** Rigid transform mapping the legacy suit forearm frame onto archangel.glb's forearm_r bone. */
const FIT = { q: { x: -.12930, y: -.01446, z: -.03941, w: .99072 }, t: { x: .0218, y: .0027, z: -.0166 } } as const;

/** Direction rotated into archangel.glb's forearm_r frame. */
export function fitDir(d: V3, out: V3 = { x: 0, y: 0, z: 0 }): V3 {
  const { x: qx, y: qy, z: qz, w: qw } = FIT.q, n = Math.hypot(qx, qy, qz, qw), x = qx / n, y = qy / n, z = qz / n, w = qw / n;
  const tx = 2 * (y * d.z - z * d.y), ty = 2 * (z * d.x - x * d.z), tz = 2 * (x * d.y - y * d.x);
  out.x = d.x + w * tx + y * tz - z * ty; out.y = d.y + w * ty + z * tx - x * tz; out.z = d.z + w * tz + x * ty - y * tx;
  return out;
}

/** Point mapped into archangel.glb's forearm_r frame. */
export function fitPoint(p: V3, out: V3 = { x: 0, y: 0, z: 0 }): V3 {
  fitDir(p, out); out.x += FIT.t.x; out.y += FIT.t.y; out.z += FIT.t.z; return out;
}

/** Live right-forearm bone published by Suit while Watchers mode is active; FlamingSword parents to its hand_r child. */
export const handLink: { forearm: Object3D | null } = { forearm: null };
