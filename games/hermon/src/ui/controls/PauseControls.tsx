'use client';
import { controlById } from '@/game/controlTypes';
import { useGame } from '@/game/store';
import { useCurrentControl } from './ControlList';
import { TriedLine } from './ControlsSheet';
import { useControlFamily } from './useControlFamily';
import pause from '../Experience.module.css';
import styles from './ControlsPicker.module.css';

/**
 * The one door from a paused screen to the Controls sheet: a row with the word, the control in use now, and a chevron. The pause card
 * and Flight settings each carry one (the list itself lives only in the sheet). From Flight settings (`fromPanel`) the settings dialog
 * closes as the sheet opens; either way the game stays paused, and closing the sheet shows the pause card again.
 */
export function ControlsRow({ fromPanel = false }: { fromPanel?: boolean }) {
  const label = controlById(useCurrentControl(useControlFamily())).label;
  // The name is the top row's `Controls: <label>`: the visible words are its two parts, in order (WCAG 2.5.3).
  return <button type="button" className={`${pause.secondary} ${styles.rowButton}`} data-testid="controls-row" aria-haspopup="dialog" aria-label={`Controls: ${label}`}
    onClick={() => useGame.setState(fromPanel ? { panel: false, controlsOpen: true } : { controlsOpen: true })}>
    <b>Controls</b><span>{label}</span><i aria-hidden="true">›</i>
  </button>;
}

export default function PauseControls() {
  const family = useControlFamily();
  return <><ControlsRow /><TriedLine family={family} /></>;
}
