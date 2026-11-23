import { resetBattle } from '@/game/celestialBattle';
import { resetShooterFeel, resetShooterInput } from '@/game/combat';
import { TERMINAL_IDS } from '@/game/navigation';
import { runtime } from '@/game/runtime';
import { clearShooterFault } from '@/game/shooterFault';
import { persistGame, useGame } from '@/game/store';
import { cancelStrike } from '@/game/strike';
import { unlockBlasterAudio } from './audioUnlock';
import { pause } from './useInput';

const VALID = new Set(TERMINAL_IDS);

/** Record a discovered 1 Enoch tablet (when valid), pause flight, and open the Field guide to it. */
export function openTabletRecord(terminalId?: string | null) {
  const g = useGame.getState();
  const id = terminalId && VALID.has(terminalId) ? terminalId : g.nearTerminalId && VALID.has(g.nearTerminalId) ? g.nearTerminalId : null;
  const discoveredTablets = id && !g.discoveredTablets.includes(id)
    ? [...g.discoveredTablets, id]
    : g.discoveredTablets;
  pause();
  useGame.setState({
    discoveredTablets,
    discovered: discoveredTablets.length > 0 || g.discovered,
    journal: true,
    journalTerminalId: id,
  });
  persistGame();
}

/** Toggle the opt-in Watchers' host encounter cleanly without leaving stale strikes, shields, or battle status behind. */
export function setWatchersMode(on: boolean, notify = true) {
  cancelStrike();
  resetShooterInput(runtime.shooter);
  resetShooterFeel(runtime.shooter);
  if (on) {
    clearShooterFault();
    resetBattle(runtime.shooter.stats.kills);
    useGame.setState({ shooter: true, ...(notify ? { message: 'The Watchers gather in the gorge.' } : {}) });
    persistGame();
    unlockBlasterAudio();
  } else {
    useGame.setState({ shooter: false, ...(notify ? { message: 'Calm sky restored.' } : {}) });
    persistGame();
  }
}
