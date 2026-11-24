import {
  SLING_FLIGHT_SECONDS,
  type BrookStone,
  type DroppedArmor,
  type Point,
} from './elahGame';
import { line, oval, polygon, print } from './elahInk';

type Brush = CanvasRenderingContext2D;

const INK = '#3b332b';
const BRONZE_MID = '#a47e47';
const BRONZE_LIGHT = '#d6b470';
const BRONZE_DARK = '#664d2b';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Draws Saul's discarded sword, coat of mail, or bronze helmet resting permanently on the western slope. */
export function drawDroppedArmor(c: Brush, item: DroppedArmor, time: number, reduced: boolean): void {
  const age = Math.max(0, time - item.at);
  const t = reduced ? 1 : clamp(age / 0.28, 0, 1);
  const arc = reduced ? 0 : Math.sin(Math.PI * t) * 10;
  const spin = reduced ? 0 : (1 - t) * 0.65 * item.side;

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(item.x, item.y);

  // Subtle settling dust puff right as the heavy bronze hits the slope
  if (!reduced && age > 0.14 && age < 0.7) {
    const p = clamp((age - 0.14) / 0.56, 0, 1);
    c.save();
    c.globalAlpha = (1 - p) * 0.42;
    oval(c, '#e6d3ad', -6 - p * 10, 1 - p * 3, 7 + p * 8, 3.2 + p * 2.5);
    oval(c, '#d8c094', 7 + p * 9, 2 - p * 2, 6 + p * 7, 2.8 + p * 2);
    c.restore();
  }

  // Ground shadow
  oval(c, 'rgba(66,51,38,.22)', 1, 2.2, item.piece === 'coat' ? 16 : 13, 3.6);

  c.translate(0, -arc);
  c.rotate(spin);

  if (item.piece === 'sword') {
    // Scabbarded heavy sword lying diagonally on the slope
    line(c, INK, 5.2, -16, 3, 11, -3);
    line(c, '#634c38', 3.4, -15.5, 2.9, 10.6, -2.9);
    line(c, BRONZE_LIGHT, 2.4, 10, -2.8, 17, -4.5);
    line(c, BRONZE_DARK, 2.0, 8.8, -7.2, 11.8, 1.4);
    oval(c, BRONZE_LIGHT, 17.5, -4.7, 2.1, 1.8);
  } else if (item.piece === 'coat') {
    // Folded heavy bronze scale coat of mail slumped on the grass
    print(c, 'M-15 3Q-13 -8 -2 -9Q10 -10 15 1Q12 6 0 6Q-11 6 -15 3Z', BRONZE_MID, INK, 1.05);
    print(c, 'M-11 1Q-8 -6 -1 -6.5Q4 -6.5 5 2Z', BRONZE_LIGHT);
    line(c, BRONZE_DARK, 0.9, -11, -1, 11, -1.5);
    line(c, BRONZE_DARK, 0.9, -9, 2.5, 10, 2);
    line(c, '#5d3e28', 1.6, -6, -6.5, 5, 4.5);
  } else {
    // Domed bronze helmet resting slightly tilted on the ground
    print(c, 'M-9.5 2Q-10 -9.5 0 -11Q10 -9.5 9.5 2Q4 4.2 -9.5 2Z', BRONZE_MID, INK, 1.0);
    print(c, 'M-6.5 0.5Q-6 -7 0 -8.5Q-1.5 -3.5 -2.5 1Z', BRONZE_LIGHT);
    line(c, BRONZE_DARK, 1.2, -9.2, 1.8, 9.2, 1.8);
  }

  c.restore();
}

/** Draws a gleaming smooth river stone in the brook of Elah (or expanding water ripple right after picking). */
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
    if (reduced || age > 0.65) return;
    const u = age / 0.65;
    c.save();
    c.strokeStyle = `rgba(232, 242, 240, ${(0.65 * (1 - u)).toFixed(3)})`;
    c.lineWidth = 1.4;
    c.beginPath();
    c.ellipse(st.x, st.y, 7 + u * 22, 3.2 + u * 9.5, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    return;
  }

  c.save();
  c.translate(st.x, st.y);

  // Subtle ambient water ring around the smooth stone
  const pulse = reduced ? 0.5 : (time * 0.8 + st.x * 0.03) % 1;
  c.strokeStyle = `rgba(222, 236, 236, ${(0.34 * (1 - pulse)).toFixed(3)})`;
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(0, 1, 7.5 + pulse * 9, 3.4 + pulse * 4, 0, 0, Math.PI * 2);
  c.stroke();

  // Soft golden selection halo when unlocked and nearby
  if (near && canPick) {
    c.strokeStyle = 'rgba(255, 240, 174, .88)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.ellipse(0, 0.5, 11, 5.4, 0, 0, Math.PI * 2);
    c.stroke();
  }

  // Smooth river stone silhouette & wet highlight
  oval(c, 'rgba(38, 54, 61, .35)', 1, 2.2, 6.8, 3.3);
  oval(c, canPick ? '#5e6b70' : '#6d787b', 0, 0, 6.5, 3.8, -0.14);
  oval(c, canPick ? '#9aa9ad' : '#8d989b', -1.2, -0.8, 4.1, 2.1, -0.18);
  oval(c, '#eef5f2', -2.2, -1.4, 1.8, 0.9, -0.2);

  c.restore();
}

