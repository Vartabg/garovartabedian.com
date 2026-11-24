'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { hydrateGame, overrideShooter, useGame } from '@/game/store';
import { runtime } from '@/game/runtime';
import { clearShooterFault } from '@/game/shooterFault';
import { pause, resume, useInput } from './useInput';
import { useShooterInput } from './useShooterInput';
import { usePlayGuard } from './usePlayGuard';
import { onPlayGesture } from './playSession';
import { useFieldGuide } from './useFieldGuide';
import { touchMode } from '@/game/pointerMode';
import { unlockHermonAudio } from './audioUnlock';
import { useAudio } from './useAudio';
import { coarsePointer } from './hintQueue';
import { secondFingerTap } from './secondFingerTap';
import { setWatchersMode } from './hermonActions';
import { useTouchCapable } from './useTouchCapable';
import { TouchControlsTrigger } from './controls/TouchControlsPicker';
import TouchControlsSheet from './controls/TouchControlsSheet';
import Boundary from './Boundary';
import TapControls from './TapControls';
import Telemetry from './Telemetry';
import HintSlot, { useMessageClock } from './HintSlot';
import PauseCard from './PauseCard';
import Landing, { Brand } from './Landing';
import styles from './Experience.module.css';

const Scene = dynamic(() => import('@/world/Scene'), { ssr: false });
const BattleHud = dynamic(() => import('./BattleHud'), { ssr: false });
const loadTouch = () => import('./TouchControls');
const loadHint = () => import('./ControlsHint');
const ControlsHint = dynamic(loadHint, { ssr: false, loading: () => null });
const loadPanel = () => import('./TestPanel');
const TestPanel = dynamic(loadPanel, { ssr: false, loading: () => null });
const skip = () => {};
const Optional = ({ children }: { children: ReactNode }) => <Boundary fallback={null} onError={skip}>{children}</Boundary>;

function desktopKeybar(flying: boolean, shooter: boolean): string {
  if (!flying) return 'SPACE TAKE OFF · WASD MOVE · DRAG OR CLICK TO LOOK · E READ TABLET';
  if (shooter) return 'CLICK OR C STRIKE · RIGHT-CLICK OR V SHIELD · 1 REBUKE · WASD FLY · ESC PAUSE';
  return 'WASD FLY · SHIFT SURGE · SPACE / F RISE / DESCEND · B HOVER · L LAND · ESC PAUSE';
}

