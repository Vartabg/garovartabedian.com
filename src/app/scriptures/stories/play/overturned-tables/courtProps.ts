import { oval, polygon } from "./courtInk";
import type { Fixture } from "./courtGame";

type Brush = CanvasRenderingContext2D;
function timber(c: Brush, x: number, y: number, height: number) {
  c.fillStyle = "#4f392c"; c.fillRect(x, y, 7, height);
  c.fillStyle = "#b67741"; c.fillRect(x, y, 2, height - 2);
}
function table(c: Brush, standing: boolean) {
  timber(c, -33, -29, 28); timber(c, 26, -29, 28);
  timber(c, -25, -40, 27); timber(c, 35, -40, 27);
  polygon(c, "#704632", -30, -10, 30, -21, 30, -17, -30, -6);
  polygon(c, "#513a2b", -44, -32, -35, -47, 45, -47, 45, -40, 37, -26, -44, -26);
  polygon(c, "#aa7447", -44, -32, -35, -47, 45, -47, 37, -32);
  polygon(c, "#d9a368", -44, -32, 37, -32, 37, -29, -44, -29);
  for (let i = 0; i < 4; i++) {
    polygon(c, "#805138", -36 + i * 20, -34, -28 + i * 20, -45, -27 + i * 20, -45, -35 + i * 20, -34);
  }
  if (!standing) return;
  polygon(c, "#39565a", -14, -46, 9, -46, 2, -32, 2, -21, -20, -21, -20, -32);
  polygon(c, "#cad1a2", -18, -24, 1, -24, 1, -22, -19, -22);
  for (const [px, py, n] of [[-28, -36, 3], [-21, -40, 2], [14, -39, 4], [25, -37, 2], [3, -39, 1]]) {
    for (let j = 0; j < n; j++) {
      oval(c, "#785327", px, py - j * 1.7, 3.6, 1.9);
      oval(c, "#f4cb66", px - .4, py - j * 1.7 - 1, 3.2, 1.25);
    }
  }
  c.strokeStyle = "#4c3931"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-1, -42); c.lineTo(-1, -57); c.moveTo(-12, -52); c.lineTo(10, -55); c.stroke();
  for (const [x, y] of [[-11, -51], [9, -54]]) {
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 6); c.lineTo(x + 3, y + 6); c.closePath(); c.stroke();
    polygon(c, "#cda354", x - 5, y + 6, x + 5, y + 6, x + 2, y + 8, x - 2, y + 8);
  }
}
export function dove(c: Brush, x: number, y: number, phase: number, direction: number, airborne: boolean) {
  c.save(); c.translate(x, y); c.scale(direction, 1);
  polygon(c, "#586a6b", -10, 0, -17, -4, -11, 4, 0, 5, 5, 1);
  oval(c, "#f4f0da", 0, 0, 7, 3.7); oval(c, "#fff8dc", 5.2, -3.2, 3.1, 3.1);
  polygon(c, "#ab7034", 8, -4, 12, -3, 8, -2); oval(c, "#323c39", 6, -4.2, .8, .8);
  if (airborne) {
    const flap = Math.sin(phase);
    polygon(c, "#ede9d6", 2, -1, -4, -5, -12, -6 + flap * 11, -18, -7 + flap * 16, -8, 1, -2, 2);
    polygon(c, "#a8b6b4", -6, -2, -15, -1 + flap * 12, -8, 2, 1, 1);
  } else polygon(c, "#b3c0b8", -6, -1, 1, -2, 3, 0, -4, 2, -10, 2);
  c.restore();
}
function seat(c: Brush, standing: boolean) {
  for (const x of [-16, 13]) timber(c, x, -20, 20);
  timber(c, -9, -26, 18); timber(c, 18, -26, 16);
  polygon(c, "#684234", -22, -22, -14, -32, 25, -32, 24, -26, 17, -19, -22, -19);
  polygon(c, "#c58c48", -22, -23, -15, -32, 25, -32, 17, -23);
  for (let i = 0; i < 6; i++) polygon(c, "#8e6443", -17 + i * 6, -24, -11 + i * 6, -30, -9 + i * 6, -30, -15 + i * 6, -24);
  if (standing) {
    dove(c, -6, -32, 0, -1, false); dove(c, 12, -37, 0, 1, false);
  }
}
export function drawFixture(c: Brush, f: Fixture, time: number, reduced: boolean) {
  if (f.kind === "gate") {
    c.save(); c.translate(f.x, f.y);
    for (let i = 0; i < 3; i++) {
      const x = -34 + i * 30;
      polygon(c, f.at === null ? "#91734f" : "#59675a", x, -7, x + 7, -4, x - 3, 1, x - 10, -2);
    }
    c.restore(); return;
  }
  const age = f.at === null ? -1 : Math.max(0, time - f.at);
  const u = age < 0 ? 0 : Math.min(1, age / (reduced ? .14 : .48));
  const eased = 1 - Math.pow(1 - u, 2.8);
  c.save(); c.translate(f.x, f.y);
  oval(c, "rgba(65,46,48,.24)", 7 + eased * 9 * f.side, 1, f.kind === "table" ? 46 : 26, 6);
  c.translate(f.side * eased * (f.kind === "table" ? 33 : 17), -Math.sin(u * Math.PI) * (reduced ? 2 : 19) - eased * (f.kind === "table" ? 29 : 14));
  c.rotate(f.side * (eased * 1.64 + (reduced ? 0 : Math.sin(u * Math.PI * 2) * .13)));
  if (f.kind === "table") table(c, age < 0); else seat(c, age < 0);
  c.restore();
}
export function drawSpill(c: Brush, f: Fixture, time: number, reduced: boolean) {
  if (f.at === null || f.kind === "gate") return;
  const t = Math.max(0, time - f.at);
  if (f.kind === "seat") {
    if (t > 3.2) return;
    for (let i = 0; i < (reduced ? 2 : 4); i++) {
      const sign = i % 3 === 0 ? -f.side : f.side;
      dove(c, f.x + sign * (i * 6 + t * (37 + i * 12)), f.y - 32 - t * (40 + i * 13) - 12 * Math.sin(t * 2), t * 16 + i, sign, true);
    }
  } else {
    for (const [i, coin] of (f.coins ?? []).entries()) {
      if (reduced && i % 2) continue;
      const rise = reduced ? coin.z * .35 : coin.z;
      const thick = coin.z < 1 ? 1.5 : 1 + Math.abs(Math.cos(coin.rotation)) * 1.7;
      oval(c, "rgba(69,53,40,.23)", coin.x + 2, coin.y + 1, 3.7, 1.3);
      oval(c, coin.silver ? "#dde1d2" : "#8b612c", coin.x, coin.y - rise, 3.6, thick);
      oval(c, coin.silver ? "#fff9e2" : "#ffe08a", coin.x - .7, coin.y - rise - .8, 2.6, .95);
    }
  }
  if (!reduced && t < .24) {
    c.save(); c.globalAlpha = 1 - t / .24; c.lineWidth = 2; c.strokeStyle = "#fff4c3";
    for (let i = 0; i < 5; i++) {
      const a = -2.9 + i * .61, r = 19 + t * 105;
      c.beginPath(); c.moveTo(f.x + Math.cos(a) * r, f.y - 28 + Math.sin(a) * r);
      c.lineTo(f.x + Math.cos(a) * (r + 8), f.y - 28 + Math.sin(a) * (r + 8)); c.stroke();
    } c.restore();
  }
}
