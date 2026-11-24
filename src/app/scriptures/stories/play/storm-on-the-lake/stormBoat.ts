import { line, oval, polygon, print, printDynamic } from '../_shared/storyInk';
import type { SailState } from './stormGame';

type Brush = CanvasRenderingContext2D;

const INK = '#2b221c';
const WOOD_DARK = '#5b3f2b';
const WOOD_MID = '#835c3e';
const WOOD_LIGHT = '#b0845b';
const WOOD_DECK = '#c49b6c';
const HAIR = '#362920';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** First-century Galilean cedar boat back hull, mast, animated sail hoist, stern lantern & cushion, and bilge water. */
export function drawBoatBack(
  c: Brush,
  sailState: SailState,
  sailLift: number,
  waterLevel: number,
  storm: number,
  boatPitch: number,
  time: number,
  reduced: boolean,
): void {
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';

  // Far-side gunwale & interior shadow planking
  polygon(c, '#4b3322', 368, 294, 412, 282, 845, 282, 898, 292, 870, 344, 398, 344);
  // Warm sunlit cedar deck floor planks (walkable plane y: 286..326)
  polygon(c, WOOD_DECK, 404, 286, 858, 286, 848, 332, 414, 332);
  for (const py of [295, 305, 315, 325]) {
    line(c, 'rgba(91, 63, 43, .45)', 0.9, 412, py, 852, py);
  }
  // Subtle wet rain sheen across cedar deck planks during squall
  if (storm > 0.25) {
    const sheen = clamp(storm * 0.22, 0, 0.22);
    polygon(c, `rgba(176, 206, 222, ${sheen.toFixed(3)})`, 410, 288, 852, 288, 848, 304, 412, 304);
  }

  // Transverse wooden bench thwarts (oar bench + fore thwart)
  polygon(c, WOOD_MID, 682, 285, 712, 285, 710, 330, 680, 330);
  line(c, WOOD_LIGHT, 1.2, 683, 287, 711, 287);
  polygon(c, WOOD_MID, 514, 285, 536, 285, 534, 330, 512, 330);

  // Sloshing bilge water filling the bottom of the boat during the squall (Mark 4:37)
  if (waterLevel > 0.03) {
    const slosh = reduced ? 0 : Math.sin(time * (3.2 + storm * 2.8)) * (2 + storm * 4.5) - boatPitch * 42;
    const fillTop = 332 - waterLevel * 31;
    c.save();
    c.beginPath();
    c.moveTo(414, 332);
    c.lineTo(416, fillTop + slosh * 0.5);
    c.quadraticCurveTo(632, fillTop - slosh * 0.4, 848, fillTop - slosh * 0.5);
    c.lineTo(848, 332);
    c.closePath();
    c.fillStyle = storm > 0.3 ? 'rgba(64, 106, 122, .72)' : 'rgba(84, 122, 134, .34)';
    c.fill();
    line(c, 'rgba(226, 242, 246, .70)', 1.55, 422, fillTop + slosh * 0.4, 632, fillTop - slosh * 0.3, 842, fillTop - slosh * 0.4);
    c.restore();
  }

  // Warm sanctuary glow from sternpost oil lantern over Jesus resting on the cushion
  const flicker = reduced ? 1 : 0.92 + 0.08 * Math.sin(time * 7.4) * Math.cos(time * 4.3);
  const lanternHalo = c.createRadialGradient(382, 286, 4, 396, 294, 72);
  lanternHalo.addColorStop(0, `rgba(255, 214, 126, ${(0.34 * flicker).toFixed(3)})`);
  lanternHalo.addColorStop(0.55, `rgba(246, 178, 86, ${(0.14 * flicker).toFixed(3)})`);
  lanternHalo.addColorStop(1, 'rgba(246, 178, 86, 0)');
  c.fillStyle = lanternHalo;
  c.beginPath();
  c.arc(396, 294, 72, 0, Math.PI * 2);
  c.fill();

  // Woven stern cushion where Jesus rests (Mark 4:38 "in the stern, asleep on the cushion")
  oval(c, '#7c3c2f', 406, 304, 20, 9.5);
  oval(c, '#a55642', 404, 302, 16, 6.8);
  line(c, '#dfb579', 1.0, 394, 303, 416, 302);

  // Wooden cedar mast & rope stays
  const mastX = 590;
  const bend = storm > 0.3 && sailState === 'set' ? (reduced ? -5 : -6 - Math.sin(time * 7) * 2.5) : 0;
  line(c, '#4c3828', 1.2, mastX + bend, 146, 392, 290); // aft stay
  line(c, '#4c3828', 1.2, mastX + bend, 146, 868, 286); // forestay
  line(c, INK, 7.2, mastX, 292, mastX + bend, 134);
  line(c, WOOD_MID, 5.2, mastX, 292, mastX + bend, 134);
  line(c, WOOD_LIGHT, 1.3, mastX - 1.5, 290, mastX + bend - 1.5, 136);

  // Horizontal wooden yardarm & square linen sail (smooth hoist climb when set!)
  if (sailState === 'set') {
    const lift = clamp(sailLift, 0, 1);
    const yardY = lerp(234, 154, lift);
    const footY = lerp(244, 248, lift);
    const billow = (storm > 0.3 ? (reduced ? -34 : -38 - Math.sin(time * 9) * 6) : (reduced ? 18 : 20 + Math.sin(time * 2.5) * 3)) * lift;
    const yardBend = bend * lift;
    // Taut hoisting halyard rope running down to the cleat
    line(c, '#6a4e35', 1.15, mastX + yardBend, yardY, mastX + 10, 288);
    // Yardarm
    line(c, INK, 5, mastX - 42 + yardBend, yardY, mastX + 46 + yardBend, yardY - 2);
    line(c, WOOD_MID, 3.4, mastX - 42 + yardBend, yardY, mastX + 46 + yardBend, yardY - 2);
    // Billowing square woven linen sail unfurling as yardarm climbs
    const midY = (yardY + footY) * 0.5;
    c.beginPath();
    c.moveTo(mastX - 38 + yardBend, yardY + 1);
    c.lineTo(mastX + 42 + yardBend, yardY - 1);
    c.quadraticCurveTo(mastX + 42 + billow, midY, mastX + 36 + billow * 0.5, footY);
    c.quadraticCurveTo(mastX + billow * 0.45, footY + 6 * lift, mastX - 36 + billow * 0.4, footY);
    c.quadraticCurveTo(mastX - 38 + billow * 0.8, midY, mastX - 38 + yardBend, yardY + 1);
    c.closePath();
    c.fillStyle = storm > 0.3 ? '#cfc5ae' : '#efe1be';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.1;
    c.stroke();
    // Woven linen vertical seams
    if (lift > 0.25) {
      for (const sx of [-18, 2, 22]) {
        line(c, 'rgba(138, 118, 88, .42)', 0.85, mastX + sx + yardBend, yardY + 2, mastX + sx + billow * 0.48, footY - 1);
      }
    }
  } else {
    // Furled or reefed linen bundle tied cleanly down along the lowered yardarm
    const yardY = sailState === 'reefed' ? 242 : 234;
    line(c, INK, 5, mastX - 46, yardY, mastX + 48, yardY - 2);
    line(c, WOOD_MID, 3.2, mastX - 46, yardY, mastX + 48, yardY - 2);
    oval(c, '#dfd1b0', mastX, yardY + 4, 42, 6.8, -0.02);
    for (const rx of [-26, -8, 10, 28]) {
      line(c, '#6a4e35', 1.1, mastX + rx, yardY - 2, mastX + rx, yardY + 10);
    }
  }

  c.restore();
}

