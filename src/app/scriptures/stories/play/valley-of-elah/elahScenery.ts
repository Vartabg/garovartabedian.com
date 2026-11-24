import { brookCenterX, ELAH_HEIGHT, ELAH_WIDTH } from './elahGame';
import { line, oval, polygon, print, stone } from '../_shared/storyInk';

type Brush = CanvasRenderingContext2D;

function grain(a: number, b: number) {
  const n = Math.sin(a * 79.13 + b * 47.29) * 14321.57;
  return n - Math.floor(n);
}

function drawSky(c: Brush) {
  const grad = c.createLinearGradient(0, 0, 0, 184);
  grad.addColorStop(0, '#d8c59d');
  grad.addColorStop(0.45, '#e7d7b5');
  grad.addColorStop(1, '#f4e8ce');
  c.fillStyle = grad;
  c.fillRect(0, 0, ELAH_WIDTH, 186);

  // Subtle Judean morning sun glow in the upper west
  const sun = c.createRadialGradient(230, 34, 14, 230, 34, 290);
  sun.addColorStop(0, 'rgba(255, 250, 230, .48)');
  sun.addColorStop(0.55, 'rgba(255, 245, 214, .16)');
  sun.addColorStop(1, 'rgba(255, 245, 214, 0)');
  c.fillStyle = sun;
  c.fillRect(0, 0, 560, 186);

  // Hand-engraved horizontal sky hatching and drifting pale cirrus streaks
  for (let i = 0; i < 14; i++) {
    const x = 35 + i * 108 + grain(i, 2) * 32;
    const y = 18 + (i % 4) * 18;
    const w = 44 + (i % 3) * 22;
    oval(c, 'rgba(255, 249, 234, .34)', x, y, w, 6.5);
    line(c, 'rgba(166, 144, 108, .20)', 0.75, x - w * 0.8, y + 4.5, x + w * 0.75, y + 4.5);
  }
}

function drawDistantHills(c: Brush) {
  // Far Judean Shephelah horizon ridge
  polygon(
    c, '#c4b698',
    0, 142, 95, 118, 210, 108, 340, 122, 470, 114, 585, 132,
    700, 142, 825, 130, 960, 114, 1110, 106, 1265, 118, 1440, 108,
    1440, 214, 0, 214,
  );
  // Subtle sunlit upper rim on far hills
  line(c, 'rgba(248, 238, 214, .55)', 1.2, 0, 142, 95, 118, 210, 108, 340, 122, 470, 114, 585, 132);
  line(c, 'rgba(248, 238, 214, .45)', 1.1, 825, 130, 960, 114, 1110, 106, 1265, 118, 1440, 108);

  // Mid-distance saddle ridge framing the valley bowl
  polygon(
    c, '#b39e7a',
    0, 150, 135, 132, 295, 138, 448, 156, 565, 178, 705, 186,
    845, 174, 1005, 150, 1175, 130, 1325, 134, 1440, 126,
    1440, 234, 0, 234,
  );
  // Soft rolling foothill contours along the valley saddle
  polygon(
    c, '#a8926d',
    420, 184, 520, 194, 625, 200, 745, 192, 860, 184, 980, 196, 1040, 228, 390, 228,
  );
  for (let i = 0; i < 8; i++) {
    const x = 60 + i * 180;
    const y = 148 + (i % 3) * 10;
    line(c, 'rgba(112, 92, 66, .32)', 0.9, x, y, x + 65, y + 6, x + 115, y + 3);
  }
}

function drawLimestoneBluff(c: Brush, x: number, y: number, w: number, h: number, flip = 1) {
  c.save();
  c.translate(x, y);
  c.scale(flip, 1);
  // Shaded vertical limestone face
  polygon(c, '#9a825d', -w * 0.5, 0, -w * 0.42, -h, w * 0.36, -h * 0.88, w * 0.52, 0);
  // Sunlit top shelf
  polygon(c, '#d7c298', -w * 0.46, -h * 0.92, -w * 0.08, -h * 1.08, w * 0.4, -h * 0.88, w * 0.12, -h * 0.62, -w * 0.36, -h * 0.68);
  // Etched rock fractures
  line(c, '#6f5c41', 0.9, -w * 0.2, -h * 0.72, -w * 0.16, -h * 0.1);
  line(c, '#6f5c41', 0.85, w * 0.14, -h * 0.65, w * 0.18, -h * 0.06);
  line(c, 'rgba(246, 232, 198, .55)', 0.9, -w * 0.42, -h * 0.86, w * 0.32, -h * 0.82);
  c.restore();
}

