// Recurring silhouettes are cut once for crisp etched-print valley rendering.
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

export function oval(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, rx: number, ry: number, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
