import { line, oval, polygon, print } from '../_shared/storyInk';

type Brush = CanvasRenderingContext2D;
export type PersonRole = 'jesus' | 'seller' | 'buyer' | 'carrier' | 'listener' | 'scribe' | 'lame' | 'blind' | 'child';
export type PersonPose = 'shove' | 'halt' | 'teach' | 'heal' | 'startled' | 'listen' | 'idle' | 'lame' | 'blind' | 'praise';

type Cloth = { tunic: string; fold: string; mantle: string; edge: string; skin: string };
const ink = '#3b342e', hair = '#382d26';
const jesus: Cloth = { tunic: '#f3e3b9', fold: '#bca782', mantle: '#a93631', edge: '#dd6445', skin: '#b7794d' };
const market: Cloth[] = [
  { tunic: '#be935c', fold: '#87673f', mantle: '#354c61', edge: '#79838a', skin: '#ab724d' },
  { tunic: '#b2b19a', fold: '#7e8570', mantle: '#386b66', edge: '#78a197', skin: '#965d42' },
  { tunic: '#819295', fold: '#586b71', mantle: '#a8783e', edge: '#d3ae6c', skin: '#ba8259' },
  { tunic: '#af875f', fold: '#795d4a', mantle: '#504c60', edge: '#89818b', skin: '#916146' },
];
const listeners: Cloth[] = [
  { tunic: '#d8caa9', fold: '#a29274', mantle: '#665f4e', edge: '#9a907a', skin: '#ab744e' },
  { tunic: '#cbbba0', fold: '#92856d', mantle: '#58695f', edge: '#8ca092', skin: '#9c6648' },
  { tunic: '#d2c2a3', fold: '#9a8a6f', mantle: '#7a614c', edge: '#b09174', skin: '#b67d54' },
  { tunic: '#cec0a8', fold: '#918775', mantle: '#565c69', edge: '#88909d', skin: '#986346' },
];
const scribes: Cloth[] = [
  { tunic: '#5d595f', fold: '#3f3c42', mantle: '#2d3442', edge: '#a69d88', skin: '#a8714c' },
  { tunic: '#555459', fold: '#39383e', mantle: '#34303f', edge: '#9e9684', skin: '#996446' },
];
const lameCloth: Cloth = { tunic: '#cfc0a0', fold: '#938368', mantle: '#7b5f42', edge: '#b39570', skin: '#a9714b' };
const blindCloth: Cloth = { tunic: '#d4c9b2', fold: '#99907d', mantle: '#5a6368', edge: '#8f989c', skin: '#9f6a49' };
const childCloths: Cloth[] = [
  { tunic: '#e6d6b0', fold: '#b5a27e', mantle: '#567457', edge: '#89aa86', skin: '#b67b50' },
  { tunic: '#e3cfa6', fold: '#b09a75', mantle: '#9d6a3e', edge: '#d09f6d', skin: '#a76f49' },
];

function leg(c: Brush, hip: number, foot: number, lift: number, near: boolean, skin: string) {
  const knee = (hip + foot) / 2 + 2.5 + lift * .4, ankle = -2.7 - lift;
  const tone = near ? skin : '#805a43';
  line(c, ink, 4.4, hip, -21, knee, -12 - lift * .25, foot, ankle);
  line(c, tone, 3.1, hip, -21, knee, -12 - lift * .25, foot, ankle);
  c.save(); c.translate(foot, -lift);
  print(c, 'M-2 -3Q0 -4 2 -2L5 -1.8Q7 -.6 5 .2L-2 .2Z', tone, ink, .8);
  print(c, 'M-2 -.8L2.5 -1L5.8 -1Q7 0 5 .8L-2 .7Z', '#544332');
  line(c, '#594733', .95, -.9, -3.4, 2, -1.2);
  c.restore();
}

