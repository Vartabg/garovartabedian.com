import type { ElahState } from './elahGame';
import { walkTo } from './elahGame';
import type { createElahView } from './elahView';

type View = ReturnType<typeof createElahView>;
type Drag = { pointerId: number; x: number; y: number; moved: boolean };

export function elahPointer(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  active: () => boolean,
  view: () => View | undefined,
  state: () => ElahState,
  approachTarget: (id: string) => void,
) {
  let drag: Drag | undefined;
  const axis = { x: 0, y: 0 };

  function clear() {
    drag = undefined;
    axis.x = 0;
    axis.y = 0;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0 || !active() || !view()) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    drag = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  }, { signal });

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
  }, { signal });

  canvas.addEventListener('pointerup', (e) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const tap = !drag.moved;
    clear();
    const projection = view();
    if (!tap || !projection || !active()) return;
    const position = projection.toWorld(e.clientX, e.clientY);
    const hitId = projection.hit(state(), position);
    if (hitId) approachTarget(hitId);
    else walkTo(state(), position);
  }, { signal });

  canvas.addEventListener('pointercancel', clear, { signal });
  canvas.addEventListener('lostpointercapture', clear, { signal });
  return { axis, clear };
}
