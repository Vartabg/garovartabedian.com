import {
  COURT_WIDTH as courtWidth, COURT_HEIGHT as courtHeight,
  activeEncounters, courtComplete, courtCompletedAt, eveningAt, eveningReady,
  nearby, nearbyEncounter, type Court, type Encounter, type Fixture, type Point,
} from "./courtGame";
import { drawCourtyard } from "./courtScenery";
import { drawPerson, type PersonPose } from "./courtPeople";
import {
  drawAerialSpill, drawDroppedReed, drawDroppedStaff,
  drawFixture, drawGroundScatter, drawMidairSpill,
} from "./courtProps";
import { oval, polygon, print } from "./courtInk";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const SELLER_EXITS: readonly Point[] = [
  { x: -26, y: 248 },
  { x: 394, y: 158 },
  { x: 632, y: 158 },
  { x: 751, y: 158 },
  { x: 989, y: 158 },
];

const BUYER_SPOTS: readonly { x: number; y: number; exitX: number; fixtureIndex: number }[] = [
  { x: 355, y: 232, exitX: 275, fixtureIndex: 0 },
  { x: 740, y: 239, exitX: 751, fixtureIndex: 2 },
  { x: 1085, y: 246, exitX: 1108, fixtureIndex: 4 },
];

// Two quiet adult listeners standing clear of the lame (162, 368), blind (462, 232), and children (612/658).
const LISTENERS: readonly { start: Point; rest: Point; delay: number; variant: number }[] = [
  { start: { x: 275, y: 158 }, rest: { x: 332, y: 232 }, delay: .4, variant: 1 },
  { start: { x: 751, y: 158 }, rest: { x: 720, y: 234 }, delay: .8, variant: 3 },
];

// Two praising children entering from rear bay 5 into open sunlit center paving (Matthew 21:15).
const CHILDREN: readonly { start: Point; rest: Point; delay: number; variant: number }[] = [
  { start: { x: 513, y: 158 }, rest: { x: 536, y: 318 }, delay: .55, variant: 0 },
  { start: { x: 632, y: 158 }, rest: { x: 574, y: 330 }, delay: .75, variant: 1 },
];

// Two chief priests & scribes near the interactive point (884, 214), withdrawing slightly back into shadow after answered.
const SCRIBES: readonly { start: Point; front: Point; back: Point; delay: number; variant: number }[] = [
  { start: { x: 870, y: 158 }, front: { x: 876, y: 208 }, back: { x: 878, y: 195 }, delay: .65, variant: 0 },
  { start: { x: 989, y: 158 }, front: { x: 916, y: 212 }, back: { x: 922, y: 199 }, delay: .85, variant: 1 },
];

const ARCH_OPENING = typeof Path2D !== "undefined"
  ? new Path2D("M1138 181V103A47 47 0 0 1 1232 103V181Z")
  : null;

export function verticalCameraTop(visibleHeight: number, feetY: number) {
  if (visibleHeight >= courtHeight) return (courtHeight - visibleHeight) / 2;
  const courtBottom = 433;
  const roomAboveFeet = Math.min(128, visibleHeight * .77);
  return Math.max(0, Math.min(courtBottom - visibleHeight, feetY - roomAboveFeet));
}

function marker(c: CanvasRenderingContext2D, x: number, y: number, time: number, reduced: boolean) {
  const lift = reduced ? 0 : Math.sin(time * 3.6) * 1.8;
  c.save(); c.translate(x, y + lift);
  polygon(c, "#4c3628", -7, -9, 7, -9, 0, 1);
  polygon(c, "#fff0a5", -5, -8, 5, -8, 0, -1);
  c.restore();
}

