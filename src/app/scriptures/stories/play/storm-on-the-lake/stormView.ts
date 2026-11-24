import {
  drawDragCompass,
  drawEdgeArrow,
  drawGuideMarker,
  drawHoverRing,
  fitVerticalCamera,
  oval,
  type DragVisualState,
} from '../_shared/storyInk';
import { drawBoatBack, drawBoatFront, drawDisciple, drawJesusInBoat } from './stormBoat';
import {
  ROGUE_WAVE_DELAY,
  STORM_HEIGHT,
  STORM_WIDTH,
  activeTasks,
  launchDoneCount,
  nearbyTask,
  stormPhase,
  type Point,
  type StormState,
} from './stormGame';
import {
  CALM_ORIGIN_X,
  drawBoatWake,
  drawCompanionBoats,
  drawGalileeHills,
  drawLakeSky,
  drawMoonReflection,
  drawRainAndWind,
  drawWaveLayer,
  seaWaveOffset,
} from './stormScenery';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const BOAT_PIVOT = { x: 625, y: 320 } as const;

export type BoatMotion = { heave: number; pitch: number };

const STILLNESS_SWEEP_SECONDS = 1.25;
const STILLNESS_MAX_RADIUS = 1400;

/** Computes the active west-to-east stillness wavefront radius (null when not actively sweeping). */
export function calmWavefrontRadius(s: StormState, reduced: boolean, time = s.time): number | null {
  if (s.calmedAt === null || reduced) return null;
  const age = time - s.calmedAt;
  if (age < 0 || age >= STILLNESS_SWEEP_SECONDS) return null;
  const u = clamp(age / STILLNESS_SWEEP_SECONDS, 0, 1);
  const eased = 1 - Math.pow(1 - u, 2.0);
  return eased * STILLNESS_MAX_RADIUS;
}

function rogueWaveProgress(s: StormState, time: number, reduced: boolean): number | null {
  if (reduced || s.calmedAt !== null) return null;
  if (s.pendingWave) {
    const startAt = s.pendingWave.at - ROGUE_WAVE_DELAY;
    const p = (time - startAt) / ROGUE_WAVE_DELAY;
    if (p >= 0 && p <= 1.05) return p;
  }
  const hitAge = time - s.lastWaveHitAt;
  if (hitAge >= 0 && hitAge <= 0.25) {
    return 1 + hitAge;
  }
  return null;
}

/**
 * Unified wave-driven boat buoyancy heave and pitch sampled at stern (420) and bow (850).
 * Strictly identity `{ heave: 0, pitch: 0 }` under `prefers-reduced-motion: reduce`.
 */
export function boatMotion(s: StormState, reduced: boolean, time = s.time): BoatMotion {
  if (reduced) return { heave: 0, pitch: 0 };
  const storm = visualStormLevel(s, false, time);
  const calm = visualCalmLevel(s, false, time);
  const frontR = calmWavefrontRadius(s, false, time);
  const rogue = rogueWaveProgress(s, time, false);
  const speed = 2.2 + storm * 2.8;

  const yStern = seaWaveOffset(420, time, storm, calm, s.calmFromIntensity, frontR, 0.013, speed, 2.1, 3.6, 15.5, 1.2, false, rogue);
  const yBow = seaWaveOffset(850, time, storm, calm, s.calmFromIntensity, frontR, 0.013, speed, 2.1, 3.6, 15.5, 1.2, false, rogue);

  // Brief downward hull punch immediately when a rogue swell crashes over the prow
  const hitAge = time - s.lastWaveHitAt;
  const slamDip = hitAge >= 0 && hitAge < 0.35 ? Math.sin(Math.PI * (hitAge / 0.35)) * 7.5 : 0;

  return {
    heave: (yStern + yBow) * 0.5 + slamDip,
    pitch: clamp(Math.atan2(yBow - yStern, 430) * 1.15, -0.17, 0.17),
  };
}