/** Foreground outer cedar hull planking + swinging stern oil lantern + side oar drawn IN FRONT of lower shins. */
export function drawBoatFront(
  c: Brush,
  oarPull: number,
  storm: number,
  boatPitch: number,
  time: number,
  reduced: boolean,
): void {
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';

  // Curved cedar bow-to-stern hull shell
  print(
    c,
    'M364 296 Q384 358 438 364 L824 364 Q878 358 906 290 L886 300 Q862 332 820 332 L438 332 Q396 332 378 302 Z',
    WOOD_MID,
    INK,
    1.5,
  );
  // Lower waterline shade strake
  print(
    c,
    'M386 334 Q404 358 442 363 L820 363 Q862 358 884 328 L866 332 L404 332 Z',
    WOOD_DARK,
  );
  // Hand-hewn plank strakes & iron-nail woodcut ribs
  line(c, '#4d3322', 1.0, 390, 326, 878, 326);
  line(c, '#4d3322', 1.0, 404, 344, 862, 344);
  line(c, WOOD_LIGHT, 1.5, 378, 302, 438, 330, 822, 330, 888, 298);
  for (const rx of [448, 520, 590, 660, 730, 800]) {
    line(c, 'rgba(60, 40, 26, .48)', 1.0, rx, 331, rx - 3, 362);
  }
  // Curved upturned sternpost (left) and prow stempost (right)
  print(c, 'M362 298 Q354 276 368 264 L376 268 Q367 282 375 302 Z', WOOD_DARK, INK, 1.1);
  print(c, 'M896 294 Q912 272 904 256 L894 261 Q899 276 884 298 Z', WOOD_DARK, INK, 1.1);

  // Swinging wrought-bronze oil lantern hanging from the sternpost
  const sway = reduced ? 0 : -boatPitch * 1.15 + Math.sin(time * 3.1) * (0.05 + storm * 0.14);
  c.save();
  c.translate(373, 267);
  c.rotate(sway);
  line(c, '#3d2f24', 1.2, 0, 0, 5, 6);
  // Lantern frame & glowing amber flame core
  polygon(c, '#4e3b2b', 2, 6, 8, 6, 9, 15, 1, 15);
  oval(c, '#ffe394', 5, 10.5, 2.3, 3.1);
  oval(c, '#fff9de', 5, 10, 1.1, 1.6);
  c.restore();

  // Midship working wooden oar pivoting over the gunwale + 2-stroke churning foam
  const sweep = oarPull > 0
    ? Math.sin(Math.PI * 2 * oarPull) * 0.44
    : (reduced ? 0 : Math.sin(time * (1.8 + storm * 1.2)) * 0.08);
  c.save();
  c.translate(696, 330);
  c.rotate(0.42 - sweep);
  line(c, INK, 4.6, -18, -14, 24, 56);
  line(c, WOOD_LIGHT, 2.8, -18, -14, 24, 56);
  polygon(c, WOOD_MID, 18, 48, 30, 44, 38, 68, 24, 72);
  c.restore();

  if (!reduced && oarPull > 0 && oarPull < 1) {
    const foamAlpha = Math.sin(Math.PI * oarPull) * 0.72;
    oval(c, `rgba(232, 244, 248, ${foamAlpha.toFixed(3)})`, 682 - oarPull * 24, 372, 16 + oarPull * 14, 4.2);
  }

  c.restore();
}

