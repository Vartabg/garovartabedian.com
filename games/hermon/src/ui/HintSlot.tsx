'use client';
import { useEffect } from 'react';
import { runtime } from '@/game/runtime';
import { useGame } from '@/game/store';
import { touchMode } from '@/game/pointerMode';
import { openTabletRecord } from './hermonActions';
import { hintInput, pickHint, slotHidden } from './hintQueue';
import styles from './Experience.module.css';

const MESSAGE_MS = 4000;
/**
 * `message` (a mode notice, a landing notice) clears 4 s after it is set. While a dialog covers the
 * slot the clock waits, so a message set under a dialog stays on screen for its 4 s once the dialog closes.
 */
export function useMessageClock() {
  const message = useGame(s => s.message), hidden = useGame(slotHidden);
  useEffect(() => {
    if (!message || hidden) return;
    const id = setTimeout(() => useGame.setState({ message: '' }), MESSAGE_MS);
    return () => clearTimeout(id);
  }, [message, hidden]);
}

/**
 * The one contextual hint slot under the top row: one line, one obsidian-wine style, never stacked.
 */
export default function HintSlot() {
  const kind = useGame(s => pickHint(hintInput(s))?.kind ?? ''), text = useGame(s => pickHint(hintInput(s))?.text ?? '');
  const coach = useGame(s => s.coach), nearTerminalId = useGame(s => s.nearTerminalId);
  if (!kind) return null;
  const read = () => openTabletRecord(nearTerminalId);
  const land = () => { runtime.land = true; };
  return <p className={styles.hint} data-testid="hint-slot" data-kind={kind}>
    {kind === 'record' ? <button type="button" className={styles.read} onMouseDown={e => { if (!touchMode()) e.preventDefault(); }} onClick={read}>{text}</button>
      : kind === 'land' ? <button type="button" className={styles.read} onMouseDown={e => { if (!touchMode()) e.preventDefault(); }} onClick={land}>{text}</button>
      : kind === 'coach' ? <span data-testid="controls-hint" data-track={coach?.track} data-step={coach?.step} aria-hidden="true">{text}</span> : text}
  </p>;
}
