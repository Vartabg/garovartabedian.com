import { moving, type Intent, type Vec } from './motion';
import { runtime } from './runtime';
import { momentumVelocity } from './momentumFlight';
import { flightFeel } from './flightFeel';
import { cancelStrike, strike } from './strike';
import { strikeLook } from './strikeLook';
import { useGame } from './store';
let requests = -1, epoch = -1, touch = -1, active = false;
/** Player's standard momentum flight branch. */
export function pilotVelocity(v: Vec, intent: Intent, yaw: number, pitch: number, flying: boolean, surge: boolean, dt: number) {
  if (epoch !== runtime.poseEpoch) { epoch = runtime.poseEpoch; requests = flightFeel.serial; flightFeel.brake = false; active = false; touch = runtime.touchEpoch; }
  const interrupted = requests !== flightFeel.serial || touch !== runtime.touchEpoch;
  if (interrupted) { flightFeel.brake = true; cancelStrike(); }
  else if (strike.phase === 1) flightFeel.brake = false; // a fresh attack leaves a deliberately parked hover
  requests = flightFeel.serial; touch = runtime.touchEpoch;
  const live = moving(intent);
  if (live && !active) flightFeel.brake = false;
  active = live;
  if (flightFeel.brake) cancelStrike();
  const game = useGame.getState();
  // Third-person framing belongs to CameraRig; keep the prior first-person launch assist without adding an orbit or pullback.
  if (game.camera === 'first' && strike.phase === 1 && !game.reduced && !runtime.thumb.active && !runtime.keyHold.yawSign && !runtime.keyHold.pitchSign)
    strikeLook(runtime, runtime.position, strike.aim, dt);
  return momentumVelocity(v, intent, yaw, pitch, flying, surge, dt, flightFeel.brake);
}
