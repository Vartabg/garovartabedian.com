// Shared etched-print Path2D primitives, camera fit math, and subtle guide overlays for 2D playable stories.
const blocks = new Map<string, Path2D>();

export function print(ctx: CanvasRenderingContext2D, d: string, fill: string, stroke?: string, width = 1) {
  let path = blocks.get(d);
  if (!path) {
    path = new Path2D(d);
    blocks.set(d, path);
  }
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
