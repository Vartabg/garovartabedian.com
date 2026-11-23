'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { hydrateGame, overrideShooter, useGame } from '@/game/store';
import { runtime } from '@/game/runtime';
import { clearShooterFault, shooterFault } from '@/game/shooterFault';
import { pause, resume, useInput } from './useInput';
import { useShooterInput } from './useShooterInput';
import { usePlayGuard } from './usePlayGuard';
import { onPlayGesture } from './playSession';
import { useFieldGuide } from './useFieldGuide';
import { touchMode } from '@/game/pointerMode';
import { unlockBlasterAudio } from './audioUnlock';
import { useAudio } from './useAudio';
import { trackpadPill } from './trackpadPill';
import { coarsePointer } from './hintQueue';
import { labFault } from './labSwitch';
import { secondFingerTap } from './secondFingerTap';
import { setWatchersMode } from './hermonActions';
import Boundary from './Boundary';
import TapControls from './TapControls';
import Telemetry from './Telemetry';
import HintSlot, { useMessageClock } from './HintSlot';
import FlowWelcome from './FlowWelcome';
import PauseCard from './PauseCard';
import SheetLost from './SheetLost';
import Landing, { Brand } from './Landing';
import styles from './Experience.module.css';

const Scene = dynamic(() => import('@/world/Scene'), { ssr: false });
const BattleHud = dynamic(() => import('./BattleHud'), { ssr: false });
const loadHud = () => import('./ShooterHud');
const ShooterHud = dynamic(loadHud, { ssr: false, loading: () => null });
const loadTouch = () => import('./TouchControls');
const loadHint = () => import('./ControlsHint');
const ControlsHint = dynamic(loadHint, { ssr: false, loading: () => null });
const FlowHud = dynamic(() => import('./FlowHud'), { ssr: false, loading: () => null });
const SimpleTrackpadHud = dynamic(() => import('./SimpleTrackpadHud'), { ssr: false, loading: () => null });
const loadPanel = () => import('./TestPanel');
type LabProps = { scheme: 'draw' | 'conduct' | 'brush'; onError?: (error: unknown) => void };
const loadLab = () => import('./gesture/LabControls');
const ControlsEntry = dynamic(() => import('./controls/ControlsEntry'), { ssr: false, loading: () => null });
const ControlUsage = dynamic(() => import('./controls/ControlUsage'), { ssr: false, loading: () => null });
const skip = () => {};
const Optional = ({ children }: { children: ReactNode }) => <Boundary fallback={null} onError={skip}>{children}</Boundary>;
const LAB_LOAD_FAILED = 'The Gesture Lab could not load. Standard controls are on.', LAB_FAILED = 'The Gesture Lab stopped. Standard controls are on.';
const TestPanel = dynamic(loadPanel, { ssr: false, loading: () => null });

function useTouchActive(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const sync = () => setTouch(touchMode());
    sync();
    document.addEventListener('pointerdown', sync, { capture: true, passive: true });
    return () => document.removeEventListener('pointerdown', sync, true);
  }, []);
  return touch;
}

function desktopKeybar(flying: boolean, shooter: boolean): string {
  if (!flying) return 'SPACE TAKE OFF · WASD MOVE · DRAG OR CLICK TO LOOK · E READ TABLET';
  if (shooter) return 'CLICK OR C STRIKE · RIGHT-CLICK OR V SHIELD · 1 REBUKE · WASD FLY · ESC PAUSE';
  return 'WASD FLY · SHIFT SURGE · SPACE / F RISE / DESCEND · B HOVER · L LAND · ESC PAUSE';
}

