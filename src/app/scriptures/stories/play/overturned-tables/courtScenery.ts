import { line, oval, polygon, print, stone } from '../_shared/storyInk';

type Brush = CanvasRenderingContext2D;
const paving = ['#dfc292', '#e6ca9a', '#e2c596', '#d7b888', '#e8cc9d', '#dbc091'];
const sandstone = ['#d0a975', '#ddbc89', '#c69b68', '#d8b480'];
const columns = Array.from({ length: 10 }, (_, i) => i * 119 - 20);

function grain(a: number, b: number) {
  const n = Math.sin(a * 91.37 + b * 43.16) * 13219.75;
  return n - Math.floor(n);
}

function pavement(c: Brush) {
  stone(c, '#b39975', 0, 153, 1320, 307);
  const rows = [159, 179, 199, 223, 252, 287, 329, 377, 434, 500];
  for (let r = 0; r < rows.length - 1; r++) {
    const y = rows[r], h = rows[r + 1] - y, width = 47 + r * 12;
    const joint = (i: number) => i * width + (r % 2 ? width * .45 : 0) + (grain(i, r) - .5) * width * .32;
    for (let i = -2; joint(i) < 1320; i++) {
      const x = joint(i), next = joint(i + 1), skew = (x - 650) * .018 + 3;
      const shade = grain(i + 8, r);
      polygon(c, paving[Math.floor(shade * paving.length)], x + 1, y, next - 1, y, next + skew, y + h - 1, x + skew, y + h - 1);
      line(c, '#edd4a7', 1, x + 3, y + 1, next - 3, y + 1);
      if (shade < .22) {
        const crack = x + (next - x) * .64;
        line(c, '#ba9d75', .8, crack, y, crack - 4, y + h * .16, crack - 1, y + h * .24, crack - 5, y + h * .31);
      }
      if (shade > .76) line(c, '#c9ab80', 1, x + 9, y + h - 5, x + 19, y + h - 6, x + 23, y + h - 8);
    }
  }
}

function rearWall(c: Brush) {
  stone(c, '#716958', 0, 0, 1320, 178);
  for (let r = 0; r < 7; r++) for (let i = -1; i < 29; i++) {
    const x = i * 50 + (r % 2) * 24, y = 34 + r * 20;
    const tone = ['#988366', '#9d896a', '#a18c6b', '#948267'][Math.floor(grain(i, r + 19) * 4)];
    stone(c, tone, x, y, 49, 19);
    line(c, '#aa9677', .8, x + 2, y + 1, x + 46, y + 1);
  }
  for (const [bay, x] of columns.entries()) {
    c.save(); c.translate(x, 0);
    polygon(c, '#726c59', 16, 47, 100, 47, 66, 93, 16, 106);
    print(c, 'M38 153V111Q38 89 57 85Q76 87 76 111V153Z', '#5b584c');
    print(c, 'M42 153V111Q42 97 56 91Q69 94 71 109V153Z', '#454b45');
    if (bay % 3 === 1) {
      print(c, 'M47 150V112Q47 100 57 96Q69 99 69 111V150Z', '#c6b590');
      print(c, 'M47 130L55 126L61 128L69 121V151H47Z', '#929881');
      print(c, 'M47 140L56 133L63 136L69 132V151H47Z', '#7d846c');
      line(c, '#696e58', 1, 61, 137, 61, 124, 64, 119);
      oval(c, '#717e68', 62, 123, 2.1, 6.3, .25);
    } else polygon(c, '#77725c', 42, 137, 61, 130, 67, 110, 71, 109, 71, 153, 42, 153);
    for (let j = 0; j < 3; j++) {
      const a = bay % 2 ? 81 : 26;
      line(c, '#82755f', .7, a + j * 2.5, 114, a - 4 + j * 2.5, 119);
    }
    stone(c, '#b2a084', 38, 151, 41, 3);
    c.restore();
  }
}

