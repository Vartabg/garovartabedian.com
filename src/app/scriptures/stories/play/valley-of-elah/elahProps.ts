import {
  ELAH_HEIGHT,
  ELAH_WIDTH,
  SLING_FLIGHT_SECONDS,
  brookCenterX,
  type BrookStone,
  type DroppedArmor,
  type Point,
} from './elahGame';
import { line, oval, polygon, print } from '../_shared/storyInk';

type Brush = CanvasRenderingContext2D;

const INK = '#3b332b';
const BRONZE_MID = '#a47e47';
const BRONZE_LIGHT = '#d6b470';
const BRONZE_DARK = '#664d2b';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Draws Saul's discarded sword, coat of mail, or bronze helmet with distinct physical landing/bounce. */
export function drawDroppedArmor(c: Brush, item: DroppedArmor, time: number, reduced: boolean): void {
  const age = Math.max(0, time - item.at);
  const dur = item.piece === 'helmet' ? 0.44 : 0.30;
  const t = reduced ? 1 : clamp(age / dur, 0, 1);

  // Distinct physical landing per piece: helmet bounces & rolls a few px, coat thuds heavily, sword skids slightly.
  let arc = 0;
  let rollX = 0;
  let spin = 0;
  if (!reduced) {
    if (item.piece === 'helmet') {
      if (t < 0.62) {
        const u = t / 0.62;
        arc = Math.sin(Math.PI * u) * 13;
        rollX = (u - 0.5) * 6 * item.side;
        spin = (1 - u) * 0.9 * item.side;
      } else {
        const u = (t - 0.62) / 0.38;
        arc = Math.sin(Math.PI * u) * 4.5;
        rollX = (3 + u * 4.5) * item.side;
        spin = Math.sin(Math.PI * u) * 0.25 * item.side;
      }
    } else if (item.piece === 'coat') {
      arc = Math.sin(Math.PI * t) * 8;
      spin = (1 - t) * 0.32 * item.side;
    } else {
      arc = Math.sin(Math.PI * t) * 11;
      rollX = (t - 0.4) * 5 * item.side;
      spin = (1 - t) * 0.72 * item.side;
    }
  } else if (item.piece === 'helmet') {
    rollX = 7.5 * item.side;
  } else if (item.piece === 'sword') {
    rollX = 3 * item.side;
  }

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(item.x + rollX, item.y);

  // Settling ochre dust ring as heavy bronze strikes the slope
  if (!reduced && age > 0.14 && age < 0.78) {
    const p = clamp((age - 0.14) / 0.64, 0, 1);
    const scale = item.piece === 'coat' ? 1.3 : 1;
    c.save();
    c.globalAlpha = (1 - p) * 0.46;
    oval(c, '#e6d3ad', (-7 - p * 12) * scale, 1 - p * 3, (7 + p * 9) * scale, (3.2 + p * 2.5) * scale);
    oval(c, '#d8c094', (7 + p * 11) * scale, 2 - p * 2, (6 + p * 8) * scale, (2.8 + p * 2.2) * scale);
    c.restore();
  }

  // Ground shadow
  oval(c, 'rgba(66,51,38,.23)', 1, 2.2, item.piece === 'coat' ? 16.5 : 13, 3.6);

  c.translate(0, -arc);
  c.rotate(spin);

  if (item.piece === 'sword') {
    line(c, INK, 5.2, -16, 3, 11, -3);
    line(c, '#634c38', 3.4, -15.5, 2.9, 10.6, -2.9);
    line(c, BRONZE_LIGHT, 2.4, 10, -2.8, 17, -4.5);
    line(c, BRONZE_DARK, 2.0, 8.8, -7.2, 11.8, 1.4);
    oval(c, BRONZE_LIGHT, 17.5, -4.7, 2.1, 1.8);
    // Subtle sunlit bronze glint on the hilt right after landing
    if (!reduced && age > 0.2 && age < 0.7) {
      const g = Math.sin(Math.PI * clamp((age - 0.2) / 0.5, 0, 1));
      c.save();
      c.strokeStyle = `rgba(255, 248, 214, ${(0.85 * g).toFixed(3)})`;
      c.lineWidth = 1.3;
      line(c, c.strokeStyle, 1.3, 13, -7, 17, -3);
      line(c, c.strokeStyle, 1.3, 17, -7, 13, -3);
      c.restore();
    }
  } else if (item.piece === 'coat') {
    print(c, 'M-15 3Q-13 -8 -2 -9Q10 -10 15 1Q12 6 0 6Q-11 6 -15 3Z', BRONZE_MID, INK, 1.05);
    print(c, 'M-11 1Q-8 -6 -1 -6.5Q4 -6.5 5 2Z', BRONZE_LIGHT);
    line(c, BRONZE_DARK, 0.9, -11, -1, 11, -1.5);
    line(c, BRONZE_DARK, 0.9, -9, 2.5, 10, 2);
    line(c, '#5d3e28', 1.6, -6, -6.5, 5, 4.5);
  } else {
    print(c, 'M-9.5 2Q-10 -9.5 0 -11Q10 -9.5 9.5 2Q4 4.2 -9.5 2Z', BRONZE_MID, INK, 1.0);
    print(c, 'M-6.5 0.5Q-6 -7 0 -8.5Q-1.5 -3.5 -2.5 1Z', BRONZE_LIGHT);
    line(c, BRONZE_DARK, 1.2, -9.2, 1.8, 9.2, 1.8);
  }

  c.restore();
}

