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
  setPaused: (next: boolean) => void;
  togglePause: () => void;
  requestPaint: () => void;
  clearInput: () => void;
  dispose: () => void;
}

/**
 * Shared browser stage lifecycle for 2D playable stories:
 * - Keyboard WASD/Arrows, P/Escape pause, Space/Enter action (with outer <section> containment guard)
 * - Hybrid pointer drag/tap via attachStoryPointer
 * - window.blur / visibilitychange auto-pause
 * - ResizeObserver & contextlost/contextrestored recovery with dirtyPaint while paused
 * - Capped requestAnimationFrame delta loop (dt <= 0.05) with clock reset on pause/resume/reset
 */
export function runStoryStage(canvas: HTMLCanvasElement, hooks: StoryStageHooks): StoryStageController {
  const section = canvas.closest('section');
  const motion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : ({ matches: false } as MediaQueryList);
  const held = new Set<string>();
  const stop = new AbortController();

  let paused = false;
  let dirtyPaint = true;
  let frame = 0;
  let last = 0;

  function isActive() {
    if (document.hidden || paused) return false;
    hooks.onInteract?.();
    return true;
  }

  function clearInput() {
    held.clear();
    pointer.clear();
    last = 0;
  }

  function setPaused(next: boolean) {
    if (paused === next) return;
    paused = next;
    clearInput();
    hooks.onPauseChange?.(paused);
  }

  function togglePause() {
    hooks.onInteract?.();
    setPaused(!paused);
    if (!paused) canvas.focus({ preventScroll: true });
  }

  function requestPaint() {
    dirtyPaint = true;
  }

  const pointer = attachStoryPointer(canvas, {
    signal: stop.signal,
    active: isActive,
    toWorld: hooks.toWorld,
    onTap: hooks.onTap,
  });

  function animate(now: number) {
    const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 0;
    last = now;
    const reduced = motion.matches;

    if (!paused && !document.hidden) {
      let x = pointer.axis.x;
      let y = pointer.axis.y;
      for (const key of held) {
        const v = MOVE_KEYS[key];
        x += v[0];
        y += v[1];
      }
      hooks.onStep(dt, x, y, now, reduced);
    }

    if (!paused || dirtyPaint) {
      try {
        hooks.onDraw(paused ? 0 : dt, reduced);
      } catch {
        hooks.onVisualError?.();
      }
    }
    dirtyPaint = false;
    frame = requestAnimationFrame(animate);
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
      if (!e.repeat) hooks.onPerform();
    }
  }, opts);

  window.addEventListener('keyup', (e) => held.delete(e.code), opts);
  window.addEventListener('blur', () => setPaused(true), opts);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
  }, opts);

  const resize = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
        hooks.onResize?.();
        dirtyPaint = true;
      })
    : undefined;
  resize?.observe(canvas);

  canvas.addEventListener('contextlost', (e) => {
    e.preventDefault();
    pointer.clear();
    hooks.onContextLost?.();
  }, opts);

  canvas.addEventListener('contextrestored', () => {
    hooks.onContextRestored?.();
    dirtyPaint = true;
  }, opts);

  frame = requestAnimationFrame(animate);

  return {
    isPaused: () => paused,
    isActive,
    reduced: () => motion.matches,
    setPaused,
    togglePause,
    requestPaint,
    clearInput,
    dispose() {
      stop.abort();
      resize?.disconnect();
      cancelAnimationFrame(frame);
    },
  };
}
