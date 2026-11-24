import { useEffect } from 'react';
import { clearInput, look, runtime, releaseHeldInput, releaseKeys, exitOwnPointerLock, unlockExpected } from '@/game/runtime';
import { flightFeel } from '@/game/flightFeel';
import { persistGame, useGame } from '@/game/store';
import { recordGesture } from '@/game/gestureLog';
import { touchMode } from '@/game/pointerMode';
import { isOrientationFlip, isPlaying, orientationOf } from './playLifecycle';
import { openTabletRecord } from './hermonActions';

export function pause() {
  recordGesture('pause');
  clearInput(true);
  useGame.setState({ paused: true, landing: false, pointerLocked: false, controlsOpen: false });
  if (document.pointerLockElement) document.exitPointerLock();
}

export function resume() {
  clearInput(true);
  runtime.skipSample = true;
  useGame.setState({
    started: true, paused: false, panel: false, journal: false, journalTerminalId: null,
    controlsOpen: false, message: '', leavePrompt: false,
  });
}

/**
 * A pointer lock ended. One the game asked for (exitOwnPointerLock: resize or touch scheme switch) only drops
 * held input; any other exit (Esc, browser, another window) pauses.
 */
export function pointerLockChanged() {
  const locked = !!document.pointerLockElement;
  useGame.setState({ pointerLocked: locked });
  if (locked) return;
  const g = useGame.getState();
  if (g.started && !g.paused) { if (unlockExpected()) clearInput(); else pause(); }
}

const SPACE_INTERACTIVE = 'button,a,input,select,textarea,dialog,[role="dialog"]';
const MOVE_CONTROLS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

export function useInput() {
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const state = useGame.getState();
      const target = e.target as HTMLElement | null;
      // Escape pauses during live flight unless a modal or the non-modal touch Controls sheet owns it.
      if (e.code === 'Escape') {
        if (state.started && !state.paused && !state.panel && !state.journal && !state.controlsOpen) pause();
        return;
      }
      if (state.paused || /INPUT|SELECT|TEXTAREA/.test(target?.tagName ?? '')) return;
      // Standalone ControlLeft / ControlRight descends on desktop without colliding with Cmd/Alt shortcuts.
      if ((e.code === 'ControlLeft' || e.code === 'ControlRight') && !e.metaKey && !e.altKey) {
        runtime.keys.add(e.code);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Shift: hold-to-surge.
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        runtime.keys.add(e.code);
        runtime.surge = true;
        return;
      }
      // Explicit wing-brake flare (keepShooter = true so active shield survives braking).
      if (e.code === 'KeyB' && !e.repeat) {
        e.preventDefault();
        clearInput(false, true);
        flightFeel.brake = true;
        flightFeel.serial++;
        return;
      }
      // Explicit landing onto targeted flat ground (or cancel landing in progress).
      if (e.code === 'KeyL' && !e.repeat && state.flying) {
        e.preventDefault();
        runtime.land = true;
        return;
      }
      // Space: take off from ground and hold to rise in air (unless activating a focused interactive control).
      if (e.code === 'Space') {
        if (target?.closest?.(SPACE_INTERACTIVE)) return;
        e.preventDefault();
        runtime.keys.add('Space');
        if (!state.flying && !e.repeat) runtime.lift = true;
        return;
      }
      // Touch: require releasing and re-pressing a held key after a brake or interruption.
      if (e.repeat && touchMode() && !runtime.keys.has(e.code)) return;
      if (MOVE_CONTROLS.includes(e.code)) { e.preventDefault(); runtime.keys.add(e.code); }
      if (e.repeat) return;
      if (e.code === 'KeyE' && state.nearTerminal) { e.preventDefault(); openTabletRecord(state.nearTerminalId); }
    };

    const keyup = (e: KeyboardEvent) => {
      runtime.keys.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!runtime.keys.has('ShiftLeft') && !runtime.keys.has('ShiftRight')) runtime.surge = false;
      }
    };

    const mouse = (e: MouseEvent) => {
      if (document.pointerLockElement && !useGame.getState().paused) {
        const state = useGame.getState();
        look(e.movementX, e.movementY, state.lookSensitivity, state.invertY);
        recordGesture('captured-steer', { deltaX: e.movementX, deltaY: e.movementY });
      }
    };

    const blur = () => { if (!touchMode()) pause(); else if (isPlaying(useGame.getState())) releaseKeys(); };
    const liveGame = () => { const g = useGame.getState(); return g.started && !g.paused; };
    const hidden = () => { if (document.hidden && liveGame()) pause(); };
    const pagehide = () => { if (liveGame()) pause(); if (useGame.getState().started) persistGame(); };
    const pageshow = (e: PageTransitionEvent) => { if (e.persisted && liveGame()) pause(); };
    const layoutOrientation = () => orientationOf(document.documentElement.clientWidth || innerWidth, document.documentElement.clientHeight || innerHeight);
    let orientation = layoutOrientation();
    const resized = () => {
      const next = layoutOrientation(), flipped = isOrientationFlip(orientation, next);
      orientation = next;
      if (touchMode()) { if (flipped) releaseHeldInput(); return; }
      clearInput(true); exitOwnPointerLock(); useGame.setState(s => ({ landing: false, inputEpoch: s.inputEpoch + 1 }));
    };

    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
    window.addEventListener('mousemove', mouse); window.addEventListener('blur', blur); window.addEventListener('resize', resized);
    window.addEventListener('pagehide', pagehide); window.addEventListener('pageshow', pageshow);
    document.addEventListener('visibilitychange', hidden); document.addEventListener('pointerlockchange', pointerLockChanged);
    window.screen.orientation?.addEventListener('change', resized);
    return () => {
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('mousemove', mouse);
      window.removeEventListener('blur', blur); window.removeEventListener('resize', resized);
      window.removeEventListener('pagehide', pagehide); window.removeEventListener('pageshow', pageshow);
      document.removeEventListener('visibilitychange', hidden); document.removeEventListener('pointerlockchange', pointerLockChanged);
      window.screen.orientation?.removeEventListener('change', resized); clearInput(true);
    };
  }, []);
}
