import type { ArmorPiece } from './elahGame';
import { line, oval, polygon, print } from './elahInk';

type Brush = CanvasRenderingContext2D;

const INK = '#3b332b';
const HAIR = '#3a2c22';
const BRONZE_MID = '#a47e47';
const BRONZE_LIGHT = '#d5b26e';
const BRONZE_DARK = '#664d2b';

function drawLeg(c: Brush, hip: number, foot: number, lift: number, near: boolean, skin: string, greave = false) {
  const knee = (hip + foot) / 2 + 2.2 + lift * 0.4;
  const ankle = -2.6 - lift;
  const tone = near ? skin : '#855c42';
  line(c, INK, 4.3, hip, -20, knee, -11.5 - lift * 0.25, foot, ankle);
  line(c, tone, 3.0, hip, -20, knee, -11.5 - lift * 0.25, foot, ankle);
  if (greave) {
    // Bronze shin greave for Goliath / armored warriors
    line(c, BRONZE_MID, 3.4, knee, -11.5 - lift * 0.25, foot, ankle - 0.5);
    line(c, BRONZE_LIGHT, 1.0, knee + 0.8, -11.5 - lift * 0.25, foot + 0.8, ankle - 0.8);
  }
  c.save();
  c.translate(foot, -lift);
  print(c, 'M-2 -3Q0 -3.8 2 -2L5 -1.7Q6.8 -.5 4.8 .3L-2 .3Z', tone, INK, 0.75);
  print(c, 'M-2 -.7L2.5 -.9L5.5 -.9Q6.6 0 4.8 .7L-2 .6Z', '#564331');
  c.restore();
}

function drawArm(
  c: Brush,
  shoulder: number,
  elbowX: number,
  elbowY: number,
  handX: number,
  handY: number,
  skin: string,
  sleeve: string,
  sleeveFold: string,
  far = false,
) {
  const tone = far ? '#8b6043' : skin;
  line(c, INK, 4.6, shoulder, -39, elbowX, elbowY, handX, handY);
  line(c, tone, 3.2, shoulder, -39, elbowX, elbowY, handX, handY);
  const sx = shoulder + (elbowX - shoulder) * 0.68;
  const sy = -39 + (elbowY + 39) * 0.68;
  line(c, far ? sleeveFold : sleeve, 5.6, shoulder, -39, sx, sy);
  oval(c, tone, handX + 0.6, handY, 2.3, 1.6, -0.15);
}

