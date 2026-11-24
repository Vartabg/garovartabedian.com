'use client';
import { useRef } from 'react';
import { clearInput } from '@/game/runtime';
import { useGame, type TouchScheme } from '@/game/store';
import { secondFingerTap } from '../secondFingerTap';
import pauseStyles from '../Experience.module.css';
import styles from './TouchControlsPicker.module.css';

export const TOUCH_SCHEME_LABEL: Readonly<Record<TouchScheme, string>> = {
  classic: 'One finger',
  twin: 'Twin stick',
};

/** Top-right Controls trigger pill for touch devices. */
export function TouchControlsTrigger() {
  const started = useGame(s => s.started);
  const paused = useGame(s => s.paused);
  const open = useGame(s => s.controlsOpen);
  const scheme = useGame(s => s.touchScheme);
  const second = useRef(-1e4);

  if (!started || paused) return null;

  const toggle = () => {
    if (open) useGame.setState({ controlsOpen: false });
    else { clearInput(); useGame.setState({ controlsOpen: true }); }
  };
  const click = () => { if (performance.now() - second.current > 700) toggle(); };

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        data-testid="controls-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Controls: ${TOUCH_SCHEME_LABEL[scheme]}`}
        onMouseDown={e => e.preventDefault()}
        onClick={click}
        onPointerUp={secondFingerTap(() => { second.current = performance.now(); toggle(); })}
      >
        Controls
      </button>
    </div>
  );
}

/** Pause card & Flight settings row opening the touch Controls sheet. */
export function TouchControlsRow({ fromPanel = false }: { fromPanel?: boolean }) {
  const label = TOUCH_SCHEME_LABEL[useGame(s => s.touchScheme)];
  return (
    <button
      type="button"
      className={`${pauseStyles.secondary} ${styles.rowButton}`}
      data-testid="controls-row"
      aria-haspopup="dialog"
      aria-label={`Controls: ${label}`}
      onClick={() => useGame.setState(fromPanel ? { panel: false, controlsOpen: true } : { controlsOpen: true })}
    >
      <b>Controls</b><span>{label}</span><i aria-hidden="true">›</i>
    </button>
  );
}
