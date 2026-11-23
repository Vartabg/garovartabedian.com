import { verticalCameraTop } from "../src/app/scriptures/stories/play/overturned-tables/courtView";
import { readHud } from "../src/app/scriptures/stories/play/overturned-tables/courtController";
import { PAVING_BOUNDS } from "../src/app/scriptures/stories/play/overturned-tables/courtCoins";
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  act, activeEncounters, actTwoCount, approach, courtComplete, courtDistance, eveningAt, eveningReady,
  nearby, nearbyEncounter, newCourt, obstacleBox, stepCourt, WALK_BOUNDS, walkTo,
  type Court,
} from '../src/app/scriptures/stories/play/overturned-tables/courtGame';

function run(s: Court, seconds: number, dx = 0, dy = 0, hz = 60) {
  for (let frame = 0; frame < seconds * hz; frame++) stepCourt(s, 1 / hz, dx, dy);
}

function fixture(s: Court, id: string) {
  const target = s.fixtures.find(item => item.id === id);
  assert.ok(target, `Expected fixture ${id}`);
  return target;
}

function reachAndAct(s: Court, id: string) {
  approach(s, id);
  run(s, 7);
  assert.notEqual(fixture(s, id).at, null);
  assert.equal(s.selected, null);
  assert.equal(s.destination, null);
}

test('the first press tips the nearby table at time zero and cannot tip it twice', () => {
  const s = newCourt(), target = nearby(s);
  assert.equal(target?.id, 'table-1');
  act(s);
  assert.equal(s.shoveAt, 0);
  assert.equal(target?.at, 0);
  assert.equal(s.seq, 1);
  assert.equal(s.facing, 1);
  assert.match(s.message, /coins scatter/);
  assert.equal(nearby(s), undefined);
  assert.equal(courtComplete(s), false);
  run(s, 1);
  act(s);
  assert.equal(s.seq, 2);
  assert.equal(s.shoveAt, s.time);
  assert.match(s.message, /Step closer/);
  assert.equal(target?.at, 0);
  assert.equal(s.fixtures.filter(item => item.at !== null).length, 1);
});

test('selecting a seat moves the feet into reach before acting and leaves the nearer first table standing', () => {
  const s = newCourt();
  approach(s, 'seat-1');
  assert.equal(s.selected, 'seat-1');
  assert.equal(s.seq, 0);
  assert.deepEqual(s.player, { x: 205, y: 310 });
  run(s, .5);
  assert.equal(s.walking, true);
  assert.ok(s.player.x > 300 && s.player.y > 330);
  assert.equal(fixture(s, 'seat-1').at, null);

  run(s, .5);
  const at = fixture(s, 'seat-1').at;
  assert.ok(at !== null && at > .7 && at < .9);
  assert.ok(s.player.x > 360 && s.player.x < 432);
  assert.equal(s.selected, null);
  assert.equal(s.destination, null);
  assert.equal(s.seq, 1);
  assert.match(s.message, /birds take wing/);
  assert.equal(fixture(s, 'table-1').at, null);
  assert.ok(s.stride > 0);
  assert.equal(s.walking, false);
  const position = { ...s.player };
  run(s, 3);
  assert.equal(fixture(s, 'seat-1').at, at);
  assert.deepEqual(s.player, position);
});

test('manual movement and ground destinations each cancel a pending fixture action', () => {
  const s = newCourt();
  approach(s, 'gate');
  run(s, .25);
  const x = s.player.x;
  stepCourt(s, 1 / 60, -1, 0);
  assert.ok(s.player.x < x);
  assert.equal(s.facing, -1);
  assert.equal(s.selected, null);
  assert.equal(s.destination, null);
  run(s, 6);
  assert.equal(fixture(s, 'gate').at, null);
  assert.equal(s.seq, 0);

  approach(s, 'seat-2');
  walkTo(s, { x: 352, y: 271 });
  assert.equal(s.selected, null);
  run(s, 3);
  assert.ok(Math.hypot(s.player.x - 352, s.player.y - 271) < 1e-6);
  assert.equal(fixture(s, 'seat-2').at, null);
  assert.equal(s.seq, 0);
});