/** Expanding ripples underfoot as David wades through the brook. */
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
  const speed = walking ? 1.9 : 0.75;
  for (let i = 0; i < 2; i++) {
    const p = (time * speed + i * 0.5) % 1;
    c.save();
    c.strokeStyle = `rgba(232, 243, 243, ${((walking ? 0.58 : 0.3) * (1 - p)).toFixed(3)})`;
    c.lineWidth = walking ? 1.5 : 1.1;
    c.beginPath();
    c.ellipse(x, y + 1, 8 + p * (walking ? 20 : 12), 3 + p * (walking ? 7 : 4.2), 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
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

    // Subtle ivory etched motion streak trailing behind the stone
    const tailU = Math.max(0, u - 0.24);
    const tx = lerp(startX, hitX, tailU);
    const ty = lerp(startY, hitY, tailU) - Math.sin(Math.PI * tailU) * 26;
    line(c, 'rgba(255, 247, 224, .75)', 2.4, tx, ty, sx, sy);
    line(c, 'rgba(72, 58, 44, .35)', 1.0, tx, ty + 2, sx, sy + 1.5);

    // Smooth dark stone
    oval(c, '#3a3530', sx, sy, 4.2, 3.0, 0.12);
    oval(c, '#dbe4e2', sx - 1.1, sy - 0.9, 1.5, 0.9);
    return;
  }

  // Impact moment (radial etched flash + warm ochre dust cloud as heavy bronze settles)
  const impactAge = reduced ? age : age - SLING_FLIGHT_SECONDS;
  if (impactAge < 0) return;

  if (!reduced && impactAge < 0.28) {
    const p = impactAge / 0.28;
    c.save();
    c.strokeStyle = `rgba(255, 244, 200, ${(0.9 * (1 - p)).toFixed(3)})`;
    c.lineWidth = 2.0;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.25;
      const r0 = 5 + p * 8;
      const r1 = 13 + p * 18;
      c.beginPath();
      c.moveTo(hitX + Math.cos(a) * r0, hitY + Math.sin(a) * r0);
      c.lineTo(hitX + Math.cos(a) * r1, hitY + Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();
  }

  // Ochre dust bloom on the valley floor as the bronze champion collapses (0.35s .. 2.2s after impact)
  const dustStart = reduced ? 0 : 0.34;
  if (impactAge >= dustStart && impactAge < dustStart + 2.0) {
    const p = clamp((impactAge - dustStart) / 2.0, 0, 1);
    const alpha = reduced ? 0.22 : Math.sin(Math.PI * clamp(p / 0.35, 0, 1)) * (1 - p) * 0.52;
    if (alpha > 0.01) {
      c.save();
      c.globalAlpha = alpha;
      const baseX = champion.x - 36;
      const baseY = champion.y + 1;
      oval(c, '#e4cea3', baseX - 24 - p * 18, baseY - p * 11, 22 + p * 18, 9 + p * 6);
      oval(c, '#d8bc8e', baseX + 12 + p * 16, baseY + 2 - p * 8, 24 + p * 16, 8 + p * 5);
      oval(c, '#ebd9b4', baseX - 6, baseY - 4 - p * 14, 18 + p * 14, 7 + p * 5);
      c.restore();
    }
  }
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
  c.strokeStyle = near ? 'rgba(255, 241, 174, .92)' : 'rgba(92, 68, 44, .46)';
  c.lineWidth = near ? 2.2 : 1.5;
  c.beginPath();
  c.ellipse(x, y + 1, 18 + pulse, 6.2 + pulse * 0.35, 0, 0, Math.PI * 2);
  c.stroke();
  polygon(c, near ? '#fff1a8' : '#7b5f42', x - 3, y - 0.5, x + 4, y + 1, x - 3, y + 2.5);
  c.restore();
}