/** Draws Jesus sleeping peacefully on the stern cushion, then standing tall to rebuke the wind & sea. */
export function drawJesusInBoat(
  c: Brush,
  x: number,
  y: number,
  standing: boolean,
  rebukeProgress: number,
  storm: number,
  time: number,
  reduced: boolean,
): void {
  const skin = '#b7794d';
  const tunic = '#f3e3b9';
  const fold = '#bca782';
  const mantle = '#a93631';
  const edge = '#dd6445';

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(x, y);

  if (!standing) {
    // Sleeping peacefully curled/reclining on the stern cushion — completely still amid the storm
    oval(c, 'rgba(42,30,22,.22)', 2, 4, 20, 6);
    print(c, 'M-14 -4 Q-4 -16 14 -12 Q24 -8 22 2 Q6 6 -16 3 Z', tunic, INK, 1.0);
    print(c, 'M-10 -6 Q4 -16 18 -10 Q16 0 4 3 Q-8 4 -12 -1 Z', mantle, INK, 0.85);
    line(c, edge, 1.0, -8, -4, 14, -7);
    oval(c, HAIR, -11, -7, 7.2, 6.2);
    oval(c, skin, -8.5, -5.5, 5.2, 4.4);
    print(c, 'M-11 -3 Q-8 -1 -4 -3 Q-6 -7 -11 -7 Z', HAIR);
    line(c, '#3a2c22', 0.85, -7.2, -5.8, -5.0, -5.6);
    c.restore();
    return;
  }

  // Standing upright in the stern facing east (+1) toward the raging lake
  oval(c, 'rgba(42,30,22,.24)', 2, 2, 13, 3.6);
  line(c, INK, 4.2, -3, -20, -4, -3);
  line(c, '#865d43', 2.9, -3, -20, -4, -3);
  line(c, INK, 4.2, 2, -20, 4, -3);
  line(c, skin, 2.9, 2, -20, 4, -3);

  // Far arm steadying cloak
  line(c, INK, 4.4, 3.5, -39, 8, -32, 11, -26);
  line(c, '#8c6044', 3.0, 3.5, -39, 8, -32, 11, -26);

  // Robe & streaming crimson mantle blowing in the gale — drawn via leak-free printDynamic!
  const windTrail = storm > 0.2 ? (reduced ? -10 : -11 - Math.sin(time * 10) * 3.5) : 0;
  print(c, 'M-5 -44 Q0 -41 4 -44 Q7.5 -42 8.2 -38 L6 -24 L8.5 -12 L-9.5 -12 L-7 -27 L-8 -38 Z', tunic, INK, 1.0);
  print(c, 'M-6 -35 L-3.5 -24 L-6.5 -13 L-8.5 -13 Z M2 -24 L4.5 -13 L7 -13 L4.5 -21 Z', fold);
  printDynamic(
    c,
    `M-7 -44 Q-3 -45.5 0 -43.5 L-1 -31 Q-5 -24 ${-8 + windTrail * 0.6} -14 L${-15 + windTrail} -15 Q${-12 + windTrail * 0.5} -28 -10 -39 Z`,
    mantle,
    INK,
    0.85,
  );
  line(c, edge, 1.0, -13 + windTrail * 0.8, -17, -6 + windTrail * 0.4, -18);

  // Head & bearded profile facing east
  print(c, 'M-5 -52 Q-7.5 -57 -4 -61 Q0 -64 5 -61 Q8.5 -59 7.5 -54 L5.5 -46 L-4 -45 Z', HAIR);
  print(c, 'M-4 -57 Q0 -60 5 -57.5 L6 -54.5 L8.4 -52.2 L6.8 -51.2 L6.8 -48.8 Q5.6 -46.4 1.8 -46.8 L-2 -48.8 Z', skin, INK, 0.65);
  print(c, 'M-4 -53 Q-1.5 -50 2 -50 L6.6 -50.6 L6.4 -48 Q5.4 -45.2 1.8 -44.2 L-2.5 -46 Z', HAIR);
  oval(c, '#352b25', 4.8, -54.4, 0.65, 0.45);

  // Near arm: outstretched calmly toward the storm waves ("Peace! Be still!")
  const reach = 0.55 + rebukeProgress * 0.45;
  const ex = 2 + reach * 8;
  const ey = -35 - reach * 4;
  const hx = 10 + reach * 15;
  const hy = -35 - reach * 11;
  line(c, INK, 4.6, -3.5, -39, ex, ey, hx, hy);
  line(c, skin, 3.2, -3.5, -39, ex, ey, hx, hy);
  line(c, tunic, 5.8, -3.5, -39, -3.5 + (ex + 3.5) * 0.65, -39 + (ey + 39) * 0.65);
  oval(c, INK, hx + 1.2, hy - 1.2, 2.3, 3.5, 0.12);
  oval(c, skin, hx + 1.2, hy - 1.2, 1.7, 2.9, 0.12);

  c.restore();
}