function head(c: Brush, cloth: Cloth, role: PersonRole, variant: number, tilt = 0) {
  const holy = role === 'jesus', authority = role === 'scribe', child = role === 'child';
  c.save();
  if (tilt !== 0) { c.translate(0, -47); c.rotate(tilt); c.translate(0, 47); }
  print(c, 'M-5 -52Q-8 -57 -4 -61Q0 -65 5 -61Q9 -59 8 -54L6 -47L-4 -45Z', hair);
  print(c, 'M-4 -49L3 -49L4 -41L0 -39L-5 -43Z', cloth.skin, ink, .7);
  print(c, 'M-4 -57Q-.5 -61 5 -58L6 -55L8.7 -52.7L7 -51.7L7 -49.2Q5.8 -46.6 2 -47L-2 -49L-4 -52Z', cloth.skin, ink, .65);
  print(c, 'M1 -59Q5 -60 6 -57L5.5 -55L3.8 -54.6L3.4 -55.6L1.5 -55Z', '#d49b67');
  if (!child && (holy || authority || variant % 3 === 0)) {
    print(c, 'M-4.5 -54Q-2.6 -55 -1.9 -52.6Q-1 -50 1.7 -50L4 -51L6.8 -50.9L6.6 -48.5Q5.7 -45.7 2 -44.3L-.5 -46L-2.5 -46.3L-4.2 -49Z', hair);
    print(c, 'M-6 -58Q-3 -61 1 -59L.2 -56Q-2 -54 -2 -49L-4 -46L-5 -48L-7 -46.5L-6.5 -53Z', hair);
    line(c, '#654c37', .65, -4.4, -56.5, -5.2, -53.5, -4.8, -51);
  }
  if (authority) {
    print(c, 'M-7 -55Q-9 -61 -3 -63.5L3 -63.5Q7.5 -62 8.2 -58L2 -58.5L-4.5 -56Z', cloth.edge, ink, .75);
    print(c, 'M-6 -56.5L.5 -58.5L7.6 -58.8L8.1 -57L.5 -56.6L-6 -55Z', cloth.mantle);
    print(c, 'M-6 -56L-7.5 -49L-9 -43L-11 -44L-9.2 -51Z', cloth.edge, ink, .55);
  } else if (!holy && !child && variant % 3 !== 1) {
    print(c, 'M-6 -55.5Q-8 -60 -3 -62L2 -63Q6 -62.5 7.5 -59L8 -57.5L2 -58L-4 -56Z', cloth.edge, ink, .7);
    print(c, 'M-5 -56.3L.5 -58L6.8 -58.5L7.5 -57L.5 -56.4L-5 -54.8Z', cloth.mantle);
    print(c, 'M-5 -56L-6 -51L-6.7 -47L-9 -46L-8 -50Z', cloth.edge);
  } else {
    print(c, 'M-6 -56Q-6 -61 0 -62Q5 -63 7.7 -58.5Q4 -57.4 2 -58.4Q.5 -56.6 -2 -57Q-3.6 -55 -5 -54Z', hair);
    print(c, 'M-4.8 -58Q-2.5 -61 1 -61.1', '', '#5b4735', .75);
  }
  print(c, 'M-.8 -54.5Q-2.4 -55.3 -2.5 -53.2Q-2.3 -51.5 -.9 -51.8', cloth.skin, '#7c553d', .55);
  oval(c, '#352b25', 5, -54.6, .65, .45);
  c.restore();
}

function arm(c: Brush, shoulder: number, elbowX: number, elbowY: number, handX: number, handY: number, cloth: Cloth, far = false, uprightPalm = false) {
  const skin = far ? '#8c6044' : cloth.skin;
  line(c, ink, 4.8, shoulder, -40, elbowX, elbowY, handX, handY);
  line(c, skin, 3.35, shoulder, -40, elbowX, elbowY, handX, handY);
  const sleeveX = shoulder + (elbowX - shoulder) * .73, sleeveY = -40 + (elbowY + 40) * .73;
  line(c, far ? cloth.fold : cloth.tunic, 6, shoulder, -40, sleeveX, sleeveY);
  line(c, cloth.fold, .8, sleeveX - 2, sleeveY - .5, sleeveX + 1.7, sleeveY + 1);
  if (uprightPalm) {
    oval(c, ink, handX + 1.1, handY - 1.5, 2.3, 3.6, .08);
    oval(c, skin, handX + 1.1, handY - 1.5, 1.7, 3.0, .08);
  } else {
    oval(c, skin, handX + .8, handY, 2.5, 1.7, -.15);
  }
  if (!far) line(c, '#c69361', .65, elbowX + .15, elbowY - .6, elbowX + (handX - elbowX) * .42, elbowY + (handY - elbowY) * .42 - .55);
}