/** Transforms a deck-local point to static world coordinates under the current boat motion. */
export function deckToWorld(p: Point, motion: BoatMotion): Point {
  const dx = p.x - BOAT_PIVOT.x;
  const dy = p.y - BOAT_PIVOT.y;
  const c = Math.cos(motion.pitch);
  const sn = Math.sin(motion.pitch);
  return {
    x: BOAT_PIVOT.x + dx * c - dy * sn,
    y: BOAT_PIVOT.y + motion.heave + dx * sn + dy * c,
  };
}

/** Inverse transform: maps a static world tap coordinate into boat-local deck space for pixel-accurate hits. */
export function worldToDeck(p: Point, motion: BoatMotion): Point {
  const dx = p.x - BOAT_PIVOT.x;
  const dy = p.y - (BOAT_PIVOT.y + motion.heave);
  const c = Math.cos(-motion.pitch);
  const sn = Math.sin(-motion.pitch);
  return {
    x: BOAT_PIVOT.x + dx * c - dy * sn,
    y: BOAT_PIVOT.y + dx * sn + dy * c,
  };
}

export function visualStormLevel(s: StormState, reduced: boolean, time = s.time): number {
  if (s.calmedAt !== null) {
    if (reduced) return 0;
    const age = Math.max(0, time - s.calmedAt);
    return clamp(s.calmFromIntensity * (1 - age / STILLNESS_SWEEP_SECONDS), 0, 1);
  }
  if (s.squallAt === null) return 0;
  if (reduced) return s.stormIntensity;
  const ramp = clamp((time - s.squallAt) / 1.4, 0, 1);
  return s.stormIntensity * ramp;
}

export function visualCalmLevel(s: StormState, reduced: boolean, time = s.time): number {
  if (s.calmedAt === null) return 0;
  if (reduced) return 1;
  return clamp((time - s.calmedAt) / 1.5, 0, 1);
}

/**
 * Keeps the active boat deck plane (286..326), player, oar bench, bailing wells, and sleeping/standing Jesus
 * inside the picture even on 129 CSS px short Safari landscape viewports.
 */
export function verticalCameraTop(visibleHeight: number, feetY: number): number {
  return fitVerticalCamera(STORM_HEIGHT, 412, 128, 0.77, visibleHeight, feetY);
}

function drawBailSplash(c: CanvasRenderingContext2D, x: number, y: number, age: number, reduced: boolean) {
  if (reduced || age < 0 || age > 0.66) return;
  const u = age / 0.66;
  c.save();
  for (const [dx, peak, r] of [[-12, 28, 3.6], [2, 38, 4.4], [15, 32, 3.5], [28, 22, 2.8], [38, 14, 2.2]] as const) {
    const px = x + dx * u * 1.45;
    const py = y - 22 - Math.sin(Math.PI * u) * peak + u * 22;
    oval(c, `rgba(232, 246, 250, ${(0.88 * (1 - u)).toFixed(3)})`, px, py, r, r * 0.72);
  }
  c.restore();
}

/** Towering white-foam sea spray curtain exploding over the prow when a rogue swell crashes into the hull! */
function drawBowWaveSpray(c: CanvasRenderingContext2D, age: number, reduced: boolean) {
  if (reduced || age < 0 || age > 0.85) return;
  const u = age / 0.85;
  c.save();
  for (const [dx, peak, r] of [[-14, 58, 7.5], [-42, 72, 9.2], [-74, 54, 7.0], [-108, 38, 5.5], [8, 42, 5.2], [-26, 46, 6.2]] as const) {
    const px = 878 + dx * u * 1.35;
    const py = 294 - Math.sin(Math.PI * clamp(u * 1.15, 0, 1)) * peak + u * 28;
    const alpha = 0.82 * Math.pow(1 - u, 1.1);
    oval(c, `rgba(236, 248, 252, ${alpha.toFixed(3)})`, px, py, r * (1 + u * 0.5), r * 0.75);
  }
  c.restore();
}

