'use client';
import { useEffect, useId, useRef } from 'react';
import { controlsFor, type ControlFamily } from '@/game/controlTypes';
import { useGame } from '@/game/store';
import { pause } from '../useInput';
import ControlList, { useTried } from './ControlList';
import { useKeysPref } from './keysPref';
import styles from './ControlsPicker.module.css';

/** The 'Number keys 1-8 switch controls' checkbox (desktop). One shared preference, so every copy on the page agrees. */
export function KeysToggle() {
  const [on, set] = useKeysPref();
  return <label className={styles.check}>
    <input type="checkbox" checked={on} onChange={e => set(e.target.checked)} />Number keys 1-8 switch controls
  </label>;
}
export function TriedLine({ family }: { family: ControlFamily }) {
  const tried = useTried(family);
  return <p className={styles.tried} aria-live="polite" data-testid="controls-tried">
    Tried {tried.length} of {controlsFor(family).length}
  </p>;
}

/**
 * On touch, a one-line way from the sheet to Flight settings (size, left-handed, look speed live there): Pause, then the dialog. It shares
 * the tried line's row, so it adds no height to the footer; the name carries what is in there (it starts with the visible words, 2.5.3).
 */
function SettingsLink() {
  return <button type="button" className={styles.link} data-testid="controls-settings" aria-label="Flight settings: size, left-handed, look speed"
    onClick={() => { pause(); useGame.setState({ panel: true }); }}>Flight settings</button>;
}

/**
 * The non-modal controls sheet (a dialog that does not trap focus or block the world): a bottom sheet on a phone, a popover under the top
 * row on a desktop or tablet (ControlsPicker.module.css). The list scrolls; the footer stays put, so Done is
 * reachable in a short landscape window. Escape and the backdrop are the layer's.
 */
export default function ControlsSheet({ family, onClose }: { family: ControlFamily; onClose: () => void }) {
  const id = useId(), ref = useRef<HTMLDivElement>(null);
  // Focus lands on the checked radio and the list scrolls it into view (a checked row below the fold is not left hidden).
  useEffect(() => { ref.current?.querySelector<HTMLInputElement>('input:checked')?.focus(); }, []);
  return <div ref={ref} role="dialog" aria-modal="false" aria-labelledby={`${id}h`} className={styles.sheet} data-testid="controls-sheet" data-family={family}>
    <h2 id={`${id}h`} className={styles.title}>Controls</h2>
    <div className={styles.sheetBody} data-scroll-ok="">
      <ControlList family={family} name="controls-sheet" onPicked={(_, how) => { if (how.touch) onClose(); }} />
    </div>
    <div className={styles.foot}>
      {family === 'desktop' ? <><TriedLine family={family} /><KeysToggle /></> : <div className={styles.footLine}><TriedLine family={family} /><SettingsLink /></div>}
      <div className={styles.buttons}>
        <button type="button" className={styles.action} data-testid="controls-done" onClick={onClose}>Done</button>
      </div>
    </div>
  </div>;
}