function drawWestHill(c: Brush) {
  // Israelite camp slope (west / Socoh limestone terraces)
  polygon(c, '#cab386', 0, 120, 152, 128, 305, 144, 430, 174, 514, 224, 0, 228);
  // Stepped terraced limestone shelves with cast shadows
  polygon(c, '#b79c70', 0, 156, 185, 162, 342, 180, 464, 206, 496, 228, 0, 228);
  polygon(c, '#d6c196', 0, 186, 162, 190, 320, 204, 444, 224, 0, 228);
  polygon(c, '#b0966c', 0, 212, 140, 214, 345, 220, 462, 228, 0, 228);

  // Etched limestone cliff outcrops along the western camp ridge
  drawLimestoneBluff(c, 74, 218, 62, 15, 1);
  drawLimestoneBluff(c, 210, 216, 74, 16, 1);
  drawLimestoneBluff(c, 372, 224, 68, 13, 1);

  for (let i = 0; i < 8; i++) {
    const y = 140 + i * 11.5;
    line(c, 'rgba(110, 89, 62, .38)', 0.95, 8 + i * 12, y, 160 + i * 38, y + 7 + i * 1.8);
    line(c, 'rgba(245, 232, 198, .36)', 0.8, 12 + i * 12, y - 1.5, 145 + i * 36, y + 5 + i * 1.7);
  }
}

function drawEastHill(c: Brush) {
  // Philistine camp slope (east / Ephes Dammim rocky escarpment)
  polygon(c, '#c0a376', 926, 226, 1012, 174, 1144, 142, 1296, 124, 1440, 116, 1440, 228);
  polygon(c, '#a88c61', 954, 228, 1034, 194, 1174, 166, 1320, 152, 1440, 146, 1440, 228);
  polygon(c, '#cab083', 980, 228, 1096, 204, 1264, 190, 1440, 184, 1440, 228);
  polygon(c, '#9f845b', 968, 228, 1110, 216, 1290, 212, 1440, 210, 1440, 228);

  drawLimestoneBluff(c, 1054, 224, 66, 14, -1);
  drawLimestoneBluff(c, 1218, 216, 78, 17, -1);
  drawLimestoneBluff(c, 1378, 214, 64, 15, -1);

  for (let i = 0; i < 8; i++) {
    const y = 136 + i * 11.5;
    line(c, 'rgba(98, 78, 54, .40)', 0.95, 1432 - i * 12, y, 1265 - i * 38, y + 8 + i * 1.8);
    line(c, 'rgba(238, 222, 186, .30)', 0.8, 1428 - i * 12, y - 1.5, 1275 - i * 36, y + 6 + i * 1.6);
  }
}

/** Gnarled Judean terebinth tree (Elah literally means "terebinth") with layered woodcut foliage & dappled shade. */
function drawTerebinthTree(c: Brush, x: number, y: number, scale = 1, lean = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);

  // Soft dappled ground shadow beneath canopy
  oval(c, 'rgba(84, 69, 48, .22)', lean * 8, 2, 30, 6.2);

  // Gnarled twisting dark trunk & spreading boughs
  print(
    c,
    `M-3.2 2 Q-2.2 -11 ${lean * 1.5} -22 L${lean * 5} -23 Q2.2 -11 4.2 2 Z`,
    '#513e2d',
    '#34271c',
    0.85,
  );
  line(c, '#4b3929', 2.4, lean * 1.5, -18, -12, -29);
  line(c, '#4b3929', 2.2, lean * 2.2, -19, 13, -30);
  line(c, '#7a5d42', 0.9, -1.5, -2, lean * 0.8, -18);

  // Shaded under-canopy mass
  oval(c, '#475538', -13, -31, 15, 10.5);
  oval(c, '#49573a', 12, -32, 16, 10.5);
  oval(c, '#4d5c3d', 0, -37, 21, 12.5);

  // Mid-tone Mediterranean olive-terebinth foliage clusters
  oval(c, '#5f704a', -14, -34, 13, 8.5);
  oval(c, '#64754e', 11, -35, 14, 8.8);
  oval(c, '#697a51', -1, -40, 18.5, 10.5);

  // Sunlit western crown highlights & woodcut leaf-stroke texture
  oval(c, '#839365', -8, -43, 12.5, 6.4);
  oval(c, '#7d8d60', 8, -39, 10, 5.5);
  oval(c, '#95a373', -11, -45, 7.5, 3.6);
  for (const [lx, ly] of [[-14, -34], [-4, -42], [6, -38], [14, -33], [-8, -38]] as const) {
    line(c, '#3e4a31', 0.85, lx - 3, ly + 2, lx + 3, ly + 1);
  }
  c.restore();
}

