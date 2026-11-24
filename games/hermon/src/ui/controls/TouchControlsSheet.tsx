'use client';
import { useEffect, useId, useRef } from 'react';
import { clearInput, exitOwnPointerLock } from '@/game/runtime';
import { persistGame, useGame, type TouchScheme } from '@/game/store';
import { pause } from '../useInput';
import styles from './TouchControlsPicker.module.css';

const SCHEMES: readonly { id: TouchScheme; label: string; line: string }[] = [
  { id: 'classic', label: 'One finger', line: 'Hold Fly to soar, drag to steer, tap a Watcher to strike.' },
  { id: 'twin', label: 'Twin stick', line: 'Left thumb moves, right thumb looks; buttons rise, descend, and aim.' },
];

function applyTouchScheme(next: TouchScheme, label: string) {
  clearInput();
  if (typeof document !== 'undefined' && document.pointerLockElement) exitOwnPointerLock();
  useGame.setState(s => ({ touchScheme: next, inputEpoch: s.inputEpoch + 1, message: label }));
  persistGame();
}

/** Non-modal touch Controls sheet: lets touch players switch between One finger and Twin stick. */
export default function TouchControlsSheet() {
  const open = useGame(s => s.controlsOpen);
  const started = useGame(s => s.started);
  const current = useGame(s => s.touchScheme);
  const id = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef('');

  const close = () => { useGame.setState({ controlsOpen: false }); };

  useEffect(() => {
    if (!open || !started) return;
    sheetRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, started]);

  if (!open || !started) return null;

  const openSettings = () => {
    if (!useGame.getState().paused) pause();
    useGame.setState({ controlsOpen: false, panel: true });
  };

  return (
    <div className={styles.layer} data-apart="">
      <div className={styles.backdrop} aria-hidden="true" data-testid="controls-backdrop" onClick={close} />
      <div ref={sheetRef} role="dialog" aria-modal="false" aria-labelledby={`${id}h`} className={styles.sheet} data-testid="controls-sheet" data-family="touch">
        <h2 id={`${id}h`} className={styles.title}>Touch controls</h2>
        <div className={styles.sheetBody} data-scroll-ok="">
          <fieldset className={styles.list}>
            <legend className={styles.legend}>Touch flight controls</legend>
            {SCHEMES.map(item => (
              <label key={item.id} className={styles.row} onPointerDown={e => { lastPointer.current = e.pointerType; }}>
                <input
                  type="radio"
                  className={styles.radio}
                  name="touch-controls-scheme"
                  value={item.id}
                  checked={current === item.id}
                  onChange={() => {
                    applyTouchScheme(item.id, item.label);
                    if (lastPointer.current === 'touch') close();
                  }}
                />
                <span className={styles.text}>
                  <b>{item.label}</b>
                  <small>{item.line}</small>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
        <div className={styles.foot}>
          <div className={styles.footLine}>
            <button type="button" className={styles.link} data-testid="controls-settings" aria-label="Flight settings: size, left-handed, look speed" onClick={openSettings}>
              Flight settings
            </button>
            <button type="button" className={styles.action} data-testid="controls-done" onClick={close}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