function column(c: Brush, x: number) {
  c.save(); c.translate(x, 0);
  polygon(c, '#8e704e', -14, 46, 13, 46, 17, 157, -16, 157);
  polygon(c, '#e0bd85', -12, 46, 7, 46, 10, 157, -15, 157);
  for (let i = 0; i < 6; i++) {
    const a = -10 + i * 4;
    polygon(c, i < 3 ? '#b99563' : '#a18159', a, 51, a + 1.8, 50, a * 1.28 + 1.8, 153, a * 1.28, 154);
    line(c, i < 4 ? '#efcf98' : '#c7a674', .85, a + 2.2, 52, a * 1.28 + 2.5, 153);
  }
  for (const y of [80, 119]) line(c, '#aa8a60', .65, -13, y, -4, y + .8, 12, y);
  polygon(c, '#e7c997', -20, 32, 19, 32, 19, 38, 15, 39, 12, 45, -12, 45, -16, 39, -20, 38);
  print(c, 'M-18 37Q-12 38 -9 43L-10 38Q-5 39 -2 44L-3 38Q2 39 3 44L6 38L8 43L12 38L13 43L17 38', '', '#ab875b', 1.4);
  stone(c, '#aa855c', -13, 44, 26, 3);
  stone(c, '#f1d5a2', -14, 47, 27, 2);
  for (const [y, w, h, tone] of [[155, 33, 4, '#dabc88'], [159, 38, 4, '#a4835b'], [163, 40, 5, '#e8c896'], [168, 45, 6, '#c0a071']] as const) {
    stone(c, tone, -w / 2, y, w, h);
    stone(c, '#927353', w * .22, y + 1, w * .28, h - 1);
  }
  c.restore();
}

function canopy(c: Brush, x: number, width: number, blue: boolean) {
  c.save(); c.translate(x, 0); c.scale(width / 112, 1);
  const colors = blue ? ['#576a75', '#859399', '#374d5b', '#a5aaa1'] : ['#b86141', '#d28a62', '#864b38', '#e4ac7c'];
  line(c, '#665748', 1.3, -4, 64, 4, 75, 110, 79, 118, 68);
  print(c, 'M4 74Q50 82 105 76L119 102Q66 111 -8 102Z', colors[0], colors[2]);
  for (const x of [13, 36, 59, 82]) {
    polygon(c, colors[1], x, 77, x + 6, 78, x + 5, 105, x - 4, 104);
    line(c, colors[3], .7, x + 7, 80, x + 7, 88, x + 4, 103);
  }
  print(c, 'M-8 102Q52 110 119 102L118 108Q109 114 103 109Q95 115 86 110Q77 116 69 111Q58 116 49 111Q39 115 31 110Q20 114 13 109Q2 113 -8 107Z', colors[2]);
  print(c, 'M-7 103Q56 110 118 103', '', colors[3], 1);
  line(c, '#66513f', 1.7, -8, 106, -9, 142); line(c, '#66513f', 1.7, 118, 106, 119, 139);
  c.restore();
}

function entablature(c: Brush) {
  stone(c, '#bb976b', 0, 0, 1320, 33);
  stone(c, '#e6c38c', 0, 0, 1320, 5);
  stone(c, '#927451', 0, 7, 1320, 3);
  for (let x = -17; x < 1320; x += 22) {
    polygon(c, '#d9b888', x, 13, x + 7, 11, x + 14, 14, x + 7, 17);
    line(c, '#a3835d', .8, x, 17, x + 7, 20, x + 15, 16);
  }
  stone(c, '#e4c495', 0, 23, 1320, 4); stone(c, '#8e7451', 0, 28, 1320, 6);
  for (let x = 0; x < 1320; x += 11) stone(c, '#cead79', x, 28, 7, 4);
}