/** Live flowing water shimmer streaks & sparkling sunlit glints drifting south down the brook of Elah. */
export function drawBrookFlow(c: Brush, time: number, reduced: boolean): void {
  const drift = reduced ? 0 : time * 26;
  c.save();
  for (let i = 0; i < 24; i++) {
    const rawY = 204 + ((i * 11.4 + drift) % (ELAH_HEIGHT - 202));
    const cx = brookCenterX(rawY);
    const lane = ((i * 37) % 11) - 5;
    const taper = rawY < 236 ? Math.max(0.24, (rawY - 180) / 56) : 1;
    const x = cx + lane * 4.2 * taper;
    const len = (6.5 + (i % 3) * 3.8) * taper;
    const shimmer = reduced ? 0.42 : 0.28 + 0.24 * Math.sin(time * 2.6 + i * 1.7);
    line(c, `rgba(232, 241, 238, ${shimmer.toFixed(3)})`, 1.05, x - len * 0.5, rawY, x + len * 0.5, rawY + 0.5);
    if (i % 5 === 0) {
      oval(c, `rgba(255, 252, 236, ${(shimmer * 0.9).toFixed(3)})`, x, rawY - 0.4, 2.2 * taper, 0.9 * taper);
    }
  }
  c.restore();
}

/** Draws a gleaming smooth river stone in the brook (and sparkling droplet arc + ripple when scooped up!). */
export function drawBrookStone(
  c: Brush,
  st: BrookStone,
  time: number,
  near: boolean,
  canPick: boolean,
  reduced: boolean,
): void {
  if (st.at !== null) {
    const age = Math.max(0, time - st.at);
    if (reduced || age > 0.7) return;
    const u = age / 0.7;
    c.save();
    c.strokeStyle = `rgba(236, 245, 243, ${(0.72 * (1 - u)).toFixed(3)})`;
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(st.x, st.y, 7 + u * 24, 3.2 + u * 10.5, 0, 0, Math.PI * 2);
    c.stroke();

    // Sparkling cool water droplets arcing off the smooth stone as David lifts it
    if (age < 0.46) {
      const du = age / 0.46;
      for (const [dx, peak] of [[-12, 16], [-4, 22], [6, 19], [13, 14]] as const) {
        const px = st.x + dx * du;
        const py = st.y - Math.sin(Math.PI * du) * peak;
        oval(c, `rgba(238, 248, 248, ${(0.85 * (1 - du)).toFixed(3)})`, px, py, 1.7, 1.3);
      }
    }
    c.restore();
    return;
  }

  c.save();
  c.translate(st.x, st.y);

  // Subtle ambient water ring around the smooth stone
  const pulse = reduced ? 0.5 : (time * 0.85 + st.x * 0.03) % 1;
  c.strokeStyle = `rgba(226, 240, 240, ${(0.36 * (1 - pulse)).toFixed(3)})`;
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(0, 1, 7.5 + pulse * 9.5, 3.4 + pulse * 4.2, 0, 0, Math.PI * 2);
  c.stroke();

  if (near && canPick) {
    c.strokeStyle = 'rgba(255, 241, 174, .92)';
    c.lineWidth = 1.9;
    c.beginPath();
    c.ellipse(0, 0.5, 11.5, 5.6, 0, 0, Math.PI * 2);
    c.stroke();
  }

  oval(c, 'rgba(38, 54, 61, .35)', 1, 2.2, 6.8, 3.3);
  oval(c, canPick ? '#5a686e' : '#6d787b', 0, 0, 6.6, 3.9, -0.14);
  oval(c, canPick ? '#9baab0' : '#8d989b', -1.2, -0.8, 4.2, 2.2, -0.18);
  oval(c, '#f2f8f6', -2.2, -1.4, 1.9, 0.95, -0.2);

  c.restore();
}

