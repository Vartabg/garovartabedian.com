import { useEffect, useRef } from 'react';
import { RigidBody, CapsuleCollider, useRapier, useBeforePhysicsStep, type RapierRigidBody, type RapierCollider } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGame, persistGame } from './store';
import { timeScale } from './slowMotion';
import { runtime, readIntent, clearInput, arrowLook, desktopDescendHeld } from './runtime';
import { boundMovement, flightTarget, landingVelocity, moving, setVec, START, FOOT } from './motion';
import { presentation } from './presentation';
import { applyEdgeTurns, thumbTurn } from './edgeTurn';
import { pilotVelocity } from './pilotFlight';
import { FlightSafety } from './FlightSafety';
import { CLEARANCE, locationName, nearestTerminal, removeInward } from './navigation';
import { resetLimitSteer } from './limitSteer';
import { driveLimits } from './limitDrive';
import { limitStep, resetCueHold } from './limitStep';
import { readScrape, scrape } from './scrape';
import { inputKind, limitHint } from './limitCopy';
import { touchMode } from './pointerMode';
import { sweepTurn } from './turnSweep';
import { moveMode } from './combat';
import { aimVelocity } from './aimMotion';
import { desktopLandStep, levelFlight, probeBelow, touchBlockedStep, touchLandStep, LAND_WINDOW } from './touchFlight';
import { cancelStrike, strike, strikeStep } from './strike';
import { lessShove, shoveBase, shoveStep } from './hurtShove';
const direction = new Vector3(), baseScratch = { x: 0, y: 0, z: 0 }, fromScratch = { x: 0, y: 0, z: 0 }, flownScratch = { x: 0, y: 0, z: 0 };
export default function Player() {
  const body = useRef<RapierRigidBody>(null), collider = useRef<RapierCollider>(null);
  const { world, rapier } = useRapier(), { camera } = useThree();
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  const tick = useRef(0), liftTime = useRef(0), savedTime = useRef(0);
  const safety = useRef<FlightSafety | null>(null), warmup = useRef(0), landingStall = useRef(0);
  const paused = useGame(s => s.paused);
  const spawn = useRef(useGame.getState().checkpoint);
  useEffect(() => { if (paused) liftTime.current = 0; }, [paused]);
  useEffect(() => {
    const c = world.createCharacterController(CLEARANCE.margin); c.setSlideEnabled(true);
    c.enableAutostep(.35, .2, true); c.enableSnapToGround(.3);
    controller.current = c;
    setVec(runtime.position, spawn.current.x, spawn.current.y, spawn.current.z);
    runtime.poseEpoch++; cancelStrike();
    useGame.setState({ ready: true });
    return () => { controller.current = null; world.removeCharacterController(c); };
  }, [world]);
  useBeforePhysicsStep(() => {
    const b = body.current, col = collider.current, c = controller.current;
    const state = useGame.getState(); if (!b || !col || !c || state.paused) return;
    // Slow motion scales movement only; look and turning keep real time (slowMotion.ts).
    const look = 1 / 60, dt = look * timeScale();
    if (!safety.current) safety.current = new FlightSafety(world, rapier, col);
    const safe = safety.current;
    // Allow Rapier's first broad-phase update before querying a persisted checkpoint.
    if (warmup.current++ === 0) return;
    const current = b.translation();
    if ((warmup.current === 2 && !safe.canLand({ ...current, y: current.y - FOOT })) || !safe.isClear(current)) {
      const checkpoint = safe.checkpoint(state.checkpoint);
      b.setTranslation(checkpoint, true); b.setNextKinematicTranslation(checkpoint);
      setVec(runtime.position, checkpoint.x, checkpoint.y, checkpoint.z); runtime.poseEpoch++;
      clearInput(true); cancelStrike(); liftTime.current = 0; resetLimitSteer();
      useGame.setState({ flying: false, landing: false, checkpoint, message: 'Returned to a clear landing.' });
      return;
    }
    if (runtime.reset) {
      b.setTranslation(START, true); b.setNextKinematicTranslation(START); setVec(runtime.position, START.x, START.y, START.z);
      clearInput(true); cancelStrike(); runtime.reset = false; runtime.yaw = 0; runtime.pitch = -.12; runtime.poseEpoch++; liftTime.current = 0; resetLimitSteer();
      useGame.setState({ flying: false, landing: false, checkpoint: START }); persistGame(); return;
    }
    // Held Descend (touch or desktop F/Ctrl): start landing before intent is read and before limitStep clearance assist.
    if (touchLandStep({ world, rapier, collider: col, safe, position: current, flying: state.flying })) landingStall.current = 0;
    // Held Descend stopped short by the clearance assist (last step's result): land beside the obstacle, or say there is no landing.
    if (touchBlockedStep({ world, rapier, collider: col, safe, position: current, flying: state.flying, clearance: runtime.clearance.active,
      vy: runtime.velocity.y, dt })) landingStall.current = 0;
    if (desktopLandStep({ world, rapier, collider: col, safe, position: current, flying: state.flying })) landingStall.current = 0;
    const p = b.translation();
    const intent = readIntent();
    const k = runtime.keys;
    applyEdgeTurns(look, state); // twin-stick look edge rest (edgeTurn.ts)
    thumbTurn(look); // classic one-thumb edge hold (1.5 rad/s, direct)
    if (state.shooter) arrowLook(look);
    else {
      runtime.yaw += (Number(k.has('ArrowLeft')) - Number(k.has('ArrowRight'))) * look * 1.5;
      runtime.pitch = Math.max(-1.3, Math.min(1.25, runtime.pitch + (Number(k.has('ArrowUp')) - Number(k.has('ArrowDown'))) * look * 1.2));
    }
    if (runtime.landGoal && moving(intent)) { runtime.landGoal = null; useGame.setState({ landing: false }); }
    let flying = state.flying;
    if (strike.phase && !flying) runtime.lift = true; // a sword strike from the ground takes off first (strike.ts)
    if (runtime.lift || (runtime.thumb.active && moving(intent) && !flying)) {
      runtime.lift = false;
      if (!flying) { flying = true; liftTime.current = moving(intent) ? .4 : .24; runtime.velocity.y = 6; useGame.setState({ flying: true }); }
    }
    if (runtime.land) {
      runtime.land = false;
      if (flying) {
        if (runtime.landGoal) { runtime.landGoal = null; useGame.setState({ landing: false }); }
        else if (runtime.landTarget) { runtime.landGoal = runtime.landTarget.clone().add(new Vector3(0, FOOT, 0)); landingStall.current = 0; useGame.setState({ landing: true }); }
        else useGame.setState({ message: 'Aim at flat ground nearby to land.' });
      }
    }
    const gestureThrust = runtime.thumb.active && !!(runtime.thumb.throttle || runtime.thumb.strafe);
    const mode = state.shooter ? moveMode(runtime.shooter) : 0, surge = runtime.surge || gestureThrust || runtime.stick.boost;
    const level = levelFlight(state);
    driveLimits(runtime, { on: flying && !runtime.landGoal && !strike.phase && mode !== 2, dt, p, v: runtime.velocity, speed: runtime.speed, intent,
      surge, level, aiming: state.shooter && runtime.shooter.input.fire, contact: runtime.clearance, scrape, safe });
    const fp = level ? 0 : runtime.pitch;
    // Copy runtime.velocity into baseScratch first: shoveBase mutates its second argument in place.
    setVec(baseScratch, runtime.velocity.x, runtime.velocity.y, runtime.velocity.z);
    const vb = shoveBase(runtime.velocity, baseScratch);
    let v = runtime.landGoal ? landingVelocity(p, runtime.landGoal)
      : mode === 2 ? aimVelocity(vb, intent, runtime.yaw, fp, flying, dt)
      : pilotVelocity(vb, intent, runtime.yaw, fp, flying, surge, dt);
    runtime.flown = moving(intent); if (runtime.landGoal) cancelStrike(); else if (flying) strikeStep(v, p, dt, state.reduced, runtime.flown, look);
    if (liftTime.current > 0) { v.y = 6; liftTime.current -= dt; }
    const from = { ...runtime.velocity }, chosen = { ...v }; shoveStep(v, dt, flying && !runtime.landGoal); // chosen: before the hit shove
    runtime.clearance.active = false; runtime.clearance.cue = '';
    if (flying && !runtime.landGoal) {
      const limited = limitStep(safe, p, v, flightTarget(intent, runtime.yaw, fp, flying, surge), from); v = limited.velocity; runtime.clearance.cue = limited.cue;
      if (limited.contact) {
        runtime.clearance.active = true;
        const w = limited.contact.witness1, n = new Vector3().copy(limited.contact.normal1).normalize();
        setVec(runtime.clearance.point, w.x, w.y, w.z); setVec(runtime.clearance.normal, n.x, n.y, n.z);
      }
    } else resetCueHold();
    setVec(runtime.velocity, v.x, v.y, v.z);
    if (flying) { c.disableSnapToGround(); c.disableAutostep(); c.setMaxSlopeClimbAngle(Math.PI / 2); c.setMinSlopeSlideAngle(0); }
    else { c.enableSnapToGround(.3); c.enableAutostep(.35, .2, true); c.setMaxSlopeClimbAngle(Math.PI / 4); c.setMinSlopeSlideAngle(Math.PI / 6); }
    const movement = boundMovement(p, { x: v.x * dt, y: v.y * dt, z: v.z * dt }, flying);
    c.computeColliderMovement(col, movement);
    const actual = c.computedMovement(); readScrape(c, scrape);
    for (let i = 0; i < c.numComputedCollisions(); i++) {
      const hit = c.computedCollision(i);
      if (hit) { const corrected = removeInward(runtime.velocity, hit.normal1); setVec(runtime.velocity, corrected.x, corrected.y, corrected.z); }
    }
    if (!flying && c.computedGrounded() && runtime.velocity.y < 0) runtime.velocity.y = 0;
    sweepTurn(runtime.turn, lessShove(from, fromScratch, true), chosen, lessShove(runtime.velocity, flownScratch, false), presentation.yaw, dt);
    const next = { x: p.x + actual.x, y: p.y + actual.y, z: p.z + actual.z };
    b.setNextKinematicTranslation(next); setVec(runtime.position, next.x, next.y, next.z);
    if (runtime.landGoal) {
      landingStall.current = Math.hypot(actual.x, actual.y, actual.z) < .002 ? landingStall.current + dt : 0;
      if (landingStall.current > .6) {
        runtime.landGoal = null; setVec(runtime.velocity, 0, 0, 0);
        useGame.setState({ landing: false, message: 'Approach blocked. Hovering clear of the surface.' });
      }
    }
    if (runtime.landGoal && runtime.landGoal.distanceTo(runtime.position) < .06) {
      runtime.landGoal = null; setVec(runtime.velocity, 0, 0, 0); flying = false;
      useGame.setState({ flying: false, landing: false, checkpoint: next, message: 'Landed. Take a moment. Look around.' }); persistGame();
    }
    // Descend held (touch or desktop F/Ctrl) into a landable surface the probe missed: land here.
    const descending = !!runtime.stick.descend || (desktopDescendHeld() && !k.has('KeyR') && !k.has('Space'));
    if (flying && descending && c.computedGrounded() && safe.canLand({ ...next, y: next.y - FOOT })) {
      runtime.landGoal = null; setVec(runtime.velocity, 0, 0, 0); flying = false;
      useGame.setState({ flying: false, landing: false, checkpoint: next, message: 'Landed. Take a moment. Look around.' }); persistGame();
    }
    // Falling off an edge deploys flight automatically, including over water.
    if (!flying && (!c.computedGrounded() && v.y < -5 || next.y < 1.8)) {
      runtime.velocity.y = 0; useGame.setState({ flying: true });
    }
    if (!flying && c.computedGrounded() && !moving(intent)) {
      savedTime.current += dt;
      if (savedTime.current > 2) {
        if (safe.canLand({ ...next, y: next.y - FOOT })) { useGame.setState({ checkpoint: next }); persistGame(); }
        savedTime.current = 0;
      }
    }
    runtime.speed = Math.hypot(actual.x, actual.y, actual.z) / dt; runtime.altitude = Math.max(0, next.y - FOOT);
    tick.current += dt;
    if (tick.current > .15) {
      tick.current = 0; camera.getWorldDirection(direction);
      const ray = new rapier.Ray(camera.position, direction);
      const hit = world.castRayAndGetNormal(ray, 45, true, undefined, undefined, col);
      runtime.landTarget = null;
      if (hit && hit.normal.y > .75) {
        const target = new Vector3().copy(camera.position).addScaledVector(direction, hit.timeOfImpact);
        const goal = target.clone(); goal.y += FOOT;
        if (target.y > 1 && target.distanceTo(runtime.position) < 30 && safe.canLand(target) && safe.pathClear(runtime.position, goal)) runtime.landTarget = target;
      }
      const terminal = nearestTerminal(runtime.position);
      const nearTerminal = terminal !== null;
      runtime.location = locationName(next, terminal);
      const nearGround = flying && probeBelow(world, rapier, col, safe, runtime.position, FOOT + LAND_WINDOW) !== null;
      useGame.setState({ canLand: !!runtime.landTarget, nearTerminal, nearTerminalId: terminal?.id ?? null, nearTerminalLabel: terminal?.location ?? '', nearGround, limitCue: runtime.clearance.cue, limitHint: limitHint(flying ? runtime.clearance.cue : '', inputKind(touchMode())), clearanceActive: runtime.clearance.active });
    }
  });
  return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[spawn.current.x, spawn.current.y, spawn.current.z]}>
    <CapsuleCollider ref={collider} args={[.6, .4]} />
    <group ref={node => { presentation.anchor = node; }} />
  </RigidBody>;
}