function eastGate(c: Brush) {
  c.save(); c.translate(1185, 0);
  stone(c, '#ad8c63', -100, 0, 235, 182);
  c.save(); c.beginPath(); c.rect(-100, 0, 235, 182); c.clip();
  for (let r = 0; r < 8; r++) for (let i = -3; i <= 3; i++) {
    const x = i * 48 - (r % 2) * 20;
    stone(c, sandstone[Math.floor(grain(i + 17, r) * 4)], x, r * 23, 47, 22);
    line(c, '#e2bd88', .8, x + 2, r * 23 + 1, x + 44, r * 23 + 1);
  }
  c.restore();
  stone(c, '#b29468', -100, 10, 235, 3); stone(c, '#e7c894', -100, 13, 235, 3);
  polygon(c, '#a28460', -99, 17, -80, 17, -70, 173, -82, 177, -98, 172);
  for (const x of [-99, 88]) {
    stone(c, '#d9b783', x, 21, 14, 154); stone(c, '#c49e6b', x + 10, 22, 4, 153);
    stone(c, '#e6c28d', x - 3, 17, 20, 5); stone(c, '#ddba87', x - 3, 174, 21, 5);
  }
  const opening = new Path2D('M-47 181V103A47 47 0 0 1 47 103V181Z');
  c.save(); c.clip(opening);
  stone(c, '#e6d4aa', -50, 49, 100, 138);
  print(c, 'M-50 134L-33 119L-14 123L4 109L21 114L34 110L50 119V160H-50Z', '#a7a18a');
  print(c, 'M-50 141L-28 133L-13 139L5 128L23 134L50 125V168H-50Z', '#858b76');
  print(c, 'M-50 152L3 145L30 151L50 145V183H-50Z', '#bea680');
  print(c, 'M-12 183Q22 162 1 151Q25 155 25 163L13 183Z', '#e7cda0');
  for (const x of [-29, -25, 37]) { oval(c, '#637364', x, 135 + x * .04, 2, 8); }
  print(c, 'M-48 105A48 48 0 0 1 48 102L48 117Q43 88 29 77Q-8 44 -38 94L-46 128Z', '#a48963');
  polygon(c, '#726b58', -49, 78, -32, 87, -32, 163, -47, 181);
  c.restore();
  for (let i = 0; i < 13; i++) {
    const a = Math.PI + i * Math.PI / 13 + .009, b = a + Math.PI / 13 - .016, outer = i === 6 ? 69 : 63;
    polygon(c, sandstone[(i + 1) % 4], 47 * Math.cos(a), 103 + 47 * Math.sin(a), outer * Math.cos(a), 103 + outer * Math.sin(a), outer * Math.cos(b), 103 + outer * Math.sin(b), 47 * Math.cos(b), 103 + 47 * Math.sin(b));
  }
  for (const x of [-63, 47]) for (let i = 0; i < 4; i++) stone(c, sandstone[(i + 1) % 4], x, 103 + i * 19, 16, 18);
  stone(c, '#eac995', -69, 99, 24, 5); stone(c, '#eac995', 45, 99, 24, 5);
  for (let i = 0; i < 3; i++) {
    const y = 179 + i * 5, w = 52 + i * 5;
    polygon(c, '#ead1a4', -w, y, w, y, w + 4, y + 3, -w - 4, y + 3);
    stone(c, '#b49a74', -w - 4, y + 3, w * 2 + 8, 2);
  }
  for (const d of [-1, 1]) {
    const edge = d * 60;
    for (const [a, b] of [[196, 218], [222, 246], [251, 273]]) {
      const top = edge + d * (a - 196) * .25, end = edge + d * (b - 196) * .25;
      line(c, 'rgba(145,112,74,.45)', 1.4, top, a, end, b);
      line(c, 'rgba(242,218,175,.75)', 1.8, top + 2, a, end + 2, b);
    }
  }
  c.restore();
}

export function drawCourtyard(c: Brush): void {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  rearWall(c); pavement(c);
  stone(c, '#c8ad85', 0, 153, 1085, 6); stone(c, '#958267', 0, 159, 1085, 3);
  stone(c, '#d9bd92', 0, 162, 1085, 7); stone(c, '#a68e6d', 0, 169, 1085, 4);
  for (const x of columns) {
    polygon(c, 'rgba(87,74,64,.14)', x - 17, 173, x + 20, 173, x + 93, 241, x + 69, 239);
  }
  canopy(c, 123, 134, false); canopy(c, 438, 150, true); canopy(c, 792, 133, false);
  entablature(c);
  for (const x of columns) column(c, x);
  eastGate(c);
  c.restore();
}