/** Expanding ripples + sparkling splash droplets underfoot as David wades through the brook. */
export function drawBrookFootRipple(
  c: Brush,
  x: number,
  y: number,
  time: number,
  walking: boolean,
  reduced: boolean,
): void {
  if (reduced) {
    c.save();
    c.strokeStyle = 'rgba(226, 238, 238, .48)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(x, y + 1, 13, 4.5, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    return;
  }
  const speed = walking ? 2.1 : 0.75;
  for (let i = 0; i < 2; i++) {
    const p = (time * speed + i * 0.5) % 1;
    c.save();
    c.strokeStyle = `rgba(234, 244, 244, ${((walking ? 0.62 : 0.32) * (1 - p)).toFixed(3)})`;
    c.lineWidth = walking ? 1.55 : 1.1;
    c.beginPath();
    c.ellipse(x, y + 1, 8 + p * (walking ? 21 : 12), 3 + p * (walking ? 7.4 : 4.2), 0, 0, Math.PI * 2);
    c.stroke();
    if (walking) {
      // Crisp ankle spray droplets when wading
      const sx = x + (i === 0 ? -1 : 1) * (5 + p * 11);
      const sy = y - Math.sin(Math.PI * p) * 9;
      oval(c, `rgba(240, 248, 248, ${(0.72 * (1 - p)).toFixed(3)})`, sx, sy, 1.5, 1.2);
    }
    c.restore();
  }
}

/** Warm ochre heel-scuff dust when David trudges in heavy bronze armor or runs across dry earth. */
export function drawFootDust(
  c: Brush,
  x: number,
  y: number,
  facing: number,
  stride: number,
  heavy: boolean,
  reduced: boolean,
): void {
  if (reduced) return;
  const cycle = ((stride / Math.PI) % 1 + 1) % 1;
  const alpha = Math.sin(Math.PI * cycle) * (heavy ? 0.42 : 0.22);
  if (alpha <= 0.02) return;
  const r = heavy ? 5.5 + cycle * 6 : 3.5 + cycle * 4;
  c.save();
  c.globalAlpha = alpha;
  oval(c, '#e4d0a6', x - facing * (6 + cycle * 10), y + 1 - cycle * 3.5, r, r * 0.46);
  c.restore();
}