test('a missed action at a distance leaves the passage open until the player is actually there', () => {
  const s = newCourt();
  run(s, 1, 1, 0);
  assert.equal(nearby(s), undefined);
  act(s);
  assert.match(s.message, /Step closer/);
  assert.equal(fixture(s, 'gate').at, null);
  walkTo(s, { x: 1140, y: 275 });
  run(s, 4);
  assert.equal(nearby(s)?.id, 'gate');
  assert.equal(fixture(s, 'gate').at, null);
  act(s);
  assert.match(s.message, /carrier turns back/);
  assert.equal(fixture(s, 'gate').at, s.time);
  assert.equal(s.fixtures.filter(item => item.at !== null).length, 1);
});

test('movement distance and fixture arrival agree at 30 and 120 Hz and stall frames are capped', () => {
  const frames = [30, 120].map(hz => {
    const s = newCourt();
    run(s, .5, 1, -1, hz);
    assert.ok(s.player.x < 205 + 100);
    assert.ok(s.player.y > 240);
    approach(s, 'table-2');
    run(s, 3, 0, 0, hz);
    return s;
  });
  assert.ok(Math.hypot(frames[0].player.x - frames[1].player.x, frames[0].player.y - frames[1].player.y) < 1e-6);
  assert.ok(Math.abs(Number(fixture(frames[0], 'table-2').at) - Number(fixture(frames[1], 'table-2').at)) < 1e-6);

  const stalled = newCourt();
  stepCourt(stalled, 100, 1, 0);
  assert.ok(stalled.player.x > 205 && stalled.player.x < 218);
  assert.ok(stalled.time <= .05);
  const still = structuredClone(stalled);
  for (const dt of [Infinity, NaN, -1, 0]) stepCourt(stalled, dt, -1, 1);
  assert.deepEqual(stalled, still);
});

test('the passage can be barred before or after the furniture and replay restores every prop', () => {
  const tableOrder = ['table-1', 'seat-1', 'table-2', 'table-3', 'seat-2'];
  for (const order of [['gate', ...tableOrder], [...tableOrder, 'gate']]) {
    const s = newCourt();
    for (const id of order.slice(0, -1)) {
      reachAndAct(s, id);
      assert.equal(courtComplete(s), false);
    }
    reachAndAct(s, order[5]);
    assert.equal(courtComplete(s), true);
    assert.equal(s.seq, 6);
    assert.match(s.message, /Jesus begins to teach/);
    const timestamps = s.fixtures.map(item => item.at);
    run(s, 10, -1, 1);
    assert.deepEqual(s.player, { x: WALK_BOUNDS.minX, y: WALK_BOUNDS.maxY });
    walkTo(s, { x: 3000, y: -100 });
    run(s, 7);
    assert.deepEqual(s.player, { x: WALK_BOUNDS.maxX, y: WALK_BOUNDS.minY });
    assert.deepEqual(s.fixtures.map(item => item.at), timestamps);
    assert.equal(s.seq, 6);
    assert.equal(courtComplete(s), true);
  }

  const replay = newCourt();
  assert.equal(replay.time, 0);
  assert.equal(replay.fixtures.length, 6);
  assert.ok(replay.fixtures.every(item => item.at === null));
  assert.equal(courtComplete(replay), false);
  act(replay);
  assert.equal(fixture(replay, 'table-1').at, 0);
});

test("money scatters, settles, and skitters away under a walking foot", () => {
  const court = newCourt();
  act(court);
  const coins = court.fixtures[0].coins!;
  assert.ok(coins.length > 1);
  const start = coins[0].x;
  for (let frame = 0; frame < 600; frame++) stepCourt(court, 1 / 60, 0, 0);
  assert.notEqual(coins[0].x, start);
  assert.ok(coins.every(coin => coin.z === 0 && coin.vx === 0));
  const landing = { x: coins[0].x, y: coins[0].y };
  walkTo(court, landing);
  for (let frame = 0; frame < 150; frame++) stepCourt(court, 1 / 60, 0, 0);
  assert.ok(Math.hypot(coins[0].x - landing.x, coins[0].y - landing.y) > 5);
  assert.ok(newCourt().fixtures.every(f => f.coins === undefined));
});

