import { COURT_WIDTH as courtWidth, COURT_HEIGHT as courtHeight, nearby, type Court, type Fixture, type Point } from "./courtGame";
import { drawCourtyard } from "./courtScenery";
import { drawPerson } from "./courtPeople";
import { drawFixture, drawSpill } from "./courtProps";

import { polygon } from "./courtInk";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function verticalCameraTop(visibleHeight: number, feetY: number) {
  if (visibleHeight >= courtHeight) return (courtHeight - visibleHeight) / 2;
  const courtBottom = 433;
  const roomAboveFeet = Math.min(128, visibleHeight * .77);
  return Math.max(0, Math.min(courtBottom - visibleHeight, feetY - roomAboveFeet));
}

function marker(c: CanvasRenderingContext2D, x: number, y: number, time: number, reduced: boolean) {
  const lift = reduced ? 0 : Math.sin(time * 3.6) * 1.8;
  c.save(); c.translate(x, y + lift);
  polygon(c, "#4c3628", -7, -9, 7, -9, 0, 1);
  polygon(c, "#fff0a5", -5, -8, 5, -8, 0, -1);
  c.restore();
}

function stallKeeper(c: CanvasRenderingContext2D, f: Fixture, index: number, time: number) {
  const age = f.at === null ? 0 : time - f.at;
  if (age > 3.5) return;
  const t = clamp((age - .16) / 3.3, 0, 1);
  const dir = index % 2 === 0 ? 1 : -1, x = f.x + dir * (50 + t * 85), y = f.y - 16 - (f.y - 160) * t;
  c.save(); c.globalAlpha = 1 - clamp((t - .76) / .24, 0, 1);
  drawPerson(c, x, y, "seller", t > 0 ? dir : -dir, t > 0 ? t * 36 : 0, age > 0 && age < .35 ? .7 : 0, index);
  c.restore();
}

