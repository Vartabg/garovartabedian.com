// Shared etched-print Path2D primitives, camera fit math, and subtle guide overlays for 2D playable stories.
const MAX_CACHED_PATHS = 512;
const blocks = new Map<string, Path2D>();

export interface DragVisualState {
  active: boolean;
  originX: number;
  originY: number;
  curX: number;
  curY: number;
}

export function inkCacheSize(): number {
  return blocks.size;
}

export function clearInkCache(): void {
  blocks.clear();
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  fill: string,
  stroke?: string,
  width = 1,
) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke(path);
  }
}

/** Draws and caches a static SVG path string with a bounded FIFO cache (never grows unbounded). */
export function print(ctx: CanvasRenderingContext2D, d: string, fill: string, stroke?: string, width = 1) {
  let path = blocks.get(d);
  if (!path) {
    if (blocks.size >= MAX_CACHED_PATHS) {
      const oldest = blocks.keys().next().value;
      if (oldest !== undefined) blocks.delete(oldest);
    }
    path = new Path2D(d);
    blocks.set(d, path);
  }
  drawPath(ctx, path, fill, stroke, width);
}

/** Draws a per-frame dynamic/interpolated SVG path string without inserting into the static cache. */
export function printDynamic(ctx: CanvasRenderingContext2D, d: string, fill: string, stroke?: string, width = 1) {
  drawPath(ctx, new Path2D(d), fill, stroke, width);
}

export function polygon(ctx: CanvasRenderingContext2D, color: string, ...points: number[]) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function line(ctx: CanvasRenderingContext2D, color: string, width: number, ...points: number[]) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function stone(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function oval(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
  angle = 0,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function fitVerticalCamera(
  worldHeight: number,
  floorBottom: number,
  maxHeadroom: number,
  headroomRatio: number,
  visibleHeight: number,
  feetY: number,
): number {
  if (visibleHeight >= worldHeight) return (worldHeight - visibleHeight) / 2;
  const roomAboveFeet = Math.min(maxHeadroom, visibleHeight * headroomRatio);
  return Math.max(0, Math.min(floorBottom - visibleHeight, feetY - roomAboveFeet));
}

export function drawGuideMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  reduced: boolean,
): void {
  const lift = reduced ? 0 : Math.sin(time * 3.6) * 1.8;
  ctx.save();
  ctx.translate(x, y + lift);
  polygon(ctx, '#4c3628', -7, -9, 7, -9, 0, 1);
  polygon(ctx, '#fff0a5', -5, -8, 5, -8, 0, -1);
  ctx.restore();
}

/** Subtle etched highlight ellipse rendered in world space under a hovered interactive target. */
export function drawHoverRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color = 'rgba(255, 241, 174, .88)',
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(42, 31, 22, .45)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.65;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Tactile virtual steering compass drawn in canvas CSS-pixel space (after `setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)`).
 * Visible only while pointer drag drift exceeds the 8 px drag threshold (`drag.active === true`).
 */
export function drawDragCompass(
  ctx: CanvasRenderingContext2D,
  drag: DragVisualState,
  reduced: boolean,
): void {
  if (!drag.active) return;
  const dx = drag.curX - drag.originX;
  const dy = drag.curY - drag.originY;
  const dist = Math.hypot(dx, dy);
  const maxR = 32;
  const clampDist = Math.min(maxR, dist);
  const nx = dist > 1e-4 ? (dx / dist) * clampDist : 0;
  const ny = dist > 1e-4 ? (dy / dist) * clampDist : 0;

  ctx.save();
  ctx.strokeStyle = 'rgba(44, 34, 24, .46)';
  ctx.fillStyle = 'rgba(255, 246, 218, .18)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(drag.originX, drag.originY, maxR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 243, 198, .75)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(drag.originX, drag.originY, maxR - 1.5, 0, Math.PI * 2);
  ctx.stroke();

  if (!reduced && clampDist > 2) {
    ctx.strokeStyle = 'rgba(255, 243, 198, .72)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(drag.originX, drag.originY);
    ctx.lineTo(drag.originX + nx, drag.originY + ny);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(44, 34, 24, .62)';
  ctx.beginPath();
  ctx.arc(drag.originX + nx, drag.originY + ny, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2ce';
  ctx.beginPath();
  ctx.arc(drag.originX + nx, drag.originY + ny, 6.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEdgeArrow(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  span: number,
  visibleHeight: number,
  targetX: number,
): void {
  const right = targetX > left + span / 2;
  const x = right ? left + span - 21 : left + 21;
  const y = top + visibleHeight * 0.59;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(right ? 1 : -1, 1);
  polygon(ctx, '#514237', -5, -8, 6, 0, -5, 8);
  polygon(ctx, '#fff1a8', -4, -5, 3, 0, -4, 5);
  ctx.restore();
}
