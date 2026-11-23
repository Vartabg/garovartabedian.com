import { useEffect, useState } from 'react';
import { flightFeel } from '@/game/flightFeel';
import type { Vec } from '@/game/motion';
import { presentation } from '@/game/presentation';
import { runtime } from '@/game/runtime';
import { useGame } from '@/game/store';
import styles from './Experience.module.css';

const coords = (v: Vec) => [v.x, v.y, v.z];

function flightStatus(flying: boolean, landing: boolean, speed: number, vy: number, braking: boolean): string {
  if (!flying) return 'Ground';
  if (landing) return 'Alighting';
  if (braking && speed >= 0.5) return 'Braking';
  if (speed < 3) return 'Hover';
  if (vy < -4) return 'Diving';
  if (vy > 4) return 'Climbing';
  return 'Soaring';
}

export default function Telemetry() {
  const flying = useGame(s => s.flying), landing = useGame(s => s.landing);
  const [sample, setSample] = useState(() => ({
    altitude: 20, speed: 0, vy: 0, braking: false, location: runtime.location,
    position: coords(runtime.position), renderedPosition: coords(presentation.position),
    lean: 0, cameraDistance: 0, yaw: runtime.yaw, pitch: runtime.pitch,
    suitYaw: presentation.yaw, viewYaw: presentation.viewYaw, suitPitch: presentation.pitch, viewPitch: presentation.viewPitch,
    suitClip: presentation.suitClip, suitRoll: presentation.suitRoll, wingTuck: { ...presentation.wingTuck },
  }));
  useEffect(() => {
    const update = () => {
      const s = useGame.getState();
      flightFeel.speed = runtime.speed;
      flightFeel.vertical = runtime.velocity.y;
      flightFeel.status = flightStatus(s.flying, s.landing, runtime.speed, runtime.velocity.y, flightFeel.brake);
      setSample({
        altitude: Math.round(runtime.altitude),
        speed: runtime.speed,
        vy: runtime.velocity.y,
        braking: flightFeel.brake,
        location: runtime.location,
        position: coords(runtime.position),
        renderedPosition: coords(presentation.position),
        lean: presentation.lean,
        cameraDistance: runtime.cameraDistance,
        yaw: runtime.yaw,
        pitch: runtime.pitch,
        suitYaw: presentation.yaw,
        viewYaw: presentation.viewYaw,
        suitPitch: presentation.pitch,
        viewPitch: presentation.viewPitch,
        suitClip: presentation.suitClip,
        suitRoll: presentation.suitRoll,
        wingTuck: { ...presentation.wingTuck },
      });
    };
    update();
    const interval = setInterval(update, 150);
    return () => clearInterval(interval);
  }, []);

  const status = flightStatus(flying, landing, sample.speed, sample.vy, sample.braking);
  const roundedSpeed = Math.round(sample.speed);

  return <div className={styles.telemetry} data-testid="flight-telemetry" data-position={JSON.stringify(sample.position)}
    data-speed={sample.speed.toFixed(2)} data-flying={String(flying)} data-rendered-position={JSON.stringify(sample.renderedPosition)}
    data-lean={sample.lean.toFixed(3)} data-camera-distance={sample.cameraDistance.toFixed(3)} data-heading={sample.yaw.toFixed(3)}
    data-pitch={sample.pitch.toFixed(3)} data-suit-heading={sample.suitYaw.toFixed(3)} data-view-heading={sample.viewYaw.toFixed(3)}
    data-suit-pitch={sample.suitPitch.toFixed(3)} data-view-pitch={sample.viewPitch.toFixed(3)} data-suit-clip={sample.suitClip}
    data-suit-roll={sample.suitRoll.toFixed(3)} data-wing-tuck-left={sample.wingTuck.left.toFixed(3)} data-wing-tuck-right={sample.wingTuck.right.toFixed(3)}>
    <span className={styles.place}>{sample.location.toUpperCase()}</span>
    <span className={styles.metrics}>
      <strong className={styles.alt}>{String(sample.altitude).padStart(3, '0')} <small>m</small></strong>
      <span className={styles.speedMeta} data-testid="momentum-readout"><i>·</i>{roundedSpeed} <small>m/s</small><i>·</i><small>{status.toUpperCase()}</small></span>
    </span>
  </div>;
}