/** Subtle etched parabolic sight-arc bridging David's whirling sling and Goliath during untimed sling stance. */
export function drawSlingSightArc(
  c: Brush,
  from: Point,
  to: Point,
  time: number,
  reduced: boolean,
): void {
  const startX = from.x + 14;
  const startY = from.y - 68;
  const endX = to.x - 16;
  const endY = to.y - 84;
  const midX = (startX + endX) * 0.5;
  const midY = Math.min(startY, endY) - 24;

  c.save();
  c.strokeStyle = 'rgba(255, 248, 224, .46)';
  c.lineWidth = 1.4;
  c.setLineDash([5, 7]);
  c.lineDashOffset = reduced ? 0 : -time * 28;
  c.beginPath();
  c.moveTo(startX, startY);
  c.quadraticCurveTo(midX, midY, endX, endY);
  c.stroke();
  c.restore();
}

/** Abandoned Philistine bronze tower shield dropped onto the valley floor when the shield-bearer flees. */
export function drawDroppedShield(c: Brush, x: number, y: number, impactAge: number, reduced: boolean): void {
  if (impactAge < 0.08) return;
  const t = reduced ? 1 : clamp((impactAge - 0.08) / 0.28, 0, 1);
  const tilt = lerp(-1.2, 0, t);
  const lift = reduced ? 0 : Math.sin(Math.PI * t) * 7;

  c.save();
  c.translate(x, y);
  oval(c, 'rgba(66, 51, 38, .22)', 2, 3, 21, 5.2);
  c.translate(0, -lift);
  c.rotate(tilt * 0.25);
  // Horizontal tower shield lying flat on the dusty floor
  print(c, 'M-20 -4Q0 -7 20 -3L18 6Q0 8 -19 5Z', '#8e6a3c', INK, 1.05);
  print(c, 'M-17 -2L16 -1L15 2L-16 1.5Z', '#c6a05d');
  line(c, '#5d4425', 1.1, 0, -5.5, 0, 6.5);
  oval(c, '#d8b672', 0, 0.5, 3.6, 2.2);
  c.restore();
}

