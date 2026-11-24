import { brookCenterX, ELAH_HEIGHT, ELAH_WIDTH } from './elahGame';
import { line, oval, polygon, print, stone } from './elahInk';

type Brush = CanvasRenderingContext2D;

function grain(a: number, b: number) {
  const n = Math.sin(a * 79.13 + b * 47.29) * 14321.57;
  return n - Math.floor(n);
}

function drawSky(c: Brush) {
  const grad = c.createLinearGradient(0, 0, 0, 175);
  grad.addColorStop(0, '#dfd0ae');
  grad.addColorStop(0.55, '#ebddc0');
  grad.addColorStop(1, '#f3e7ce');
  c.fillStyle = grad;
  c.fillRect(0, 0, ELAH_WIDTH, 180);

  // Subtle woodcut sky hatching and high sunlit clouds
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 168 + grain(i, 2) * 35;
    const y = 26 + (i % 3) * 20;
    oval(c, 'rgba(255, 250, 236, .42)', x, y, 52 + (i % 2) * 18, 8);
    line(c, 'rgba(176, 156, 122, .22)', 0.8, x - 44, y + 6, x + 42, y + 6);
  }
}

function drawDistantHills(c: Brush) {
  // Far Judean horizon range
  polygon(
    c, '#c4b89c',
    0, 146, 110, 122, 230, 114, 370, 126, 495, 118, 610, 134,
    730, 140, 860, 128, 985, 116, 1130, 110, 1280, 122, 1440, 114,
    1440, 210, 0, 210,
  );
  // Mid-distance warm ochre ridge framing the valley saddle
  polygon(
    c, '#b7a582',
    0, 152, 140, 136, 305, 142, 460, 158, 590, 176, 720, 182,
    855, 172, 1010, 152, 1180, 134, 1330, 138, 1440, 132,
    1440, 232, 0, 232,
  );
  // Subtle ridge contour etchings
  line(c, 'rgba(126, 108, 79, .38)', 1, 18, 148, 142, 136, 305, 142, 460, 158, 590, 176);
  line(c, 'rgba(126, 108, 79, .38)', 1, 855, 172, 1010, 152, 1180, 134, 1435, 132);
}

function drawWestHill(c: Brush) {
  // Israelite camp slope (west / Socoh ridge)
  polygon(
    c, '#ccb68b',
    0, 124, 155, 132, 310, 148, 435, 178, 515, 224, 0, 228,
  );
  // Limestone terrace strata
  polygon(c, '#b99f74', 0, 160, 185, 166, 340, 182, 465, 208, 495, 228, 0, 228);
  polygon(c, '#d7c399', 0, 188, 160, 192, 318, 206, 442, 224, 0, 228);
  for (let i = 0; i < 6; i++) {
    const y = 148 + i * 13;
    line(c, 'rgba(118, 97, 68, .42)', 1, 10 + i * 14, y, 165 + i * 42, y + 8 + i * 2);
  }
  // Olive shrubs along the west ridge
  for (const [ox, oy, r] of [[52, 214, 15], [228, 210, 13], [358, 218, 12], [442, 224, 10]] as const) {
    oval(c, '#5e6b48', ox, oy, r, r * 0.56);
    oval(c, '#77855c', ox - r * 0.25, oy - r * 0.16, r * 0.68, r * 0.36);
    line(c, '#4c3c2e', 1.5, ox, oy + 4, ox + 1, oy + 10);
  }
}

function drawEastHill(c: Brush) {
  // Philistine camp slope (east / Ephes Dammim ridge)
  polygon(
    c, '#c4a97d',
    930, 226, 1015, 176, 1145, 144, 1295, 128, 1440, 120, 1440, 228,
  );
  polygon(c, '#ae9268', 955, 228, 1035, 196, 1175, 168, 1320, 154, 1440, 150, 1440, 228);
  polygon(c, '#cdb388', 980, 228, 1095, 206, 1265, 192, 1440, 186, 1440, 228);
  for (let i = 0; i < 6; i++) {
    const y = 144 + i * 13;
    line(c, 'rgba(104, 83, 58, .44)', 1, 1430 - i * 14, y, 1260 - i * 44, y + 9 + i * 2);
  }
  // Scrub along the east stones
  for (const [ox, oy, r] of [[1040, 222, 11], [1165, 214, 13], [1345, 212, 14]] as const) {
    oval(c, '#5d6646', ox, oy, r, r * 0.52);
    oval(c, '#757e58', ox + r * 0.2, oy - r * 0.15, r * 0.62, r * 0.34);
  }
}

