import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readHud } from '../src/app/scriptures/stories/play/storm-on-the-lake/stormController';
import {
  CALM_SPEED,
  CALM_VERSES,
  DECK_BOUNDS,
  WIND_EAST_SPEED,
  WIND_WEST_SPEED,
  act,
  approach,
  moveSpeed,
  newStorm,
  stepStorm,
  stormPhase,
  walkTo,
  type StormState,
} from '../src/app/scriptures/stories/play/storm-on-the-lake/stormGame';
import {
  boatMotion,
  calmWavefrontRadius,
  deckToWorld,
  verticalCameraTop,
  worldToDeck,
} from '../src/app/scriptures/stories/play/storm-on-the-lake/stormView';
import { localStormAt } from '../src/app/scriptures/stories/play/storm-on-the-lake/stormScenery';

function run(s: StormState, seconds: number, dx = 0, dy = 0, hz = 60) {
  for (let frame = 0; frame < Math.round(seconds * hz); frame++) {
    stepStorm(s, 1 / hz, dx, dy);
  }
}

function finishLaunch(s: StormState, order: ('sail' | 'oars')[] = ['oars', 'sail']) {
  for (const id of order) {
    approach(s, id);
    run(s, 3);
  }
  assert.equal(stormPhase(s), 'squall');
}

function finishSquall(s: StormState, order: ('reef' | 'bail-1' | 'bail-2')[] = ['bail-1', 'reef', 'bail-2']) {
  for (const id of order) {
    approach(s, id);
    run(s, 4);
  }
  assert.equal(stormPhase(s), 'wake');
}

test('evening launch tasks complete in any order and trigger the rising squall with asymmetric headwind speed', () => {
  const s = newStorm();
  assert.equal(stormPhase(s), 'launch');
  assert.equal(moveSpeed(s, 1), CALM_SPEED);
  assert.equal(moveSpeed(s, -1), CALM_SPEED);

  // Premature stern wake attempt is ignored before squall tasks complete.
  approach(s, 'stern');
  assert.equal(s.selected, null);

  finishLaunch(s, ['oars', 'sail']);
  assert.equal(s.sailState, 'set');
  assert.ok(s.squallAt !== null);
  assert.ok(s.stormIntensity > 0.5);
  assert.ok(s.waterLevel > 0.3);

  // Headwind pushes west: moving east (into wind) is slower than moving west (aft toward stern).
  assert.equal(moveSpeed(s, 1), WIND_EAST_SPEED);
  assert.equal(moveSpeed(s, -1), WIND_WEST_SPEED);
  assert.ok(WIND_EAST_SPEED < WIND_WEST_SPEED);

  // Premature stern wake during squall is still ignored until all 3 fisherman efforts are spent.
  approach(s, 'stern');
  assert.equal(s.selected, null);
  assert.equal(readHud(s).canWake, false);
});