/** Abstract, crisp etched stone arc from David's sling to Goliath's helmet brow + sunlit valley dust (zero gore). */
export function drawSlingFlightAndImpact(
  c: Brush,
  from: Point,
  champion: Point,
  releasedAt: number,
  time: number,
  reduced: boolean,
): void {
  const age = Math.max(0, time - releasedAt);
  const startX = from.x + 12;
  const startY = from.y - 66;
  const hitX = champion.x - 10;
  const hitY = champion.y - 84;

  // In-flight smooth stone arc (0 -> 0.42s)
  if (!reduced && age <= SLING_FLIGHT_SECONDS) {
    const u = clamp(age / SLING_FLIGHT_SECONDS, 0, 1);
    const arcLift = Math.sin(Math.PI * u) * 26;
    const sx = lerp(startX, hitX, u);
    const sy = lerp(startY, hitY, u) - arcLift;

    const tailU = Math.max(0, u - 0.26);
    const tx = lerp(startX, hitX, tailU);
    const ty = lerp(startY, hitY, tailU) - Math.sin(Math.PI * tailU) * 26;
    line(c, 'rgba(255, 248, 224, .82)', 2.6, tx, ty, sx, sy);
    line(c, 'rgba(72, 58, 44, .38)', 1.0, tx, ty + 2, sx, sy + 1.5);

    oval(c, '#3a3530', sx, sy, 4.4, 3.1, 0.12);
    oval(c, '#e4ecea', sx - 1.1, sy - 0.9, 1.6, 0.95);
    return;
  }

  const impactAge = reduced ? age : age - SLING_FLIGHT_SECONDS;
  if (impactAge < 0) return;

  // Crisp etched impact starburst flash (zero gore)
  if (!reduced && impactAge < 0.32) {
    const p = impactAge / 0.32;
    c.save();
    c.strokeStyle = `rgba(255, 246, 206, ${(0.95 * (1 - p)).toFixed(3)})`;
    c.lineWidth = 2.2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const r0 = 4 + p * 8;
      const r1 = (i % 2 === 0 ? 18 : 12) + p * 20;
      c.beginPath();
      c.moveTo(hitX + Math.cos(a) * r0, hitY + Math.sin(a) * r0);
      c.lineTo(hitX + Math.cos(a) * r1, hitY + Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();
  }

  // Sunlit ochre dust cloud billowing softly as heavy bronze settles to earth
  const dustStart = reduced ? 0 : 0.32;
  if (impactAge >= dustStart && impactAge < dustStart + 2.3) {
    const p = clamp((impactAge - dustStart) / 2.3, 0, 1);
    const alpha = reduced ? 0.24 : Math.sin(Math.PI * clamp(p / 0.32, 0, 1)) * (1 - p) * 0.58;
    if (alpha > 0.01) {
      c.save();
      c.globalAlpha = alpha;
      const baseX = champion.x - 36;
      const baseY = champion.y + 1;
      oval(c, '#e6d0a4', baseX - 26 - p * 22, baseY - p * 12, 24 + p * 20, 9.5 + p * 6.5);
      oval(c, '#d9bd8e', baseX + 14 + p * 20, baseY + 2 - p * 9, 26 + p * 18, 8.5 + p * 5.5);
      oval(c, '#eedcb8', baseX - 6, baseY - 5 - p * 15, 20 + p * 15, 7.5 + p * 5);
      c.restore();
    }
  }
}

/** Subtle warm golden clearing sunlight shafts breaking across the valley after impact. */
export function drawValleySunlight(c: Brush, strength: number): void {
  if (strength <= 0.01) return;
  c.save();
  c.fillStyle = `rgba(255, 244, 206, ${(0.115 * strength).toFixed(4)})`;
  for (const x of [160, 480, 770, 1080]) {
    c.beginPath();
    c.moveTo(x - 30, 0);
    c.lineTo(x + 62, 0);
    c.lineTo(x + 215, ELAH_HEIGHT);
    c.lineTo(x + 75, ELAH_HEIGHT);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** Rippling camp pennant flag waving smoothly in the Judean valley wind. */
export function drawCampBanner(
  c: Brush,
  x: number,
  y: number,
  dir: 1 | -1,
  color: string,
  trim: string,
  time: number,
  reduced: boolean,
  droop = 0,
): void {
  const wave = reduced ? 0 : Math.sin(time * 3.6 + x * 0.05) * 2.4 * (1 - droop * 0.7);
  const w = (23 - droop * 11) * dir;
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(w * 0.5, 2 + wave + droop * 6, w, 4.5 - wave * 0.8 + droop * 14);
  c.lineTo(w * 0.82, 13 - wave * 0.6 + droop * 14);
  c.quadraticCurveTo(w * 0.45, 11.5 + wave * 0.7 + droop * 6, 0, 13);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  line(c, trim, 0.85, 1 * dir, 6.5, w * 0.76, 8 - wave * 0.4 + droop * 11);
  c.restore();
}

/** Subtle dust clouds trailing behind retreating eastern army / surging western army. */
export function drawArmyDust(c: Brush, x: number, y: number, alpha: number, radius = 12): void {
  if (alpha <= 0.01) return;
  c.save();
  c.globalAlpha = alpha;
  oval(c, '#e4d1aa', x, y, radius, radius * 0.45);
  c.restore();
}

/** Subtle ground ring marking the open valley standoff point before entering sling stance. */
export function drawStandoffMark(c: Brush, x: number, y: number, near: boolean, time: number, reduced: boolean): void {
  const pulse = reduced ? 0 : Math.sin(time * 3.0) * 1.6;
  c.save();
  c.strokeStyle = near ? 'rgba(255, 241, 174, .92)' : 'rgba(92, 68, 44, .48)';
  c.lineWidth = near ? 2.2 : 1.5;
  c.beginPath();
  c.ellipse(x, y + 1, 18 + pulse, 6.2 + pulse * 0.35, 0, 0, Math.PI * 2);
  c.stroke();
  polygon(c, near ? '#fff1a8' : '#7b5f42', x - 3, y - 0.5, x + 4, y + 1, x - 3, y + 2.5);
  c.restore();
}

export const VALLEY_BOUNDS_WIDTH = ELAH_WIDTH;
