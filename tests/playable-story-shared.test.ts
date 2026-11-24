import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createStoryAudio } from '../src/app/scriptures/stories/play/_shared/storyAudio';
import { fitVerticalCamera } from '../src/app/scriptures/stories/play/_shared/storyInk';
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

test('createStoryAudio fails open silently when AudioContext is absent and keeps ambient ticks alive across pause/resume', async () => {
  const prevWindow = globalThis.window;
  try {
    // 1. No AudioContext: silent fallback never throws.
    (globalThis as unknown as { window?: unknown }).window = {};
    const silent = createStoryAudio({ ambientFreq: 300, ambientQ: 0.8 });
    silent.unlock();
    silent.tone(440, 220, 0.1, 0.05, 'sine');
    silent.noise(0.1, 'bandpass', 600, 300, 1.2, 0.02);
    silent.setAmbientTarget(0.02);
    silent.setPaused(true);
    silent.setPaused(false);
    silent.setEnabled(false);
    silent.close();
    assert.equal(silent.isReady(), false);

    // 2. Mock AudioContext: ambient ticks pause cleanly, resume after unpause, and stop after close().
    let closed = false;
    let ambientTicks = 0;
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
          frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          Q: { value: 0 },
          connect() {},
          disconnect() {},
        };
      }
      async suspend() { this.state = 'suspended'; }
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
    audio.unlock();
    assert.equal(audio.isRunning(), true);
    await new Promise(r => setTimeout(r, 55));
    const beforePause = ambientTicks;
    assert.ok(beforePause >= 1, 'Expected ambient ticks while running');

    audio.setPaused(true);
    assert.equal(audio.isRunning(), false);
    const atPause = ambientTicks;
    await new Promise(r => setTimeout(r, 55));
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

test('runStoryStage honors section keyboard containment, dirtyPaint while paused, clock reset, and clean dispose', () => {
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

  const rafQueue: ((now: number) => void)[] = [];
  let nextRaf = 1;
  const cancelled: number[] = [];

  (globalThis as unknown as { window: unknown }).window = dom.window;
  (globalThis as unknown as { document: unknown }).document = dom.window.document;
  (globalThis as unknown as { HTMLElement: unknown }).HTMLElement = dom.window.HTMLElement;
  (globalThis as unknown as { AbortController: unknown }).AbortController = dom.window.AbortController;
  Object.defineProperty(dom.window.document, 'hidden', { configurable: true, value: false });
  (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = (cb: (now: number) => void) => {
    rafQueue.push(cb);
    return nextRaf++;
  };
  (globalThis as unknown as { cancelAnimationFrame: unknown }).cancelAnimationFrame = (id: number) => {
    cancelled.push(id);
  };

  try {
    const canvas = dom.window.document.querySelector('canvas') as unknown as HTMLCanvasElement;
    const outside = dom.window.document.getElementById('outside')!;
    const stepCalls: { dt: number; x: number; y: number; reduced: boolean }[] = [];
    const drawCalls: { dt: number; reduced: boolean }[] = [];
    let performs = 0;
    let interacts = 0;
    let lostCount = 0;
    let restoredCount = 0;
    const pauseEvents: boolean[] = [];

    const stage = runStoryStage(canvas, {
      onStep: (dt, x, y, _now, reduced) => stepCalls.push({ dt, x, y, reduced }),
      onDraw: (dt, reduced) => drawCalls.push({ dt, reduced }),
      onPerform: () => { performs++; },
      onInteract: () => { interacts++; },
      toWorld: (x, y) => ({ x, y }),
      onTap: () => {},
      onContextLost: () => { lostCount++; },
      onContextRestored: () => { restoredCount++; },
      onPauseChange: (p) => pauseEvents.push(p),
    });

    const tick = (now: number) => {
      const fn = rafQueue.shift();
      assert.ok(fn, 'Expected scheduled animation frame');
      fn(now);
    };

    // Initial tick at t=1000 -> dt=0
    tick(1000);
    assert.equal(stepCalls.length, 1);
    assert.equal(stepCalls[0].dt, 0);
    assert.equal(drawCalls.length, 1);

    // Space dispatched from outside <section> is ignored
    outside.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    assert.equal(performs, 0);

    // Space dispatched from canvas triggers onPerform
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    assert.equal(performs, 1);

    // ArrowRight inside section steers and triggers onInteract
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }));
    assert.ok(interacts >= 1);
    tick(1020);
    assert.equal(stepCalls[1].x, 1);
    assert.ok(Math.abs(stepCalls[1].dt - 0.02) < 1e-6);

    // Pause via KeyP stops stepping and drawing, clears held keys
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'KeyP', bubbles: true }));
    assert.equal(stage.isPaused(), true);
    assert.deepEqual(pauseEvents, [true]);
    tick(2000);
    assert.equal(stepCalls.length, 2, 'Paused tick must not step simulation');
    assert.equal(drawCalls.length, 2, 'Paused clean tick must not redraw');

    // contextrestored while paused triggers a single dirtyPaint draw(0, reduced)
    canvas.dispatchEvent(new dom.window.Event('contextlost', { cancelable: true }));
    assert.equal(lostCount, 1);
    canvas.dispatchEvent(new dom.window.Event('contextrestored'));
    assert.equal(restoredCount, 1);
    tick(2100);
    assert.equal(drawCalls.length, 3, 'contextrestored while paused must trigger one dirtyPaint draw');
    assert.equal(drawCalls[2].dt, 0);

    // Unpause resets clock so first resumed frame computes dt = 0 (no jump across pause gap)
    stage.setPaused(false);
    assert.deepEqual(pauseEvents, [true, false]);
    tick(5000);
    assert.equal(stepCalls.length, 3);
    assert.equal(stepCalls[2].dt, 0);
    assert.equal(stepCalls[2].x, 0);

    // Dispose cancels rAF and tears down listeners
    stage.dispose();
    assert.ok(cancelled.length >= 1);
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    assert.equal(performs, 1, 'Disposed stage must ignore further keyboard events');
  } finally {
    (globalThis as unknown as { window: unknown }).window = prev.window;
    (globalThis as unknown as { document: unknown }).document = prev.document;
    (globalThis as unknown as { HTMLElement: unknown }).HTMLElement = prev.HTMLElement;
    (globalThis as unknown as { AbortController: unknown }).AbortController = prev.AbortController;
    (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = prev.requestAnimationFrame;
    (globalThis as unknown as { cancelAnimationFrame: unknown }).cancelAnimationFrame = prev.cancelAnimationFrame;
  }
});