export function createView(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width = 1, height = 1, scale = 1, left = 0, top = 0, pixelRatio = 1, centered = false;
  const back = document.createElement("canvas");
  back.width = courtWidth * 2; back.height = courtHeight * 2;
  const ink = back.getContext("2d");
  if (ink) { ink.scale(2, 2); drawCourtyard(ink); }

  function size() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width); height = Math.max(1, box.height);
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
    scale = Math.min(width / 310, Math.max(height / (courtHeight * .82), width / 1040));
    centered = false;
  }
  function toWorld(x: number, y: number): Point {
    const box = canvas.getBoundingClientRect();
    return { x: (x - box.left) / scale + left, y: (y - box.top) / scale + top };
  }
  function hit(s: Court, p: Point) {
    return s.fixtures.filter(f => f.at === null).sort((a, b) => b.y - a.y).find(f => {
      const gate = f.kind === "gate", seat = f.kind === "seat";
      return Math.abs(f.x - p.x) < (gate ? 50 : seat ? 35 : 52) && p.y > f.y - (gate ? 91 : seat ? 56 : 70) && p.y < f.y + 20;
    });
  }
  function draw(s: Court, dt: number, reduced: boolean) {
    const span = width / scale;
    top = verticalCameraTop(height / scale, s.player.y);
    const to = span >= courtWidth ? (courtWidth - span) / 2 : clamp(s.player.x - span * .43, 0, courtWidth - span);
    left = centered ? left + (to - left) * (1 - Math.exp(-dt * 11)) : to;
    centered = true;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = "#c7a879"; ctx.fillRect(0, 0, width, height);
    ctx.scale(scale, scale); ctx.translate(-left, -top);
    if (ink) ctx.drawImage(back, 0, 0, courtWidth, courtHeight); else drawCourtyard(ctx);
    const time = s.time, near = nearby(s);
    const gate = s.fixtures.find(f => f.kind === "gate")!;
    const rows: { y: number; draw: () => void }[] = [];
    if (s.destination && !s.selected) {
      const p = s.destination;
      ctx.strokeStyle = "#473f32"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 3.2, 0, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = "#f6eac5"; ctx.fillRect(p.x - 2, p.y - 1, 4, 2);
    }
    for (const [i, f] of s.fixtures.entries()) {
      rows.push({ y: f.y, draw: () => drawFixture(ctx, f, time, reduced) });
      if (f.kind !== "gate") {
        rows.push({ y: f.y - 16 - (f.at === null ? 0 : clamp((time - f.at - .16) / 3.3, 0, 1) * (f.y - 160)), draw: () => stallKeeper(ctx, f, i, time) });
        if (f.at !== null) rows.push({ y: f.y + 4, draw: () => drawSpill(ctx, f, time, reduced) });
      }
    }
    for (const [i, spot] of [[0, 355], [1, 740], [2, 1085]]) {
      const linked = s.fixtures[[0, 2, 4][i]], age = linked.at === null ? 0 : time - linked.at;
      if (age > 3.6) continue;
      const ground = 232 + i * 7 - Math.max(0, age - .2) * 14;
      rows.push({
y: ground, draw: () => {
          ctx.save(); ctx.globalAlpha = clamp((3.6 - age) / .9, 0, 1);
          drawPerson(ctx, spot + Math.max(0, age - .15) * (i % 2 ? 48 : -48), ground, "buyer", i % 2 ? 1 : -1, age > 0 ? age * 11 : 0, 0, i + 2);
          ctx.restore();
        }
});
    }
    const elapsed = gate.at === null ? 0 : time - gate.at;
    if (gate.at === null || elapsed < 3.5) {
      const cycle = (gate.at ?? time) * .46;
      const initial = gate.x + Math.sin(cycle) * 41;
      const x = initial + (gate.at === null ? 0 : elapsed * 41);
      const y = gate.y - 3 + (gate.at === null ? Math.sin(cycle) * 12 : -elapsed * 9);
      rows.push({
y, draw: () => {
          ctx.save(); ctx.globalAlpha = gate.at === null ? 1 : clamp((3.5 - elapsed) / .7, 0, 1);
          drawPerson(ctx, x, y, "carrier", gate.at === null && Math.cos(cycle) < 0 ? -1 : 1, time * 6.8, 0, 2);
          ctx.restore();
        }
});
    }
    rows.push({
y: s.player.y, draw: () => {
        const age = time - s.shoveAt;
        const reach = age >= 0 && age < .42 ? Math.sin(Math.PI * clamp(age / .42, 0, 1)) ** .65 : 0;
        drawPerson(ctx, s.player.x + s.facing * reach * 5, s.player.y, "jesus", s.facing, s.walking ? s.stride : 0, reach, 0);
      }
});
    rows.sort((a, b) => a.y - b.y);
    for (const row of rows) row.draw();
    if (s.seq === 0 && !s.walking) {
      ctx.save(); ctx.translate(s.player.x, s.player.y + 11);
      ctx.fillStyle = "#463b31"; ctx.fillRect(-20, 0, 40, 13);
      ctx.font = "bold 9px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff2ce";
      ctx.fillText("JESUS", 0, 9.5); ctx.restore();
    }
    const target = s.fixtures.find(f => f.id === s.selected) ?? near;
    if (target) marker(ctx, target.x, target.y - (target.kind === "gate" ? 84 : target.kind === "seat" ? 58 : 66), time, reduced);
    const next = s.fixtures.filter(f => f.at === null).sort((a, b) => Math.hypot(a.x - s.player.x, a.y - s.player.y) - Math.hypot(b.x - s.player.x, b.y - s.player.y))[0];
    // Show the direction when the next object falls outside a narrow camera.
    if (!target && next && (next.x > left + span - 20 || next.x < left + 20)) {
      const right = next.x > left + span / 2;
      const x = right ? left + span - 21 : left + 21, y = top + height / scale * .59;
      ctx.save(); ctx.translate(x, y); ctx.scale(right ? 1 : -1, 1);
      polygon(ctx, "#514237", -5, -8, 6, 0, -5, 8); polygon(ctx, "#fff1a8", -4, -5, 3, 0, -4, 5); ctx.restore();
    }

  }
  size();
  return { size, draw, toWorld, hit };
}