test("a short Safari landscape view keeps the player's head, feet and nearby fixture in the picture", () => {
  // The iPhone simulator with both Safari bars expanded leaves about 129 CSS px for a 750 px wide canvas.
  const visibleHeight = 129 / (750 / 1040);
  for (const feetY of [212, 265, 310, 371, 417]) {
    const top = verticalCameraTop(visibleHeight, feetY);
    assert.ok(feetY - 70 >= top + 5);
    assert.ok(feetY + 12 <= top + visibleHeight);
    assert.ok(feetY - 36 - 80 >= top);
  }
  assert.equal(verticalCameraTop(460, 310), 0);
  assert.equal(verticalCameraTop(500, 310), -20);
});

test("standing stalls block direct walk-through, slide smoothly, and open the floor once overturned", () => {
  const s = newCourt();
  const table1 = fixture(s, 'table-1');
  const box = obstacleBox(table1)!;
  assert.ok(box);
  // Walking due east from (205, 310) slightly north into the table face stops at minX instead of ghosting through.
  walkTo(s, { x: 205, y: 298 });
  run(s, .5);
  assert.ok(Math.abs(s.player.y - 298) < 1e-3);
  run(s, 1, 1, 0);
  assert.ok(s.player.x <= box.minX + 1e-6);
  // Overturning opens the space immediately.
  act(s);
  assert.equal(obstacleBox(table1), null);
  run(s, 1, 1, 0);
  assert.ok(s.player.x > box.maxX + 40);
});

test("approach routes cleanly around an intervening standing table at 30 and 120 Hz", () => {
  const results = [30, 120].map(hz => {
    const s = newCourt();
    // Place Jesus directly west of standing table-2 on its exact Y centerline, then target table-3 beyond it.
    walkTo(s, { x: 520, y: 265 });
    run(s, 4, 0, 0, hz);
    approach(s, 'gate');
    assert.ok(s.route.length > 0, 'Expected corner clearance route around standing table-2');
    run(s, 6, 0, 0, hz);
    assert.notEqual(fixture(s, 'gate').at, null);
    assert.equal(fixture(s, 'table-2').at, null);
    assert.equal(s.actionKind, 'halt');
    return s;
  });
  assert.ok(Math.hypot(results[0].player.x - results[1].player.x, results[0].player.y - results[1].player.y) < 1e-6);
  assert.ok(Math.abs(Number(fixture(results[0], 'gate').at) - Number(fixture(results[1], 'gate').at)) < 1e-6);
});

test("coins stay inside courtyard paving bounds, report kicks, and dove seats shed kickable feathers", () => {
  const s = newCourt();
  // Flip table-2 (closest to the rear colonnade) and push coins northward to verify floor clamping.
  reachAndAct(s, 'table-2');
  const coins = fixture(s, 'table-2').coins!;
  run(s, 5);
  for (const coin of coins) {
    assert.ok(coin.x >= PAVING_BOUNDS.minX && coin.x <= PAVING_BOUNDS.maxX);
    assert.ok(coin.y >= PAVING_BOUNDS.minY && coin.y <= PAVING_BOUNDS.maxY);
  }
  const beforeKick = s.coinKickAt;
  walkTo(s, { x: coins[0].x, y: coins[0].y });
  run(s, 2);
  assert.ok(s.coinKickAt > beforeKick, 'Walking through settled coins should record coinKickAt');
  for (const coin of coins) {
    assert.ok(coin.y >= PAVING_BOUNDS.minY && coin.y <= PAVING_BOUNDS.maxY);
  }

  // Tip dove seller's seat and verify drifting feathers settle inside paving and stir underfoot.
  reachAndAct(s, 'seat-1');
  const feathers = fixture(s, 'seat-1').feathers!;
  assert.equal(feathers.length, 5);
  run(s, 5);
  assert.ok(feathers.every(f => f.z === 0 && f.y >= PAVING_BOUNDS.minY && f.y <= PAVING_BOUNDS.maxY));
  const landed = { x: feathers[0].x, y: feathers[0].y };
  walkTo(s, landed);
  run(s, 1.5);
  assert.ok(Math.hypot(feathers[0].x - landed.x, feathers[0].y - landed.y) > 2);
});