function carrierOpenPose(gate: Fixture, t: number): { x: number; y: number; facing: number; alpha: number } {
  const phase = (t * .26) % 1;
  if (phase < .22) {
    const u = phase / .22;
    return { x: gate.x, y: lerp(176, 256, u), facing: -1, alpha: clamp(u * 2.6, 0, 1) };
  }
  if (phase < .52) {
    const u = (phase - .22) / .30;
    return { x: lerp(gate.x, gate.x - 76, u), y: lerp(256, 276, u), facing: -1, alpha: 1 };
  }
  if (phase < .78) {
    const u = (phase - .52) / .26;
    return { x: lerp(gate.x - 76, gate.x, u), y: lerp(276, 254, u), facing: 1, alpha: 1 };
  }
  const u = (phase - .78) / .22;
  return { x: gate.x, y: lerp(254, 174, u), facing: 1, alpha: clamp((1 - u) * 2.6, 0, 1) };
}

function nearbyDisturbance(s: Court, f: Fixture, time: number): { x: number; amount: number } | null {
  let strongest: { x: number; amount: number } | null = null;
  for (const other of s.fixtures) {
    if (other === f || other.at === null || other.kind === "gate") continue;
    const age = time - other.at;
    if (age < 0 || age > 1.15) continue;
    if (Math.hypot(other.x - f.x, other.y - f.y) > 280) continue;
    const amount = Math.sin(Math.PI * clamp(age / 1.15, 0, 1));
    if (!strongest || amount > strongest.amount) strongest = { x: other.x, amount };
  }
  return strongest;
}