/** David: visually shifts from overburdened by Saul's bronze armor to nimble shepherd with staff and sling. */
export function drawDavid(
  c: Brush,
  x: number,
  y: number,
  facing: number,
  stride: number,
  armorLeft: readonly ArmorPiece[],
  pose: 'idle' | 'drop' | 'pick' | 'sling' | 'release' | 'read',
  actionProgress: number,
  time: number,
  reduced: boolean,
): void {
  const hasSword = armorLeft.includes('sword');
  const hasCoat = armorLeft.includes('coat');
  const hasHelmet = armorLeft.includes('helmet');
  const armorCount = armorLeft.length;

  const skin = '#bc7e52';
  const tunicColor = '#ead8b2';
  const tunicFold = '#b9a37b';
  const sash = '#7a4f30';

  const phase = Math.sin(stride);
  const swing = phase * (armorCount > 0 ? 5.8 : 8.8);
  const moving = Math.min(1, Math.abs(stride) * 3);
  const lift = (v: number) => Math.max(0, v) ** 2 * moving * (armorCount > 0 ? 2.8 : 4.9);
  const breathe = reduced ? 0 : Math.sin(time * 2.0) * 0.5;

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(x, y);

  // Ground shadow
  oval(c, 'rgba(72,56,41,.20)', 4, 1.4, armorCount > 0 ? 15 : 12.5, 3.6, 0.06);
  oval(c, 'rgba(58,44,34,.18)', 1.5, 0.5, 7.5, 1.7);

  c.scale(facing < 0 ? -1 : 1, 1);
  c.scale(0.94, 0.94);

  const stanceSpread = pose === 'sling' || pose === 'release' ? 3.5 : 0;
  drawLeg(c, -3, -3.5 - swing - stanceSpread, lift(Math.cos(stride)), false, skin);
  drawLeg(c, 1, 3.2 + swing + stanceSpread, lift(-Math.cos(stride)), true, skin);

  // Heavy bronze armor bows David's posture forward; shedding it restores upright freedom.
  const weightStoop = hasCoat ? 0.11 : hasHelmet || hasSword ? 0.05 : 0;
  const pickStoop = pose === 'pick' ? actionProgress * 0.34 : 0;
  const dropStoop = pose === 'drop' ? actionProgress * 0.16 : 0;
  const releaseLean = pose === 'release' ? actionProgress * 0.18 : 0;
  const bodyTilt = weightStoop + pickStoop + dropStoop + releaseLean;

  c.translate(0, -22 + Math.abs(phase) * 1.1 + breathe + (pose === 'pick' ? actionProgress * 4 : 0));
  c.rotate(bodyTilt);
  c.translate(0, 22);

  // Far arm (holds shepherd's wooden staff once all armor is set aside!)
  if (armorCount === 0 && pose !== 'pick') {
    const staffX = pose === 'sling' ? 11.5 : 10 + phase * 2.2;
    const staffY = pose === 'sling' ? -29 : -27;
    drawArm(c, 3.4, 7.5, -32, staffX, staffY, skin, tunicColor, tunicFold, true);
    // Shepherd's wooden staff
    line(c, '#4f3825', 2.8, staffX + 2.5, -52, staffX - 1.5, 1.5);
    line(c, '#8d6844', 1.1, staffX + 2.1, -52, staffX - 1.9, 1);
  } else if (pose === 'pick') {
    drawArm(c, 3.4, 8, -28 + actionProgress * 6, 12, -18 + actionProgress * 12, skin, tunicColor, tunicFold, true);
  } else {
    drawArm(c, 3.4, 6 + phase * 1.6, -31, 7 + phase * 2.6, -24, skin, hasCoat ? BRONZE_MID : tunicColor, hasCoat ? BRONZE_DARK : tunicFold, true);
  }

  // Homespun shepherd tunic
  print(
    c,
    'M-4.5 -43Q0 -40.5 3.5 -43Q7 -41.5 7.8 -37.5L5.2 -26L7 -19L8.6 -12.5Q4.5 -11.5 1.8 -12.4L-1 -11.5L-8.8 -12.2L-9.5 -14.5L-6.6 -27.5L-7.4 -37.5Q-7.8 -40.5 -4.5 -43Z',
    tunicColor,
    INK,
    0.95,
  );
  print(c, 'M-6 -35L-3.5 -26L-6.2 -13.5L-8.5 -13Z M2 -24L4.2 -13L6.6 -13L4.4 -21Z', tunicFold);
  // Leather belt & shepherd's pouch at hip
  print(c, 'M-6.6 -28.5Q-1 -27 5.8 -28.6L6 -26.2Q-1 -24.7 -7 -26.6Z', sash);
  if (armorCount === 0) {
    // Shepherd's stone pouch clearly visible on hip
    print(c, 'M-8.5 -27L-3 -26.2L-2.4 -18.5Q-5.6 -16.8 -8.8 -19.2Z', '#784c2c', INK, 0.85);
    line(c, '#a8784d', 0.8, -7.8, -24.5, -3.5, -24.2);
  }

  // Oversized Saul's bronze coat of mail (while still worn)
  if (hasCoat) {
    print(
      c,
      'M-7.5 -43.5Q0 -41 6.8 -43.5L10.4 -36.5L8.6 -23.5L10.2 -16Q4.5 -14.2 0 -15.2L-10.2 -15.5L-9.4 -24.5L-10.6 -36.8Z',
      BRONZE_MID,
      INK,
      1.05,
    );
    // Sunlit bronze highlight & scale mail cross-etching
    print(c, 'M-6 -41.5L-1.5 -40.5L-2.5 -17.5L-8.2 -17.5Z', BRONZE_LIGHT);
    for (const sy of [-37, -32, -27, -22, -18]) {
      line(c, BRONZE_DARK, 0.75, -8.5, sy, 8.2, sy);
    }
    print(c, 'M-9.5 -27.5Q0 -25.6 8.8 -27.5L9 -24.8Q0 -23.2 -9.6 -25.2Z', '#5a3a26', INK, 0.7);
  }

  // Heavy Saul's sword strapped across hip (while still worn)
  if (hasSword) {
    line(c, INK, 4.4, -14.5, -10.5, 8.5, -27.5);
    line(c, '#5d4735', 2.8, -14.2, -10.7, 8.2, -27.3);
    line(c, BRONZE_LIGHT, 2.2, 6.5, -26.2, 12.2, -30.5);
    line(c, BRONZE_DARK, 1.5, 4.2, -29.8, 10.6, -22.8);
  }

  // Head & youth silhouette
  print(c, 'M-4.6 -51Q-7.4 -56 -3.8 -60.5Q0 -63.5 4.8 -60Q8.2 -58 7.5 -53.5L5.5 -46.5L-3.8 -45Z', HAIR);
  print(c, 'M-3.5 -48.5L2.8 -48.5L3.6 -41.5L0 -39.5L-4.2 -43Z', skin, INK, 0.65);
  print(c, 'M-3.6 -56.5Q-.4 -60 4.6 -57.2L5.8 -54.5L8.2 -52.4L6.6 -51.3L6.6 -49Q5.4 -46.5 1.8 -47L-2 -48.8L-3.6 -51.8Z', skin, INK, 0.65);
  oval(c, '#352b25', 4.6, -54.1, 0.6, 0.45);

  if (hasHelmet) {
    // Oversized bronze helmet sitting heavy over brow
    print(
      c,
      'M-7.8 -54.5Q-8.2 -64.5 0.4 -66.5Q8.6 -65 9.2 -55.2Q4.5 -54.2 1.2 -55.8Q-3.2 -54 -7.8 -54.5Z',
      BRONZE_MID,
      INK,
      1.0,
    );
    print(c, 'M-5.5 -56.5Q-4.5 -63.2 0.2 -64.5Q-1.2 -60.5 -2.2 -56.2Z', BRONZE_LIGHT);
    line(c, BRONZE_DARK, 1.1, -7.5, -55, 8.8, -55.4);
    // Cheek guard
    print(c, 'M-5.5 -55L-4 -48.5L-1.5 -49L-2.5 -55Z', BRONZE_MID, INK, 0.7);
  } else {
    // Bare dark curly shepherd hair
    print(c, 'M-5.8 -55.5Q-6.2 -61 0 -62Q5.2 -62.5 7.4 -58Q3.8 -57 1.8 -58Q0 -56.2 -2.4 -56.6Q-4 -54.5 -5.2 -53.8Z', HAIR);
    line(c, '#634935', 0.75, -4.4, -58.2, 0.6, -60.4);
  }

  // Near arm & whirling sling!
  if (pose === 'sling') {
    // Raised sling arm whirling leather sling steadily overhead (peak y ~ -96 in world coords, inside headroom!)
    const spin = reduced ? -0.65 : time * 8.2;
    const handX = 3.5;
    const handY = -61;
    drawArm(c, -3.5, 2.5, -48, handX, handY, skin, tunicColor, tunicFold);

    // Overhead elliptical sling whirl (compact vertical radius so peak is ~ -92..-96 px above feet)
    const rx = 27;
    const ry = 17;
    const cx = handX + 1;
    const cy = handY - 12;
    const sx = cx + Math.cos(spin) * rx;
    const sy = cy + Math.sin(spin) * ry;

    // Subtle etched motion trail ring around whirling sling
    if (!reduced) {
      c.save();
      c.strokeStyle = 'rgba(84, 62, 42, .28)';
      c.lineWidth = 1.2;
      c.setLineDash([4, 5]);
      c.beginPath();
      c.ellipse(cx, cy, rx, ry, -0.08, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    // Two leather sling cords from hand to pouch
    line(c, '#5d3e26', 1.4, handX, handY, (handX + sx) * 0.5 - 2, (handY + sy) * 0.5 - 3, sx, sy);
    line(c, '#7d5636', 1.2, handX, handY, (handX + sx) * 0.5 + 2, (handY + sy) * 0.5 + 2, sx, sy);
    // Leather pouch & smooth river stone gleaming inside
    oval(c, '#4b311e', sx, sy, 4.4, 3.0, spin);
    oval(c, '#dce4e2', sx + 0.4, sy - 0.3, 2.2, 1.6, spin);
  } else if (pose === 'release') {
    // Sweeping follow-through arm whip
    const hx = 12 + actionProgress * 12;
    const hy = -44 - (1 - actionProgress) * 14;
    drawArm(c, -3.5, 4 + actionProgress * 5, -41, hx, hy, skin, tunicColor, tunicFold);
    // Trailing loose sling cord after stone departs
    line(c, '#6a472c', 1.3, hx, hy, hx + 16, hy + 5, hx + 24, hy + 13);
  } else if (pose === 'pick') {
    const hx = 6 + actionProgress * 10;
    const hy = -24 + actionProgress * 16;
    drawArm(c, -3.5, 2 + actionProgress * 4, -30 + actionProgress * 6, hx, hy, skin, tunicColor, tunicFold);
  } else if (pose === 'drop') {
    const hx = 5 + actionProgress * 8;
    const hy = -28 - actionProgress * 4;
    drawArm(c, -3.5, 1 + actionProgress * 4, -33, hx, hy, skin, hasCoat ? BRONZE_MID : tunicColor, hasCoat ? BRONZE_DARK : tunicFold);
  } else if (pose === 'read') {
    drawArm(c, -3.5, 1 + actionProgress * 4, -33, 8 + actionProgress * 6, -32 - actionProgress * 6, skin, tunicColor, tunicFold);
  } else {
    const hx = -3.2 - phase * 5.2;
    const hy = -23.5;
    drawArm(c, -3.5, -4.5 - phase * 2.4, -31.5, hx, hy, skin, hasCoat ? BRONZE_MID : tunicColor, hasCoat ? BRONZE_DARK : tunicFold);
    // Holding folded leather sling at his side once free of Saul's armor
    if (armorCount === 0) {
      line(c, '#644228', 1.35, hx + 1, hy + 1, hx + 3, hy + 11, hx - 1, hy + 14);
      oval(c, '#4d331f', hx + 1, hy + 13.5, 2.6, 1.5);
    }
  }

  c.restore();
}

/** King Saul watching from the western camp terrace (1 Samuel 17:38–39). */
export function drawSaul(c: Brush, x: number, y: number, cheering: boolean, time: number, reduced: boolean): void {
  const skin = '#ac744c';
  const tunic = '#d4c39f';
  const mantle = '#89362b';
  const fold = '#9b8a6b';
  const sway = reduced ? 0 : Math.sin(time * 1.4) * 0.45;

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(x, y);
  oval(c, 'rgba(72,56,41,.20)', 4, 1.4, 15, 3.8);
  c.scale(1.12, 1.12);

  drawLeg(c, -3, -3.5, 0, false, skin);
  drawLeg(c, 1.5, 3.6, 0, true, skin);

  c.translate(0, -23 + sway);
  c.translate(0, 23);

  // Royal spear planted beside him (raised slightly once Israel surges)
  const lift = cheering ? -12 : 0;
  line(c, '#4c3827', 2.6, 12.5, -62 + lift, 12.5, 1.5);
  polygon(c, '#c9ab6b', 12.5, -72 + lift, 10, -61 + lift, 15, -61 + lift);
  drawArm(c, 3.8, 7.5, -32 + lift * 0.4, 11.5, -31 + lift * 0.8, skin, tunic, fold, true);

  // Tunic & royal crimson-gold cloak
  print(c, 'M-5 -44Q0 -41 4 -44Q7.5 -42.5 8.5 -38L6 -25L8 -13Q3 -12 -1 -12.5L-9 -12.2L-7 -27L-8 -38Z', tunic, INK, 1);
  print(c, 'M-7 -44Q-3 -45.5 0 -43.5L-1 -31Q-4 -25 -6.5 -14L-13 -14L-11 -31Z', mantle, INK, 0.85);
  line(c, '#d8af63', 1.1, -12.2, -16, -6.5, -16.5);

  // Bearded head + royal bronze circlet
  print(c, 'M-5 -52Q-7.5 -57 -4 -61Q0 -64 5 -61Q8 -59 7.5 -54L5.5 -46L-4 -45Z', HAIR);
  print(c, 'M-4 -57Q0 -60.5 5 -58L6 -55L8.4 -52.5L6.8 -51.4L6.8 -49Q5.6 -46.5 1.8 -46.8L-2 -48.8L-4 -52Z', skin, INK, 0.65);
  print(c, 'M-4 -53Q-1.5 -50 2 -50L6.6 -50.6L6.4 -48Q5.4 -45.2 1.8 -44.2L-2.5 -46Z', HAIR);
  // Bronze circlet
  line(c, BRONZE_LIGHT, 2.2, -6, -58.5, 7, -58.8);
  oval(c, '#352b25', 4.8, -54.5, 0.65, 0.45);

  // Near arm resting at belt
  drawArm(c, -4, -2.5, -31, 4.5, -28, skin, tunic, fold);
  c.restore();
}

/** Towering Philistine champion Goliath (scale 1.56) — dignified horizontal bronze collapse on impact (zero gore). */
export function drawGoliath(
  c: Brush,
  x: number,
  y: number,
  challenging: boolean,
  impactAge: number,
  time: number,
  reduced: boolean,
): void {
  const skin = '#a76e4a';
  const cloak = '#7d3128';
  const fallen = impactAge >= 0;
  const fallT = fallen ? (reduced ? 1 : Math.min(1, impactAge / 0.56)) : 0;
  // Smooth ease-in collapse: he falls forward onto his face (1 Samuel 17:49)
  const easeFall = fallT * fallT * (3 - 2 * fallT);

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(x, y);

  if (fallen && easeFall > 0.02) {
    // Broad ground shadow lengthening as the bronze silhouette comes to rest
    oval(c, 'rgba(64,48,35,.24)', -24 * easeFall, 2, 22 + 28 * easeFall, 5.5);
  } else {
    oval(c, 'rgba(64,48,35,.25)', 4, 2, 23, 5.5, 0.04);
    oval(c, 'rgba(54,40,30,.20)', 1, 0.6, 13, 2.6);
  }

  // Face west toward David (-1)
  c.scale(-1, 1);
  c.scale(1.56, 1.56);

  // Rotate around front foot cleanly into horizontal face-down silhouette on valley floor
  if (easeFall > 0) {
    c.translate(4, -1);
    c.rotate(easeFall * (Math.PI * 0.49));
    c.translate(-4, 1);
  }

  const breathe = !fallen && !reduced ? Math.sin(time * 1.45) * 0.45 : 0;
  const taunt = !fallen && challenging ? (reduced ? 0.5 : 0.45 + Math.sin(time * 2.4) * 0.25) : 0;

  // Legs relax together cleanly when fallen so heels rest flat along the earth
  drawLeg(c, -3.5 + easeFall * 2.2, -5.2 + easeFall * 4.4, 0, false, skin, true);
  drawLeg(c, 2 - easeFall * 1.2, 5.2 - easeFall * 3.8, 0, true, skin, true);

  c.translate(0, -23 + breathe);
  c.translate(0, 23);

  // Far arm holding massive weaver's-beam iron-headed spear (1 Samuel 17:7) — drops slightly forward as he falls
  const spearLift = taunt * 7;
  const spearDrop = easeFall * 10;
  drawArm(c, 4.5, 9, -33 - spearLift * 0.4, 13.5, -31 - spearLift, skin, BRONZE_MID, BRONZE_DARK, true);
  line(c, '#4d3726', 3.4, 14.5 + spearDrop, -68 - spearLift, 11.5 + spearDrop * 0.4, 2);
  line(c, '#7c5d41', 1.1, 14.1 + spearDrop, -68 - spearLift, 11.1 + spearDrop * 0.4, 1);
  // Broad heavy iron spearhead
  polygon(c, '#677078', 14.8 + spearDrop, -81 - spearLift, 11.2 + spearDrop, -67 - spearLift, 18.2 + spearDrop, -67 - spearLift);
  line(c, '#b7c1c7', 1.0, 14.6 + spearDrop, -79 - spearLift, 13.2 + spearDrop, -68 - spearLift);

  // Bronze javelin slung diagonally across his back (1 Samuel 17:6)
  line(c, BRONZE_DARK, 2.2, -13, -52, 8, -22);
  polygon(c, BRONZE_LIGHT, -15, -56, -10, -50, -14, -49);

  // Crimson war cloak behind broad shoulders
  print(c, 'M-7.5 -44L-15 -14L-6 -14L-4 -38Z', cloak, INK, 0.8);

  // Heavy bronze scale breastplate & skirt plates
  print(
    c,
    'M-7.5 -44.5Q0 -42 7.5 -44.5L10.5 -36L8.8 -22L10 -13.5Q4 -12 0 -13L-9.8 -13.2L-8.8 -23L-10.2 -36.5Z',
    BRONZE_MID,
    INK,
    1.05,
  );
  print(c, 'M-6.5 -42.5L-1.5 -41.5L-2.2 -15L-7.8 -15Z', BRONZE_LIGHT);
  for (const sy of [-38, -33, -28, -23, -18]) {
    line(c, BRONZE_DARK, 0.85, -8.8, sy, 8.6, sy);
  }
  // Wide bronze war girdle
  print(c, 'M-9.5 -26.5Q0 -24.8 9.2 -26.5L9.4 -23.5Q0 -22 -9.6 -23.8Z', '#5a3a26', INK, 0.75);

  // Head with tall bronze Philistine helmet & crest
  print(c, 'M-4 -49L3 -49L4 -41L0 -39.5L-5 -43Z', skin, INK, 0.65);
  print(c, 'M-4.2 -56.5Q0 -60 5 -57.5L6.2 -54.5L8.6 -52.2L6.8 -51.2L6.8 -48.6Q5.5 -46 1.5 -46.5L-2.5 -48.6Z', skin, INK, 0.65);
  print(c, 'M-4.2 -52.5Q-1.5 -49.8 2.2 -49.8L6.8 -50.4L6.4 -47.6Q5.2 -44.8 1.5 -43.8L-3 -45.6Z', HAIR);
  oval(c, '#352b25', 4.8, -54.2, 0.65, 0.45);
  // Domed bronze helmet + crest plume
  print(c, 'M-7.8 -54.5Q-8 -65 0.6 -67Q9 -65.2 9.2 -55.2Q4 -54.4 0.8 -55.8Q-3.2 -54 -7.8 -54.5Z', BRONZE_MID, INK, 1.0);
  print(c, 'M-5.5 -56.8Q-4.5 -63.5 0.2 -65Q-1 -60.5 -2 -56.5Z', BRONZE_LIGHT);
  print(c, 'M-6.2 -64.5Q-1 -72.5 5.5 -65.5L3 -63.5Q-1 -67.5 -4.2 -63.5Z', '#8a3529', INK, 0.7);
  line(c, BRONZE_DARK, 1.0, -7.4, -55, 8.8, -55.4);

  // Near arm (defiant gesture during challenge, clenched at side otherwise)
  if (!fallen && challenging) {
    drawArm(c, -4.5, 3, -34 - taunt * 4, 11, -37 - taunt * 6, skin, BRONZE_MID, BRONZE_DARK);
  } else {
    drawArm(c, -4.5, -5.5, -31, -3.5, -22, skin, BRONZE_MID, BRONZE_DARK);
  }

  c.restore();
}

/** Philistine shield-bearer going before Goliath (1 Samuel 17:41), fleeing east once champion falls. */
export function drawShieldBearer(
  c: Brush,
  x: number,
  y: number,
  facing: number,
  stride: number,
  holdingShield: boolean,
  alpha = 1,
): void {
  const skin = '#a56e4b';
  const phase = Math.sin(stride);
  const swing = phase * 7.5;
  const moving = Math.min(1, Math.abs(stride) * 3);
  const lift = (v: number) => Math.max(0, v) ** 2 * moving * 4.2;

  c.save();
  c.globalAlpha = alpha;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.translate(x, y);
  oval(c, 'rgba(68,52,38,.18)', 3, 1.2, 13, 3.4);
  c.scale(facing < 0 ? -1 : 1, 1);
  c.scale(0.96, 0.96);

  drawLeg(c, -3, -3.5 - swing, lift(Math.cos(stride)), false, skin);
  drawLeg(c, 1.2, 3.2 + swing, lift(-Math.cos(stride)), true, skin);

  // Tunic & bronze shoulder plate
  print(c, 'M-4.5 -43Q0 -41 4 -43L7.5 -37L6.5 -13L-8.5 -13L-7 -37Z', '#7d624c', INK, 0.95);
  print(c, 'M-7 -43L7 -43L8.2 -31L-8 -31Z', '#937044', INK, 0.8);
  // Head & Philistine cap helm
  print(c, 'M-3.8 -56Q0 -60 5 -57L6.8 -52L5.5 -46.8L-2.5 -48.2Z', skin, INK, 0.65);
  print(c, 'M-6.5 -55.5Q-6.5 -63 0.5 -64.5Q7.2 -63 7.5 -55.8Z', '#88673e', INK, 0.85);
  drawArm(c, -3.5, 2, -32, 9.5, -29, skin, '#7d624c', '#5c4636');

  // Tall bronze-and-hide tower shield in front while holding ground
  if (holdingShield) {
    print(c, 'M7 -52Q13 -53 18 -51L17.5 -9Q12.5 -8 6.8 -9.5Z', '#8e6a3c', INK, 1.15);
    print(c, 'M9 -49L12.5 -49.5L12 -11.5L8.8 -11.8Z', '#c6a05d');
    line(c, '#5d4425', 1.1, 7.2, -31, 17.8, -31);
    oval(c, '#d7b470', 12.5, -31, 2.4, 3.4);
  }
  c.restore();
}

/** Compact background ridge soldier (18 per hillside) — surges east (Israel) or breaks east (Philistines) after impact. */
export function drawRidgeSoldier(
  c: Brush,
  x: number,
  y: number,
  side: 'israel' | 'philistine',
  facing: number,
  stride: number,
  spearUp: boolean,
  variant: number,
): void {
  const phase = Math.sin(stride);
  const swing = phase * 3.5;
  const tunic = side === 'israel'
    ? (variant % 2 === 0 ? '#78664e' : '#645c4c')
    : (variant % 2 === 0 ? '#693c34' : '#58413a');
  const shield = side === 'israel' ? '#9c835d' : '#a88148';

  c.save();
  c.translate(x, y);
  c.scale(facing < 0 ? -1 : 1, 1);

  // Shadow dot
  oval(c, 'rgba(60,46,35,.18)', 0, 0.5, 5.5, 1.5);
  // Legs
  line(c, INK, 1.8, -1.5, -7, -2 - swing, 0);
  line(c, INK, 1.8, 1.5, -7, 2 + swing, 0);
  // Body silhouette
  polygon(c, tunic, -3.5, -18, 3.5, -18, 4.5, -6, -4.5, -6);
  // Head / helm
  oval(c, side === 'israel' ? '#4b3b2d' : '#9c7843', 0, -21, 2.6, 2.8);
  // Small shield
  oval(c, shield, 3.8, -12, 2.4, 4.2);
  // Spear (planted vertically at rest, angled forward/up when surging or fleeing!)
  if (spearUp) {
    line(c, '#473628', 1.25, -1, -13, 9, -32);
    polygon(c, '#c8b288', 9, -35, 7.6, -31, 10.4, -31);
  } else {
    line(c, '#473628', 1.15, -3.5, -2, -3.5, -30);
    polygon(c, '#c8b288', -3.5, -33, -4.8, -29.5, -2.2, -29.5);
  }
  c.restore();
}
