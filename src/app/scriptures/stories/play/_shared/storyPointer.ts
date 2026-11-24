import type { DragVisualState } from './storyInk';

export type WorldPoint = { x: number; y: number };

export interface StoryPointerOptions {
  signal: AbortSignal;
  active: () => boolean;
  toWorld: (clientX: number, clientY: number) => WorldPoint | undefined;
  onTap: (point: WorldPoint) => void;
  onHover?: (point: WorldPoint | undefined) => boolean;
  onHoldStart?: (point: WorldPoint) => boolean;
  onHoldEnd?: () => void;
  onHoldCancel?: () => void;
}

type Drag = {
  pointerId: number;
  x: number;
  y: number;
  originCssX: number;
  originCssY: number;
  moved: boolean;
  holding: boolean;
};

/**
 * Shared tap, drag-steer, hover-affordance, and hold-to-charge canvas pointer controller:
 * - Short tap (< 8 px drift) projects client coordinates to world space and fires onTap.
 * - Drag (>= 8 px drift) exposes a smooth normalized steering vector in `axis` and CSS-pixel drag compass in `dragState`.
 * - Mouse/pen hover calls `onHover(worldPt)` and switches canvas cursor between `pointer` and `default`.
 * - Optional hold-to-charge captures pointerdown without colliding with drag steering (cancels cleanly on >= 8 px drift or pointercancel).
 */
export function attachStoryPointer(canvas: HTMLCanvasElement, options: StoryPointerOptions) {
  let drag: Drag | undefined;
  let hasHover = false;
  const axis = { x: 0, y: 0 };
  const dragState: DragVisualState = { active: false, originX: 0, originY: 0, curX: 0, curY: 0 };

  function setCursor(interactive: boolean) {
    canvas.style.cursor = interactive ? 'pointer' : 'default';
  }

  function clearHover() {
    setCursor(false);
    if (!hasHover) return;
    hasHover = false;
    options.onHover?.(undefined);
  }

  function clear() {
    if (drag?.holding) {
      drag.holding = false;
      options.onHoldCancel?.();
    }
    drag = undefined;
    axis.x = 0;
    axis.y = 0;
    dragState.active = false;
    clearHover();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0 || !options.active()) return;
    const worldPt = options.toWorld(e.clientX, e.clientY);
    if (!worldPt) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    const box = canvas.getBoundingClientRect();
    const holding = Boolean(options.onHoldStart?.(worldPt));
    drag = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      originCssX: e.clientX - box.left,
      originCssY: e.clientY - box.top,
      moved: false,
      holding,
    };
    dragState.active = false;
    dragState.originX = drag.originCssX;
    dragState.originY = drag.originCssY;
    dragState.curX = drag.originCssX;
    dragState.curY = drag.originCssY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch { /* Non-capturable synthetic pointer event. */ }
  }, { signal: options.signal });

  canvas.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.pointerId) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 8 && !drag.moved) return;
      if (drag.holding) {
        drag.holding = false;
        options.onHoldCancel?.();
      }
      drag.moved = true;
      const radius = Math.max(28, distance);
      axis.x = dx / radius;
      axis.y = dy / radius;
      const box = canvas.getBoundingClientRect();
      dragState.active = true;
      dragState.curX = e.clientX - box.left;
      dragState.curY = e.clientY - box.top;
      return;
    }

    if (drag || e.pointerType === 'touch' || !options.onHover) return;
    const worldPt = options.toWorld(e.clientX, e.clientY);
    hasHover = Boolean(worldPt);
    setCursor(Boolean(worldPt && options.onHover(worldPt)));
  }, { signal: options.signal });

  canvas.addEventListener('pointerup', (e) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const tap = !drag.moved;
    const wasHolding = drag.holding;
    drag.holding = false;
    drag = undefined;
    axis.x = 0;
    axis.y = 0;
    dragState.active = false;

    if (wasHolding && tap) {
      if (options.active()) options.onHoldEnd?.();
      else options.onHoldCancel?.();
      return;
    }
    if (!tap || !options.active()) return;
    const position = options.toWorld(e.clientX, e.clientY);
    if (position) options.onTap(position);
  }, { signal: options.signal });

  canvas.addEventListener('pointerleave', () => {
    if (!drag) clearHover();
  }, { signal: options.signal });

  canvas.addEventListener('pointercancel', clear, { signal: options.signal });
  canvas.addEventListener('lostpointercapture', clear, { signal: options.signal });

  return { axis, dragState, clear };
}
