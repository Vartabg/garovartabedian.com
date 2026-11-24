import type { DragVisualState } from './storyInk';
import { attachStoryPointer, type WorldPoint } from './storyPointer';

const MOVE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};

export interface StoryStageHooks {
  onStep: (dt: number, x: number, y: number, now: number, reduced: boolean) => void;
  onDraw: (dt: number, reduced: boolean) => void;
  onPerform: () => void;
  onTap: (point: WorldPoint) => void;
  toWorld: (clientX: number, clientY: number) => WorldPoint | undefined;
  onHover?: (point: WorldPoint | undefined) => boolean;
  /** Optional hold-to-charge capture on Space/Enter keydown. Return true to suppress onPerform until keyup. */
  onActionDown?: () => boolean;
  onActionUp?: () => void;
  onActionCancel?: () => void;
  /** Optional pointer hold-to-charge capture on pointerdown. Cancels cleanly on >= 8 px drag or pointercancel. */
  onHoldStart?: (point: WorldPoint) => boolean;
  onHoldEnd?: () => void;
  onHoldCancel?: () => void;
  onInteract?: () => void;
  onResize?: () => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onPauseChange?: (paused: boolean) => void;
  onVisualError?: () => void;
}

export interface StoryStageController {
  isPaused: () => boolean;
  isActive: () => boolean;
  reduced: () => boolean;
  getDragState: () => DragVisualState;
  setPaused: (next: boolean) => void;
  togglePause: () => void;
  requestPaint: () => void;
  clearInput: () => void;
  dispose: () => void;
}

/**
 * Shared browser stage lifecycle for 2D playable stories:
 * - Keyboard WASD/Arrows, P/Escape pause, Space/Enter action or hold-to-charge capture (outer <section> guarded)
 * - Hybrid pointer tap, drag-steer compass, hover affordance, and hold-to-charge via attachStoryPointer
 * - True idle-pause / hidden-tab rAF shutdown & clean wake (zero background CPU burn)
 * - ResizeObserver, live devicePixelRatio monitor tracking, and contextlost/contextrestored recovery
 * - Capped requestAnimationFrame delta loop (dt <= 0.05) with clock reset on pause/resume/idle wake
 */
export function runStoryStage(canvas: HTMLCanvasElement, hooks: StoryStageHooks): StoryStageController {
  const section = canvas.closest('section');
  const motion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : ({ matches: false } as MediaQueryList);
  const held = new Set<string>();
  const stop = new AbortController();

  let disposed = false;
  let paused = false;
  let actionHeld = false;
  let dirtyPaint = true;
  let frame = 0;
  let last = 0;

  function ensureFrame() {
    if (disposed || frame !== 0) return;
    frame = requestAnimationFrame(animate);
  }

  function stopFrame() {
    if (frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    last = 0;
  }

  function isActive() {
    if (document.hidden || paused) return false;
    hooks.onInteract?.();
    return true;
  }

  function clearInput() {
    held.clear();
    if (actionHeld) {
      actionHeld = false;
      hooks.onActionCancel?.();
    }
    pointer.clear();
    last = 0;
  }

  function setPaused(next: boolean) {
    if (paused === next) return;
    paused = next;
    clearInput();
    hooks.onPauseChange?.(paused);
    if (paused) {
      if (!dirtyPaint) stopFrame();
    } else if (!document.hidden) {
      dirtyPaint = true;
      ensureFrame();
    }
  }

  function togglePause() {
    hooks.onInteract?.();
    setPaused(!paused);
    if (!paused) canvas.focus({ preventScroll: true });
  }

  function requestPaint() {
    dirtyPaint = true;
    ensureFrame();
  }

  const pointer = attachStoryPointer(canvas, {
    signal: stop.signal,
    active: isActive,
    toWorld: hooks.toWorld,
    onTap: hooks.onTap,
    onHover: hooks.onHover
      ? (pt) => {
          const hit = hooks.onHover!(pt);
          if (paused) {
            dirtyPaint = true;
            ensureFrame();
          }
          return hit;
        }
      : undefined,
    onHoldStart: hooks.onHoldStart,
    onHoldEnd: hooks.onHoldEnd,
    onHoldCancel: hooks.onHoldCancel,
  });

  function animate(now: number) {
    frame = 0;
    if (disposed) return;

    const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 0;
    last = now;
    const reduced = motion.matches;

    const activeLoop = !paused && !document.hidden;
    if (activeLoop) {
      let x = pointer.axis.x;
      let y = pointer.axis.y;
      for (const key of held) {
        const v = MOVE_KEYS[key];
        x += v[0];
        y += v[1];
      }
      hooks.onStep(dt, x, y, now, reduced);
    }

    if (activeLoop || dirtyPaint) {
      dirtyPaint = false;
      try {
        hooks.onDraw(activeLoop ? dt : 0, reduced);
      } catch {
        hooks.onVisualError?.();
      }
    }

    if (!paused && !document.hidden) {
      ensureFrame();
    } else {
      last = 0;
    }
  }

  const opts = { signal: stop.signal };
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target && target !== document.body && target !== document.documentElement && !section?.contains(target)) {
      return;
    }
    if (target?.closest('summary, a, input, textarea, select')) return;

    if (MOVE_KEYS[e.code]) {
      e.preventDefault();
      if (isActive()) held.add(e.code);
    } else if (e.code === 'KeyP' || (e.code === 'Escape' && !paused && target === canvas)) {
      if (!e.repeat) {
        e.preventDefault();
        togglePause();
      }
    } else if ((e.code === 'Space' || e.code === 'Enter') && !target?.closest('button')) {
      e.preventDefault();
      if (!e.repeat) {
        if (isActive() && hooks.onActionDown?.()) {
          actionHeld = true;
        } else {
          hooks.onPerform();
        }
      }
    }
  }, opts);

  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
    if ((e.code === 'Space' || e.code === 'Enter') && actionHeld) {
      actionHeld = false;
      if (!paused && !document.hidden) hooks.onActionUp?.();
      else hooks.onActionCancel?.();
    }
  }, opts);

  window.addEventListener('blur', () => setPaused(true), opts);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      setPaused(true);
    } else if (!paused) {
      last = 0;
      dirtyPaint = true;
      ensureFrame();
    }
  }, opts);

  const resize = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
        if (disposed) return;
        hooks.onResize?.();
        requestPaint();
      })
    : undefined;
  resize?.observe(canvas);

  // Re-size canvas cleanly when dragged across displays with different devicePixelRatio.
  function watchDpr() {
    if (disposed || typeof window.matchMedia !== 'function') return;
    const dpr = window.devicePixelRatio || 1;
    const mql = window.matchMedia(`(resolution: ${dpr}dppx)`);
    if (typeof mql?.addEventListener !== 'function') return;
    mql.addEventListener('change', () => {
      if (disposed) return;
      hooks.onResize?.();
      requestPaint();
      watchDpr();
    }, { once: true, signal: stop.signal });
  }
  watchDpr();

  canvas.addEventListener('contextlost', (e) => {
    e.preventDefault();
    pointer.clear();
    hooks.onContextLost?.();
  }, opts);

  canvas.addEventListener('contextrestored', () => {
    hooks.onContextRestored?.();
    requestPaint();
  }, opts);

  ensureFrame();

  return {
    isPaused: () => paused,
    isActive,
    reduced: () => motion.matches,
    getDragState: () => pointer.dragState,
    setPaused,
    togglePause,
    requestPaint,
    clearInput,
    dispose() {
      disposed = true;
      clearInput();
      stop.abort();
      resize?.disconnect();
      stopFrame();
    },
  };
}
