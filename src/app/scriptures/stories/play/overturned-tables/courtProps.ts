import { line, oval, polygon } from "./courtInk";
import { PAVING_BOUNDS } from "./courtCoins";
import type { Fixture } from "./courtGame";

type Brush = CanvasRenderingContext2D;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

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

function clothPose(f: Fixture, age: number, reduced: boolean) {
  const dur = reduced ? .12 : .4;
  const u = clamp(age / dur, 0, 1);
  const eased = 1 - Math.pow(1 - u, 2.2);
  // Land clearly beyond the overturned tabletop edge (~f.x + side * 72) so the crumpled cloth stays fully visible.
  const endX = clamp(f.x + f.side * 90, PAVING_BOUNDS.minX + 18, PAVING_BOUNDS.maxX - 18);
  const endY = clamp(f.y + 18, PAVING_BOUNDS.minY + 8, PAVING_BOUNDS.maxY - 6);
  const x = f.x + (endX - f.x) * eased;
  const y = f.y - 6 + (endY - (f.y - 6)) * eased;
  const z = (1 - eased) * 28 + Math.sin(u * Math.PI) * (reduced ? 3 : 20);
  return { x, y, z, u, rot: f.side * (u * .85) };
}

function drawClothRunner(c: Brush, f: Fixture, age: number, reduced: boolean) {
  const p = clothPose(f, age, reduced);
  c.save();
  oval(c, "rgba(69,53,40,.16)", p.x + 2, p.y + 2, 16, 4.5);
  c.translate(p.x, p.y - p.z);
  c.rotate(p.rot);
  polygon(c, "#2d4649", -15, -4, 9, -7, 15, 2, 3, 6, -13, 4);
  polygon(c, "#3d5e63", -14, -5, 10, -7, 13, 0, -1, 4, -12, 2);
  polygon(c, "#cad1a2", -11, 2, 8, -1, 9, 1, -10, 4);
  c.restore();
}

function scalePose(f: Fixture, age: number, reduced: boolean) {
  const dur = reduced ? .14 : .48;
  const u = clamp(age / dur, 0, 1);
  const eased = 1 - Math.pow(1 - u, 2.0);
  // Toss the brass balance scale well past the fallen tabletop onto open paving.
  const endX = clamp(f.x + f.side * 116, PAVING_BOUNDS.minX + 20, PAVING_BOUNDS.maxX - 20);
  const endY = clamp(f.y + (f.side > 0 ? 4 : -10), PAVING_BOUNDS.minY + 8, PAVING_BOUNDS.maxY - 6);
  const x = f.x + (endX - f.x) * eased;
  const y = f.y - 12 + (endY - (f.y - 12)) * eased;
  let z = 0;
  if (u < .72) {
    const a = u / .72;
    z = (1 - a) * 34 + Math.sin(a * Math.PI) * (reduced ? 4 : 28);
  } else if (u < 1 && !reduced) {
    const b = (u - .72) / .28;
    z = Math.sin(b * Math.PI) * 8;
  }
  return { x, y, z, u, rot: f.side * (.75 + eased * .65) };
}

function drawBalanceScale(c: Brush, f: Fixture, age: number, reduced: boolean) {
  const p = scalePose(f, age, reduced);
  c.save();
  oval(c, "rgba(69,53,40,.18)", p.x + 2, p.y + 2, 15, 4);
  c.translate(p.x, p.y - p.z);
  c.rotate(p.rot);
  // Iron crossbar & stem
  line(c, "#43322a", 2, -13, 0, 13, 0);
  line(c, "#43322a", 1.6, 0, 0, 0, -10);
  // Splayed chains and brass weighing pans
  line(c, "#6b5442", 1, -12, 0, -16, 7);
  line(c, "#6b5442", 1, 12, 0, 16, 6);
  oval(c, "#8c6629", -16, 8, 5.6, 2.3, -.2);
  oval(c, "#ecc468", -16.4, 7.3, 4.1, 1.4, -.2);
  oval(c, "#8c6629", 16, 7, 5.6, 2.3, .25);
  oval(c, "#ecc468", 15.6, 6.3, 4.1, 1.4, .25);
  c.restore();
}

