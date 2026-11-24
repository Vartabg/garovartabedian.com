import {
  ELAH_HEIGHT,
  ELAH_WIDTH,
  SLING_FLIGHT_SECONDS,
  elahPhase,
  isInBrook,
  nearStandoff,
  nearbyStone,
  type ElahState,
  type Point,
} from './elahGame';
import { drawEdgeArrow, drawGuideMarker, fitVerticalCamera } from '../_shared/storyInk';
import { drawDavid, drawGoliath, drawRidgeSoldier, drawSaul, drawShieldBearer } from './elahPeople';
import {
  drawArmyDust,
  drawBrookFlow,
  drawBrookFootRipple,
  drawBrookStone,
  drawCampBanner,
  drawDroppedArmor,
  drawDroppedShield,
  drawFootDust,
  drawSlingFlightAndImpact,
  drawSlingSightArc,
  drawStandoffMark,
  drawValleySunlight,
} from './elahProps';
import { drawValleyBackdrop } from './elahScenery';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 18 watching Israelite soldiers along the western hillside ridge (surge eastward on impact!)
const ISRAEL_LINE: readonly { x: number; y: number; row: number; v: number }[] = Array.from({ length: 18 }, (_, i) => {
  const row = i % 2;
  return {
    x: 46 + Math.floor(i / 2) * 44 + row * 20,
    y: 176 + row * 18 + Math.floor(i / 6) * 6,
    row,
    v: i,
  };
});

// 18 watching Philistine soldiers along the eastern hillside ridge (break and flee eastward on impact!)
const PHILISTINE_LINE: readonly { x: number; y: number; row: number; v: number }[] = Array.from({ length: 18 }, (_, i) => {
  const row = i % 2;
  return {
    x: 1018 + Math.floor(i / 2) * 44 + row * 18,
    y: 196 - Math.floor(i / 6) * 8 + row * 14,
    row,
    v: i,
  };
});

/**
 * Keeps David's feet, head, and overhead whirling sling arc (~98 px above feet) inside the picture
 * even on a 129 CSS px short Safari landscape canvas.
 */
export function verticalCameraTop(visibleHeight: number, feetY: number): number {
  return fitVerticalCamera(ELAH_HEIGHT, 436, 132, 0.80, visibleHeight, feetY);
}

