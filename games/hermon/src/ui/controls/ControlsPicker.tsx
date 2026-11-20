'use client';
import { useEffect, useRef } from 'react';
import { controlById, type ControlFamily } from '@/game/controlTypes';
import { clearInput } from '@/game/runtime';
import { useGame } from '@/game/store';
import { useCurrentControl } from './ControlList';
import { closeControls, closeOnEscape } from './closeControls';
import { takeHeldName } from './selectControl';
import { useControlFamily } from './useControlFamily';
import { useRowExtra } from './useRowExtra';
import { secondFingerTap } from '../secondFingerTap';
import styles from './ControlsPicker.module.css';
/** `family` is for tests; the page follows the last pointer. */
export default function ControlsPicker({ family: forced }: { family?: ControlFamily }) {
  const started = useGame(s => s.started), paused = useGame(s => s.paused), open = useGame(s => s.controlsOpen);
  const followed = useControlFamily(), family = forced ?? followed, current = useCurrentControl(family);
  useRowExtra();
  const second = useRef(-1e4); // when a second finger last opened or closed the sheet: the click some browsers still send for it is skipped
  // Warm the lab chunk so the first switch to Draw, Conduct or Brush mounts without a network wait.
  useEffect(() => { import('../gesture/LabControls').catch(() => { /* the switch still works; the chunk loads on demand */ }); }, []);
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.controlId = current;
    return () => { delete html.dataset.controlId; };
  }, [current]);
  // When the game closes, the sheet steps aside. So does a CHANGE of `paused` (Pause pressed with the sheet open: the header sits
  // above the backdrop, one tap pauses and closes it). The pause card's and Flight settings' Controls rows open the sheet while the game
  // is already paused, which is no change, so it stays open there. If this component goes (the world failed), no flag is left behind.
  const close = () => { if (useGame.getState().controlsOpen) useGame.setState({ controlsOpen: false }); };
  useEffect(close, [paused]);
  useEffect(() => { if (!started) close(); }, [started]);
  // A control picked while paused is named once play is back: Resume empties `message`, so selectControl held the name and it is published
  // here on the change to playing, after that clear. The slot's 4 s clock starts when it is on screen (addendum D6).
  useEffect(() => { if (!paused) { const name = takeHeldName(); if (name) useGame.setState({ message: name }); } }, [paused]);
  useEffect(() => () => { close(); }, []);
  if (!started || paused) return null;

  const toggle = () => { if (open) closeControls(family); else { clearInput(); useGame.setState({ controlsOpen: true }); } };
  const click = () => { if (performance.now() - second.current > 700) toggle(); };
  return <div className={styles.root} onKeyDown={closeOnEscape(family)}>
    <button type="button" className={styles.trigger} data-testid="controls-trigger" aria-haspopup="dialog" aria-expanded={open}
      aria-label={`Controls: ${controlById(current).label}`} onMouseDown={e => e.preventDefault()} onClick={click}
      onPointerUp={secondFingerTap(() => { second.current = performance.now(); toggle(); })}>
      Controls
    </button>
  </div>;
}
