// Combat arm/carry pose block of Suit's frame (priority -20) and right-forearm publication for FlamingSword.
// Relative imports: node tests may import this module.
import { Vector3, type Object3D } from 'three';
import type { ShooterState } from '../game/combat';
import { guarded, shooterFaulted } from '../game/shooterFault';
import { resetBurst } from '../game/burst';
import { advanceSuitAim, applySuitAim, barrelOf, createSuitAim, type SuitAim } from './aimPose';
import { FOREARM, handLink } from './handLink';
import { advanceShotBody, createShotBody, resetShotBody, ventAimScale, type ShotBody, type ShotBodyEnv } from './shotBody';
import { applyShotBodyPost, applyShotBodyPre } from './shotBodyPose';
import { BONE_COUNT } from './suitSkeleton';

export const CARRY_FLIGHT = .7;
export type BlasterRig = { root: Object3D; joints: Object3D[] };
export type SuitBlaster = {
  aim: SuitAim; body: ShotBody; env: ShotBodyEnv;
  active: boolean; epoch: number;
  barrel: { x: number; y: number; z: number };
};
export type BlasterFrame = {
  rig: BlasterRig; blaster: SuitBlaster; s: ShooterState; on: boolean; third: boolean; paused: boolean; reduced: boolean;
  epoch: number; flight: number; speed: number; ground: number; camera: { x: number; y: number; z: number }; fov: number; height: number;
};
export function createSuitBlaster(): SuitBlaster {
  return { aim: createSuitAim(), body: createShotBody(), active: false, epoch: NaN, barrel: { x: 0, y: -1, z: 0 },
    env: { dt: 0, paused: false, reduced: false, epoch: 0, aimWeight: 0, ads: 0, ground: 1, pxPerM: 0 } };
}
export function createBlasterFrame(rig: BlasterRig, s: ShooterState): BlasterFrame {
  return { rig, blaster: createSuitBlaster(), s, on: false, third: true, paused: true, reduced: false, epoch: 0, flight: 0, speed: 0,
    ground: 1, camera: { x: 0, y: 0, z: 0 }, fov: 65, height: 0 };
}
const muzzle = new Vector3(), axis = new Vector3(), offset = new Vector3(), DEG = Math.PI / 180;
const clamp01 = (v: number) => v <= 0 ? 0 : v >= 1 ? 1 : v;
export function carryGoal(f: BlasterFrame) {
  if (!f.on || !f.third) return 0;
  const cruise = clamp01(f.flight) * clamp01((f.speed - 3) / 10);
  return 1 + (CARRY_FLIGHT - 1) * cruise;
}
function pxPerM(f: BlasterFrame) {
  const m = f.s.muzzle, c = f.camera, d = m.valid ? Math.hypot(m.x - c.x, m.y - c.y, m.z - c.z) : 0;
  return d > .1 && f.height > 0 ? f.height / (2 * Math.tan(f.fov * DEG / 2) * d) : 0;
}
const run = guarded('Suit combat pose', (f: BlasterFrame, dt: number) => {
  const b = f.blaster, s = f.s, joints = f.rig.joints, root = f.rig.root, skinned = joints.length >= BONE_COUNT;
  if (b.epoch !== f.epoch) { b.epoch = f.epoch; resetBurst(); }
  if (f.third) {
    const e = b.env, body = b.body;
    e.dt = dt; e.paused = f.paused; e.reduced = f.reduced; e.epoch = f.epoch; e.aimWeight = b.aim.weight; e.ads = s.aim.blend;
    e.ground = f.ground; e.pxPerM = pxPerM(f);
    advanceShotBody(body, s, e);
    applyShotBodyPre(joints, body);
    advanceSuitAim(b.aim, f.epoch, s.aim.blend, s.aim.fireHold, carryGoal(f), ventAimScale(body), s.aim.origin, s.aim.point, f.paused, f.reduced, dt);
    applySuitAim(joints, root, b.aim, s.aim.origin, s.aim.dir);
    if (skinned) {
      root.updateMatrixWorld(true);
      barrelOf(joints, muzzle, axis); b.barrel.x = axis.x; b.barrel.y = axis.y; b.barrel.z = axis.z;
      s.muzzle.x = muzzle.x; s.muzzle.y = muzzle.y; s.muzzle.z = muzzle.z;
      s.muzzle.valid = false; s.muzzle.weight = b.aim.weight;
    } else { s.muzzle.valid = false; s.muzzle.weight = 0; }
    applyShotBodyPost(joints, body);
    if (body.offset.x !== 0 || body.offset.y !== 0 || body.offset.z !== 0)
      root.position.add(offset.set(body.offset.x, body.offset.y, body.offset.z).applyQuaternion(root.quaternion));
    b.active = true;
  } else {
    advanceSuitAim(b.aim, f.epoch, 0, 0, 0, 1, s.aim.origin, s.aim.point, f.paused, f.reduced, dt);
    if (b.active) { resetShotBody(b.body); b.active = false; }
    s.muzzle.valid = false; s.muzzle.weight = 0;
  }
});
/** Unguarded so same-frame fault recovery always restores the body and aim pose to rest. */
function release(f: BlasterFrame) {
  const b = f.blaster;
  if ((!f.on || shooterFaulted()) && (b.active || b.aim.weight !== 0 || b.aim.carry !== 0)) {
    resetShotBody(b.body); b.active = false; b.aim = createSuitAim();
  }
}
/** Two sequential ifs ensure that if run() throws and sets shooterFaulted(), release() cleans up on the same frame. */
export function stepSuitBlaster(f: BlasterFrame, dt: number) {
  const skinned = f.rig.joints.length >= BONE_COUNT;
  if (f.on && !shooterFaulted()) run(f, dt);
  if (!f.on || shooterFaulted()) release(f);
  handLink.forearm = skinned && f.on && !shooterFaulted() ? f.rig.joints[FOREARM] : null;
  f.rig.root.updateMatrixWorld(true);
}
export function releaseSuitBlaster(f: BlasterFrame) {
  f.on = false; release(f); handLink.forearm = null;
}
