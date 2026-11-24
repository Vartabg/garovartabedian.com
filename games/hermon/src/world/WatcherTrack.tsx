import { useEffect } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
import { runtime } from '@/game/runtime';
import { guarded } from '@/game/shooterFault';
import { aimFrameFrom, droneTrack, liveAimFrame, recordTrack, resetTrack } from '@/game/screenRay';
// Watcher screen history for mobile One-finger tap/stroke targeting: priority -9, right after CameraRig (-10) publishes the aim
// and before the Watchers and effects (-5). Projects up to 8 targets into droneTrack's fixed arrays each frame (no DOM reads).
const frame = guarded('WatcherTrack', (state: RootState) => {
  const s = runtime.shooter;
  if (!s.aim.valid) return;
  const t = performance.now();
  aimFrameFrom(s.aim, state.size, t, liveAimFrame);
  recordTrack(droneTrack, liveAimFrame, s.targets, s.drones.count, t);
});
export default function WatcherTrack() {
  useEffect(() => { resetTrack(); return () => resetTrack(); }, []);
  useFrame(frame, -9);
  return null;
}
