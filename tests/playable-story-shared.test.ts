import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createStoryAudio } from '../src/app/scriptures/stories/play/_shared/storyAudio';
import {
  clearInkCache,
  fitVerticalCamera,
  inkCacheSize,
  print,
  printDynamic,
} from '../src/app/scriptures/stories/play/_shared/storyInk';
import { createActionBuffer, integrateVelocity } from '../src/app/scriptures/stories/play/_shared/storyMotion';
import { runStoryStage } from '../src/app/scriptures/stories/play/_shared/storyStage';

test('fitVerticalCamera centers tall viewports and preserves overhead headroom on short landscape screens', () => {
  assert.equal(fitVerticalCamera(460, 436, 132, 0.8, 460, 312), 0);
  assert.equal(fitVerticalCamera(460, 436, 132, 0.8, 500, 312), -20);
  const shortLandscape = 129 / (750 / 1040);
  for (const feetY of [238, 312, 416]) {
    const top = fitVerticalCamera(460, 436, 132, 0.8, shortLandscape, feetY);
    assert.ok(feetY - 98 >= top + 4);
    assert.ok(feetY + 12 <= top + shortLandscape);
  }
});

test('storyInk caps static Path2D cache at 512 entries and printDynamic never grows the cache', () => {
  const prevPath2D = globalThis.Path2D;
  class StubPath2D {
    d: string;
    constructor(d: string) { this.d = d; }
  }
  (globalThis as unknown as { Path2D: unknown }).Path2D = StubPath2D;
  try {
    clearInkCache();
    let fills = 0;
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fill() { fills++; },
      stroke() {},
    } as unknown as CanvasRenderingContext2D;

    for (let i = 0; i < 650; i++) {
      print(ctx, `M0 0 L${i} ${i}`, '#111');
    }
    assert.equal(inkCacheSize(), 512, 'Static Path2D cache must stay bounded at 512 entries');

    clearInkCache();
    for (let i = 0; i < 40; i++) {
      printDynamic(ctx, `M0 0 Q${i} 10 20 20`, '#222');
    }
    assert.equal(inkCacheSize(), 0, 'printDynamic must not insert entries into static Path2D cache');
    assert.equal(fills, 690);
  } finally {
    clearInkCache();
    (globalThis as unknown as { Path2D: unknown }).Path2D = prevPath2D;
  }
});

test('integrateVelocity matches across 30 Hz and 120 Hz within 1e-12 and snaps cleanly on reversal', () => {
  const runSim = (hz: number) => {
    let x = 0;
    let v = 0;
    for (let i = 0; i < hz; i++) {
      const step = integrateVelocity(v, 240, 22, 1 / hz);
      v = step.v;
      x += step.dx;
    }
    return { x, v };
  };

  const r30 = runSim(30);
  const r120 = runSim(120);
  assert.ok(Math.abs(r30.x - r120.x) < 1e-12, `Expected exact displacement agreement, got ${r30.x} vs ${r120.x}`);
  assert.ok(Math.abs(r30.v - r120.v) < 1e-12);

  // Opposing reversal snaps opposing velocity to 0 so movement immediately heads in the new direction.
  const rev = integrateVelocity(240, -240, 22, 1 / 60);
  assert.ok(rev.dx < 0 && rev.v < 0, 'Opposing input must reverse immediately on frame 1');

  // Guard invalid dt / accelRate
  assert.deepEqual(integrateVelocity(50, 100, 10, 0), { v: 50, dx: 0 });
  assert.deepEqual(integrateVelocity(50, 100, 10, NaN), { v: 50, dx: 0 });
  assert.deepEqual(integrateVelocity(0, 100, 0, 0.1), { v: 100, dx: 10 });
});

