import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readHud } from '../src/app/scriptures/stories/play/valley-of-elah/elahController';
import {
  ARMOR_SPEEDS,
  CLOSING_VERSES,
  WALK_BOUNDS,
  act,
  approach,
  currentMaxX,
  currentSpeed,
  elahPhase,
  isInBrook,
  nearbyStone,
  newElah,
  stepElah,
  stonesPicked,
  walkTo,
  type ElahState,
} from '../src/app/scriptures/stories/play/valley-of-elah/elahGame';
import { verticalCameraTop } from '../src/app/scriptures/stories/play/valley-of-elah/elahView';

function run(s: ElahState, seconds: number, dx = 0, dy = 0, hz = 60) {
  for (let frame = 0; frame < Math.round(seconds * hz); frame++) {
    stepElah(s, 1 / hz, dx, dy);
  }
}

function shedAllArmor(s: ElahState) {
  act(s);
  act(s);
  act(s);
  assert.equal(s.armorLeft.length, 0);
  assert.equal(elahPhase(s), 'brook');
}

function gatherAllStones(s: ElahState, order = ['stone-1', 'stone-2', 'stone-3', 'stone-4', 'stone-5']) {
  for (const id of order) {
    approach(s, id);
    run(s, 5);
  }
  assert.equal(stonesPicked(s), 5);
  assert.equal(elahPhase(s), 'approach');
}

test('shedding Saul’s armor increases walk speed monotonically, leaves discarded pieces, and unlocks brook stones', () => {
  const s = newElah();
  assert.equal(elahPhase(s), 'armor');
  assert.deepEqual(ARMOR_SPEEDS, [256, 188, 132, 82]);
  assert.equal(currentSpeed(s), 82);

  // Brook stones are locked while any piece of Saul's armor remains worn.
  assert.equal(readHud(s).action, 'Set aside sword');
  assert.ok(readHud(s).stones.every(st => st.locked));
  approach(s, 'stone-1');
  assert.equal(s.selected, null);
  assert.equal(s.destination, null);

  // Drop sword
  act(s);
  assert.equal(s.armorLeft.length, 2);
  assert.equal(currentSpeed(s), 132);
  assert.equal(s.droppedArmor.length, 1);
  assert.equal(s.droppedArmor[0].piece, 'sword');
  assert.equal(readHud(s).action, 'Set aside coat of mail');

  // Drop coat of mail
  approach(s, 'armor');
  assert.equal(s.armorLeft.length, 1);
  assert.equal(currentSpeed(s), 188);
  assert.equal(s.droppedArmor.length, 2);
  assert.equal(s.droppedArmor[1].piece, 'coat');
  assert.equal(readHud(s).action, 'Set aside bronze helmet');

  // Drop bronze helmet
  act(s);
  assert.equal(s.armorLeft.length, 0);
  assert.equal(currentSpeed(s), 256);
  assert.equal(s.droppedArmor.length, 3);
  assert.equal(s.droppedArmor[2].piece, 'helmet');
  assert.equal(elahPhase(s), 'brook');
  assert.equal(readHud(s).armorDone, true);
  assert.equal(readHud(s).armorLabel, 'Saul’s armor set aside');
  assert.ok(readHud(s).stones.every(st => !st.locked));
});

test('progressive eastern soft bounds hold David west while armored, west of valley before 5 stones, and open full valley after release', () => {
  const s = newElah();
  assert.equal(currentMaxX(s), 495);
  run(s, 6, 1, 0);
  assert.equal(s.player.x, 495);
  assert.equal(s.message, 'I can’t go with these, for I have not tested them.');

  shedAllArmor(s);
  assert.equal(currentMaxX(s), 645);
  run(s, 2, 1, 0);
  assert.equal(s.player.x, 645);
  assert.equal(s.message, 'Choose five smooth stones from the brook first.');

  gatherAllStones(s);
  assert.equal(currentMaxX(s), 950);
  run(s, 3, 1, 0);
  assert.equal(s.player.x, 950);

  // Enter standoff and release stone to unlock the full eastern valley floor.
  walkTo(s, { x: 785, y: 312 });
  run(s, 2);
  act(s);
  assert.equal(elahPhase(s), 'sling');
  act(s);
  assert.equal(elahPhase(s), 'resolved');
  assert.equal(currentMaxX(s), WALK_BOUNDS.maxX);
  run(s, 4, 1, 0);
  assert.equal(s.player.x, WALK_BOUNDS.maxX);
});

test('all five brook stones sit inside the brook and can be gathered in any order', () => {
  const s = newElah();
  for (const st of s.stones) {
    assert.ok(isInBrook(st), `${st.id} should sit inside the brook`);
  }
  shedAllArmor(s);

  // Missed pick while away from the brook leaves stones untouched and prompts player.
  assert.equal(nearbyStone(s), undefined);
  act(s);
  assert.match(s.message, /Step closer to the brook/);
  assert.equal(stonesPicked(s), 0);

  gatherAllStones(s, ['stone-5', 'stone-1', 'stone-4', 'stone-2', 'stone-3']);
  assert.ok(s.stones.every(st => st.at !== null));
  assert.equal(readHud(s).action, 'Step into the valley');
});

