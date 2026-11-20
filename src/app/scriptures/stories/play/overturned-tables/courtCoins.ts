import type { Point } from "./courtGame";

export type Coin = Point & {
  z: number; vx: number; vy: number; vz: number; spin: number; rotation: number;
  silver: boolean; kickAfter: number;
};

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

export function stirCoins(coins: Coin[], dt: number, time: number, feet: Point, walking: boolean, facing: number) {
  for (const coin of coins) {
    const dx = coin.x - feet.x, dy = coin.y - feet.y, distance = Math.hypot(dx, dy * 1.6);
    if (walking && time >= coin.kickAfter && coin.z < 4 && distance < 14) {
      coin.vx = facing * 48 + dx * 4;
      coin.vy = dy * 4;
      coin.vz = 48 + (coin.silver ? 15 : 0);
      coin.z = 1; coin.spin = 10; coin.kickAfter = time + .35;
    }
    if (coin.z === 0 && coin.vx === 0 && coin.vy === 0) continue;
    coin.x += coin.vx * dt; coin.y += coin.vy * dt;
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
}