test('createActionBuffer triggers on arrival within window, expires deterministically on dt, and clears cleanly', () => {
  const buf = createActionBuffer(0.14);
  let expired = 0;
  let inReach = false;

  buf.arm();
  assert.equal(buf.isArmed(), true);
  assert.equal(buf.tick(0.05, () => inReach, () => { expired++; }), false);
  assert.equal(expired, 0);
  inReach = true;
  assert.equal(buf.tick(0.05, () => inReach, () => { expired++; }), true);
  assert.equal(buf.isArmed(), false);
  assert.equal(expired, 0);

  // Expiry invokes fallback exactly once
  inReach = false;
  buf.arm();
  buf.tick(0.08, () => false, () => { expired++; });
  assert.equal(expired, 0);
  buf.tick(0.08, () => false, () => { expired++; });
  assert.equal(expired, 1);
  assert.equal(buf.isArmed(), false);

  // Explicit clear prevents expiry callback
  buf.arm();
  buf.clear();
  buf.tick(0.5, () => false, () => { expired++; });
  assert.equal(expired, 1);
});

test('createStoryAudio caches filter pre-unlock, uses limiter + click-free delayed suspend, and resumes ambient ticks cleanly', async () => {
  const prevWindow = globalThis.window;
  try {
    // 1. No AudioContext: silent fallback never throws.
    (globalThis as unknown as { window?: unknown }).window = {};
    const silent = createStoryAudio({ ambientFreq: 300, ambientQ: 0.8 });
    silent.setAmbientFilter(680, 1.1, 0.2);
    silent.unlock();
    silent.tone(440, 220, 0.1, 0.05, 'sine', 0, 0.006, 4);
    silent.noise(0.1, 'bandpass', 600, 300, 1.2, 0.02);
    silent.setAmbientTarget(0.02);
    silent.setPaused(true);
    silent.setPaused(false);
    silent.setEnabled(false);
    silent.close();
    assert.equal(silent.isReady(), false);

    // 2. Mock AudioContext with compressor + filter param tracking.
    let closed = false;
    let ambientTicks = 0;
    let limiterCreated = 0;
    let lastFilterFreq = 0;
    let suspendCalls = 0;
    class FakeAudioContext {
      state: 'running' | 'suspended' | 'closed' = 'running';
      sampleRate = 8000;
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: { value: 0, setTargetAtTime() {}, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
          disconnect() {},
        };
      }
      createDynamicsCompressor() {
        limiterCreated++;
        return {
          threshold: { value: 0 },
          knee: { value: 0 },
          ratio: { value: 0 },
          attack: { value: 0 },
          release: { value: 0 },
          connect() {},
        };
      }
      createBuffer(_channels: number, length: number) {
        const buf = new Float32Array(length);
        return { getChannelData: () => buf };
      }
      createBufferSource() {
        return { buffer: null, loop: false, connect() {}, start() {}, stop() {}, disconnect() {} };
      }
      createBiquadFilter() {
        return {
          type: 'bandpass',
          frequency: {
            get value() { return lastFilterFreq; },
            set value(v: number) { lastFilterFreq = v; },
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          Q: { value: 0 },
          connect() {},
          disconnect() {},
        };
      }
      async suspend() { suspendCalls++; this.state = 'suspended'; }
      async resume() { this.state = 'running'; }
      async close() { this.state = 'closed'; closed = true; }
    }

    (globalThis as unknown as { window?: unknown }).window = { AudioContext: FakeAudioContext };
    const audio = createStoryAudio({
      seed: 0x73e9a1,
      ambientFreq: 260,
      ambientQ: 0.7,
      ambientTickMs: 20,
      onAmbientTick: () => { ambientTicks++; },
    });
    // Pre-unlock filter target must survive into startAmbient() on unlock.
    audio.setAmbientFilter(740, 1.2);
    audio.unlock();
    assert.equal(limiterCreated, 1, 'Expected DynamicsCompressorNode master limiter');
    assert.equal(lastFilterFreq, 740, 'Pre-unlock filter frequency must initialize ambient filter');
    assert.equal(audio.isRunning(), true);

    await new Promise(r => setTimeout(r, 55));
    const beforePause = ambientTicks;
    assert.ok(beforePause >= 1, 'Expected ambient ticks while running');

    // Quick pause + immediate unpause (< 75 ms) cancels delayed suspend so audio never pops.
    audio.setPaused(true);
    assert.equal(suspendCalls, 0, 'Suspend must be delayed past fade-out to avoid click/pop');
    audio.setPaused(false);
    await new Promise(r => setTimeout(r, 95));
    assert.equal(suspendCalls, 0, 'Quick resume must cancel pending delayed suspend');

    // Sustained pause suspends cleanly after 75 ms fade-out and stops ambient ticks.
    audio.setPaused(true);
    assert.equal(audio.isRunning(), false);
    const atPause = ambientTicks;
    await new Promise(r => setTimeout(r, 110));
    assert.equal(suspendCalls, 1, 'Sustained pause must suspend AudioContext after fade');
    assert.equal(ambientTicks, atPause, 'Ambient ticks must not fire while paused');

    audio.setPaused(false);
    assert.equal(audio.isRunning(), true);
    await new Promise(r => setTimeout(r, 55));
    assert.ok(ambientTicks > atPause, 'Ambient ticks must resume cleanly after unpause');

    audio.close();
    const atClose = ambientTicks;
    await new Promise(r => setTimeout(r, 55));
    assert.equal(ambientTicks, atClose, 'Ambient ticks must stop permanently after close');
    assert.equal(closed, true);
  } finally {
    (globalThis as unknown as { window?: unknown }).window = prevWindow;
  }
});

