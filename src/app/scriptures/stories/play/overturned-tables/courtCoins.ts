import type { Point } from "./courtGame";

export const PAVING_BOUNDS = { minX: 24, maxX: 1296, minY: 178, maxY: 424 } as const;

export type Coin = Point & {
  z: number; vx: number; vy: number; vz: number; spin: number; rotation: number;
  silver: boolean; kickAfter: number;
};

export type Feather = Point & {
  z: number; vx: number; vy: number; vz: number; phase: number; tilt: number;
  kickAfter: number;
};

function boundPoint(p: { x: number; y: number; vx: number; vy: number }, bounce: number) {
  if (p.x < PAVING_BOUNDS.minX) { p.x = PAVING_BOUNDS.minX; p.vx = Math.abs(p.vx) * bounce; }
  else if (p.x > PAVING_BOUNDS.maxX) { p.x = PAVING_BOUNDS.maxX; p.vx = -Math.abs(p.vx) * bounce; }
  if (p.y < PAVING_BOUNDS.minY) { p.y = PAVING_BOUNDS.minY; p.vy = Math.abs(p.vy) * bounce; }
  else if (p.y > PAVING_BOUNDS.maxY) { p.y = PAVING_BOUNDS.maxY; p.vy = -Math.abs(p.vy) * bounce; }
}

export function scatterCoins(table: Point, side: number, time: number): Coin[] {
  return Array.from({ length: 19 }, (_, i) => {
    const angle = i * 2.39996;
    return {
      x: table.x + (i % 5 - 2) * 6, y: table.y - 4, z: 36 + i % 4,
      vx: Math.cos(angle) * (61 + i % 4 * 14) + side * 77,
      vy: Math.sin(angle) * (33 + i % 7 * 5),
      vz: 66 + i % 6 * 19, spin: 9 + i % 5, rotation: angle,
      silver: i % 4 === 0, kickAfter: time + .55,
    };
  });
}

export function stirCoins(coins: Coin[], dt: number, time: number, feet: Point, walking: boolean, facing: number): boolean {
  let kicked = false;
  for (const coin of coins) {
    const dx = coin.x - feet.x, dy = coin.y - feet.y, distance = Math.hypot(dx, dy * 1.6);
    if (walking && time >= coin.kickAfter && coin.z < 4 && distance < 14) {
      coin.vx = facing * 48 + dx * 4;
      coin.vy = dy * 4;
      coin.vz = 48 + (coin.silver ? 15 : 0);
      coin.z = 1; coin.spin = 10; coin.kickAfter = time + .35;
      kicked = true;
    }
    if (coin.z === 0 && coin.vx === 0 && coin.vy === 0) continue;
    coin.x += coin.vx * dt; coin.y += coin.vy * dt;
    boundPoint(coin, .45);
    coin.rotation += coin.spin * dt;
    coin.vz -= 540 * dt; coin.z += coin.vz * dt;
    if (coin.z <= 0) {
      coin.z = 0;
      coin.vz = coin.vz < -35 ? -coin.vz * .37 : 0;
      const skid = Math.exp(-8 * dt);
      coin.vx *= skid; coin.vy *= skid; coin.spin *= skid;
      if (Math.abs(coin.vx) + Math.abs(coin.vy) < 2 && coin.vz === 0) {
        coin.vx = coin.vy = coin.spin = 0;
      }
    }
  }
  return kicked;
}

export function scatterFeathers(seat: Point, side: number, time: number): Feather[] {
  return Array.from({ length: 5 }, (_, i) => {
    const spread = (i - 2) * 11;
    return {
      x: seat.x + spread * .6,
      y: seat.y - 6 + (i % 3 - 1) * 5,
      z: 30 + i * 5,
      vx: side * (24 + i * 5) + spread * 1.4,
      vy: (i % 2 ? 1 : -1) * (10 + i * 3),
      vz: 14 + (i % 3) * 7,
      phase: i * 1.35,
      tilt: (i % 2 ? 1 : -1) * .35,
      kickAfter: time + 1.1,
    };
  });
}

export function stirFeathers(feathers: Feather[], dt: number, time: number, feet: Point, walking: boolean, facing: number): void {
  for (const f of feathers) {
    const dx = f.x - feet.x, dy = f.y - feet.y, distance = Math.hypot(dx, dy * 1.6);
    if (walking && time >= f.kickAfter && f.z < 3 && distance < 17) {
      f.vx = facing * 22 + dx * 1.8;
      f.vy = dy * 1.6;
      f.vz = 26;
      f.z = 1;
      f.kickAfter = time + .55;
    }
    if (f.z === 0 && f.vx === 0 && f.vy === 0) continue;
    f.phase += dt * 4.4;
    if (f.z > 0) {
      f.vz = Math.max(-20, f.vz - 56 * dt);
      f.z += f.vz * dt;
      const flutter = Math.sin(f.phase) * 16;
      f.x += (f.vx + flutter) * dt;
      f.y += f.vy * dt;
      const airDrag = Math.exp(-1.5 * dt);
      f.vx *= airDrag; f.vy *= airDrag;
      f.tilt = Math.sin(f.phase) * .55;
    } else {
      f.x += f.vx * dt; f.y += f.vy * dt;
      const groundDrag = Math.exp(-7 * dt);
      f.vx *= groundDrag; f.vy *= groundDrag;
    }
    boundPoint(f, .3);
    if (f.z <= 0) {
      f.z = 0; f.vz = 0;
      if (Math.abs(f.vx) + Math.abs(f.vy) < 1.2) {
        f.vx = f.vy = 0;
      }
    }
  }
}
