import { persistGame, useGame } from '@/game/store';
import { setWatchersMode } from './hermonActions';
import styles from './Experience.module.css';

type Patch = Parameters<ReturnType<typeof useGame.getState>['set']>[0];
const save = (patch: Patch) => { useGame.setState(patch); persistGame(); };

const COARSE_NOTE = {
  twin: 'Fire strikes the Watcher under the crosshair.',
  classic: 'Hold Fly to move. Tap a Watcher to strike it.',
};
const FINE_NOTE = 'Click (while mouse-locked) or press C to dive with the flaming sword. Hold Right-click or V for the shield, and press 1 to rebuke.';

export default function ShooterSettings({ coarse }: { coarse: boolean }) {
  const shooter = useGame(s => s.shooter), autoFire = useGame(s => s.autoFire), scheme = useGame(s => s.touchScheme);
  return <fieldset><legend>The Watchers’ host</legend>
    <label className={styles.check}>
      <input type="checkbox" checked={shooter} onChange={e => setWatchersMode(e.target.checked, false)} />
      Challenge the Watchers in the gorge
    </label>
    {shooter && <>
      {scheme === 'twin' && <label className={styles.check}><input type="checkbox" checked={autoFire} onChange={e => save({ autoFire: e.target.checked })} /> Auto-fire assist on touch screens</label>}
      <p className={styles.muted}>{coarse ? COARSE_NOTE[scheme] : FINE_NOTE}</p>
    </>}
  </fieldset>;
}