function drawShrub(c: Brush, x: number, y: number, r: number) {
  oval(c, 'rgba(84, 69, 48, .18)', x + 2, y + 3, r * 1.1, r * 0.32);
  oval(c, '#526040', x, y, r, r * 0.54);
  oval(c, '#6c7c53', x - r * 0.24, y - r * 0.18, r * 0.72, r * 0.38);
  oval(c, '#869567', x - r * 0.35, y - r * 0.28, r * 0.42, r * 0.22);
}

function drawTent(c: Brush, x: number, y: number, w: number, h: number, palette: [string, string, string]) {
  c.save();
  c.translate(x, y);
  // Subtle camp ground shadow
  oval(c, 'rgba(66, 52, 38, .20)', 5, 3, w * 0.54, 4.5);
  // Taut guy ropes & wooden stakes
  line(c, '#5b4c3d', 0.9, -w * 0.6, 3, -w * 0.35, -h * 0.74);
  line(c, '#5b4c3d', 0.9, w * 0.6, 3, w * 0.35, -h * 0.74);
  // Main goat-hair / woven cloth body
  polygon(c, palette[0], -w * 0.49, 2, -w * 0.33, -h * 0.78, 0, -h, w * 0.34, -h * 0.78, w * 0.49, 2);
  // Sunlit western roof slope
  polygon(c, palette[1], -w * 0.46, 2, -w * 0.31, -h * 0.76, -w * 0.02, -h + 2, -w * 0.08, 2);
  // Woven panel vertical seams
  line(c, 'rgba(42, 33, 26, .34)', 0.75, -w * 0.24, -h * 0.74, -w * 0.28, 2);
  line(c, 'rgba(42, 33, 26, .34)', 0.75, w * 0.22, -h * 0.74, w * 0.26, 2);
  // Darkened entrance flap
  polygon(c, '#29221c', -w * 0.08, 2, 0, -h * 0.58, w * 0.09, 2);
  // Ridge pole & seam highlight
  line(c, palette[2], 1.15, -w * 0.33, -h * 0.78, 0, -h, w * 0.34, -h * 0.78);
  c.restore();
}

function drawCamps(c: Brush) {
  // Israelite black goat-hair tents on the western ridge
  const israelTent: [string, string, string] = ['#4b4036', '#665749', '#92806b'];
  drawTent(c, 50, 166, 58, 29, israelTent);
  drawTent(c, 134, 156, 68, 34, ['#5c3a30', '#815342', '#bf8f69']); // Saul's royal pavilion
  drawTent(c, 224, 166, 56, 27, israelTent);
  drawTent(c, 302, 176, 48, 24, israelTent);

  // Saul's standard pole (animated pennant drawn live in elahView.ts)
  line(c, '#4b3b2c', 1.9, 174, 158, 174, 114);
  oval(c, '#d7b46d', 174, 113, 2.4, 2.4);

  // Philistine bronze-trimmed war pavilions on the eastern ridge
  const philTent: [string, string, string] = ['#633931', '#845042', '#cfa366'];
  drawTent(c, 1146, 174, 56, 28, philTent);
  drawTent(c, 1234, 160, 66, 33, ['#4a3838', '#6e4e49', '#c89f61']);
  drawTent(c, 1336, 152, 62, 31, philTent);
  drawTent(c, 1408, 160, 52, 26, ['#533932', '#755147', '#be985e']);

  // Philistine bronze standard poles (animated pennants drawn live in elahView.ts)
  for (const [sx, sy] of [[1192, 162], [1290, 152], [1376, 148]] as const) {
    line(c, '#4a3a2d', 1.8, sx, sy, sx, sy - 41);
    oval(c, '#cfa861', sx, sy - 42, 2.6, 2.6);
  }
}

