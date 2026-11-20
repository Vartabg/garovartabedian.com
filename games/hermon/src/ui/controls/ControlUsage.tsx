'use client';
import { useEffect } from 'react';
import { idFor } from '@/game/controlTypes';
import { useGame } from '@/game/store';
import { currentFamily, watchFamily } from './family';
import { watchPlayInput } from './playInput';
import { recordPlayedSecond, savePlayedControls } from './playedControls';

/** The Controls sheet marks a scheme as tried after twenty seconds of active use on this device. */
export default function ControlUsage() {
  useEffect(() => {
    watchFamily();
    const input = watchPlayInput();
    let activeSeconds = 0;
    const clock = window.setInterval(() => {
      const game = useGame.getState();
      if (!game.started || game.paused || document.hidden || !input.active(performance.now())) return;
      const family = currentFamily();
      recordPlayedSecond(family, idFor(game, family));
      if (++activeSeconds % 10 === 0) savePlayedControls();
    }, 1000);
    const saveHidden = () => { if (document.hidden) savePlayedControls(); };
    window.addEventListener('pagehide', savePlayedControls);
    document.addEventListener('visibilitychange', saveHidden);
    return () => {
      window.clearInterval(clock);
      input.stop();
      window.removeEventListener('pagehide', savePlayedControls);
      document.removeEventListener('visibilitychange', saveHidden);
      savePlayedControls();
    };
  }, []);
  return null;
}