test('squall tasks complete in any order, unlock stern wake, hold untimed rebuke, calm the lake, cycle verses, and reset on replay', () => {
  const s = newStorm();
  finishLaunch(s, ['sail', 'oars']);
  finishSquall(s, ['bail-2', 'bail-1', 'reef']);

  assert.equal(s.sailState, 'reefed');
  assert.equal(readHud(s).canWake, true);
  assert.equal(readHud(s).action, 'Wake Jesus');

  // Calling act() while away from stern walks smoothly aft and wakes Jesus.
  act(s);
  assert.equal(s.selected, 'stern');
  run(s, 4);
  assert.equal(stormPhase(s), 'rebuke');
  assert.ok(s.wokeAt !== null);
  assert.equal(readHud(s).action, 'Speak to the sea');
  assert.match(readHud(s).card?.quote ?? '', /don’t you care that we are dying/i);

  // Rebuke turning point is strictly untimed: 60s wait causes zero timeout or fail state.
  run(s, 60);
  assert.equal(stormPhase(s), 'rebuke');
  assert.equal(s.calmedAt, null);

  // Speaking to the sea calms storm & hull water immediately and opens the full deck.
  act(s);
  assert.equal(stormPhase(s), 'calm');
  assert.equal(s.stormIntensity, 0);
  assert.equal(s.waterLevel, 0);
  assert.equal(moveSpeed(s, 1), CALM_SPEED);
  assert.equal(readHud(s).action, 'Read verse');
  assert.equal(readHud(s).card?.ref, CALM_VERSES[0].ref);

  // Cycle Mark 4:39 -> 4:40 -> 4:41 -> 4:39
  act(s);
  assert.equal(readHud(s).card?.ref, CALM_VERSES[1].ref);
  act(s);
  assert.equal(readHud(s).card?.ref, CALM_VERSES[2].ref);
  assert.match(readHud(s).card?.quote ?? '', /wind and the sea obey him/i);
  act(s);
  assert.equal(readHud(s).card?.ref, CALM_VERSES[0].ref);

  // Full deck roaming after calm stays inside DECK_BOUNDS.
  walkTo(s, { x: 100, y: 100 });
  run(s, 4);
  assert.deepEqual(s.player, { x: DECK_BOUNDS.minX, y: DECK_BOUNDS.minY });
  walkTo(s, { x: 1200, y: 500 });
  run(s, 4);
  assert.deepEqual(s.player, { x: DECK_BOUNDS.maxX, y: DECK_BOUNDS.maxY });

  // Replay starts completely fresh.
  const fresh = newStorm();
  assert.equal(fresh.time, 0);
  assert.equal(stormPhase(fresh), 'launch');
  assert.equal(fresh.sailState, 'furled');
  assert.equal(fresh.wokeAt, null);
  assert.equal(fresh.calmedAt, null);
});

test('30 Hz and 120 Hz approach arrival agree within 1e-6 under asymmetric headwind and stall frames are capped', () => {
  const results = [30, 120].map(hz => {
    const s = newStorm();
    for (const id of ['sail', 'oars', 'bail-1', 'reef', 'bail-2', 'stern'] as const) {
      approach(s, id);
      run(s, 4, 0, 0, hz);
    }
    return s;
  });

  assert.equal(stormPhase(results[0]), 'rebuke');
  assert.equal(stormPhase(results[1]), 'rebuke');
  assert.ok(
    Math.hypot(
      results[0].player.x - results[1].player.x,
      results[0].player.y - results[1].player.y,
    ) < 1e-6,
  );
  assert.ok(Math.abs(Number(results[0].squallAt) - Number(results[1].squallAt)) < 1e-6);
  assert.ok(Math.abs(Number(results[0].wokeAt) - Number(results[1].wokeAt)) < 1e-6);

  // dt capping & invalid dt guard
  const stalled = newStorm();
  stepStorm(stalled, 100, 1, 0);
  assert.ok(stalled.time <= 0.05);
  assert.ok(stalled.player.x > 618 && stalled.player.x <= 630);
  const frozen = structuredClone(stalled);
  for (const dt of [Infinity, NaN, -1, 0]) stepStorm(stalled, dt, 1, -1);
  assert.deepEqual(stalled, frozen);
});

test('inverse boat pitch projection round-trips deck coordinates accurately and short landscape keeps deck and Jesus in frame', () => {
  const s = newStorm();
  finishLaunch(s);
  run(s, 1.8);
  const motion = boatMotion(s, false);
  assert.ok(Math.abs(motion.heave) > 0 || Math.abs(motion.pitch) > 0);

  for (const pt of [
    { x: 406, y: 304 },
    { x: 590, y: 298 },
    { x: 785, y: 306 },
  ]) {
    const worldPt = deckToWorld(pt, motion);
    const recovered = worldToDeck(worldPt, motion);
    assert.ok(Math.hypot(recovered.x - pt.x, recovered.y - pt.y) < 1e-9);
  }

  // Under reduced motion, transform is exact identity.
  assert.deepEqual(boatMotion(s, true), { heave: 0, pitch: 0 });

  // Short iPhone Safari landscape (~129 CSS px on 750 px wide canvas) keeps deck plane & standing Jesus in frame.
  const visibleHeight = 129 / (750 / 1040);
  for (const feetY of [286, 304, 326]) {
    const top = verticalCameraTop(visibleHeight, feetY);
    assert.ok(feetY - 72 >= top + 4, `standing figure clipped at feetY=${feetY}`);
    assert.ok(feetY + 12 <= top + visibleHeight, `feet clipped at feetY=${feetY}`);
  }
  assert.equal(verticalCameraTop(460, 308), 0);
  assert.equal(verticalCameraTop(500, 308), -20);
});