test('movement and approach arrival agree at 30 and 120 Hz within 1e-6 and stall frames are capped', () => {
  const results = [30, 120].map(hz => {
    const s = newElah();
    shedAllArmor(s);
    run(s, 0.5, 1, -1, hz);
    approach(s, 'stone-3');
    run(s, 3, 0, 0, hz);
    for (const id of ['stone-1', 'stone-2', 'stone-4', 'stone-5']) {
      approach(s, id);
      run(s, 4, 0, 0, hz);
    }
    approach(s, 'meet');
    run(s, 3, 0, 0, hz);
    return s;
  });

  assert.equal(elahPhase(results[0]), 'sling');
  assert.equal(elahPhase(results[1]), 'sling');
  assert.ok(
    Math.hypot(
      results[0].player.x - results[1].player.x,
      results[0].player.y - results[1].player.y,
    ) < 1e-6,
  );
  assert.ok(Math.abs(Number(results[0].challengeAt) - Number(results[1].challengeAt)) < 1e-6);
  assert.ok(results[0].stonesDoneAt !== null && results[1].stonesDoneAt !== null);
  assert.ok(Math.abs(Number(results[0].stonesDoneAt) - Number(results[1].stonesDoneAt)) < 1e-6);
  assert.ok(
    Math.abs(
      Number(results[0].stones.find(st => st.id === 'stone-3')?.at) -
      Number(results[1].stones.find(st => st.id === 'stone-3')?.at),
    ) < 1e-6,
  );

  // dt cap and invalid dt guards
  const stalled = newElah();
  stepElah(stalled, 100, 1, 0);
  assert.ok(stalled.time <= 0.05);
  assert.ok(stalled.player.x > 168 && stalled.player.x < 173);
  const frozen = structuredClone(stalled);
  for (const dt of [Infinity, NaN, -1, 0]) stepElah(stalled, dt, 1, -1);
  assert.deepEqual(stalled, frozen);
});

test('sling standoff is untimed, advances David smoothly to the mark, releases cleanly, cycles verses, and resets on replay', () => {
  const s = newElah();
  shedAllArmor(s);
  gatherAllStones(s);

  approach(s, 'meet');
  run(s, 3);
  assert.equal(elahPhase(s), 'sling');
  assert.ok(Math.hypot(s.player.x - 825, s.player.y - 312) < 1e-6);
  assert.equal(readHud(s).action, 'Release stone');
  assert.match(readHud(s).card?.quote ?? '', /doesn’t save with sword and spear/);

  // Holding sling indefinitely has zero countdown or fail state.
  run(s, 60);
  assert.equal(elahPhase(s), 'sling');
  assert.equal(s.releasedAt, null);

  // Deliberate release resolves the standoff.
  approach(s, 'release');
  assert.equal(elahPhase(s), 'resolved');
  assert.equal(s.releasedAt, s.time);
  assert.equal(readHud(s).action, 'Read verse');
  assert.equal(readHud(s).verseStep, 0);
  assert.equal(readHud(s).card?.ref, CLOSING_VERSES[0].ref);

  // Cycling verses alternates between 1 Samuel 17:47 and 1 Samuel 17:50.
  act(s);
  assert.equal(readHud(s).verseStep, 1);
  assert.equal(readHud(s).card?.ref, CLOSING_VERSES[1].ref);
  assert.match(readHud(s).card?.quote ?? '', /no sword in David’s hand/);

  act(s);
  assert.equal(readHud(s).verseStep, 0);
  assert.equal(readHud(s).card?.ref, CLOSING_VERSES[0].ref);

  // Replay starts completely fresh.
  const fresh = newElah();
  assert.equal(fresh.time, 0);
  assert.equal(fresh.armorLeft.length, 3);
  assert.equal(fresh.droppedArmor.length, 0);
  assert.equal(stonesPicked(fresh), 0);
  assert.equal(fresh.challengeAt, null);
  assert.equal(fresh.releasedAt, null);
});

test('short Safari landscape view keeps David’s feet, head, and overhead whirling sling arc in frame', () => {
  // iPhone Safari landscape with bars expanded leaves ~129 CSS px for a 750 px wide canvas.
  const visibleHeight = 129 / (750 / 1040);
  for (const feetY of [238, 280, 312, 368, 416]) {
    const top = verticalCameraTop(visibleHeight, feetY);
    assert.ok(feetY - 98 >= top + 4, `overhead sling peak clipped at feetY=${feetY}`);
    assert.ok(feetY + 12 <= top + visibleHeight, `feet clipped at feetY=${feetY}`);
  }
  assert.equal(verticalCameraTop(460, 312), 0);
  assert.equal(verticalCameraTop(500, 312), -20);
});
