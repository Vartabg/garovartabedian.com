import { line, oval, polygon } from '../_shared/storyInk';
import { STORM_HEIGHT, STORM_WIDTH } from './stormGame';

type Brush = CanvasRenderingContext2D;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const CALM_ORIGIN_X = 406;

function rgb(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

/**
 * Spatial storm intensity at world X during the expanding west-to-east stillness wavefront
 * emanating from Jesus in the stern (x = 406). Ahead of the wavefront, waves still rage;
 * behind it they iron smoothly into glassy calm.
 */
export function localStormAt(
  x: number,
  storm: number,
  calmFrom: number,
  calmFrontRadius: number | null,
): number {
  if (calmFrontRadius === null) return storm;
  const dist = Math.abs(x - CALM_ORIGIN_X);
  const feather = 140;
  const behind = smoothstep(calmFrontRadius - feather, calmFrontRadius, dist);
  return calmFrom * behind;
}

/**
 * Unified traveling Sea of Galilee wave height offset at world X.
 * Drives BOTH rendered wave contours and the boat's physical heave/pitch buoyancy!
 * Optional `rogueProgress` (0..1) injects a steep white-capped swell sweeping east -> prow (1280 -> 840).
 */
export function seaWaveOffset(
  x: number,
  time: number,
  storm: number,
  calm: number,
  calmFrom: number,
  calmFrontRadius: number | null,
  freq: number,
  speed: number,
  phase: number,
  baseAmp: number,
  stormAmp: number,
  calmAmp: number,
  reduced: boolean,
  rogueProgress: number | null = null,
): number {
  if (reduced) return 0;
  const localStorm = localStormAt(x, storm, calmFrom, calmFrontRadius);
  const localCalm = calmFrontRadius !== null
    ? 1 - (calmFrom > 0 ? localStorm / calmFrom : 1)
    : calm;
  const amp = lerp(lerp(baseAmp, stormAmp, localStorm), calmAmp, localCalm);
  const shift = time * speed;
  let y = Math.sin(x * freq + shift + phase) * amp
    + Math.cos(x * freq * 1.72 - shift * 0.78 + phase) * (amp * 0.34);

  // Steep traveling rogue wave crest rushing in from the east toward the prow!
  if (rogueProgress !== null && rogueProgress >= 0 && rogueProgress <= 1.25 && localStorm > 0.25) {
    const crestX = lerp(1290, 815, clamp(rogueProgress, 0, 1.15));
    const dx = (x - crestX) / 115;
    const envelope = Math.exp(-dx * dx);
    const fadeOut = rogueProgress > 1 ? Math.max(0, 1 - (rogueProgress - 1) / 0.25) : 1;
    // Negative Y is upward on canvas: lifts prow sharply before breaking!
    y -= envelope * fadeOut * 28 * localStorm;
  }

  return y;
}

/** Smooth sky grading from warm Galilean dusk -> dark slate squall -> starry moonlit stillness. */
export function drawLakeSky(
  c: Brush,
  storm: number,
  calm: number,
  time: number,
  reduced: boolean,
): void {
  const duskTop: [number, number, number] = [94, 82, 108];
  const duskMid: [number, number, number] = [194, 134, 96];
  const duskLow: [number, number, number] = [235, 186, 128];

  const stormTop: [number, number, number] = [30, 40, 52];
  const stormMid: [number, number, number] = [48, 62, 74];
  const stormLow: [number, number, number] = [78, 92, 100];

  const calmTop: [number, number, number] = [24, 38, 62];
  const calmMid: [number, number, number] = [44, 68, 98];
  const calmLow: [number, number, number] = [92, 118, 144];

  const blend = (d: [number, number, number], s: [number, number, number], cm: [number, number, number]) => {
    const mid: [number, number, number] = [lerp(d[0], s[0], storm), lerp(d[1], s[1], storm), lerp(d[2], s[2], storm)];
    return rgb(mid, cm, calm);
  };

  const grad = c.createLinearGradient(0, 0, 0, 268);
  grad.addColorStop(0, blend(duskTop, stormTop, calmTop));
  grad.addColorStop(0.58, blend(duskMid, stormMid, calmMid));
  grad.addColorStop(1, blend(duskLow, stormLow, calmLow));
  c.fillStyle = grad;
  c.fillRect(0, 0, STORM_WIDTH, 268);

  // Soft distant atmospheric silver-blue cloud-depth rim over eastern Golan ridge at peak squall (never flashing!)
  if (storm > 0.55 && calm < 0.25) {
    const rimAlpha = clamp((storm - 0.55) / 0.45, 0, 1) * (1 - calm * 4) * 0.16;
    const ridgeGlow = c.createRadialGradient(980, 198, 20, 980, 198, 260);
    ridgeGlow.addColorStop(0, `rgba(190, 212, 224, ${rimAlpha.toFixed(3)})`);
    ridgeGlow.addColorStop(1, 'rgba(190, 212, 224, 0)');
    c.fillStyle = ridgeGlow;
    c.fillRect(680, 40, 600, 220);
  }

  // Subtle starlight & pale gold crescent moon emerging in the calm night sky
  if (calm > 0.08) {
    const alpha = clamp((calm - 0.08) / 0.92, 0, 1);
    const stars: readonly [number, number, number, boolean][] = [
      [118, 44, 1.4, false], [216, 72, 1.1, false], [312, 36, 1.6, true], [448, 56, 1.2, false],
      [534, 34, 1.3, false], [682, 48, 1.7, true], [768, 30, 1.2, false], [858, 62, 1.4, false],
      [1042, 42, 1.6, true], [1166, 66, 1.2, false], [1218, 38, 1.3, false],
      [380, 88, 1.0, false], [608, 78, 1.1, false], [946, 148, 1.0, false],
    ];
    for (const [sx, sy, sr, bright] of stars) {
      const twinkle = reduced ? 1 : 0.72 + 0.28 * Math.sin(time * 2.1 + sx);
      const starA = alpha * 0.88 * twinkle;
      oval(c, `rgba(255, 248, 224, ${starA.toFixed(3)})`, sx, sy, sr, sr);
      if (bright) {
        line(c, `rgba(255, 248, 224, ${(starA * 0.45).toFixed(3)})`, 0.8, sx - 4.2, sy, sx + 4.2, sy);
        line(c, `rgba(255, 248, 224, ${(starA * 0.45).toFixed(3)})`, 0.8, sx, sy - 4.2, sx, sy + 4.2);
      }
    }

    // Luminous crescent moon & soft atmospheric halo over the eastern horizon
    const mx = 948;
    const my = 84;
    const halo = c.createRadialGradient(mx, my, 6, mx, my, 102);
    halo.addColorStop(0, `rgba(255, 248, 218, ${(0.44 * alpha).toFixed(3)})`);
    halo.addColorStop(0.45, `rgba(218, 230, 242, ${(0.16 * alpha).toFixed(3)})`);
    halo.addColorStop(1, 'rgba(218, 230, 242, 0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(mx, my, 102, 0, Math.PI * 2);
    c.fill();

    // True curved crescent silhouette (zero dark eclipse disk)
    c.save();
    c.globalAlpha = alpha;
    c.translate(mx, my);
    c.rotate(0.32);
    const r = 16;
    c.beginPath();
    c.arc(0, 0, r, -Math.PI * 0.5, Math.PI * 0.5, false);
    c.bezierCurveTo(r * 0.54, r * 0.48, r * 0.54, -r * 0.48, 0, -r);
    c.closePath();
    c.fillStyle = '#fef4d4';
    c.fill();
    c.restore();
  }

  // Rolling sculpted storm cloud banks (single seamless silhouette per bank, parting gracefully in calm)
  const cloudAlpha = clamp(0.30 + storm * 0.58 - calm * 0.24, 0.08, 0.88);
  const drift = reduced ? 0 : time * (7 + storm * 32);
  c.save();
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 255 - drift) % (STORM_WIDTH + 320) + (STORM_WIDTH + 320)) % (STORM_WIDTH + 320) - 160;
    const cy = 50 + (i % 3) * 26;
    const rw = 105 + (i % 3) * 34;
    const rh = 19 + storm * 14;
    const topCol = storm > 0.35
      ? `rgba(74, 88, 100, ${(cloudAlpha * 0.85).toFixed(3)})`
      : calm > 0.5
        ? `rgba(88, 112, 142, ${(cloudAlpha * 0.38).toFixed(3)})`
        : `rgba(176, 126, 108, ${(cloudAlpha * 0.45).toFixed(3)})`;
    const botCol = storm > 0.35
      ? `rgba(34, 44, 54, ${cloudAlpha.toFixed(3)})`
      : calm > 0.5
        ? `rgba(48, 68, 96, ${(cloudAlpha * 0.34).toFixed(3)})`
        : `rgba(116, 84, 88, ${(cloudAlpha * 0.48).toFixed(3)})`;
    const gradCloud = c.createLinearGradient(cx, cy - rh, cx, cy + rh);
    gradCloud.addColorStop(0, topCol);
    gradCloud.addColorStop(1, botCol);
    c.fillStyle = gradCloud;
    c.beginPath();
    c.moveTo(cx - rw, cy + rh * 0.38);
    c.bezierCurveTo(cx - rw * 0.96, cy - rh * 0.45, cx - rw * 0.48, cy - rh * 0.95, cx - rw * 0.08, cy - rh * 0.72);
    c.bezierCurveTo(cx + rw * 0.14, cy - rh * 1.05, cx + rw * 0.62, cy - rh * 0.88, cx + rw * 0.78, cy - rh * 0.25);
    c.bezierCurveTo(cx + rw * 1.05, cy - rh * 0.15, cx + rw * 1.12, cy + rh * 0.42, cx + rw * 0.82, cy + rh * 0.58);
    c.bezierCurveTo(cx + rw * 0.32, cy + rh * 0.72, cx - rw * 0.48, cy + rh * 0.74, cx - rw, cy + rh * 0.38);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** Distant Golan heights & Capernaum shore with tiny glowing dusk/night village lamps. */
export function drawGalileeHills(c: Brush, storm: number, calm: number, progress: number): void {
  const shift = progress * 68;
  const farColor = calm > 0.5 ? '#26384e' : storm > 0.4 ? '#323f49' : '#655966';
  const nearColor = calm > 0.5 ? '#1f2e42' : storm > 0.4 ? '#28343d' : '#4b4650';

  polygon(
    c, farColor,
    -60 - shift * 0.3, 258, 120 - shift * 0.3, 214, 290 - shift * 0.3, 224, 470 - shift * 0.3, 206,
    670 - shift * 0.3, 226, 860 - shift * 0.3, 198, 1060 - shift * 0.3, 188, 1240 - shift * 0.3, 204,
    STORM_WIDTH + 60, 192, STORM_WIDTH + 60, 272, -60, 272,
  );
  polygon(
    c, nearColor,
    -40 - shift, 232, 90 - shift, 236, 210 - shift, 248, 310 - shift, 266, -40, 268,
  );
  if (storm < 0.75) {
    const lampAlpha = (1 - storm * 0.7) * 0.88;
    for (const [lx, ly] of [[44, 250], [72, 252], [116, 256], [154, 258]] as const) {
      oval(c, `rgba(255, 222, 146, ${lampAlpha.toFixed(3)})`, lx - shift, ly, 2.3, 1.5);
    }
  }
}

/** Distant companion small fishing boats (Mark 4:36 "Other small boats were also with him") riding the wave field. */
export function drawCompanionBoats(
  c: Brush,
  storm: number,
  calm: number,
  calmFrom: number,
  calmFrontRadius: number | null,
  time: number,
  reduced: boolean,
): void {
  const boats: readonly { x: number; y: number; scale: number; phase: number }[] = [
    { x: 185, y: 280, scale: 0.44, phase: 0.4 },
    { x: 1095, y: 276, scale: 0.38, phase: 2.1 },
  ];

  for (const b of boats) {
    const localStorm = localStormAt(b.x, storm, calmFrom, calmFrontRadius);
    const bob = seaWaveOffset(b.x, time, storm, calm, calmFrom, calmFrontRadius, 0.015, 1.8 + localStorm * 2.2, 0.4, 2.5, 9, 0.9, reduced);
    const ahead = seaWaveOffset(b.x + 28, time, storm, calm, calmFrom, calmFrontRadius, 0.015, 1.8 + localStorm * 2.2, 0.4, 2.5, 9, 0.9, reduced);
    const tilt = reduced ? 0 : clamp(Math.atan2(ahead - bob, 28) * 0.85, -0.22, 0.22);
    c.save();
    c.translate(b.x, b.y + bob);
    c.rotate(tilt);
    c.scale(b.scale, b.scale);

    polygon(c, calm > 0.5 ? '#202b38' : '#332b27', -44, -6, 46, -6, 34, 12, -32, 12);
    line(c, '#2d241f', 2.4, -2, -6, -2, -52);
    if (localStorm < 0.5) {
      polygon(c, calm > 0.5 ? '#9ba9b8' : '#d8c5a2', -2, -46, 22, -32, -2, -16);
    }
    c.restore();
  }
}

/** Trailing V-foam wake behind the boat stern while sailing out at evening. */
export function drawBoatWake(c: Brush, strength: number, time: number, reduced: boolean): void {
  if (strength <= 0.04) return;
  const drift = reduced ? 0 : (time * 38) % 44;
  c.save();
  for (let i = 0; i < 6; i++) {
    const x = 368 - i * 28 - drift * 0.55;
    const spread = 4 + i * 3.8;
    const a = strength * Math.max(0, 0.42 - i * 0.065);
    line(c, `rgba(235, 242, 240, ${a.toFixed(3)})`, 1.4, x, 356 - spread * 0.4, x - 18, 356 - spread * 0.55);
    line(c, `rgba(235, 242, 240, ${(a * 0.85).toFixed(3)})`, 1.2, x, 358 + spread * 0.35, x - 16, 358 + spread * 0.5);
  }
  c.restore();
}

/** Draws a single layered etched wave band directly from the unified ocean wave field. */
export function drawWaveLayer(
  c: Brush,
  baseY: number,
  baseAmp: number,
  stormAmp: number,
  calmAmp: number,
  freq: number,
  speed: number,
  phase: number,
  fill: string,
  crestColor: string,
  storm: number,
  calm: number,
  calmFrom: number,
  calmFrontRadius: number | null,
  time: number,
  reduced: boolean,
  rogueProgress: number | null = null,
): void {
  c.beginPath();
  c.moveTo(0, STORM_HEIGHT + 12);
  for (let x = 0; x <= STORM_WIDTH; x += 16) {
    const y = baseY + seaWaveOffset(
      x, time, storm, calm, calmFrom, calmFrontRadius, freq, speed, phase, baseAmp, stormAmp, calmAmp, reduced, rogueProgress,
    );
    c.lineTo(x, y);
  }
  c.lineTo(STORM_WIDTH, STORM_HEIGHT + 12);
  c.closePath();
  c.fillStyle = fill;
  c.fill();

  // Foaming woodcut wave crest stroke
  c.beginPath();
  for (let x = 0; x <= STORM_WIDTH; x += 16) {
    const y = baseY + seaWaveOffset(
      x, time, storm, calm, calmFrom, calmFrontRadius, freq, speed, phase, baseAmp, stormAmp, calmAmp, reduced, rogueProgress,
    );
    if (x === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.strokeStyle = crestColor;
  c.lineWidth = storm > 0.3 || calmFrontRadius !== null ? 2.1 : 1.25;
  c.stroke();

  // Whitecap foam curls along steep storm crests
  if (!reduced && (storm > 0.42 || calmFrontRadius !== null)) {
    for (let x = 80; x < STORM_WIDTH - 60; x += 145) {
      const localStorm = localStormAt(x, storm, calmFrom, calmFrontRadius);
      if (localStorm < 0.42) continue;
      const y = baseY + seaWaveOffset(
        x, time, storm, calm, calmFrom, calmFrontRadius, freq, speed, phase, baseAmp, stormAmp, calmAmp, reduced, rogueProgress,
      );
      if (y < baseY - stormAmp * 0.45) {
        oval(c, `rgba(244, 251, 252, ${(0.55 * localStorm).toFixed(3)})`, x - 6, y + 1.5, 11, 2.2, -0.14);
      }
    }
  }

  // Etched horizontal woodcut water hatching lines below the crest
  const hatchAlpha = storm > 0.3 ? 0.24 : 0.16;
  for (let x = 24; x < STORM_WIDTH - 24; x += 72) {
    const hx = x + ((phase * 31) % 24);
    const hy = baseY + 15 + ((x * 13) % 26);
    const half = 9 + ((x * 7) % 10);
    line(c, `rgba(225, 238, 244, ${hatchAlpha})`, 0.9, hx - half, hy, hx + half, hy);
  }
}

/** Shimmering vertical crescent-moon reflection dancing on the glassy calmed Sea of Galilee. */
export function drawMoonReflection(c: Brush, calm: number, time: number, reduced: boolean): void {
  if (calm <= 0.08) return;
  const alpha = clamp((calm - 0.08) / 0.92, 0, 1);
  const mx = 948;
  c.save();
  const glow = c.createRadialGradient(mx, 340, 8, mx, 340, 118);
  glow.addColorStop(0, `rgba(255, 245, 206, ${(0.18 * alpha).toFixed(3)})`);
  glow.addColorStop(0.55, `rgba(220, 232, 244, ${(0.07 * alpha).toFixed(3)})`);
  glow.addColorStop(1, 'rgba(220, 232, 244, 0)');
  c.fillStyle = glow;
  c.fillRect(mx - 120, 262, 240, 195);

  for (let i = 0; i < 18; i++) {
    const y = 268 + i * 10.2;
    const sway = reduced ? 0 : Math.sin(time * 1.8 + i * 1.15) * (2.5 + i * 0.32);
    const taper = 1 - Math.abs(i - 6) / 14;
    const baseHalf = 9 + taper * 22 + ((i * 7) % 9);
    const a = alpha * clamp(0.46 - i * 0.017, 0.08, 0.46);
    const lw = Math.max(0.8, 1.9 - i * 0.055);
    line(c, `rgba(255, 246, 212, ${a.toFixed(3)})`, lw, mx - baseHalf + sway, y, mx + baseHalf + sway, y);
    if (i % 3 === 1) {
      const side = (i % 2 === 0 ? 1 : -1) * (baseHalf + 9);
      line(c, `rgba(240, 238, 214, ${(a * 0.55).toFixed(3)})`, lw * 0.8, mx + side - 5 + sway, y + 1, mx + side + 6 + sway, y + 1);
    }
  }
  c.restore();
}

/** Slanted etched rain & driving wind-spray sheets — evaporating spatially as the stillness wavefront sweeps east! */
export function drawRainAndWind(
  c: Brush,
  storm: number,
  calmFrom: number,
  calmFrontRadius: number | null,
  time: number,
  reduced: boolean,
): void {
  const activeStrength = calmFrontRadius !== null ? calmFrom : storm;
  if (activeStrength <= 0.08) return;
  c.save();
  const fall = reduced ? 0 : time * 420;
  const count = Math.round(52 * clamp(activeStrength, 0, 1));
  c.lineWidth = 1.15;
  for (let i = 0; i < count; i++) {
    const rx = ((i * 89 + (i % 5) * 31 - fall * 0.48) % (STORM_WIDTH + 120) + (STORM_WIDTH + 120)) % (STORM_WIDTH + 120) - 60;
    const localS = localStormAt(rx, storm, calmFrom, calmFrontRadius);
    if (localS <= 0.06) continue;
    const ry = (i * 53 + fall) % (STORM_HEIGHT + 80);
    c.strokeStyle = `rgba(214, 228, 236, ${(0.38 * localS).toFixed(3)})`;
    c.beginPath();
    c.moveTo(rx, ry);
    c.lineTo(rx - 14, ry + 26);
    c.stroke();
  }

  if (!reduced) {
    c.lineWidth = 1.3;
    for (let i = 0; i < 6; i++) {
      const wx = ((i * 260 - time * 310) % (STORM_WIDTH + 220) + (STORM_WIDTH + 220)) % (STORM_WIDTH + 220) - 110;
      const localS = localStormAt(wx, storm, calmFrom, calmFrontRadius);
      if (localS <= 0.08) continue;
      const wy = 95 + i * 38;
      c.strokeStyle = `rgba(228, 238, 244, ${(0.22 * localS).toFixed(3)})`;
      c.beginPath();
      c.moveTo(wx, wy);
      c.quadraticCurveTo(wx - 45, wy - 5, wx - 92, wy + 2);
      c.stroke();
    }
  }
  c.restore();
}