test('bailing drops hull water immediately before a rogue wave surges it higher across all 6 squall orders and early stern wake settles cleanly', () => {
  // 1. Immediate bail drop + delayed rogue swell surge
  const s = newStorm();
  finishLaunch(s, ['sail', 'oars']);
  const waterBeforeBail = s.waterLevel;
  assert.ok(waterBeforeBail >= 0.4);

  approach(s, 'bail-1');
  for (let i = 0; i < 180 && s.actionKind !== 'bail'; i++) stepStorm(s, 1 / 60, 0, 0);
  assert.equal(s.actionKind, 'bail');
  assert.ok(s.waterLevel < waterBeforeBail, 'Bailing must immediately drop hull water');
  assert.ok(s.pendingWave !== null, 'Bailing must schedule an incoming rogue wave surge');

  const hitSeqBefore = s.waveHitSeq;
  run(s, 1.0);
  assert.equal(s.waveHitSeq, hitSeqBefore + 1, 'Rogue wave must slam after 0.75 s');
  assert.equal(s.pendingWave, null);
  assert.ok(s.waterLevel >= 0.62, 'Rogue wave must surge hull water higher than before bailing');

  // 2. All 6 squall task orders end with waterLevel === 0.90 after waves settle or on early stern wake
  const orders: ('reef' | 'bail-1' | 'bail-2')[][] = [
    ['reef', 'bail-1', 'bail-2'],
    ['reef', 'bail-2', 'bail-1'],
    ['bail-1', 'reef', 'bail-2'],
    ['bail-1', 'bail-2', 'reef'],
    ['bail-2', 'reef', 'bail-1'],
    ['bail-2', 'bail-1', 'reef'],
  ];
  for (const order of orders) {
    const t = newStorm();
    finishLaunch(t, ['oars', 'sail']);
    for (const id of order) {
      approach(t, id);
      for (let i = 0; i < 240 && t.tasks.find(x => x.id === id)?.at === null; i++) {
        stepStorm(t, 1 / 60, 0, 0);
      }
    }
    assert.equal(stormPhase(t), 'wake');
    approach(t, 'stern');
    run(t, 4);
    assert.equal(stormPhase(t), 'rebuke');
    assert.equal(t.pendingWave, null, `Pending wave must settle cleanly on wakeJesus for order ${order.join('>')}`);
    assert.ok(t.waterLevel >= 0.89, `Hull water must reach 90% by rebuke for order ${order.join('>')}, got ${t.waterLevel}`);
  }

  // 3. Spatial stillness wavefront preserves calmFromIntensity and flattens west-to-east (stern before bow)
  const w = newStorm();
  finishLaunch(w);
  finishSquall(w);
  approach(w, 'stern');
  run(w, 4);
  act(w);
  assert.equal(w.stormIntensity, 0);
  assert.ok(w.calmFromIntensity >= 0.85);
  run(w, 0.25);
  const frontR = calmWavefrontRadius(w, false);
  assert.ok(frontR !== null && frontR > 150 && frontR < 900);
  const sternStorm = localStormAt(406, 0, w.calmFromIntensity, frontR);
  const farEastStorm = localStormAt(1260, 0, w.calmFromIntensity, frontR);
  assert.ok(sternStorm < 0.05, 'Stern near Jesus must flatten first');
  assert.ok(farEastStorm > 0.7, 'Far eastern water ahead of the wavefront must remain stormy until reached');
  assert.equal(calmWavefrontRadius(w, true), null);
});