function drawCoin(c: Brush, x: number, y: number, z: number, rotation: number, silver: boolean, reduced: boolean) {
  const rise = reduced ? z * .35 : z;
  const thick = z < 1 ? 1.5 : 1 + Math.abs(Math.cos(rotation)) * 1.7;
  oval(c, "rgba(69,53,40,.23)", x + 2, y + 1, 3.7, 1.3);
  oval(c, silver ? "#dde1d2" : "#8b612c", x, y - rise, 3.6, thick);
  oval(c, silver ? "#fff9e2" : "#ffe08a", x - .7, y - rise - .8, 2.6, .95);
}

function drawFeather(c: Brush, x: number, y: number, z: number, tilt: number, reduced: boolean) {
  const rise = reduced ? z * .3 : z;
  c.save();
  oval(c, "rgba(69,53,40,.11)", x + 1.5, y + 1, 4.2, 1.0);
  c.translate(x, y - rise);
  c.rotate(tilt);
  polygon(c, "#dcd4bc", -5.5, .4, -2, -1.8, 3.5, -1.6, 5.8, -.1, 3.2, 1.5, -2.2, 1.4);
  polygon(c, "#fffbf0", -3.8, .1, -1.4, -1.2, 2.8, -1.1, 4.6, -.1, 2.4, .9, -1.6, .9);
  line(c, "#9e937a", .75, -6.4, .5, 5.2, -.2);
  c.restore();
}

/** Pass 1: Settled ground scatter drawn onto the paving beneath standing actors and furniture. */
export function drawGroundScatter(c: Brush, f: Fixture, time: number, reduced: boolean) {
  if (f.at === null || f.kind === "gate") return;
  const age = Math.max(0, time - f.at);
  if (f.kind === "table") {
    if (age >= (reduced ? .12 : .38)) drawClothRunner(c, f, age, reduced);
    if (age >= (reduced ? .14 : .46)) drawBalanceScale(c, f, age, reduced);
    for (const [i, coin] of (f.coins ?? []).entries()) {
      if (reduced && i % 2) continue;
      if (coin.z < 2) drawCoin(c, coin.x, coin.y, coin.z, coin.rotation, coin.silver, reduced);
    }
  } else {
    for (const [i, feather] of (f.feathers ?? []).entries()) {
      if (reduced && i % 2) continue;
      if (feather.z < 2) drawFeather(c, feather.x, feather.y, feather.z, feather.tilt, reduced);
    }
  }
}

/** Pass 2a: Fixtures and in-flight table props drawn in Y-sorted order. */
export function drawFixture(c: Brush, f: Fixture, time: number, reduced: boolean) {
  if (f.kind === "gate") {
    c.save(); c.translate(f.x, f.y);
    for (let i = 0; i < 3; i++) {
      const x = -34 + i * 30;
      polygon(c, f.at === null ? "#91734f" : "#59675a", x, -7, x + 7, -4, x - 3, 1, x - 10, -2);
    }
    if (f.at === null) {
      // Subtle dusty thoroughfare prints leading from the eastern archway steps into the court
      for (const [px, py] of [[4, -44], [-4, -34], [2, -23], [-6, -13]]) {
        oval(c, "rgba(112,89,61,.22)", px, py, 3.6, 1.5, -.2);
      }
    } else {
      line(c, "rgba(89,103,90,.42)", 1.5, -42, -9, 44, -9);
    }
    c.restore(); return;
  }
  const age = f.at === null ? -1 : Math.max(0, time - f.at);
  const dur = reduced ? .14 : .46;
  const u = age < 0 ? 0 : Math.min(1, age / dur);
  const tip = u < .72 ? Math.pow(u / .72, 1.55) : 1;
  const rebound = reduced || u < .72 ? 0 : Math.sin(((u - .72) / .28) * Math.PI) * .085;
  const lift = u < .72
    ? Math.sin((u / .72) * Math.PI) * (reduced ? 2 : 18)
    : (reduced ? 0 : Math.sin(((u - .72) / .28) * Math.PI) * 3.8);

  c.save(); c.translate(f.x, f.y);
  oval(c, "rgba(65,46,48,.24)", 7 + tip * (f.kind === "table" ? 28 : 13) * f.side, 1, f.kind === "table" ? 46 : 26, 6);
  c.translate(f.side * tip * (f.kind === "table" ? 33 : 17), -lift - tip * (f.kind === "table" ? 29 : 14));
  c.rotate(f.side * (tip * 1.64 - rebound));
  if (f.kind === "table") table(c, age < 0); else seat(c, age < 0);
  c.restore();

  if (f.kind === "table" && age >= 0) {
    if (age < (reduced ? .12 : .38)) drawClothRunner(c, f, age, reduced);
    if (age < (reduced ? .14 : .46)) drawBalanceScale(c, f, age, reduced);
  }
}