/** Draws a fisherman disciple aboard the boat (player or companion crew member) with wind-lean & wave-brace. */
export function drawDisciple(
  c: Brush,
  x: number,
  y: number,
  facing: number,
  stride: number,
  pose: 'idle' | 'sail' | 'oars' | 'bail' | 'wake' | 'brace' | 'awe',
  actionProgress: number,
  variant: number,
  time: number,
  reduced: boolean,
  windLean = 0,
): void {
  const palettes = [
    { tunic: '#d8c59e', fold: '#a2906e', mantle: '#3e596d', skin: '#b0764d' }, // Player disciple (Galilee fisherman indigo)
    { tunic: '#c7b08a', fold: '#8e7a5a', mantle: '#6a533e', skin: '#9d6846' }, // Companion 1 (bow lookout)
    { tunic: '#cfc2a6', fold: '#968b72', mantle: '#4d6558', skin: '#ab724a' }, // Companion 2 (oar bench)
  ] as const;
  const pal = palettes[variant % palettes.length];
  const phase = Math.sin(stride);
  const swing = phase * 7.6;
  const moving = Math.min(1, Math.abs(stride) * 3);
  const lift = (v: number) => Math.max(0, v) ** 2 * moving * 4.0;
  const breathe = reduced ? 0 : Math.sin(time * 2.1 + variant) * 0.45;

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(x, y);
  oval(c, 'rgba(42,30,22,.20)', 2, 1.5, 11.5, 3.2);
  c.scale(facing < 0 ? -1 : 1, 1);
  c.scale(0.95, 0.95);

  // Legs
  line(c, INK, 4.1, -3, -20, -3.5 - swing, -2.5 - lift(Math.cos(stride)));
  line(c, '#835a41', 2.8, -3, -20, -3.5 - swing, -2.5 - lift(Math.cos(stride)));
  line(c, INK, 4.1, 1.5, -20, 3.2 + swing, -2.5 - lift(-Math.cos(stride)));
  line(c, pal.skin, 2.8, 1.5, -20, 3.2 + swing, -2.5 - lift(-Math.cos(stride)));

  const baseTilt = pose === 'bail'
    ? actionProgress * 0.28
    : pose === 'oars'
      ? -actionProgress * 0.18
      : pose === 'brace'
        ? 0.15 + actionProgress * 0.14
        : 0;
  const tilt = baseTilt + windLean * (facing < 0 ? -1 : 1);
  c.translate(0, -22 + Math.abs(phase) * 1.0 + breathe + (pose === 'brace' ? actionProgress * 2.5 : 0));
  c.rotate(tilt);
  c.translate(0, 22);

  // Far arm
  line(c, INK, 4.2, 3.4, -38, 7.5, -30, 10, -24);
  line(c, '#875c42', 2.8, 3.4, -38, 7.5, -30, 10, -24);

  // Fisherman's belted tunic & short shoulder cloak
  print(c, 'M-4.5 -43 Q0 -40.5 3.5 -43 Q7 -41.5 7.8 -37 L5.5 -25 L7.8 -12.5 L-8.8 -12.5 L-6.8 -27 L-7.6 -37 Z', pal.tunic, INK, 0.95);
  print(c, 'M-6 -35 L-3.5 -25 L-6.5 -13.5 L-8.5 -13 Z', pal.fold);
  print(c, 'M-6.8 -28.5 Q0 -27 6 -28.6 L6.2 -26 Q0 -24.5 -7 -26.4 Z', '#5d432e');
  print(c, 'M-7 -43 Q-3 -44.5 0 -42.5 L-1 -31 L-6.5 -17 L-11.5 -17 L-9.5 -32 Z', pal.mantle, INK, 0.8);

  // Head & fisherman beard
  print(c, 'M-4.8 -51 Q-7.2 -56 -3.8 -60.2 Q0 -63.2 4.8 -60 Q8.2 -58 7.5 -53.5 L5.5 -46.5 L-3.8 -45 Z', HAIR);
  print(c, 'M-3.8 -56.5 Q0 -59.8 4.8 -57 L5.8 -54.5 L8.2 -52.2 L6.6 -51.2 L6.6 -48.8 Q5.4 -46.5 1.8 -46.8 L-2 -48.8 Z', pal.skin, INK, 0.65);
  print(c, 'M-3.8 -52.5 Q-1.4 -49.8 2 -49.8 L6.4 -50.4 L6.2 -48 Q5 -45.5 1.8 -44.5 L-2.4 -46 Z', HAIR);
  oval(c, '#352b25', 4.6, -54.1, 0.6, 0.45);

  // Near arm + prop (wooden bailing scoop during bail!)
  if (pose === 'bail') {
    const hx = 9 + actionProgress * 7;
    const hy = -26 + Math.sin(Math.PI * actionProgress) * 6;
    line(c, INK, 4.4, -3.5, -38, 3, -31, hx, hy);
    line(c, pal.skin, 3.0, -3.5, -38, 3, -31, hx, hy);
    polygon(c, '#7a5233', hx - 3, hy - 3, hx + 6, hy - 5, hx + 8, hy + 4, hx - 2, hy + 5);
  } else if (pose === 'sail' || pose === 'wake') {
    const hx = 8 + actionProgress * 6;
    const hy = -35 - actionProgress * 10;
    line(c, INK, 4.4, -3.5, -38, 2.5, -33, hx, hy);
    line(c, pal.skin, 3.0, -3.5, -38, 2.5, -33, hx, hy);
  } else if (pose === 'awe') {
    line(c, INK, 4.4, -3.5, -38, 2.5, -32, 7.5, -36);
    line(c, pal.skin, 3.0, -3.5, -38, 2.5, -32, 7.5, -36);
  } else {
    const hx = -3 - phase * 5.0;
    line(c, INK, 4.4, -3.5, -38, -4.5 - phase * 2.2, -31, hx, -23.5);
    line(c, pal.skin, 3.0, -3.5, -38, -4.5 - phase * 2.2, -31, hx, -23.5);
  }

  c.restore();
}