function drawTent(c: Brush, x: number, y: number, w: number, h: number, palette: [string, string, string]) {
  c.save();
  c.translate(x, y);
  // Guy ropes
  line(c, '#5b4c3d', 0.9, -w * 0.56, 2, -w * 0.36, -h * 0.72);
  line(c, '#5b4c3d', 0.9, w * 0.58, 2, w * 0.36, -h * 0.72);
  // Tent body (black goat hair or Philistine striped pavilion)
  polygon(c, palette[0], -w * 0.48, 2, -w * 0.32, -h * 0.78, 0, -h, w * 0.34, -h * 0.78, w * 0.48, 2);
  // Sunlit face
  polygon(c, palette[1], -w * 0.45, 2, -w * 0.3, -h * 0.76, -w * 0.02, -h + 2, -w * 0.08, 2);
  // Darkened entrance opening
  polygon(c, '#2d2620', -w * 0.07, 2, 0, -h * 0.56, w * 0.09, 2);
  // Ridge seam highlight
  line(c, palette[2], 1.1, -w * 0.32, -h * 0.78, 0, -h, w * 0.34, -h * 0.78);
  c.restore();
}

function drawCamps(c: Brush) {
  // Israelite goat-hair tents on the western ridge
  const israelTent: [string, string, string] = ['#4e4339', '#67584a', '#8e7c68'];
  drawTent(c, 52, 168, 56, 28, israelTent);
  drawTent(c, 134, 158, 66, 33, ['#5d3c32', '#7e5242', '#b88864']); // Saul's royal pavilion
  drawTent(c, 224, 168, 54, 26, israelTent);
  drawTent(c, 298, 178, 48, 24, israelTent);

  // Saul's standard pole beside pavilion
  line(c, '#4b3b2c', 1.8, 174, 158, 174, 116);
  polygon(c, '#9a4332', 175, 118, 198, 123, 193, 132, 175, 131);
  line(c, '#e2be79', 0.8, 176, 124, 193, 125);

  // Philistine war pavilions on the eastern ridge
  const philTent: [string, string, string] = ['#633a32', '#824f42', '#c89e64'];
  drawTent(c, 1146, 176, 54, 27, philTent);
  drawTent(c, 1234, 162, 64, 32, ['#4b3939', '#6b4d49', '#c29a5e']);
  drawTent(c, 1336, 154, 60, 30, philTent);
  drawTent(c, 1408, 162, 52, 26, ['#543a33', '#735046', '#ba945c']);

  // Tall Philistine bronze standards
  for (const [sx, sy] of [[1192, 162], [1290, 152], [1376, 148]] as const) {
    line(c, '#4a3a2d', 1.7, sx, sy, sx, sy - 40);
    polygon(c, '#6a2e28', sx - 1, sy - 38, sx - 20, sy - 33, sx - 16, sy - 25, sx - 1, sy - 26);
    oval(c, '#cfa861', sx, sy - 41, 2.6, 2.6);
  }
}

function drawValleyFloor(c: Brush) {
  // Base warm sun-baked valley earth
  stone(c, '#d7bc8f', 0, 222, ELAH_WIDTH, ELAH_HEIGHT - 222);

  // Horizontal perspective contour bands in warm Judean ochre
  const bands: readonly [number, number, string][] = [
    [222, 246, '#cbb082'],
    [246, 280, '#d8be90'],
    [280, 324, '#dfc699'],
    [324, 376, '#d6ba8b'],
    [376, 460, '#caa979'],
  ];
  for (const [y0, y1, color] of bands) {
    stone(c, color, 0, y0, ELAH_WIDTH, y1 - y0);
  }

  // Etched soil contours, limestone stones, and dry scrub tufts
  for (let i = 0; i < 62; i++) {
    const rx = grain(i, 11) * ELAH_WIDTH;
    const ry = 236 + grain(i, 23) * 204;
    if (Math.abs(rx - brookCenterX(ry)) < 68) continue;
    const w = 18 + grain(i, 31) * 44;
    line(c, 'rgba(146, 118, 82, .24)', 1, rx - w * 0.5, ry, rx + w * 0.5, ry + (grain(i, 7) - 0.5) * 3);
    if (i % 3 === 0) {
      oval(c, '#bfa57c', rx, ry + 3, 3.2 + grain(i, 5) * 3, 1.5);
    }
    if (i % 7 === 0) {
      // Small dry valley grass tuft
      line(c, '#7e7d53', 1.1, rx, ry, rx - 3, ry - 5);
      line(c, '#8c8a5e', 1.1, rx, ry, rx + 1, ry - 6);
      line(c, '#72724a', 1, rx, ry, rx + 4, ry - 4);
    }
  }

  // Soft hill shadow lip along north boundary of the walkable valley floor
  const lip = c.createLinearGradient(0, 218, 0, 248);
  lip.addColorStop(0, 'rgba(96, 78, 56, .26)');
  lip.addColorStop(1, 'rgba(96, 78, 56, 0)');
  c.fillStyle = lip;
  c.fillRect(0, 218, ELAH_WIDTH, 30);
}