function tunic(c: Brush, cloth: Cloth, swing: number, holy: boolean) {
  c.save(); c.translate(0, -23); c.rotate(swing * .007); c.translate(0, 23);
  print(c, 'M-4 -44Q-.2 -41 3 -44Q7 -43 8 -39L5 -27L7 -20L9 -13Q5 -12 2.5 -13L-.2 -11.8L-4 -12.4L-9 -11.9L-10 -14L-6.8 -28L-7.5 -38Q-8 -41 -4 -44Z', cloth.tunic, ink, 1);
  print(c, 'M-6 -37Q-3 -31 -3 -27L-6.5 -14L-9 -13L-6 -28Z M1 -25Q2 -20 .5 -14L3 -13L4 -18Z M5 -25L8 -14L6.1 -13L4 -19Z', cloth.fold);
  print(c, 'M-9 -14.8Q-5 -15.3 -.4 -14.8Q4 -15.7 8.3 -15', '', cloth.fold, .8);
  print(c, 'M-6.5 -28.9Q-2 -27.3 5.6 -29L5.8 -26.6Q-2 -25 -6.9 -27Z', '#73563d');
  print(c, 'M-3.5 -45Q-1.3 -42 1.2 -42L3.8 -44L3 -41L.6 -39.6L-3.3 -42Z', cloth.fold);
  print(c, 'M1 -39.6L2.1 -37.4L2.9 -39.1M3.8 -38.8L4.3 -36.7', '', cloth.fold, .65);
  print(c, 'M-6.8 -44Q-4 -45.6 -2 -44.4L-.3 -41.6Q-1.7 -34 3.5 -29Q-1.2 -27.6 -4.3 -23.4L-6.4 -15L-12.3 -14.4L-12.5 -19.7Q-8.7 -27.4 -9 -33.2L-10.3 -39.5Z', cloth.mantle, ink, .8);
  print(c, 'M-7.8 -42.6L-6 -43.5Q-5 -36.5 -3 -33Q-4.4 -30.2 -7.6 -28.8Q-5.5 -32.8 -6.6 -35.5Z M-7 -24L-8.5 -17L-10.4 -16.7Z', cloth.edge);
  print(c, 'M-12 -17.7L-6.6 -18.6M-11.8 -16.5L-7.2 -17.2', '', cloth.edge, .7);
  if (holy) print(c, 'M-3.4 -41Q-4 -34.7 .9 -29.5M-9.7 -17.2L-7.4 -23.2', '', '#f0ac6f', .7);
  c.restore();
}

function amphora(c: Brush, wobble = 0) {
  c.save(); c.translate(11 - wobble * 1.4, -32 - wobble * 2.2); c.rotate(-.16 - wobble * .16);
  print(c, 'M-2.4 -6.8Q-7.6 -11 -7.1 -4.5Q-6.5 -.9 -3 .1M2.5 -6.8Q8.1 -11 7.1 -4.4Q6.7 -1 3.3 .1', '', '#603e2f', 2.1);
  print(c, 'M-3.2 -10.4Q0 -11.4 3.3 -10.4L3.2 -8.8L1.9 -8.6L2.2 -4.2Q6.8 -1.8 5.6 3Q4.4 8.1 .6 11.5L-.4 11.3Q-4.2 8.2 -5.7 3Q-6.7 -1.7 -2.4 -4.3L-2.1 -8.8L-3.2 -9Z', '#bd7650', '#654332', 1);
  print(c, 'M-3.9 -.8Q-2.1 -3 .5 -3.5Q-2.8 .3 -2.3 4.3L-3.5 4Z', '#e0a474');
  print(c, 'M-5.4 1Q-.8 2.1 5.3 .5M-4.8 3.2Q0 4.4 5 2.5', '', '#79503a', .8);
  c.restore();
}

function palmSprig(c: Brush, hx: number, hy: number, wave: number) {
  c.save(); c.translate(hx, hy); c.rotate(-.32 + wave * .26);
  line(c, '#4f6d42', 1.6, 0, 2, 0, -18);
  for (const [y, s] of [[-6, 1], [-10, -1], [-13, 1], [-16, -1]] as const) {
    polygon(c, '#6e9155', 0, y, s * 7, y - 4, s * 4.5, y - 1);
  }
  polygon(c, '#7da161', 0, -17, -2.5, -23, 2.5, -22);
  c.restore();
}