export function createElahView(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width = 1;
  let height = 1;
  let scale = 1;
  let left = 0;
  let top = 0;
  let pixelRatio = 1;
  let centered = false;

  const back = document.createElement('canvas');
  back.width = ELAH_WIDTH * 2;
  back.height = ELAH_HEIGHT * 2;
  const ink = back.getContext('2d');
  if (ink) {
    ink.scale(2, 2);
    drawValleyBackdrop(ink);
  }

  function size() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    scale = Math.min(width / 310, Math.max(height / (ELAH_HEIGHT * 0.82), width / 1040));
    centered = false;
  }

  function toWorld(x: number, y: number): Point {
    const box = canvas.getBoundingClientRect();
    return { x: (x - box.left) / scale + left, y: (y - box.top) / scale + top };
  }

  function hit(s: ElahState, p: Point): string | undefined {
    const phase = elahPhase(s);
    if (phase === 'armor') {
      if (Math.abs(p.x - s.player.x) < 42 && p.y > s.player.y - 76 && p.y < s.player.y + 18) {
        return 'armor';
      }
      return undefined;
    }
    if (phase === 'brook') {
      const hitStone = s.stones
        .filter(st => st.at === null)
        .sort((a, b) => b.y - a.y)
        .find(st => Math.abs(st.x - p.x) < 28 && Math.abs(st.y - p.y) < 22);
      return hitStone?.id;
    }
    if (phase === 'approach') {
      const hitMark = Math.abs(p.x - s.standoff.x) < 46 && Math.abs(p.y - s.standoff.y) < 34;
      const hitChampion = p.x > 910 && p.x < 1120 && p.y > 195 && p.y < 345;
      if (hitMark || hitChampion) return 'meet';
      return undefined;
    }
    if (phase === 'sling') {
      const hitChampion = p.x > 910 && p.x < 1100 && p.y > 195 && p.y < 345;
      const hitDavid = Math.abs(p.x - s.player.x) < 46 && p.y > s.player.y - 105 && p.y < s.player.y + 20;
      if (hitChampion || hitDavid) return 'release';
      return undefined;
    }
    return undefined;
  }

  function draw(s: ElahState, dt: number, reduced: boolean) {
    const time = s.time;
    const phase = elahPhase(s);
    const impactAt = s.releasedAt === null ? null : s.releasedAt + (reduced ? 0 : SLING_FLIGHT_SECONDS);
    const rawImpactAge = impactAt === null ? -1 : time - impactAt;

    // Crisp 42 ms hit-stop freeze right at bronze impact (skipped under reduced motion)
    const hitStopped = !reduced && rawImpactAge >= 0 && rawImpactAge < 0.042;
    const renderTime = hitStopped && impactAt !== null ? impactAt + 0.005 : time;
    const impactAge = impactAt === null ? -1 : renderTime - impactAt;

    // Goliath & shield-bearer advance heavily westward once all 5 stones are gathered (1 Samuel 17:41 & 48)
    const advanceT = s.challengeAt !== null || reduced
      ? (s.stonesDoneAt !== null || s.challengeAt !== null ? 1 : 0)
      : s.stonesDoneAt === null
        ? 0
        : clamp((renderTime - s.stonesDoneAt) / 1.65, 0, 1);
    const advanceEase = advanceT * (2 - advanceT);
    const goliathX = lerp(1072, s.champion.x, advanceEase);
    const goliathWalking = !reduced && advanceT > 0.01 && advanceT < 0.99 && impactAge < 0;
    const goliathStride = goliathWalking ? renderTime * 5.6 : 0;

    const sbHomeX = lerp(1024, 972, advanceEase);

    // Camera frames David cleanly; during sling standoff gently widens view to show both David & Goliath
    const span = width / scale;
    const camTargetX = phase === 'sling'
      ? lerp(s.player.x, (s.player.x + s.champion.x) * 0.5, 0.55)
      : s.player.x;
    const camRatio = phase === 'sling' ? 0.5 : 0.43;
    top = verticalCameraTop(height / scale, s.player.y);
    const to = span >= ELAH_WIDTH ? (ELAH_WIDTH - span) / 2 : clamp(camTargetX - span * camRatio, 0, ELAH_WIDTH - span);
    left = centered ? left + (to - left) * (1 - Math.exp(-dt * 9.5)) : to;
    centered = true;

    // Damped bronze-fall ground impulse right after hit-stop (skipped under reduced motion)
    let shakeX = 0;
    let shakeY = 0;
    if (!reduced && rawImpactAge >= 0.03 && rawImpactAge < 0.42) {
      const a = rawImpactAge - 0.03;
      const amp = 3.2 * Math.exp(-a * 9.5);
      shakeY = Math.sin(a * 56) * amp;
      shakeX = Math.cos(a * 41) * amp * 0.4;
    }

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = '#c8af83';
    ctx.fillRect(0, 0, width, height);
    ctx.scale(scale, scale);
    ctx.translate(-left + shakeX, -top + shakeY);

    if (ink) ctx.drawImage(back, 0, 0, ELAH_WIDTH, ELAH_HEIGHT);
    else drawValleyBackdrop(ctx);

    // Live animated flowing brook glints
    drawBrookFlow(ctx, renderTime, reduced);

    // Warm golden clearing sunlight shafts breaking over the valley after impact
    if (impactAge >= 0) {
      const sunStrength = reduced ? 1 : clamp(impactAge / 1.9, 0, 1);
      drawValleySunlight(ctx, sunStrength);
    }

    // Rippling camp banners on Saul's pavilion and Philistine standards
    const philDroop = impactAge < 0 ? 0 : (reduced ? 0.85 : clamp(impactAge / 1.4, 0, 0.85));
    drawCampBanner(ctx, 175, 117, 1, '#9a4332', '#e4c17a', renderTime, reduced, 0);
    drawCampBanner(ctx, 1191, 123, -1, '#6a2e28', '#cfa861', renderTime, reduced, philDroop);
    drawCampBanner(ctx, 1289, 113, -1, '#6a2e28', '#cfa861', renderTime, reduced, philDroop);
    drawCampBanner(ctx, 1375, 109, -1, '#6a2e28', '#cfa861', renderTime, reduced, philDroop);

    // Background watching armies along both ridges — react immediately after impact!
    const armyMotion = impactAge < 0 ? 0 : (reduced ? 1 : clamp((impactAge - 0.16) / 4.0, 0, 1));

    for (const sol of ISRAEL_LINE) {
      const moveT = armyMotion > 0 ? clamp(armyMotion * 1.15 - sol.row * 0.08, 0, 1) : 0;
      const sx = sol.x + moveT * (320 + (sol.v % 5) * 30);
      const sy = sol.y + moveT * (30 - sol.row * 8);
      const stride = !reduced && moveT > 0 && moveT < 0.98 ? renderTime * 11.5 + sol.v : 0;
      if (moveT > 0.05 && moveT < 0.92 && !reduced && sol.v % 3 === 0) {
        drawArmyDust(ctx, sx - 10, sy + 1, (1 - moveT) * 0.30, 9.5);
      }
      drawRidgeSoldier(ctx, sx, sy, 'israel', 1, stride, impactAge >= 0.08, sol.v);
    }

    for (const sol of PHILISTINE_LINE) {
      const fleeT = armyMotion > 0 ? clamp(armyMotion * 1.25 - (1 - sol.row) * 0.05, 0, 1) : 0;
      const sx = sol.x + fleeT * (440 + (sol.v % 4) * 34);
      const sy = sol.y - fleeT * 10;
      if (sx > ELAH_WIDTH + 28) continue;
      const stride = !reduced && fleeT > 0 ? renderTime * 13.5 + sol.v : 0;
      if (fleeT > 0.04 && !reduced && sol.v % 2 === 0) {
        drawArmyDust(ctx, sx - 12, sy + 1, (1 - fleeT) * 0.36, 10.5);
      }
      drawRidgeSoldier(ctx, sx, sy, 'philistine', fleeT > 0 ? 1 : -1, stride, fleeT > 0, sol.v);
    }

    // Subtle walking destination marker when tapping open valley floor
    if (s.destination && !s.selected) {
      const p = s.destination;
      ctx.strokeStyle = '#473f32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 9, 3.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f6eac5';
      ctx.fillRect(p.x - 2, p.y - 1, 4, 2);
    }

    // Standoff ground mark in 'approach' phase
    if (phase === 'approach') {
      drawStandoffMark(ctx, s.standoff.x, s.standoff.y, nearStandoff(s), renderTime, reduced);
    }

    // Pass 1: Ground layer — discarded Saul's armor, abandoned Philistine shield, brook stones, foot ripples/dust
    for (const item of s.droppedArmor) {
      drawDroppedArmor(ctx, item, renderTime, reduced);
    }
    if (impactAge >= 0.08) {
      drawDroppedShield(ctx, 1066, 332, impactAge, reduced);
    }
    const nearSt = nearbyStone(s);
    const canPick = s.armorLeft.length === 0;
    for (const st of s.stones) {
      drawBrookStone(ctx, st, renderTime, nearSt?.id === st.id, canPick, reduced);
    }
    if (isInBrook(s.player)) {
      drawBrookFootRipple(ctx, s.player.x, s.player.y, renderTime, s.walking, reduced);
    } else if (s.walking) {
      drawFootDust(ctx, s.player.x, s.player.y, s.facing, s.stride, s.armorLeft.length > 0, reduced);
    }
    if (goliathWalking) {
      drawFootDust(ctx, goliathX + 10, s.champion.y + 1, -1, goliathStride, true, reduced);
    }

    // Pass 2: Y-sorted actors (King Saul, David, Goliath, Shield-bearer)
    const rows: { y: number; draw: () => void }[] = [];

    rows.push({
      y: 252,
      draw: () => drawSaul(ctx, 98, 252, impactAge >= 0.18, renderTime, reduced),
    });

    rows.push({
      y: s.champion.y,
      draw: () => drawGoliath(
        ctx,
        goliathX,
        s.champion.y,
        phase === 'sling',
        impactAge,
        renderTime,
        reduced,
        goliathStride,
      ),
    });

    const sbFlee = impactAge < 0 ? 0 : (reduced ? 1 : clamp((impactAge - 0.14) / 2.5, 0, 1));
    if (sbFlee < 1) {
      const sbX = lerp(sbHomeX, ELAH_WIDTH + 30, sbFlee);
      const sbY = lerp(322, 286, sbFlee);
      const sbAlpha = clamp((1 - sbFlee) / 0.22, 0, 1);
      const sbStride = sbFlee > 0 ? sbFlee * 32 : (goliathWalking ? renderTime * 6.8 : 0);
      rows.push({
        y: sbY,
        draw: () => drawShieldBearer(
          ctx,
          sbX,
          sbY,
          sbFlee > 0 ? 1 : -1,
          sbStride,
          impactAge < 0.08,
          sbAlpha,
        ),
      });
    }

    rows.push({
      y: s.player.y,
      draw: () => {
        const age = Math.max(0, renderTime - s.actionAt);
        let pose: 'idle' | 'drop' | 'pick' | 'sling' | 'release' | 'read' = 'idle';
        let progress = 0;
        if (phase === 'sling') {
          pose = 'sling';
          progress = 1;
        } else if (s.actionKind === 'release' && age < 0.45) {
          pose = 'release';
          progress = reduced ? 1 : clamp(age / 0.45, 0, 1);
        } else if (s.actionKind === 'pick' && age < 0.38) {
          pose = 'pick';
          progress = Math.sin(Math.PI * clamp(age / 0.38, 0, 1));
        } else if (
          (s.actionKind === 'drop-sword' || s.actionKind === 'drop-coat' || s.actionKind === 'drop-helmet') &&
          age < 0.36
        ) {
          pose = 'drop';
          progress = Math.sin(Math.PI * clamp(age / 0.36, 0, 1));
        } else if (s.actionKind === 'read' && age < 0.7) {
          pose = 'read';
          progress = Math.sin(Math.PI * clamp(age / 0.7, 0, 1));
        }
        drawDavid(
          ctx,
          s.player.x,
          s.player.y,
          s.facing,
          s.walking ? s.stride : 0,
          s.armorLeft,
          pose,
          progress,
          renderTime,
          reduced,
        );
      },
    });

    rows.sort((a, b) => a.y - b.y);
    for (const row of rows) row.draw();

    // Pass 3: Subtle sling sight-arc during untimed stance, then stone flight arc + impact rays + valley dust
    if (phase === 'sling') {
      drawSlingSightArc(ctx, s.player, { x: goliathX, y: s.champion.y }, renderTime, reduced);
    }
    if (s.releasedAt !== null) {
      drawSlingFlightAndImpact(ctx, s.player, { x: goliathX, y: s.champion.y }, s.releasedAt, renderTime, reduced);
    }

    // Subtle opening name badge on David before the first action or movement
    if (s.seq === 0 && !s.walking) {
      ctx.save();
      ctx.translate(s.player.x, s.player.y + 11);
      ctx.fillStyle = '#463b31';
      ctx.fillRect(-20, 0, 40, 13);
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff2ce';
      ctx.fillText('DAVID', 0, 9.5);
      ctx.restore();
    }

    // In-world guide marker & offscreen edge arrow
    let nextPoint: Point | undefined;
    if (phase === 'armor') {
      drawGuideMarker(ctx, s.player.x, s.player.y - 72, renderTime, reduced);
    } else if (phase === 'brook') {
      const selStone = s.stones.find(st => st.id === s.selected && st.at === null);
      const focused = selStone ?? nearSt;
      if (focused) {
        drawGuideMarker(ctx, focused.x, focused.y - 16, renderTime, reduced);
      } else {
        const remaining = s.stones
          .filter(st => st.at === null)
          .sort((a, b) => Math.hypot(a.x - s.player.x, a.y - s.player.y) - Math.hypot(b.x - s.player.x, b.y - s.player.y));
        nextPoint = remaining[0];
        if (nextPoint && nextPoint.x >= left + 20 && nextPoint.x <= left + span - 20) {
          drawGuideMarker(ctx, nextPoint.x, nextPoint.y - 16, renderTime, reduced);
        }
      }
    } else if (phase === 'approach') {
      nextPoint = s.standoff;
      if (s.standoff.x >= left + 20 && s.standoff.x <= left + span - 20) {
        drawGuideMarker(ctx, s.standoff.x, s.standoff.y - 18, renderTime, reduced);
      }
    } else if (phase === 'sling') {
      drawGuideMarker(ctx, goliathX, s.champion.y - 114, renderTime, reduced);
    }

    if (nextPoint && (nextPoint.x > left + span - 20 || nextPoint.x < left + 20)) {
      drawEdgeArrow(ctx, left, top, span, height / scale, nextPoint.x);
    }
  }

  size();
  return { size, draw, toWorld, hit };
}