test('runStoryStage sleeps rAF while paused, guards hold-to-charge handshake, toggles hover cursor, and stops cleanly on dispose', () => {
  const dom = new JSDOM(`
    <!doctype html>
    <body>
      <div id="outside" tabindex="0"></div>
      <section>
        <canvas width="400" height="200" tabindex="0"></canvas>
        <button id="hud-btn">Action</button>
      </section>
    </body>
  `);
  const prev = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    AbortController: globalThis.AbortController,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };

  const rafMap = new Map<number, (now: number) => void>();
  let nextRaf = 1;
  const cancelled: number[] = [];

  (globalThis as unknown as { window: unknown }).window = dom.window;
  (globalThis as unknown as { document: unknown }).document = dom.window.document;
  (globalThis as unknown as { HTMLElement: unknown }).HTMLElement = dom.window.HTMLElement;
  (globalThis as unknown as { AbortController: unknown }).AbortController = dom.window.AbortController;
  Object.defineProperty(dom.window.document, 'hidden', { configurable: true, value: false });
  (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = (cb: (now: number) => void) => {
    const id = nextRaf++;
    rafMap.set(id, cb);
    return id;
  };
  (globalThis as unknown as { cancelAnimationFrame: unknown }).cancelAnimationFrame = (id: number) => {
    cancelled.push(id);
    rafMap.delete(id);
  };

  try {
    const canvas = dom.window.document.querySelector('canvas') as unknown as HTMLCanvasElement;
    const outside = dom.window.document.getElementById('outside')!;
    const hudBtn = dom.window.document.getElementById('hud-btn')!;
    const stepCalls: { dt: number; x: number; y: number; reduced: boolean }[] = [];
    const drawCalls: { dt: number; reduced: boolean }[] = [];
    let performs = 0;
    let interacts = 0;
    let lostCount = 0;
    let restoredCount = 0;
    let captureHold = false;
    let holdUps = 0;
    let holdCancels = 0;
    const pauseEvents: boolean[] = [];

    const stage = runStoryStage(canvas, {
      onStep: (dt, x, y, _now, reduced) => stepCalls.push({ dt, x, y, reduced }),
      onDraw: (dt, reduced) => drawCalls.push({ dt, reduced }),
      onPerform: () => { performs++; },
      onActionDown: () => captureHold,
      onActionUp: () => { holdUps++; },
      onActionCancel: () => { holdCancels++; },
      onHover: (pt) => Boolean(pt && pt.x > 100),
      onInteract: () => { interacts++; },
      toWorld: (x, y) => ({ x, y }),
      onTap: () => {},
      onContextLost: () => { lostCount++; },
      onContextRestored: () => { restoredCount++; },
      onPauseChange: (p) => pauseEvents.push(p),
    });

    const tick = (now: number) => {
      const entry = rafMap.entries().next().value as [number, (n: number) => void] | undefined;
      assert.ok(entry, 'Expected scheduled animation frame');
      rafMap.delete(entry[0]);
      entry[1](now);
    };

    // Initial tick at t=1000 -> dt=0
    tick(1000);
    assert.equal(stepCalls.length, 1);
    assert.equal(stepCalls[0].dt, 0);
    assert.equal(drawCalls.length, 1);

    // Space outside <section> ignored
    outside.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    assert.equal(performs, 0);

    // Non-capturing Space triggers onPerform immediately and keyup does NOT trigger onActionUp
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    assert.equal(performs, 1);
    captureHold = true; // Simulate phase transition right before keyup (e.g. approach -> sling)
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
    assert.equal(holdUps, 0, 'Keyup from a non-capturing Space press must never bleed into onActionUp');

    // Capturing Space suppresses onPerform and fires onActionUp on keyup
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    assert.equal(performs, 1);
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
    assert.equal(holdUps, 1);

    // HUD button Space keyup never fires onActionUp
    hudBtn.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    hudBtn.dispatchEvent(new dom.window.KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
    assert.equal(holdUps, 1);

    // Pause while holding cancels charge via onActionCancel (never firing onActionUp!) and sleeps rAF completely
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'KeyP', bubbles: true }));
    assert.equal(stage.isPaused(), true);
    assert.equal(holdCancels, 1);
    assert.equal(holdUps, 1);
    assert.deepEqual(pauseEvents, [true]);
    assert.equal(rafMap.size, 0, 'Paused clean stage must have 0 queued rAF frames (idle sleep)');

    // Hover toggles pointer cursor and resets cleanly on pointerleave
    canvas.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 150, clientY: 50, bubbles: true }));
    assert.equal(canvas.style.cursor, 'pointer');
    canvas.dispatchEvent(new dom.window.MouseEvent('pointerleave', { bubbles: true }));
    assert.equal(canvas.style.cursor, 'default');
    // Drain hover dirty paint while paused
    while (rafMap.size > 0) tick(2050);

    // contextrestored while paused wakes for exactly one dirtyPaint frame at dt = 0 then sleeps again
    const drawsBeforeRestore = drawCalls.length;
    canvas.dispatchEvent(new dom.window.Event('contextlost', { cancelable: true }));
    assert.equal(lostCount, 1);
    canvas.dispatchEvent(new dom.window.Event('contextrestored'));
    assert.equal(restoredCount, 1);
    assert.equal(rafMap.size, 1);
    tick(2100);
    assert.equal(drawCalls.length, drawsBeforeRestore + 1);
    assert.equal(drawCalls[drawCalls.length - 1].dt, 0);
    assert.equal(rafMap.size, 0, 'Paused stage must sleep again after painting dirty frame');

    // Unpause resets clock so first resumed frame computes dt = 0
    stage.setPaused(false);
    assert.deepEqual(pauseEvents, [true, false]);
    assert.equal(rafMap.size, 1);
    tick(5000);
    assert.equal(stepCalls[stepCalls.length - 1].dt, 0);
    assert.ok(interacts >= 1);

    // Dispose cancels rAF and blocks late requestPaint from scheduling zombie frames
    stage.dispose();
    assert.ok(cancelled.length >= 1);
    assert.equal(rafMap.size, 0);
    stage.requestPaint();
    assert.equal(rafMap.size, 0, 'Disposed stage must never schedule zombie rAF frames');
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    assert.equal(performs, 1);
  } finally {
    (globalThis as unknown as { window: unknown }).window = prev.window;
    (globalThis as unknown as { document: unknown }).document = prev.document;
    (globalThis as unknown as { HTMLElement: unknown }).HTMLElement = prev.HTMLElement;
    (globalThis as unknown as { AbortController: unknown }).AbortController = prev.AbortController;
    (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = prev.requestAnimationFrame;
    (globalThis as unknown as { cancelAnimationFrame: unknown }).cancelAnimationFrame = prev.cancelAnimationFrame;
  }
});