/** Expanding luminous golden-silver stillness shockwave sweeping west-to-east from Jesus's outstretched hand. */
function drawStillnessWave(c: CanvasRenderingContext2D, origin: Point, age: number, reduced: boolean) {
  if (age < 0 || age > 1.75) return;
  if (reduced) {
    c.save();
    const g = c.createRadialGradient(origin.x, origin.y - 36, 4, origin.x, origin.y - 36, 48);
    g.addColorStop(0, 'rgba(255, 248, 220, .42)');
    g.addColorStop(1, 'rgba(255, 248, 220, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(origin.x, origin.y - 36, 48, 0, Math.PI * 2);
    c.fill();
    c.restore();
    return;
  }
  const u = clamp(age / STILLNESS_SWEEP_SECONDS, 0, 1);
  const eased = 1 - Math.pow(1 - u, 2.0);
  const radius = eased * STILLNESS_MAX_RADIUS;
  c.save();
  // Primary luminous gold-silver wavefront ellipse
  c.strokeStyle = `rgba(255, 248, 218, ${(0.82 * (1 - u)).toFixed(3)})`;
  c.lineWidth = 3.2 - u * 2.0;
  c.beginPath();
  c.ellipse(CALM_ORIGIN_X + 12, origin.y - 26, Math.max(12, radius), Math.max(8, radius * 0.28), 0, 0, Math.PI * 2);
  c.stroke();

  // Inner trailing shimmer ring
  if (radius > 90) {
    c.strokeStyle = `rgba(218, 238, 248, ${(0.45 * (1 - u)).toFixed(3)})`;
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(CALM_ORIGIN_X + 12, origin.y - 26, radius - 70, (radius - 70) * 0.26, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

export function createStormView(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width = 1;
  let height = 1;
  let scale = 1;
  let left = 0;
  let top = 0;
  let pixelRatio = 1;
  let centered = false;
  let lastMotion: BoatMotion = { heave: 0, pitch: 0 };
  let hoveredId: string | undefined;

  function size() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    scale = Math.min(width / 320, Math.max(height / (STORM_HEIGHT * 0.82), width / 1040));
    centered = false;
  }

  /** Projects client coordinates into boat-local deck space (applying inverse heave + pitch). */
  function toWorld(clientX: number, clientY: number): Point {
    const box = canvas.getBoundingClientRect();
    const worldPt = {
      x: (clientX - box.left) / scale + left,
      y: (clientY - box.top) / scale + top,
    };
    return worldToDeck(worldPt, lastMotion);
  }

  function hit(s: StormState, deckPt: Point): string | undefined {
    const phase = stormPhase(s);
    if (phase === 'launch' || phase === 'squall') {
      const hitTask = activeTasks(s).find(t => Math.abs(t.x - deckPt.x) < 46 && Math.abs(t.y - deckPt.y) < 40);
      return hitTask?.id;
    }
    if (phase === 'wake') {
      if (deckPt.x >= 375 && deckPt.x <= 495 && deckPt.y >= 245 && deckPt.y <= 345) return 'stern';
      return undefined;
    }
    if (phase === 'rebuke') {
      if (deckPt.x >= 375 && deckPt.x <= 515 && deckPt.y >= 225 && deckPt.y <= 345) return 'still';
      return undefined;
    }
    return undefined;
  }

  function setHovered(id: string | undefined) {
    hoveredId = id;
  }

  function draw(s: StormState, dt: number, reduced: boolean, drag?: DragVisualState) {
    const rawTime = s.time;
    const phase = stormPhase(s);

    // Visual-only hit-stops (strictly never mutating simulation dt):
    // 1. 45 ms rogue wave bow-slam freeze-frame
    // 2. 65 ms miraculous Speak-to-the-Sea freeze-frame on Jesus's outstretched hand
    const rawWaveAge = rawTime - s.lastWaveHitAt;
    const rawCalmAge = s.calmedAt === null ? -1 : rawTime - s.calmedAt;
    let time = rawTime;
    if (!reduced) {
      if (rawCalmAge >= 0 && rawCalmAge < 0.065 && s.calmedAt !== null) {
        time = s.calmedAt + 0.004;
      } else if (rawWaveAge >= 0 && rawWaveAge < 0.045) {
        time = s.lastWaveHitAt + 0.004;
      }
    }

    const storm = visualStormLevel(s, reduced, time);
    const calm = visualCalmLevel(s, reduced, time);
    const frontR = calmWavefrontRadius(s, reduced, time);
    const rogue = rogueWaveProgress(s, time, reduced);
    const motion = boatMotion(s, reduced, time);
    lastMotion = motion;

    // Damped rogue-wave camera impact shake (visual-only, skipped under reduced motion)
    let shakeX = 0;
    let shakeY = 0;
    if (!reduced && rawWaveAge >= 0.035 && rawWaveAge < 0.42) {
      const a = rawWaveAge - 0.035;
      const amp = 4.6 * Math.exp(-a * 10);
      shakeY = Math.sin(a * 58) * amp;
      shakeX = -Math.cos(a * 42) * amp * 0.55;
    }

    const span = width / scale;
    const focusX = phase === 'rebuke'
      ? lerp(s.player.x, 560, 0.5)
      : lerp(s.player.x, 635, 0.35);
    top = verticalCameraTop(height / scale, s.player.y);
    const to = span >= STORM_WIDTH ? (STORM_WIDTH - span) / 2 : clamp(focusX - span * 0.48, 0, STORM_WIDTH - span);
    left = centered ? left + (to - left) * (1 - Math.exp(-dt * 9)) : to;
    centered = true;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = calm > 0.5 ? '#1c2c42' : storm > 0.4 ? '#222e38' : '#3a4a58';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-left + shakeX, -top + shakeY);

    // 1. Sky, moon/stars, storm clouds, and distant Galilean hills
    const lakeProgress = clamp(launchDoneCount(s) * 0.5 + (s.squallAt !== null ? 0.5 : 0), 0, 1);
    drawLakeSky(ctx, storm, calm, time, reduced);
    drawGalileeHills(ctx, storm, calm, lakeProgress);

    // 2. Far wave band + distant companion fishing boats (Mark 4:36)
    drawWaveLayer(
      ctx, 266, 2.5, 9, 0.9, 0.015, 1.8 + storm * 2.2, 0.4,
      calm > 0.5 ? '#263e56' : storm > 0.4 ? '#2b3e4b' : '#4a6070',
      calm > 0.5 ? 'rgba(218, 232, 242, .35)' : storm > 0.4 ? 'rgba(224, 238, 242, .65)' : 'rgba(240, 212, 168, .48)',
      storm, calm, s.calmFromIntensity, frontR, time, reduced,
    );
    drawCompanionBoats(ctx, storm, calm, s.calmFromIntensity, frontR, time, reduced);

    // 3. Mid-sea wave band behind the boat (carrying the visible rogue wave crest!)
    drawWaveLayer(
      ctx, 304, 4.0, 16, 1.3, 0.013, 2.2 + storm * 2.8, 2.1,
      calm > 0.5 ? '#20374d' : storm > 0.4 ? '#243743' : '#3c5566',
      calm > 0.5 ? 'rgba(220, 234, 244, .32)' : storm > 0.4 ? 'rgba(232, 244, 248, .78)' : 'rgba(235, 206, 162, .42)',
      storm, calm, s.calmFromIntensity, frontR, time, reduced, rogue,
    );

    // Boat stern wake while sailing away from shore at dusk
    const wakeStrength = s.sailState === 'set' && storm < 0.35 && calm < 0.2 ? 0.9 : 0;
    drawBoatWake(ctx, wakeStrength, time, reduced);

    // 4. First-century Galilee fishing boat & crew (transformed by live wave buoyancy heave & pitch!)
    ctx.save();
    ctx.translate(BOAT_PIVOT.x, BOAT_PIVOT.y + motion.heave);
    ctx.rotate(motion.pitch);
    ctx.translate(-BOAT_PIVOT.x, -BOAT_PIVOT.y);

    const shownWater = s.calmedAt !== null ? s.waterLevel * (1 - calm) : s.waterLevel;
    const sailLift = s.sailState !== 'set'
      ? 0
      : reduced || s.sailSetAt === null
        ? 1
        : clamp((time - s.sailSetAt) / 0.65, 0, 1);

    drawBoatBack(ctx, s.sailState, sailLift, shownWater, storm, motion.pitch, time, reduced);

    // Hover highlight ring on hovered interactive station or stern
    if (hoveredId) {
      const hoverTask = activeTasks(s).find(t => t.id === hoveredId);
      if (hoverTask) {
        drawHoverRing(ctx, hoverTask.x, hoverTask.y, 26, 10);
      } else if (hoveredId === 'stern' || hoveredId === 'still') {
        drawHoverRing(ctx, s.jesusPos.x + 6, s.jesusPos.y + 2, 28, 11);
      }
    }

    // Subtle deck walking destination ring
    if (s.destination && !s.selected) {
      const p = s.destination;
      ctx.strokeStyle = '#3d2f22';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 8.5, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Y-sorted boat occupants: Jesus (stern), 2 companion crew, and player disciple
    const rows: { y: number; draw: () => void }[] = [];
    const waveBrace = !reduced && rawWaveAge >= 0 && rawWaveAge < 0.72
      ? Math.sin(Math.PI * clamp(rawWaveAge / 0.72, 0, 1))
      : 0;
    const windLean = reduced ? 0 : -storm * 0.08;

    const jesusStanding = s.wokeAt !== null;
    const rebukeProgress = s.calmedAt !== null
      ? (reduced ? 1 : clamp((time - s.calmedAt) / 0.55, 0, 1))
      : 0;
    rows.push({
      y: s.jesusPos.y,
      draw: () => drawJesusInBoat(ctx, s.jesusPos.x, s.jesusPos.y, jesusStanding, rebukeProgress, storm, time, reduced),
    });

    // Companion fisherman 1 at bow bracing in squall & rogue swells, gazing in awe in calm
    rows.push({
      y: 294,
      draw: () => drawDisciple(
        ctx, 822, 294, phase === 'calm' || phase === 'rebuke' || phase === 'wake' ? -1 : 1, 0,
        phase === 'calm' ? 'awe' : (storm > 0.3 || waveBrace > 0) ? 'brace' : 'idle',
        waveBrace, 1, time, reduced, windLean,
      ),
    });

    // Companion fisherman 2 near forward bench watching stern & bracing against waves
    rows.push({
      y: 292,
      draw: () => drawDisciple(
        ctx, 518, 292, phase === 'calm' || phase === 'rebuke' || phase === 'wake' ? -1 : 1, 0,
        phase === 'calm' ? 'awe' : (storm > 0.3 || waveBrace > 0) ? 'brace' : 'idle',
        waveBrace, 2, time, reduced, windLean,
      ),
    });

    // Player disciple
    rows.push({
      y: s.player.y,
      draw: () => {
        const age = Math.max(0, time - s.actionAt);
        let pose: 'idle' | 'sail' | 'oars' | 'bail' | 'wake' | 'brace' | 'awe' = phase === 'calm'
          ? 'awe'
          : waveBrace > 0.25 && !s.walking
            ? 'brace'
            : 'idle';
        let progress = pose === 'brace' ? waveBrace : 0;
        if (s.actionKind === 'bail' && age < 0.52) {
          pose = 'bail';
          progress = Math.sin(Math.PI * clamp(age / 0.52, 0, 1));
        } else if ((s.actionKind === 'sail' || s.actionKind === 'reef') && age < 0.52) {
          pose = 'sail';
          progress = Math.sin(Math.PI * clamp(age / 0.52, 0, 1));
        } else if (s.actionKind === 'oars' && age < 0.65) {
          pose = 'oars';
          progress = Math.sin(Math.PI * clamp(age / 0.65, 0, 1));
        } else if (s.actionKind === 'wake' && age < 0.6) {
          pose = 'wake';
          progress = Math.sin(Math.PI * clamp(age / 0.6, 0, 1));
        }
        drawDisciple(
          ctx, s.player.x, s.player.y, s.facing, s.walking ? s.stride : 0,
          pose, progress, 0, time, reduced, windLean,
        );
      },
    });

    rows.sort((a, b) => a.y - b.y);
    for (const row of rows) row.draw();

    // Bail splash droplets arcing over gunwale
    if (s.lastBailAt >= 0) {
      drawBailSplash(ctx, s.player.x, s.player.y, time - s.lastBailAt, reduced);
    }
    // Rogue wave crashing spray sheet over the prow
    if (rawWaveAge >= 0 && rawWaveAge <= 0.85) {
      drawBowWaveSpray(ctx, rawWaveAge, reduced);
    }

    // Foreground cedar hull shell + swinging stern lantern + 2-stroke oar dipping into sea
    const oarAge = s.actionKind === 'oars' ? time - s.actionAt : -1;
    const oarPull = !reduced && oarAge >= 0 && oarAge < 0.72 ? clamp(oarAge / 0.72, 0, 1) : 0;
    drawBoatFront(ctx, oarPull, storm, motion.pitch, time, reduced);

    // Subtle opening badge on player before first action
    if (s.seq === 0 && !s.walking) {
      ctx.save();
      ctx.translate(s.player.x, s.player.y + 16);
      ctx.fillStyle = '#2d2520';
      ctx.fillRect(-16, 0, 32, 13);
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff2ce';
      ctx.fillText('YOU', 0, 9.5);
      ctx.restore();
    }

    // In-world guide marker on boat deck
    let targetWorldX: number | undefined;
    if (phase === 'launch' || phase === 'squall') {
      const sel = activeTasks(s).find(t => t.id === s.selected);
      const focused = sel ?? nearbyTask(s) ?? activeTasks(s)[0];
      if (focused) {
        drawGuideMarker(ctx, focused.x, focused.y - (focused.id === 'sail' || focused.id === 'reef' ? 68 : 42), time, reduced);
        targetWorldX = focused.x;
      }
    } else if (phase === 'wake') {
      drawGuideMarker(ctx, s.jesusPos.x + 12, s.jesusPos.y - 36, time, reduced);
      targetWorldX = s.stern.x;
    } else if (phase === 'rebuke') {
      drawGuideMarker(ctx, s.jesusPos.x + 4, s.jesusPos.y - 74, time, reduced);
      targetWorldX = s.jesusPos.x;
    }

    ctx.restore();

    // 5. Foreground cresting wave lapping across the keel (also driven by unified wave field + rogue crest)
    drawWaveLayer(
      ctx, 356, 5.0, 22, 1.6, 0.011, 2.7 + storm * 3.4, 4.0,
      calm > 0.5 ? '#182b3e' : storm > 0.4 ? '#1b2c37' : '#2f4656',
      calm > 0.5 ? 'rgba(228, 240, 248, .36)' : storm > 0.4 ? 'rgba(242, 250, 252, .88)' : 'rgba(232, 206, 168, .44)',
      storm, calm, s.calmFromIntensity, frontR, time, reduced, rogue,
    );

    // 5b. Moonlit shimmer column across open calmed eastern water (past the bow)
    drawMoonReflection(ctx, calm, time, reduced);

    // 5c. Expanding stillness wavefront sweeping across the lake surface (world space, outside boat tilt!)
    if (s.calmedAt !== null) {
      drawStillnessWave(ctx, s.jesusPos, time - s.calmedAt, reduced);
    }

    // 6. Slanted rain & gale spray evaporating spatially as stillness sweeps east
    drawRainAndWind(ctx, storm, s.calmFromIntensity, frontR, time, reduced);

    // Offscreen edge arrow if active target is outside narrow mobile viewport
    if (targetWorldX !== undefined && (targetWorldX > left + span - 20 || targetWorldX < left + 20)) {
      drawEdgeArrow(ctx, left, top, span, height / scale, targetWorldX);
    }

    ctx.restore();

    // 7. CSS-pixel screen-space virtual drag steering compass when actively dragging
    if (drag?.active) {
      drawDragCompass(ctx, drag, reduced);
    }
  }

  size();
  return { size, draw, toWorld, hit, setHovered };
}