test("post-clear Teach cycles Mark 11:17-18 in HUD without breaking completion or replay", () => {
  const s = newCourt();
  for (const id of ['table-1', 'seat-1', 'table-2', 'table-3', 'seat-2', 'gate']) {
    reachAndAct(s, id);
  }
  assert.equal(courtComplete(s), true);
  assert.equal(s.actionKind, 'halt');
  assert.equal(readHud(s).action, 'Teach');
  assert.equal(readHud(s).teachingStep, 0);

  act(s);
  assert.equal(s.actionKind, 'teach');
  assert.equal(s.teachingStep, 1);
  assert.equal(readHud(s).teachingStep, 1);
  assert.match(s.message, /den of robbers/i);

  act(s);
  assert.equal(s.teachingStep, 2);
  assert.match(s.message, /colonnade/i);

  act(s);
  assert.equal(s.teachingStep, 0);
  assert.match(s.message, /house of prayer/i);

  const fresh = newCourt();
  assert.equal(readHud(fresh).action, 'Flip table');
  assert.equal(readHud(fresh).teachingStep, 0);
});

test("Act II encounters stay outside Act I reach, activate after clearing, and unlock evening departure", () => {
  const fresh = newCourt();
  assert.deepEqual(activeEncounters(fresh), []);
  // Every Act II encounter must sit far (> 2 * REACH = 124) from every Act I fixture so completion never auto-overrides Teach.
  for (const f of fresh.fixtures) {
    for (const e of fresh.encounters) {
      if (e.kind === 'depart') continue;
      assert.ok(courtDistance(e.x - f.x, e.y - f.y) > 124, `${e.id} too close to ${f.id}`);
    }
  }
  // Attempting to approach Act II encounters before clearing is a no-op.
  approach(fresh, 'heal-lame');
  assert.equal(fresh.selected, null);

  // Clear all Act I fixtures in arbitrary order.
  for (const id of ['gate', 'table-1', 'seat-1', 'table-2', 'seat-2', 'table-3']) {
    reachAndAct(fresh, id);
  }
  assert.equal(courtComplete(fresh), true);
  assert.equal(nearbyEncounter(fresh), undefined);
  assert.equal(readHud(fresh).action, 'Teach');
  assert.equal(activeEncounters(fresh).length, 3);
  assert.equal(eveningAt(fresh), null);
  assert.equal(eveningReady(fresh), false);

  // Approach and resolve lame visitor, scribes, then blind visitor in non-default order.
  approach(fresh, 'heal-lame');
  run(fresh, 6);
  assert.equal(fresh.actionKind, 'heal');
  assert.equal(actTwoCount(fresh), 1);
  assert.match(readHud(fresh).card.quote, /lame and the blind/i);

  // Walking near scribes switches HUD action to "Answer scribes" before pressing act.
  walkTo(fresh, { x: 860, y: 224 });
  run(fresh, 6);
  assert.equal(nearbyEncounter(fresh)?.id, 'scribes');
  assert.equal(readHud(fresh).action, 'Answer scribes');
  act(fresh);
  assert.equal(fresh.actionKind, 'answer');
  assert.equal(actTwoCount(fresh), 2);
  assert.match(readHud(fresh).card.quote, /perfected praise/i);
  assert.equal(eveningReady(fresh), false);

  // Completing the third Act II encounter unlocks evening dusk and east archway departure.
  approach(fresh, 'heal-blind');
  run(fresh, 5);
  assert.equal(fresh.actionKind, 'heal');
  assert.equal(actTwoCount(fresh), 3);
  assert.ok(eveningAt(fresh) !== null);
  assert.equal(eveningReady(fresh), true);
  assert.match(fresh.message, /Evening settles over the court/);
  assert.deepEqual(activeEncounters(fresh).map(e => e.id), ['depart']);

  // Walking near the east archway offers "Leave at evening".
  walkTo(fresh, { x: 1145, y: 228 });
  run(fresh, 5);
  assert.equal(readHud(fresh).action, 'Leave at evening');
  act(fresh);
  assert.ok(fresh.departedAt !== null);
  assert.equal(fresh.actionKind, 'depart');
  assert.equal(readHud(fresh).departed, true);
  assert.equal(readHud(fresh).card.heading, 'Evening');
  assert.match(readHud(fresh).card.quote, /went out of the city/i);

  // Further steering or actions after departure do not move Jesus until replay.
  const departedPos = { ...fresh.player };
  const seqAtDepart = fresh.seq;
  run(fresh, 2, -1, 1);
  act(fresh);
  assert.deepEqual(fresh.player, departedPos);
  assert.equal(fresh.seq, seqAtDepart);
});