function drawValleyFloor(c: Brush) {
  // Continuous warm Judean sandstone-ochre earth gradient (replaces flat stripe bands!)
  const floorGrad = c.createLinearGradient(0, 220, 0, ELAH_HEIGHT);
  floorGrad.addColorStop(0, '#c8ad80');
  floorGrad.addColorStop(0.18, '#d9bf91');
  floorGrad.addColorStop(0.46, '#e2c99b');
  floorGrad.addColorStop(0.78, '#d6b989');
  floorGrad.addColorStop(1, '#c5a474');
  c.fillStyle = floorGrad;
  c.fillRect(0, 222, ELAH_WIDTH, ELAH_HEIGHT - 222);

  // Soft feathered sunlight washes across the open valley basin (no hard elliptical edges)
  for (const [cx, cy, rx, ry, tone] of [
    [290, 314, 210, 62, '248, 235, 202'],
    [845, 316, 250, 68, '248, 235, 202'],
    [1185, 336, 190, 56, '244, 228, 190'],
  ] as const) {
    c.save();
    c.translate(cx, cy);
    c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, rx * 0.12, 0, 0, rx);
    g.addColorStop(0, `rgba(${tone}, .26)`);
    g.addColorStop(0.6, `rgba(${tone}, .11)`);
    g.addColorStop(1, `rgba(${tone}, 0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, rx, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Worn dusty shepherd & army footpath descending from Saul's camp through the brook ford toward Goliath
  c.save();
  c.strokeStyle = 'rgba(235, 214, 174, .52)';
  c.lineWidth = 34;
  c.beginPath();
  c.moveTo(75, 294);
  c.bezierCurveTo(210, 326, 375, 318, 520, 314);
  c.moveTo(612, 314);
  c.bezierCurveTo(735, 310, 880, 316, 1135, 304);
  c.stroke();

  c.strokeStyle = 'rgba(164, 134, 94, .24)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(75, 278);
  c.bezierCurveTo(210, 310, 375, 302, 514, 298);
  c.moveTo(616, 298);
  c.bezierCurveTo(735, 294, 880, 300, 1135, 288);
  c.stroke();
  c.restore();

  // Etched soil contours, limestone cobbles, cracks, and dry Judean grass tufts
  for (let i = 0; i < 86; i++) {
    const rx = grain(i, 11) * ELAH_WIDTH;
    const ry = 234 + grain(i, 23) * 208;
    if (Math.abs(rx - brookCenterX(ry)) < 68) continue;
    const w = 16 + grain(i, 31) * 46;
    line(
      c,
      i % 2 === 0 ? 'rgba(142, 114, 78, .24)' : 'rgba(248, 234, 200, .26)',
      0.95,
      rx - w * 0.5,
      ry,
      rx + w * 0.5,
      ry + (grain(i, 7) - 0.5) * 3.2,
    );
    if (i % 3 === 0) {
      const pr = 2.6 + grain(i, 5) * 3.4;
      oval(c, 'rgba(98, 79, 55, .20)', rx + 1, ry + 3.6, pr, pr * 0.48);
      oval(c, i % 6 === 0 ? '#cdb790' : '#b79d74', rx, ry + 2.8, pr, pr * 0.45);
    }
    if (i % 6 === 0) {
      // Dry golden-olive valley scrub tuft
      line(c, '#77784d', 1.15, rx, ry, rx - 3.5, ry - 5.5);
      line(c, '#8c8a5d', 1.15, rx, ry, rx + 0.8, ry - 6.8);
      line(c, '#6a6b44', 1.0, rx, ry, rx + 4.2, ry - 4.5);
    }
  }

  // Soft hill shadow lip along north boundary of walkable valley floor
  const lip = c.createLinearGradient(0, 218, 0, 250);
  lip.addColorStop(0, 'rgba(88, 71, 50, .28)');
  lip.addColorStop(1, 'rgba(88, 71, 50, 0)');
  c.fillStyle = lip;
  c.fillRect(0, 218, ELAH_WIDTH, 32);
}

function drawBrook(c: Brush) {
  // Taper the wadi gracefully from the distant valley saddle (y=182) into the foreground valley floor
  const ys: number[] = [];
  for (let y = 182; y <= ELAH_HEIGHT + 4; y += 10) ys.push(y);
  const taper = (y: number) => (y < 236 ? Math.max(0.16, (y - 178) / 58) : 1);

  // Outer gravel & limestone pebble bed
  c.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const w = (55 + Math.max(0, y - 216) * 0.065) * taper(y);
    const x = brookCenterX(y) - w;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const w = (55 + Math.max(0, y - 216) * 0.065) * taper(y);
    const x = brookCenterX(y) + w;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#c4b69a';
  c.fill();

  // Damp inner sandy bank
  c.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const w = (42 + Math.max(0, y - 216) * 0.042) * taper(y);
    const x = brookCenterX(y) - w;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const w = (42 + Math.max(0, y - 216) * 0.042) * taper(y);
    const x = brookCenterX(y) + w;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#9c9680';
  c.fill();

  // Cool shallow brook water channel
  c.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const w = (34 + Math.max(0, y - 216) * 0.032) * taper(y);
    const x = brookCenterX(y) - w;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const w = (34 + Math.max(0, y - 216) * 0.032) * taper(y);
    const x = brookCenterX(y) + w;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#6c8d97';
  c.fill();

  // Deeper blue-slate stream ribbon
  c.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const x = brookCenterX(y) - 18 * taper(y);
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const x = brookCenterX(y) + 18 * taper(y);
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#537480';
  c.fill();

  // Pale sky reflection & submerged riverbed stones along shorelines
  for (let i = 0; i < 34; i++) {
    const y = 216 + i * 7.2;
    const cx = brookCenterX(y);
    const side = i % 2 === 0 ? -1 : 1;
    const px = cx + side * (35 + grain(i, 53) * 16);
    const r = 2.6 + grain(i, 19) * 2.6;
    oval(c, i % 3 === 0 ? '#7f7a6a' : '#aba089', px, y, r * 1.35, r * 0.65);
    oval(c, 'rgba(232, 224, 204, .45)', px - 0.8, y - 0.5, r * 0.6, r * 0.25);
  }

  // Limestone boulders & tall wadi reeds framing where the brook emerges from the saddle
  for (const [rx, ry, rw] of [[520, 218, 13], [604, 216, 14], [538, 199, 10], [588, 197, 11], [506, 368, 9], [622, 344, 10]] as const) {
    oval(c, 'rgba(72, 58, 42, .22)', rx + 2, ry + 2.5, rw, rw * 0.4);
    oval(c, '#94856b', rx, ry, rw, rw * 0.44);
    oval(c, '#baa98a', rx - 2, ry - 1.6, rw * 0.66, rw * 0.28);
  }
  for (const [rx, ry] of [[524, 234], [530, 241], [608, 232], [614, 242], [514, 424], [616, 428], [508, 300], [620, 384]] as const) {
    line(c, '#4c5b3b', 1.35, rx, ry, rx - 3.5, ry - 14);
    line(c, '#677750', 1.2, rx + 2, ry + 1, rx + 4.2, ry - 11.5);
    line(c, '#566444', 1.1, rx - 1, ry, rx + 1, ry - 16);
  }
}

function drawLandmarks(c: Brush) {
  // Iconic Judean terebinth trees ("Elah" = Valley of the Terebinth) and olive scrub
  drawTerebinthTree(c, 276, 220, 1.08, 1);
  drawTerebinthTree(c, 466, 224, 0.82, -1);
  drawTerebinthTree(c, 654, 224, 0.78, 1);
  drawTerebinthTree(c, 1106, 220, 0.88, -1);

  drawShrub(c, 52, 218, 14);
  drawShrub(c, 196, 222, 11);
  drawShrub(c, 378, 222, 11);
  drawShrub(c, 1018, 224, 10);
  drawShrub(c, 1246, 218, 12);
  drawShrub(c, 1368, 216, 13);
}

function drawValleyFrame(c: Brush) {
  // Grounded limestone boulders framing the extreme west and east foreground corners
  print(c, 'M0 422L48 414L90 434L126 460H0Z', '#b5976e', '#765f44', 0.95);
  print(c, 'M10 425L46 418L76 432L32 438Z', '#cfb488');
  print(c, 'M1324 460L1368 426L1412 415L1440 420V460Z', '#ae9069', '#735c42', 0.95);
  print(c, 'M1374 429L1412 419L1436 424L1394 438Z', '#c9ad82');
}

export function drawValleyBackdrop(c: Brush): void {
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  drawSky(c);
  drawDistantHills(c);
  drawWestHill(c);
  drawEastHill(c);
  drawCamps(c);
  drawValleyFloor(c);
  drawBrook(c);
  drawLandmarks(c);
  drawValleyFrame(c);
  stone(c, 'rgba(72, 58, 42, .06)', 0, 0, ELAH_WIDTH, 2);
  c.restore();
}
