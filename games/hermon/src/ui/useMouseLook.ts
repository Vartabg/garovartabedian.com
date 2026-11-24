import { useCallback, useEffect, useRef, type PointerEvent, type RefObject } from 'react';
import { look } from '@/game/runtime';
import { useGame } from '@/game/store';

type Press = { id: number; x: number; y: number; dragged: boolean };
const DRAG_LOOK_PX = 5;

function requestCanvasLock() {
  const canvas = document.querySelector('canvas');
  if (!canvas?.requestPointerLock) return;
  try { void Promise.resolve(canvas.requestPointerLock()).catch(() => {}); } catch { /* drag-look remains active */ }
}

/** Standard desktop mouse look: drag on the scene to look without locking, or short-click for Pointer Lock. */
export function useMouseLook(surface: RefObject<HTMLDivElement | null>) {
  const press = useRef<Press | null>(null);
  const last = useRef({ x: 0, y: 0 });
  const paused = useGame(s => s.paused);
  const dropPress = useCallback(() => { press.current = null; }, []);

  useEffect(() => {
    if (paused) dropPress();
    return dropPress;
  }, [surface, paused, dropPress]);

  const start = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || useGame.getState().paused) return;
    if (document.pointerLockElement) return;
    press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dragged: false };
    last.current = { x: e.clientX, y: e.clientY };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* optional capture */ }
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const state = useGame.getState();
    if (state.paused || document.pointerLockElement) return;
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.dragged && Math.hypot(e.clientX - p.x, e.clientY - p.y) >= DRAG_LOOK_PX) p.dragged = true;
    if (p.dragged) look(e.clientX - last.current.x, e.clientY - last.current.y, state.lookSensitivity, state.invertY);
    last.current = { x: e.clientX, y: e.clientY };
  };

  const end = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const state = useGame.getState();
    // Release pointer capture first (WebKit/Safari compatibility), then lock on a clean short click.
    if (!p.dragged && !state.paused && !document.pointerLockElement) requestCanvasLock();
  };

  return { start, move, end, leave: dropPress, cancel: dropPress, lostCapture: dropPress };
}