export default function Experience() {
  const state = useGame(), [hydrated, setHydrated] = useState(false), [failed, setFailed] = useState(false);
  const [sceneKey, setSceneKey] = useState(0), [touchReady, setTouchReady] = useState(false);
  const [TouchControls, setTouchControls] = useState<ComponentType | null>(null);
  const [LabControls, setLabControls] = useState<ComponentType<LabProps> | null>(null);
  const isTouch = useTouchActive();
  const lab = state.controlLab;
  const main = useRef<HTMLElement>(null), guide = useFieldGuide(hydrated);

  useEffect(() => {
    let cancelled = false;
    hydrateGame();
    const query = new URLSearchParams(location.search), profile = query.get('trackpad'), blaster = query.get('shooter');
    if (blaster === '1') { clearShooterFault(); overrideShooter(true); } else if (blaster === '0') overrideShooter(false);
    if (profile === 'simple' || profile === 'flow' || profile === 'free' || profile === 'captured') useGame.setState({ desktopMode: 'trackpad', trackpadSteering: profile });
    const go = () => { if (!cancelled) setHydrated(true); }, c = query.get('controls');
    if (c) import('./controls/controlsQuery').then(m => m.applyControlsQuery(c)).catch(() => {}).finally(go); else go();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (hydrated) void loadTouch().then(m => setTouchControls(() => m.default)).catch(() => {}).finally(() => setTouchReady(true));
  }, [hydrated]);
  useEffect(() => { if (hydrated && state.shooter && isTouch) void loadHud().catch(() => {}); }, [hydrated, state.shooter, isTouch]);
  useEffect(() => { if (hydrated) void loadHint().catch(() => {}); }, [hydrated]);
  useEffect(() => { if (state.started) void loadPanel().catch(() => {}); }, [state.started]);
  useEffect(() => {
    if (hydrated && lab !== 'standard' && !LabControls) void loadLab().then(m => setLabControls(() => m.default)).catch(() => labFault(LAB_LOAD_FAILED));
  }, [hydrated, lab, LabControls]);

  useEffect(() => {
    const html = document.documentElement;
    if (lab === 'standard') delete html.dataset.controls; else html.dataset.controls = lab;
    return () => { delete html.dataset.controls; };
  }, [lab]);

  const touchBlast = lab === 'standard' && state.shooter && state.touchScheme === 'classic';
  useEffect(() => {
    const html = document.documentElement;
    if (touchBlast) html.dataset.touchBlast = ''; else delete html.dataset.touchBlast;
    return () => { delete html.dataset.touchBlast; };
  }, [touchBlast]);

  const bar = state.started && !failed;
  useInput(); useAudio(); useShooterInput({ unlock: unlockBlasterAudio }); usePlayGuard();
  const failure = useCallback(() => { setFailed(true); pause(); }, []);
  const enter = () => {
    if (!onPlayGesture()) { useGame.setState({ zoomNote: true }); return; }
    useGame.setState({ zoomNote: false }); unlockBlasterAudio(); resume(); main.current?.focus();
  };
  const closePanel = () => state.set({ panel: false });
  const closeGuide = () => state.set({ journal: false, journalTerminalId: null });
  const retry = async () => {
    pause();
    const { clearWorldCache } = await import('@/world/Suit');
    clearWorldCache();
    setFailed(false); setSceneKey(v => v + 1); state.set({ ready: false, flying: false, landing: false });
  };

  const standard = lab === 'standard', playing = state.started && !state.paused, twin = state.touchScheme === 'twin';
  const standardDesktop = standard && state.desktopMode === 'mouse' && !isTouch;
  const showControlsPicker = isTouch || !standardDesktop;
  const ready = state.ready && touchReady && (standard || !!LabControls);
  const trackpadLegend = standard && state.desktopMode === 'trackpad'
    ? trackpadPill({ steering: state.trackpadSteering, shooter: state.shooter, cruising: state.trackpadFlying, flying: state.flying, canLand: state.canLand })
    : null;
  const legendText = standardDesktop ? desktopKeybar(state.flying, state.shooter) : trackpadLegend;
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
            {showControlsPicker && <Optional><ControlsEntry part="trigger" /></Optional>}
            {playing && <button type="button" className={styles.pause} onClick={pause} onPointerUp={secondFingerTap(pause)} aria-label="Pause expedition"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor" /></svg></button>}
          </> : <button type="button" id="field-guide" onClick={() => { pause(); state.set({ journal: true }); }}>Field guide</button>}
        </div>
      </header>
      {bar && <><span id="field-guide" className="sr-only" tabIndex={-1} />{showControlsPicker && <Boundary fallback={<SheetLost />} onError={skip}><ControlsEntry part="sheet" /></Boundary>}</>}
      {state.started && <div className={styles.bandProbe} data-band="" aria-hidden="true" />}
      <Landing started={state.started} failed={failed} ready={ready} zoomNote={state.zoomNote} note={guide.note} onEnter={enter} onRetry={retry} />
      {state.started && <>
        {state.shooter && <Optional><BattleHud /></Optional>}
        {standard ? TouchControls && <TouchControls key={`${state.paused}-${state.inputEpoch}`} />
          : playing && LabControls && <LabControls key={`${lab}-${state.inputEpoch}`} scheme={lab as LabProps['scheme']} onError={() => labFault(LAB_FAILED)} />}
        {playing && <>
          {state.tapControls && <TapControls key={state.inputEpoch} />}
          {state.shooter && (
            standardDesktop
              ? (state.pointerLocked ? <div className={styles.aimDot} aria-hidden="true" /> : null)
              : (isTouch && twin ? <Boundary fallback={null} onError={() => shooterFault('hud', null)}><ShooterHud /></Boundary> : null)
          )}
          {standard && <Optional><ControlsHint coarse={coarsePointer()} /></Optional>}
          <HintSlot />
          <Telemetry />
          {(isTouch || state.tapControls) && (
            <div className={styles.actions} data-ghost-avoid="" data-shooter={String(state.shooter)} data-twin={String(twin && standard)}>
              <button type="button" className={styles.action} onMouseDown={e => { if (!touchMode()) e.preventDefault(); }}
                onClick={() => { if (state.flying) runtime.land = true; else runtime.lift = true; }}>
                <span aria-hidden="true">{state.flying ? '↓' : '↑'}</span>
                {state.landing ? 'Cancel landing' : state.flying ? 'Land' : 'Lift'}
              </button>
            </div>
          )}
          {standard && state.desktopMode === 'trackpad' && state.trackpadSteering === 'flow' && <Optional><FlowHud /></Optional>}
          {standard && state.desktopMode === 'trackpad' && state.trackpadSteering === 'simple' && <Optional><SimpleTrackpadHud /></Optional>}
          {legendText && !state.limitHint && (
            <div className={`${styles.legend} ${state.flying ? styles.legendQuiet : ''}`} data-testid="legend">{legendText}</div>
          )}
        </>}
        {state.paused && !state.panel && !guide.Guide && !failed && !state.controlsOpen && <PauseCard ready={ready} onEnter={enter} note={guide.note} />}
        {!failed && showControlsPicker && <Optional><ControlUsage /></Optional>}
      </>}
      <div className="sr-only" aria-live="polite">{state.message}</div>
      {guide.Guide && <Boundary fallback={null} onError={guide.fail}><guide.Guide onClose={closeGuide} /></Boundary>}
      {state.panel && <TestPanel onClose={closePanel} onResume={() => { closePanel(); enter(); }} ready={ready} />}
      {state.started && !failed && standard && state.desktopMode === 'trackpad' && state.trackpadSteering === 'flow' && !state.flowIntroSeen && !state.panel && !state.journal && <FlowWelcome />}
    </main>
  </>;
}
