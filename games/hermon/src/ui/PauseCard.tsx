import { useEffect, useId, useRef, useState } from 'react';
import { TERMINALS } from '@/game/navigation';
import { persistGame, useGame } from '@/game/store';
import { runtime } from '@/game/runtime';
import { touchMode } from '@/game/pointerMode';
import { computeLayout } from '@/game/touchLayout';
import { CROSSING_PATH, STORIES_PATH } from '@/paths';
import { headerBand, readInsets, viewportBox } from './touchInsets';
import { isStandalone, keepPlaying, leaveGame } from './playSession';
import { setWatchersMode } from './hermonActions';
import LazyControls from './LazyControls';
import styles from './Experience.module.css';

type Props = { ready: boolean; onEnter: () => void; note?: string };

function crampedNow(probe: HTMLElement | null): boolean {
  if (!probe || !touchMode()) return false;
  const s = useGame.getState(), box = viewportBox(), insets = readInsets(probe);
  const top = headerBand(box, insets.top);
  const prefs = { size: s.controlSize, flip: s.flipSides, fire: s.shooter, aim: s.shooter && s.aimButton && !s.tapControls, tapPad: s.tapControls };
  return computeLayout(box.w, box.h, insets, top, prefs).cramped;
}

/** The pause card, the "Leave the game?" card (touch back swipe), and recovery notes. */
export default function PauseCard({ ready, onEnter, note = '' }: Props) {
  const leave = useGame(s => s.leavePrompt), zoomNote = useGame(s => s.zoomNote), shooter = useGame(s => s.shooter);
  const tipSeen = useGame(s => s.homeTipSeen), discoveredCount = useGame(s => s.discoveredTablets.length);
  const desktopMode = useGame(s => s.desktopMode), controlLab = useGame(s => s.controlLab);
  const probe = useRef<HTMLDivElement>(null), card = useRef<HTMLElement>(null), go = useRef<HTMLButtonElement>(null), kicker = useId();
  const [cramped, setCramped] = useState(false), [tip, setTip] = useState(false), [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const update = () => {
      const touch = touchMode();
      setIsTouch(touch);
      setCramped(crampedNow(probe.current));
      setTip(touch && !isStandalone());
    };
    update();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update); window.addEventListener('resize', update);
    return () => { vv?.removeEventListener('resize', update); window.removeEventListener('resize', update); };
  }, []);

  useEffect(() => {
    if (!ready) card.current?.focus({ preventScroll: true });
    else if (document.activeElement === card.current) go.current?.focus({ preventScroll: true });
  }, [ready]);

  const probeNode = <div ref={probe} className={styles.insetProbe} aria-hidden="true" />;
  if (leave) return <section ref={card} tabIndex={-1} className={styles.pauseCard} aria-label="Leave the game">
    {probeNode}
    <h2>Leave the game?</h2><p>Your progress is saved.</p>
    <button type="button" ref={go} className={styles.primary} autoFocus disabled={!ready} onClick={() => { useGame.setState({ leavePrompt: false }); keepPlaying(); onEnter(); }}>Keep playing <span aria-hidden="true">↗</span></button>
    <button type="button" className={styles.secondary} onClick={leaveGame}>Leave</button>
  </section>;

  const showTip = tip && !tipSeen;
  const resume = () => { if (showTip) { useGame.setState({ homeTipSeen: true }); persistGame(); } onEnter(); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape') { e.preventDefault(); resume(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const showTouchControls = isTouch || controlLab !== 'standard' || desktopMode !== 'mouse';

  return <><div className={styles.pauseScrim} data-testid="pause-scrim" aria-hidden="true" onClick={resume} />
  <section ref={card} tabIndex={-1} className={styles.pauseCard} aria-labelledby={kicker}>
    {probeNode}
    <p id={kicker} className={styles.kicker}>Ascent paused</p>
    <h2>Take your time.</h2>
    {shooter && runtime.shooter.stats.kills > 0 && <p>Watchers cast down: {runtime.shooter.stats.kills}</p>}
    <p className={styles.note} role="status">{note || (zoomNote ? 'Pinch out to normal size, then tap Resume.' : cramped ? 'Screen too short for touch controls. Zoom out or turn the phone.' : '')}</p>
    <button type="button" ref={go} className={styles.primary} autoFocus disabled={!ready} onClick={resume}>{ready ? 'Resume flight' : 'Restoring your angel…'} <span aria-hidden="true">↗</span></button>
    <div className={styles.pauseRows}>
      <button type="button" className={styles.secondary} onClick={() => setWatchersMode(!shooter)}>
        <span>{shooter ? 'Return to calm sky' : 'Challenge the Watchers'}</span>
        <span className={styles.muted}>{shooter ? 'Battle on' : 'Calm'}</span>
      </button>
      {showTouchControls && <LazyControls />}
      <div className={styles.pair}>
        <button type="button" className={styles.secondary} onClick={() => useGame.setState({ journal: true, journalTerminalId: null })}>
          <span>Field guide &amp; tablets</span>
          <span className={styles.muted}>{discoveredCount} / {TERMINALS.length}</span>
        </button>
        <button type="button" className={styles.secondary} aria-describedby="settings-hint" onClick={() => useGame.setState({ panel: true })}>Flight settings</button>
        <p id="settings-hint" className={`${styles.pauseNote} ${styles.settingsHint}`}>Perspective, look speed, graphics, audio</p>
      </div>
      <div className={styles.pauseLinks}>
        <a href={CROSSING_PATH}>Play The Cloven Arch</a>
        <a href={STORIES_PATH}>Playable stories</a>
      </div>
    </div>
    <p className={`${styles.pauseNote} ${styles.portraitLine}`}>Best played sideways.</p>
    {showTip && <p className={styles.pauseNote}>Tip: Share › Add to Home Screen for full screen.</p>}
  </section></>;
}
