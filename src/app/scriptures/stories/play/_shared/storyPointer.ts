export type WorldPoint = { x: number; y: number };

export interface StoryPointerOptions {
  signal: AbortSignal;
  active: () => boolean;
  toWorld: (clientX: number, clientY: number) => WorldPoint | undefined;
  onTap: (point: WorldPoint) => void;
}

type Drag = { pointerId: number; x: number; y: number; moved: boolean };

/**
 * Shared tap-or-drag canvas pointer controller:
 * - Short tap (< 8 px drift) projects client coordinates to world space and fires onTap.
 * - Drag (>= 8 px drift) exposes a smooth normalized steering vector in `axis`.
 */
export function attachStoryPointer(canvas: HTMLCanvasElement, options: StoryPointerOptions) {
  let drag: Drag | undefined;
  const axis = { x: 0, y: 0 };

  function clear() {
    drag = undefined;
    axis.x = 0;
    axis.y = 0;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0 || !options.active()) return;
    if (!options.toWorld(e.clientX, e.clientY)) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    drag = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  }, { signal: options.signal });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8 && !drag.moved) return;
    drag.moved = true;
    const radius = Math.max(28, distance);
    axis.x = dx / radius;
    axis.y = dy / radius;
  }, { signal: options.signal });

  canvas.addEventListener('pointerup', (e) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const tap = !drag.moved;
    clear();
    if (!tap || !options.active()) return;
    const position = options.toWorld(e.clientX, e.clientY);
    if (position) options.onTap(position);
  }, { signal: options.signal });

  canvas.addEventListener('pointercancel', clear, { signal: options.signal });
  canvas.addEventListener('lostpointercapture', clear, { signal: options.signal });

  return { axis, clear };
}