function drawBrook(c: Brush) {
  // Taper the wadi gracefully from the distant valley saddle (y=184) into the foreground valley floor
  const ys: number[] = [];
  for (let y = 184; y <= ELAH_HEIGHT + 4; y += 10) ys.push(y);
  const taper = (y: number) => (y < 236 ? Math.max(0.18, (y - 180) / 56) : 1);

  // Outer gravel & limestone pebble bed
  c.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const w = (52 + Math.max(0, y - 216) * 0.06) * taper(y);
    const x = brookCenterX(y) - w;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const w = (52 + Math.max(0, y - 216) * 0.06) * taper(y);
    const x = brookCenterX(y) + w;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#c5b79c';
  c.fill();

  // Damp inner sandy bank
  c.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const w = (41 + Math.max(0, y - 216) * 0.04) * taper(y);
    const x = brookCenterX(y) - w;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const w = (41 + Math.max(0, y - 216) * 0.04) * taper(y);
    const x = brookCenterX(y) + w;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#a39d88';
  c.fill();

  // Cool shallow brook water channel
  c.beginPath();
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const w = (33 + Math.max(0, y - 216) * 0.03) * taper(y);
    const x = brookCenterX(y) - w;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const w = (33 + Math.max(0, y - 216) * 0.03) * taper(y);
    const x = brookCenterX(y) + w;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#6f8e97';
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
  c.fillStyle = '#5a7a85';
  c.fill();

  // Engraved pale water shimmer streaks and shoreline pebbles
  for (let i = 0; i < 28; i++) {
    const y = 224 + i * 8.4;
    const cx = brookCenterX(y);
    const shift = (grain(i, 41) - 0.5) * 32;
    line(c, 'rgba(227, 236, 232, .52)', 1, cx + shift - 8, y, cx + shift + 8, y + 0.6);
    // Bank pebbles
    const side = i % 2 === 0 ? -1 : 1;
    const px = cx + side * (36 + grain(i, 53) * 14);
    oval(c, i % 3 === 0 ? '#8c8676' : '#afa38c', px, y, 3.4, 1.8);
  }

  // Low limestone rocks & reeds framing where the brook winds out of the valley saddle
  for (const [rx, ry, rw] of [[522, 218, 12], [602, 216, 13], [540, 200, 9], [586, 198, 10]] as const) {
    oval(c, '#9a8b70', rx, ry, rw, rw * 0.42);
    oval(c, '#b7a687', rx - 2, ry - 1.5, rw * 0.68, rw * 0.28);
  }
  for (const [rx, ry] of [[526, 234], [532, 240], [608, 232], [614, 242], [516, 422], [616, 428]] as const) {
    line(c, '#566444', 1.3, rx, ry, rx - 3, ry - 13);
    line(c, '#6b7954', 1.2, rx + 2, ry + 1, rx + 4, ry - 11);
    line(c, '#4c593c', 1.1, rx - 1, ry, rx + 1, ry - 15);
  }
}

function drawValleyFrame(c: Brush) {
  // Subtle dry limestone rock outcrops on far west and east foreground edges
  print(c, 'M0 426L46 416L84 434L118 460H0Z', '#b79a72', '#7d664a', 0.9);
  print(c, 'M1332 460L1372 428L1414 418L1440 422V460Z', '#b1946d', '#786146', 0.9);
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
  drawValleyFrame(c);
  c.restore();
}