/** Pass 2b: Mid-air coins and fluttering feathers in the Y-sorted actor pass. */
export function drawMidairSpill(c: Brush, f: Fixture, time: number, reduced: boolean) {
  if (f.at === null || f.kind === "gate") return;
  if (f.kind === "table") {
    for (const [i, coin] of (f.coins ?? []).entries()) {
      if (reduced && i % 2) continue;
      if (coin.z >= 2) drawCoin(c, coin.x, coin.y, coin.z, coin.rotation, coin.silver, reduced);
    }
  } else {
    for (const [i, feather] of (f.feathers ?? []).entries()) {
      if (reduced && i % 2) continue;
      if (feather.z >= 2) drawFeather(c, feather.x, feather.y, feather.z, feather.tilt, reduced);
    }
  }
}

/** Pass 3: Soaring doves, impact rays, and limestone dust puffs drawn above ground actors. */
export function drawAerialSpill(c: Brush, f: Fixture, time: number, reduced: boolean) {
  if (f.at === null || f.kind === "gate") return;
  const t = Math.max(0, time - f.at);
  if (f.kind === "seat" && t <= 5.8) {
    const count = reduced ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const sign = i % 3 === 0 ? -f.side : f.side;
      const dx = sign * (i * 7 + t * (40 + i * 13) + Math.sin(t * 1.8 + i) * 6);
      const y = f.y - 34 - t * (52 + i * 15) - t * t * (15 + i * 4.5) - Math.sin(t * 2.8 + i) * 7;
      if (y < -28) continue;
      c.save();
      if (t > 4.8) c.globalAlpha = clamp((5.8 - t) / 1.0, 0, 1);
      dove(c, f.x + dx, y, t * 17 + i * 1.4, sign, true);
      c.restore();
    }
  }
  if (!reduced && t < .22) {
    c.save(); c.globalAlpha = 1 - t / .22; c.lineWidth = 2; c.strokeStyle = "#fff4c3";
    for (let i = 0; i < 5; i++) {
      const a = -2.9 + i * .61, r = 19 + t * 105;
      c.beginPath(); c.moveTo(f.x + Math.cos(a) * r, f.y - 28 + Math.sin(a) * r);
      c.lineTo(f.x + Math.cos(a) * (r + 8), f.y - 28 + Math.sin(a) * (r + 8)); c.stroke();
    }
    c.restore();
  }
  // Warm limestone dust bloom where overturned timber hits the paving
  const dustStart = f.kind === "table" ? .26 : .2;
  const dustAge = t - dustStart;
  if (!reduced && dustAge > 0 && dustAge < .62) {
    const p = dustAge / .62;
    const baseX = f.x + f.side * (f.kind === "table" ? 36 : 19);
    const baseY = f.y + 2;
    c.save();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + .35;
      const spread = (6 + i * 2.5) * (1 - Math.pow(1 - p, 2));
      const rx = 5.5 + p * 7.5 + (i % 2) * 2;
      const ry = 2.6 + p * 3.1;
      c.globalAlpha = (1 - p) * .36;
      oval(c, "#f0dfba", baseX + Math.cos(angle) * spread * 1.45, baseY + Math.sin(angle) * spread * .45 - p * 5, rx, ry);
    }
    c.restore();
  }
}

/** Wooden walking staff set down on the limestone after the lame visitor is healed. */
export function drawDroppedStaff(c: Brush, x: number, y: number) {
  c.save();
  oval(c, "rgba(69,53,40,.16)", x + 16, y + 5, 16, 2.3, .12);
  line(c, "#4b3625", 2.8, x + 2, y + 2, x + 32, y + 7);
  line(c, "#95714c", 1.1, x + 2, y + 1.3, x + 31, y + 6.2);
  c.restore();
}

/** Slender guide reed laid on the paving after the blind visitor is healed. */
export function drawDroppedReed(c: Brush, x: number, y: number) {
  c.save();
  oval(c, "rgba(69,53,40,.13)", x + 13, y + 4, 13, 1.8, -.08);
  line(c, "#6a543c", 1.8, x + 1, y + 5, x + 26, y + 2);
  line(c, "#b3956a", .8, x + 1, y + 4.4, x + 25.5, y + 1.5);
  c.restore();
}
