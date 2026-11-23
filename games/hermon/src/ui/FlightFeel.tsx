import { flightFeel } from '@/game/flightFeel';
import { clearInput } from '@/game/runtime';
import { useGame } from '@/game/store';
import { secondFingerTap } from './secondFingerTap';
import styles from './FlightFeel.module.css';
import PhoneFlight from './PhoneFlight';
import { useTouchCapable } from './useTouchCapable';
import { touchMode } from '@/game/pointerMode';

/** Touch classic flight controls (Fly · hold + Brake). Desktop speed/status live in Telemetry and KeyB lives in useInput. */
export default function FlightFeel() {
  const paused = useGame(s => s.paused);
  const capable = useTouchCapable(), classic = useGame(s => s.touchScheme === 'classic');
  const phone = capable && classic && touchMode();
  const brake = () => { clearInput(false, true); flightFeel.brake = true; flightFeel.serial++; };
  if (!phone || paused) return null;
  return <aside className={styles.panel} aria-label="Touch flight controls">
    <div className={styles.actions}>
      <PhoneFlight />
      <button type="button" onClick={brake} onPointerUp={secondFingerTap(brake)} aria-label="Brake to hover">Brake</button>
    </div>
  </aside>;
}