function paletteFor(role: PersonRole, index: number): Cloth {
  if (role === 'jesus') return jesus;
  if (role === 'listener') return listeners[index % listeners.length];
  if (role === 'scribe') return scribes[index % scribes.length];
  if (role === 'lame') return lameCloth;
  if (role === 'blind') return blindCloth;
  if (role === 'child') return childCloths[index % childCloths.length];
  return market[index % market.length];
}

/** Drawn from the feet so the floor, limbs and walk cycle share one point of contact. */
export function drawPerson(
  c: Brush,
  x: number,
  y: number,
  role: PersonRole,
  facing: number,
  stride: number,
  action: number,
  variant = 0,
  pose: PersonPose = 'shove',
  breathe = 0,
): void {
  const holy = role === 'jesus', carrying = role === 'carrier', child = role === 'child';
  const index = Math.abs(Math.trunc(variant)) + (role === 'buyer' ? 1 : carrying ? 2 : 0);
  const cloth = paletteFor(role, index);
  const phase = Math.sin(stride), swing = phase * (pose === 'lame' ? 4.8 : 8.5);
  const moving = Math.min(1, Math.abs(stride) * 3), reach = Math.max(0, Math.min(1, action));
  const up = (v: number) => Math.max(0, v) ** 2 * moving * (pose === 'lame' ? 2.4 : 4.8);
  const idleSway = moving < .1 ? Math.sin(breathe) * .55 : 0;
  const shoveAmt = pose === 'shove' ? reach : 0;
  const haltAmt = pose === 'halt' ? reach : 0;
  const teachAmt = pose === 'teach' ? reach : 0;
  const healAmt = pose === 'heal' ? reach : 0;
  const startleAmt = pose === 'startled' ? reach : 0;
  const praiseAmt = pose === 'praise' ? reach : 0;

  c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.translate(x, y);
  oval(c, 'rgba(78,60,45,.17)', 5, 1.2, child ? 10 : 14, child ? 2.8 : 3.8, .07);
  oval(c, 'rgba(64,49,40,.18)', 1.8, .5, child ? 6 : 8, child ? 1.4 : 1.9);
  c.scale(facing < 0 ? -1 : 1, 1);
  if (child) c.scale(.68, .68);
  else if (role === 'buyer') c.scale(.94, .94);
  else if (role === 'listener') c.scale(.96, .97);
  else if (role === 'scribe') c.scale(1.01, 1.01);
  else if (role === 'seller' && index % 2) c.scale(1.08, .96);

  const footSpread = shoveAmt * 2 + haltAmt * 1.4 + healAmt * 1.1;
  leg(c, -3, -3.8 - swing - footSpread, up(Math.cos(stride)), false, cloth.skin);
  leg(c, 1, 3.2 + swing + footSpread * 1.1, up(-Math.cos(stride)), true, cloth.skin);

  const stoop = pose === 'lame' ? .22 : pose === 'blind' ? .08 : 0;
  const dropY = pose === 'lame' ? 3.5 : 0;
  const tilt = stoop + shoveAmt * .14 + healAmt * .08 - haltAmt * .03 - startleAmt * .09 + teachAmt * .02 - praiseAmt * .04;
  c.translate(0, -23 + dropY + Math.abs(phase) * 1.15 + idleSway); c.rotate(tilt); c.translate(0, 23);

  // Far arm
  if (haltAmt > .01) {
    arm(c, 3.7, 5.2 + phase * 1.4, -31, 6 + phase * 2.2, -24.5, cloth, true);
  } else if (healAmt > .01) {
    arm(c, 3.7, 6 + healAmt * 3, -32 - healAmt * 2, 9 + healAmt * 7, -30 - healAmt * 5, cloth, true);
  } else if (teachAmt > .01) {
    arm(c, 3.7, 7 + teachAmt * 2.5, -33 - teachAmt * 2, 10.5 + teachAmt * 4, -30 - teachAmt * 5, cloth, true);
  } else if (praiseAmt > .01) {
    arm(c, 3.7, 6.5 + praiseAmt * 3, -34 - praiseAmt * 5, 10 + praiseAmt * 5, -40 - praiseAmt * 9, cloth, true);
  } else if (pose === 'lame') {
    arm(c, 3.7, 7.5, -31, 11.5, -25, cloth, true);
  } else if (pose === 'blind') {
    arm(c, 3.7, 9.5, -34, 15.5, -33, cloth, true);
  } else if (startleAmt > .01 && !carrying) {
    arm(c, 3.7, 5 + startleAmt * 3, -34 - startleAmt * 4, 8 + startleAmt * 4, -37 - startleAmt * 6, cloth, true);
  } else if (pose === 'listen') {
    arm(c, 3.7, 5.2, -31, 6.2, -26.5, cloth, true);
  } else {
    arm(c, 3.7, 6.5 + phase * 2 + shoveAmt * 7, -32 - shoveAmt * 4, 7 + phase * 4 + shoveAmt * 12, -25 - shoveAmt * 11, cloth, true);
  }

  tunic(c, cloth, swing, holy);
  const headTilt = pose === 'blind' ? .16 : (pose === 'praise' && role === 'blind' ? -.14 : 0);
  head(c, cloth, role, index, headTilt);

  if (carrying) amphora(c, startleAmt);

  // Wooden walking staff for lame visitor before healing
  if (pose === 'lame') {
    line(c, '#4b3625', 2.8, 12.5, -36, 17, 1);
    line(c, '#8f6a46', 1.1, 12.1, -36, 16.5, 0);
  }
  // Slender guide reed for blind visitor before healing
  if (pose === 'blind') {
    line(c, '#6a543c', 1.7, 12, -26, 22, 1);
    line(c, '#aa8d64', .7, 11.7, -26, 21.6, 0);
  }

  // Near arm
  if (carrying) {
    arm(c, -4, -.5 - startleAmt, -28 - startleAmt * 2, 9 - startleAmt * 1.5, -30 - startleAmt * 3.5, cloth);
  } else if (haltAmt > .01) {
    arm(c, -4, 3 + haltAmt * 5.5, -32 - haltAmt * 3.5, 9 + haltAmt * 10.5, -31 - haltAmt * 14, cloth, false, haltAmt > .25);
  } else if (healAmt > .01) {
    // Gentle outstretched healing hand
    arm(c, -4, 2 + healAmt * 6.5, -32 - healAmt * 2.5, 8 + healAmt * 13.5, -31 - healAmt * 8, cloth);
  } else if (teachAmt > .01) {
    arm(c, -4, -1 + teachAmt * 4.5, -31 - teachAmt * 1.5, 4 + teachAmt * 10, -28 - teachAmt * 8.5, cloth);
  } else if (praiseAmt > .01) {
    const wave = Math.sin(breathe * 1.8);
    const hx = 6 + praiseAmt * 6.5;
    const hy = -34 - praiseAmt * 12 + (child ? wave * 2.4 : 0);
    if (child) palmSprig(c, hx + 1, hy - 1, wave);
    arm(c, -4, 1 + praiseAmt * 4, -33 - praiseAmt * 4, hx, hy, cloth);
  } else if (pose === 'lame') {
    arm(c, -4, 4, -31, 12, -27, cloth);
  } else if (pose === 'blind') {
    arm(c, -4, 4, -31, 12.5, -27, cloth);
  } else if (startleAmt > .01) {
    arm(c, -4, -2 + startleAmt * 4, -33 - startleAmt * 4, 2 + startleAmt * 5.5, -35 - startleAmt * 8, cloth);
  } else if (pose === 'listen') {
    if (child) palmSprig(c, 5.5, -29, Math.sin(breathe) * .45);
    arm(c, -4, -1.5, -30, 3.8, -27.5 - reach * 2.5, cloth);
  } else {
    arm(
      c,
      -4,
      -5.2 - phase * 2.8 + shoveAmt * 14,
      -31.5 - shoveAmt * 3.2 + idleSway * .6,
      -3.9 - phase * 6.1 + shoveAmt * 25,
      -23.8 - shoveAmt * 10.7 + idleSway,
      cloth,
    );
  }
  c.restore();
}