export default function Experience() {
  const state = useGame(), [hydrated, setHydrated] = useState(false), [failed, setFailed] = useState(false);
  const [sceneKey, setSceneKey] = useState(0), [touchReady, setTouchReady] = useState(false);
  const [TouchControls, setTouchControls] = useState<ComponentType | null>(null);
  const touchCapable = useTouchCapable();
  const main = useRef<HTMLElement>(null), guide = useFieldGuide(hydrated);

  useEffect(() => {
    hydrateGame();
    const query = new URLSearchParams(location.search), shooter = query.get('shooter');
    if (shooter === '1') { clearShooterFault(); overrideShooter(true); } else if (shooter === '0') overrideShooter(false);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) void loadTouch().then(m => setTouchControls(() => m.default)).catch(() => {}).finally(() => setTouchReady(true));
  }, [hydrated]);
  useEffect(() => { if (hydrated) void loadHint().catch(() => {}); }, [hydrated]);
  useEffect(() => { if (state.started) void loadPanel().catch(() => {}); }, [state.started]);

  const bar = state.started && !failed;
  useInput(); useAudio(); useShooterInput({ unlock: unlockHermonAudio }); usePlayGuard();
  const failure = useCallback(() => { setFailed(true); pause(); }, []);
  const enter = () => {
    if (!onPlayGesture()) { useGame.setState({ zoomNote: true }); return; }
    useGame.setState({ zoomNote: false }); unlockHermonAudio(); resume(); main.current?.focus();
  };
  const closePanel = () => state.set({ panel: false });
  const closeGuide = () => state.set({ journal: false, journalTerminalId: null });
  const retry = async () => {
    pause();
    const { clearWorldCache } = await import('@/world/Suit');
    clearWorldCache();
    setFailed(false); setSceneKey(v => v + 1); state.set({ ready: false, flying: false, landing: false });
  };

  const playing = state.started && !state.paused, twin = state.touchScheme === 'twin';
  const ready = state.ready && touchReady;
  const legendText = !touchCapable ? desktopKeybar(state.flying, state.shooter) : null;
  useMessageClock();

  return <>
    <a className="skip" href="#field-guide" onClick={() => { pause(); state.set({ journal: true }); }}>Skip to text field guide</a>
    <main id="expedition" ref={main} className={styles.experience} tabIndex={-1} aria-label="Mount Hermon expedition"
      onContextMenu={e => { if (!(e.target as Element).closest('dialog')) e.preventDefault(); }}>
      <div className={styles.world}>
        {hydrated && !failed && <Boundary key={sceneKey} fallback={null} onError={failure}><Scene onLoss={failure} /></Boundary>}
      </div>
      <div className={`${styles.vignette} ${!state.started ? styles.introVignette : ''}`} aria-hidden="true" />
      <header className={styles.header} data-play={bar ? '' : undefined}>
        {!bar && <Brand />}
        <div className={styles.headerActions}>
          {bar ? <>
            {playing && (
              <button type="button" className={styles.modeToggle} data-active={String(state.shooter)} aria-pressed={state.shooter}
                onMouseDown={e => { if (!touchMode()) e.preventDefault(); }}
                onClick={e => { e.currentTarget.blur(); setWatchersMode(!state.shooter); }}>
                <span className={styles.modeDot} aria-hidden="true" />
                {state.shooter ? 'Watchers · On' : 'Watchers'}
              </button>
            )}
            {touchCapable && <TouchControlsTrigger />}
            {playing && <button type="button" className={styles.pause} onClick={pause} onPointerUp={secondFingerTap(pause)} aria-label="Pause expedition"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor" /></svg></button>}
          </> : <button type="button" id="field-guide" onClick={() => { pause(); state.set({ journal: true }); }}>Field guide</button>}
        </div>
      </header>
      {bar && <><span id="field-guide" className="sr-only" tabIndex={-1} />{(touchCapable || state.controlsOpen) && <TouchControlsSheet />}</>}
      {state.started && <div className={styles.bandProbe} data-band="" aria-hidden="true" />}
      <Landing started={state.started} failed={failed} ready={ready} zoomNote={state.zoomNote} note={guide.note} onEnter={enter} onRetry={retry} />
      {state.started && <>
        {state.shooter && <Optional><BattleHud /></Optional>}
        {TouchControls && <TouchControls key={`${state.paused}-${state.inputEpoch}`} />}
        {playing && <>
          {state.tapControls && <TapControls key={state.inputEpoch} />}
          {state.shooter && (state.pointerLocked || (touchCapable && twin)) && <div className={styles.aimDot} aria-hidden="true" />}
          <Optional><ControlsHint coarse={coarsePointer()} /></Optional>
          <HintSlot />
          <Telemetry />
          {(touchCapable || state.tapControls) && (
            <div className={styles.actions} data-ghost-avoid="" data-shooter={String(state.shooter)} data-twin={String(twin)}>
              <button type="button" className={styles.action} onMouseDown={e => { if (!touchMode()) e.preventDefault(); }}
                onClick={() => { if (state.flying) runtime.land = true; else runtime.lift = true; }}>
                <span aria-hidden="true">{state.flying ? '↓' : '↑'}</span>
                {state.landing ? 'Cancel landing' : state.flying ? 'Land' : 'Lift'}
              </button>
            </div>
          )}
          {legendText && !state.limitHint && (
            <div className={`${styles.legend} ${state.flying ? styles.legendQuiet : ''}`} data-testid="legend">{legendText}</div>
          )}
        </>}
        {state.paused && !state.panel && !guide.Guide && !failed && !state.controlsOpen && <PauseCard ready={ready} onEnter={enter} note={guide.note} />}
      </>}
      <div className="sr-only" aria-live="polite">{state.message}</div>
      {guide.Guide && <Boundary fallback={null} onError={guide.fail}><guide.Guide onClose={closeGuide} /></Boundary>}
      {state.panel && <TestPanel onClose={closePanel} onResume={() => { closePanel(); enter(); }} ready={ready} />}
    </main>
  </>;
}