function drawClearingLight(c: CanvasRenderingContext2D, sun: number, dusk: number) {
  if (sun <= .005) return;
  c.save();
  const r = Math.round(lerp(255, 246, dusk));
  const g = Math.round(lerp(241, 176, dusk));
  const b = Math.round(lerp(198, 106, dusk));
  c.fillStyle = `rgba(${r}, ${g}, ${b}, ${((0.125 + dusk * 0.04) * sun).toFixed(4)})`;
  const stretch = dusk * 44;
  for (const x of [140, 385, 620, 860, 1135]) {
    c.beginPath();
    c.moveTo(x - 18, 154);
    c.lineTo(x + 56, 154);
    c.lineTo(x + 152 + stretch, 434);
    c.lineTo(x + 36 + stretch * .6, 434);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function drawDuskAtmosphere(c: CanvasRenderingContext2D, dusk: number, archGlow: boolean) {
  if (dusk <= .005) return;
  c.save();
  // Deepen the sky and Bethany hills seen through the eastern archway into amber-plum twilight
  if (ARCH_OPENING) {
    c.save();
    c.clip(ARCH_OPENING);
    const grad = c.createLinearGradient(1185, 52, 1185, 181);
    grad.addColorStop(0, `rgba(92, 74, 98, ${(0.88 * dusk).toFixed(4)})`);
    grad.addColorStop(.52, `rgba(216, 134, 86, ${(0.84 * dusk).toFixed(4)})`);
    grad.addColorStop(1, `rgba(234, 174, 108, ${(0.62 * dusk).toFixed(4)})`);
    c.fillStyle = grad;
    c.fillRect(1135, 49, 100, 136);
    c.save(); c.translate(1185, 0);
    c.globalAlpha = dusk * .72;
    print(c, "M-50 134L-33 119L-14 123L4 109L21 114L34 110L50 119V160H-50Z", "#5b5163");
    print(c, "M-50 141L-28 133L-13 139L5 128L23 134L50 125V168H-50Z", "#454150");
    print(c, "M-50 152L3 145L30 151L50 145V183H-50Z", "#82644e");
    print(c, "M-12 183Q22 162 1 151Q25 155 25 163L13 183Z", "#cf9a68");
    c.restore();
    c.restore();
  }
  // Subtle warm sunset wash across the limestone court
  c.fillStyle = `rgba(164, 82, 42, ${(0.165 * dusk).toFixed(4)})`;
  c.fillRect(0, 0, courtWidth, courtHeight);
  // Soft golden sunset sheen along the eastern archway steps inviting departure
  if (archGlow) {
    c.fillStyle = `rgba(255, 224, 152, ${(0.22 * dusk).toFixed(4)})`;
    c.beginPath();
    c.moveTo(1138, 179); c.lineTo(1232, 179);
    c.lineTo(1254, 244); c.lineTo(1116, 244);
    c.closePath(); c.fill();
  }
  c.restore();
}

function drawHealGlow(c: CanvasRenderingContext2D, x: number, y: number, alpha: number) {
  if (alpha <= .01) return;
  c.save();
  const g = c.createRadialGradient(x, y, 2, x, y, 30);
  g.addColorStop(0, `rgba(255, 248, 214, ${(0.55 * alpha).toFixed(4)})`);
  g.addColorStop(.55, `rgba(246, 216, 146, ${(0.22 * alpha).toFixed(4)})`);
  g.addColorStop(1, "rgba(246, 216, 146, 0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, 30, 0, Math.PI * 2); c.fill();
  c.restore();
}

function hitEncounter(s: Court, p: Point): Encounter | undefined {
  for (const e of activeEncounters(s)) {
    if (e.kind === "lame" && Math.abs(p.x - e.x) < 42 && p.y > e.y - 64 && p.y < e.y + 20) return e;
    if (e.kind === "blind" && Math.abs(p.x - e.x) < 38 && p.y > e.y - 64 && p.y < e.y + 20) return e;
    if (e.kind === "scribes" && p.x > e.x - 40 && p.x < e.x + 60 && p.y > e.y - 62 && p.y < e.y + 22) return e;
    if (e.kind === "depart" && Math.abs(p.x - e.x) < 54 && p.y > e.y - 104 && p.y < e.y + 32) return e;
  }
  return undefined;
}

export function createView(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width = 1, height = 1, scale = 1, left = 0, top = 0, pixelRatio = 1, centered = false;
  const back = document.createElement("canvas");
  back.width = courtWidth * 2; back.height = courtHeight * 2;
  const ink = back.getContext("2d");
  if (ink) { ink.scale(2, 2); drawCourtyard(ink); }

  function size() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width); height = Math.max(1, box.height);
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
    scale = Math.min(width / 310, Math.max(height / (courtHeight * .82), width / 1040));
    centered = false;
  }

  function toWorld(x: number, y: number): Point {
    const box = canvas.getBoundingClientRect();
    return { x: (x - box.left) / scale + left, y: (y - box.top) / scale + top };
  }

  function hit(s: Court, p: Point): Fixture | Encounter | undefined {
    if (s.departedAt !== null) return undefined;
    if (courtComplete(s)) return hitEncounter(s, p);
    return s.fixtures.filter(f => f.at === null).sort((a, b) => b.y - a.y).find(f => {
      const gate = f.kind === "gate", seat = f.kind === "seat";
      return Math.abs(f.x - p.x) < (gate ? 50 : seat ? 35 : 52) && p.y > f.y - (gate ? 91 : seat ? 56 : 70) && p.y < f.y + 20;
    });
  }

  function draw(s: Court, dt: number, reduced: boolean) {
    const time = s.time;
    const complete = courtComplete(s);
    const completedAt = courtCompletedAt(s);
    const evAt = eveningAt(s);
    const dusk = evAt === null ? 0 : (reduced ? 1 : clamp((time - evAt) / 2.2, 0, 1));

    // Compute Jesus's visual position (walking up eastern steps onto the Bethany road once departed).
    let jesusX = s.player.x, jesusY = s.player.y, jesusFacing = s.facing;
    let jesusStride = s.walking ? s.stride : 0, jesusAlpha = 1, jesusScale = 1;
    if (s.departedAt !== null) {
      const depAge = Math.max(0, time - s.departedAt);
      const u = reduced ? 1 : clamp(depAge / 2.6, 0, 1);
      if (u < .45) {
        const leg = u / .45;
        jesusX = lerp(s.player.x, 1185, leg);
        jesusY = lerp(s.player.y, 220, leg);
      } else {
        const leg = (u - .45) / .55;
        jesusX = 1185;
        jesusY = lerp(220, 168, leg);
        jesusScale = lerp(1, .82, leg);
      }
      jesusFacing = 1;
      jesusStride = reduced ? 0 : depAge * 7.2;
      jesusAlpha = reduced ? 0 : clamp((1 - u) / .32, 0, 1);
    }

    const span = width / scale;
    const camFocusX = s.departedAt !== null ? lerp(s.player.x, 1185, reduced ? 1 : clamp((time - s.departedAt) / 1.4, 0, 1)) : s.player.x;
    const camFocusY = s.departedAt !== null ? Math.max(212, jesusY) : s.player.y;
    top = verticalCameraTop(height / scale, camFocusY);
    const to = span >= courtWidth ? (courtWidth - span) / 2 : clamp(camFocusX - span * .43, 0, courtWidth - span);
    left = centered ? left + (to - left) * (1 - Math.exp(-dt * 11)) : to;
    centered = true;

    const nearFix = nearby(s);
    const nearEnc = complete ? nearbyEncounter(s) : undefined;
    const gate = s.fixtures.find(f => f.kind === "gate")!;

    let lastStallImpact = -Infinity;
    let lastStallKind: "table" | "seat" = "table";
    let lastStallSide = 1;
    for (const f of s.fixtures) {
      if (f.kind !== "gate" && f.at !== null && f.at > lastStallImpact) {
        lastStallImpact = f.at; lastStallKind = f.kind; lastStallSide = f.side;
      }
    }
    const impactAge = time - lastStallImpact;
    const hitStopped = !reduced && impactAge >= 0 && impactAge < .035;
    const renderTime = hitStopped ? lastStallImpact + .006 : time;

    let shakeX = 0, shakeY = 0;
    if (!reduced && impactAge >= .02 && impactAge < .3) {
      const amp = (lastStallKind === "table" ? 2.9 : 1.7) * Math.exp(-(impactAge - .02) * 14);
      shakeY = Math.sin((impactAge - .02) * 62) * amp;
      shakeX = lastStallSide * Math.cos((impactAge - .02) * 44) * amp * .45;
    }

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = dusk > .01 ? "#a77954" : "#c7a879";
    ctx.fillRect(0, 0, width, height);
    ctx.scale(scale, scale); ctx.translate(-left + shakeX, -top + shakeY);

    if (ink) ctx.drawImage(back, 0, 0, courtWidth, courtHeight); else drawCourtyard(ctx);

    if (completedAt !== null) {
      const clearAge = Math.max(0, time - completedAt);
      const sun = reduced ? 1 : clamp(clearAge / 1.8, 0, 1);
      drawClearingLight(ctx, sun, dusk);
    }

    if (dusk > .005) {
      drawDuskAtmosphere(ctx, dusk, eveningReady(s));
    }

    if (s.destination && !s.selected) {
      const p = s.destination;
      ctx.strokeStyle = "#473f32"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 3.2, 0, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = "#f6eac5"; ctx.fillRect(p.x - 2, p.y - 1, 4, 2);
    }

    // Pass 1: Ground scatter (settled coins, cloths, scales, settled feathers, dropped healing staff/reed)
    for (const f of s.fixtures) {
      drawGroundScatter(ctx, f, renderTime, reduced);
    }
    if (complete) {
      const lameEnc = s.encounters.find(e => e.kind === "lame");
      const blindEnc = s.encounters.find(e => e.kind === "blind");
      if (lameEnc?.at !== null && lameEnc) drawDroppedStaff(ctx, lameEnc.x, lameEnc.y);
      if (blindEnc?.at !== null && blindEnc) drawDroppedReed(ctx, blindEnc.x, blindEnc.y);
    }

    // Pass 2: Depth-sorted fixtures, mid-air spill, merchants, buyers, carrier, Act II cast, and Jesus
    const rows: { y: number; draw: () => void }[] = [];

    for (const [i, f] of s.fixtures.entries()) {
      rows.push({ y: f.y, draw: () => drawFixture(ctx, f, renderTime, reduced) });
      if (f.kind !== "gate") {
        if (f.at !== null) {
          rows.push({ y: f.y + 4, draw: () => drawMidairSpill(ctx, f, renderTime, reduced) });
        }
        const exit = SELLER_EXITS[i] ?? { x: f.x, y: 158 };
        const age = f.at === null ? -1 : Math.max(0, renderTime - f.at);
        if (age <= 3.6) {
          const homeX = f.x + (i % 2 === 0 ? 50 : -50);
          const homeY = f.y - 16;
          if (age < 0) {
            const alert = nearbyDisturbance(s, f, time);
            const lookDir = alert ? Math.sign(alert.x - homeX) || -1 : (i % 2 === 0 ? -1 : 1);
            const breathe = reduced ? 0 : time * 1.9 + i * 1.3;
            rows.push({
              y: homeY,
              draw: () => drawPerson(ctx, homeX, homeY, "seller", lookDir, 0, alert ? alert.amount * .85 : 0, i, alert ? "startled" : "idle", breathe),
            });
          } else {
            const t = clamp((age - .22) / 3.2, 0, 1);
            const sx = lerp(homeX, exit.x, t);
            const sy = lerp(homeY, exit.y, t);
            const facing = t > 0 ? (Math.sign(exit.x - homeX) || (i % 2 === 0 ? 1 : -1)) : (i % 2 === 0 ? -1 : 1);
            const alpha = 1 - clamp((t - .78) / .22, 0, 1);
            rows.push({
              y: sy,
              draw: () => {
                ctx.save(); ctx.globalAlpha = alpha;
                drawPerson(ctx, sx, sy, "seller", facing, t > 0 ? t * 34 : 0, age < .38 ? .85 : 0, i, age < .38 ? "startled" : "shove");
                ctx.restore();
              },
            });
          }
        }
      }
    }

    for (const [i, b] of BUYER_SPOTS.entries()) {
      const linked = s.fixtures[b.fixtureIndex];
      const age = linked.at === null ? -1 : Math.max(0, renderTime - linked.at);
      if (age > 3.2) continue;
      const t = age < 0 ? 0 : clamp((age - .18) / 2.9, 0, 1);
      const bx = lerp(b.x, b.exitX, t);
      const by = lerp(b.y, 158, t);
      const facing = t > 0 ? (Math.sign(b.exitX - b.x) || 1) : (i % 2 ? 1 : -1);
      const alpha = age < 0 ? 1 : clamp((1 - t) / .24, 0, 1);
      const breathe = reduced ? 0 : time * 1.7 + i * 2.1;
      rows.push({
        y: by,
        draw: () => {
          ctx.save(); ctx.globalAlpha = alpha;
          drawPerson(ctx, bx, by, "buyer", facing, t > 0 ? t * 24 : 0, 0, i + 2, "idle", breathe);
          ctx.restore();
        },
      });
    }

    const elapsed = gate.at === null ? -1 : Math.max(0, renderTime - gate.at);
    if (gate.at === null) {
      const cPose = carrierOpenPose(gate, renderTime);
      rows.push({
        y: cPose.y,
        draw: () => {
          ctx.save(); ctx.globalAlpha = cPose.alpha;
          drawPerson(ctx, cPose.x, cPose.y, "carrier", cPose.facing, renderTime * 6.4, 0, 2, "idle");
          ctx.restore();
        },
      });
    } else if (elapsed < 3.2) {
      const atHalt = carrierOpenPose(gate, gate.at);
      if (elapsed < .42) {
        const recoil = Math.sin(Math.PI * (elapsed / .42));
        rows.push({
          y: atHalt.y,
          draw: () => {
            ctx.save(); ctx.globalAlpha = atHalt.alpha;
            drawPerson(ctx, atHalt.x, atHalt.y, "carrier", -1, 0, recoil * .95, 2, "startled");
            ctx.restore();
          },
        });
      } else {
        const u = clamp((elapsed - .42) / 2.6, 0, 1);
        let cx: number, cy: number;
        if (u < .45) {
          const leg = u / .45;
          cx = lerp(atHalt.x, gate.x, leg);
          cy = lerp(atHalt.y, 240, leg);
        } else {
          const leg = (u - .45) / .55;
          cx = gate.x;
          cy = lerp(240, 170, leg);
        }
        const alpha = clamp((1 - u) / .24, 0, 1) * atHalt.alpha;
        rows.push({
          y: cy,
          draw: () => {
            ctx.save(); ctx.globalAlpha = alpha;
            drawPerson(ctx, cx, cy, "carrier", 1, u * 24, 0, 2, "idle");
            ctx.restore();
          },
        });
      }
    }

    // Act II & III cast: lame visitor, blind visitor, praising children, quiet listeners, and watching scribes
    if (completedAt !== null) {
      const clearAge = Math.max(0, time - completedAt);
      const lameEnc = s.encounters.find(e => e.kind === "lame")!;
      const blindEnc = s.encounters.find(e => e.kind === "blind")!;
      const scribesEnc = s.encounters.find(e => e.kind === "scribes")!;
      const anyHealed = lameEnc.at !== null || blindEnc.at !== null;
      const teachPulse = (s.actionKind === "teach" || s.actionKind === "answer") && time - s.shoveAt >= 0 && time - s.shoveAt < .85
        ? Math.sin(Math.PI * clamp((time - s.shoveAt) / .85, 0, 1)) : 0;

      // Lame visitor entering from west edge (-26, 368) -> (162, 368)
      if (reduced || clearAge >= .25) {
        const t = reduced ? 1 : clamp((clearAge - .25) / 2.05, 0, 1);
        const eased = 1 - Math.pow(1 - t, 2);
        const lx = lerp(-26, lameEnc.x, eased);
        const ly = lameEnc.y;
        const arriving = t < .99 && lameEnc.at === null;
        const healed = lameEnc.at !== null;
        const healAge = healed ? Math.max(0, time - lameEnc.at!) : -1;
        const praise = healed ? (healAge < 3.0 ? clamp(1 - (healAge - 1.6) / 1.4, .45, 1) : .3) : 0;
        const facing = arriving ? 1 : (Math.sign(jesusX - lx) || 1);
        const alpha = reduced ? 1 : clamp(t * 3.5, 0, 1);
        const breathe = reduced ? 0 : time * 1.6;
        rows.push({
          y: ly,
          draw: () => {
            ctx.save(); ctx.globalAlpha = alpha;
            if (healed && healAge < 1.35) {
              drawHealGlow(ctx, lx, ly - 32, reduced ? .35 : Math.sin(Math.PI * clamp(healAge / 1.35, 0, 1)));
            }
            drawPerson(ctx, lx, ly, "lame", facing, arriving ? eased * 18 : 0, healed ? praise : 0, 0, healed ? "praise" : "lame", breathe);
            ctx.restore();
          },
        });
      }

      // Blind visitor entering from rear arch bay 4 (513, 158) -> (462, 232)
      if (reduced || clearAge >= .45) {
        const t = reduced ? 1 : clamp((clearAge - .45) / 1.65, 0, 1);
        const eased = 1 - Math.pow(1 - t, 2);
        const bx = lerp(513, blindEnc.x, eased);
        const by = lerp(158, blindEnc.y, eased);
        const arriving = t < .99 && blindEnc.at === null;
        const healed = blindEnc.at !== null;
        const healAge = healed ? Math.max(0, time - blindEnc.at!) : -1;
        const praise = healed ? (healAge < 3.0 ? clamp(1 - (healAge - 1.6) / 1.4, .45, 1) : .28) : 0;
        const facing = arriving ? -1 : (Math.sign(jesusX - bx) || 1);
        const alpha = reduced ? 1 : clamp(t * 3.5, 0, 1);
        const breathe = reduced ? 0 : time * 1.5 + 1.2;
        rows.push({
          y: by,
          draw: () => {
            ctx.save(); ctx.globalAlpha = alpha;
            if (healed && healAge < 1.35) {
              drawHealGlow(ctx, bx, by - 46, reduced ? .35 : Math.sin(Math.PI * clamp(healAge / 1.35, 0, 1)));
            }
            drawPerson(ctx, bx, by, "blind", facing, arriving ? eased * 14 : 0, healed ? praise : 0, 1, healed ? "praise" : "blind", breathe);
            ctx.restore();
          },
        });
      }

      // Two praising children holding olive/palm sprigs (Matthew 21:15)
      for (const ch of CHILDREN) {
        if (!reduced && clearAge < ch.delay) continue;
        const t = reduced ? 1 : clamp((clearAge - ch.delay) / 1.65, 0, 1);
        const eased = 1 - Math.pow(1 - t, 2.1);
        const cx = lerp(ch.start.x, ch.rest.x, eased);
        const cy = lerp(ch.start.y, ch.rest.y, eased);
        const arriving = t < .99;
        const facing = arriving ? (Math.sign(ch.rest.x - ch.start.x) || 1) : (Math.sign(jesusX - cx) || -1);
        const alpha = reduced ? 1 : clamp(t * 3.5, 0, 1);
        const breathe = reduced ? 0 : time * 2.5 + ch.variant * 2.1;
        const joy = arriving ? 0 : (anyHealed ? .85 : .48);
        rows.push({
          y: cy,
          draw: () => {
            ctx.save(); ctx.globalAlpha = alpha;
            drawPerson(ctx, cx, cy, "child", facing, arriving ? eased * 24 : 0, joy, ch.variant, arriving ? "idle" : "praise", breathe);
            ctx.restore();
          },
        });
      }

      // Quiet adult listeners
      for (const l of LISTENERS) {
        if (!reduced && clearAge < l.delay) continue;
        const t = reduced ? 1 : clamp((clearAge - l.delay) / 2.1, 0, 1);
        const eased = 1 - Math.pow(1 - t, 2.2);
        const lx = lerp(l.start.x, l.rest.x, eased);
        const ly = lerp(l.start.y, l.rest.y, eased);
        const arriving = t < .99;
        const facing = arriving ? (Math.sign(l.rest.x - l.start.x) || 1) : (Math.sign(jesusX - lx) || 1);
        const alpha = reduced ? 1 : clamp(t * 3.5, 0, 1);
        const breathe = reduced ? 0 : time * 1.5 + l.variant * 1.7;
        rows.push({
          y: ly,
          draw: () => {
            ctx.save(); ctx.globalAlpha = alpha;
            drawPerson(ctx, lx, ly, "listener", facing, arriving ? eased * 22 : 0, arriving ? 0 : teachPulse * .7, l.variant, arriving ? "idle" : "listen", breathe);
            ctx.restore();
          },
        });
      }

      // Chief priests & scribes watching from the colonnade (pulling back slightly into shadow after answered)
      for (const sc of SCRIBES) {
        if (!reduced && clearAge < sc.delay) continue;
        const t = reduced ? 1 : clamp((clearAge - sc.delay) / 1.7, 0, 1);
        const eased = 1 - Math.pow(1 - t, 2);
        let sx = lerp(sc.start.x, sc.front.x, eased);
        let sy = lerp(sc.start.y, sc.front.y, eased);
        let stepStride = t < .99 ? eased * 14 : 0;
        if (scribesEnc.at !== null) {
          const backT = reduced ? 1 : clamp((time - scribesEnc.at) / 1.1, 0, 1);
          const bEased = 1 - Math.pow(1 - backT, 2);
          sx = lerp(sc.front.x, sc.back.x, bEased);
          sy = lerp(sc.front.y, sc.back.y, bEased);
          stepStride = backT < .99 ? bEased * 8 : 0;
        }
        const facing = Math.sign(jesusX - sx) || -1;
        const alpha = reduced ? .94 : clamp(t * 3, 0, .94);
        const breathe = reduced ? 0 : time * 1.3 + sc.variant * 2.2;
        rows.push({
          y: sy,
          draw: () => {
            ctx.save(); ctx.globalAlpha = alpha;
            drawPerson(ctx, sx, sy, "scribe", facing, stepStride, 0, sc.variant, "listen", breathe);
            ctx.restore();
          },
        });
      }
    }

    // Jesus (with shove, halt, teach, heal, or quiet dusk departure)
    if (jesusAlpha > .01) {
      rows.push({
        y: jesusY,
        draw: () => {
          const age = renderTime - s.shoveAt;
          const dur = s.actionKind === "heal" ? 1.05 : (s.actionKind === "teach" || s.actionKind === "answer") ? .85 : s.actionKind === "halt" ? .62 : .42;
          const active = s.departedAt === null && age >= 0 && age < dur
            ? Math.sin(Math.PI * clamp(age / dur, 0, 1)) ** .65 : 0;
          const pose: PersonPose = active > 0
            ? (s.actionKind === "halt" ? "halt"
              : s.actionKind === "heal" ? "heal"
                : (s.actionKind === "teach" || s.actionKind === "answer") ? "teach"
                  : "shove")
            : "idle";
          const lunge = pose === "shove" ? jesusFacing * active * 5 : 0;
          const breathe = reduced ? 0 : time * 1.8;
          ctx.save();
          ctx.globalAlpha = jesusAlpha;
          if (jesusScale !== 1) {
            ctx.translate(jesusX, jesusY);
            ctx.scale(jesusScale, jesusScale);
            ctx.translate(-jesusX, -jesusY);
          }
          drawPerson(ctx, jesusX + lunge, jesusY, "jesus", jesusFacing, jesusStride, active, 0, pose, breathe);
          ctx.restore();
        },
      });
    }

    rows.sort((a, b) => a.y - b.y);
    for (const row of rows) row.draw();

    // Pass 3: Soaring doves, impact rays, and limestone dust puffs above ground actors
    for (const f of s.fixtures) {
      drawAerialSpill(ctx, f, renderTime, reduced);
    }

    if (s.seq === 0 && !s.walking) {
      ctx.save(); ctx.translate(s.player.x, s.player.y + 11);
      ctx.fillStyle = "#463b31"; ctx.fillRect(-20, 0, 40, 13);
      ctx.font = "bold 9px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff2ce";
      ctx.fillText("JESUS", 0, 9.5); ctx.restore();
    }

    // In-world target marker & offscreen edge arrow for Act I fixtures AND Act II/III encounters
    if (s.departedAt === null) {
      const actII = complete ? activeEncounters(s) : [];
      const selectedFix = s.fixtures.find(f => f.id === s.selected && f.at === null);
      const selectedEnc = actII.find(e => e.id === s.selected);
      const targetFix = selectedFix ?? nearFix;
      const targetEnc = selectedEnc ?? nearEnc;

      if (targetFix) {
        marker(ctx, targetFix.x, targetFix.y - (targetFix.kind === "gate" ? 84 : targetFix.kind === "seat" ? 58 : 66), time, reduced);
      } else if (targetEnc) {
        const yOff = targetEnc.kind === "depart" ? 88 : 68;
        marker(ctx, targetEnc.x, targetEnc.y - yOff, time, reduced);
      } else if (eveningReady(s)) {
        // Gentle marker at the east archway when evening settles
        marker(ctx, 1185, 136, time, reduced);
      }

      const remaining: Point[] = complete ? actII : s.fixtures.filter(f => f.at === null);
      const next = remaining.sort((a, b) => Math.hypot(a.x - s.player.x, a.y - s.player.y) - Math.hypot(b.x - s.player.x, b.y - s.player.y))[0];
      if (!targetFix && !targetEnc && next && (next.x > left + span - 20 || next.x < left + 20)) {
        const right = next.x > left + span / 2;
        const x = right ? left + span - 21 : left + 21, y = top + height / scale * .59;
        ctx.save(); ctx.translate(x, y); ctx.scale(right ? 1 : -1, 1);
        polygon(ctx, "#514237", -5, -8, 6, 0, -5, 8); polygon(ctx, "#fff1a8", -4, -5, 3, 0, -4, 5); ctx.restore();
      }
    }

    // Subtle ground glow on eastern archway threshold when evening is ready
    if (eveningReady(s)) {
      oval(ctx, "rgba(255, 224, 152, .22)", 1185, 222, 34, 9);
    }
  }

  size();
  return { size, draw, toWorld, hit };
}
