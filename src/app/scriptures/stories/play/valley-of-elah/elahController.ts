import {
  ARMOR_LABELS,
  act,
  activeCard,
  approach,
  elahPhase,
  isInBrook,
  nearStandoff,
  nearbyStone,
  newElah,
  nextArmorPiece,
  stepElah,
  stonesPicked,
  type ElahState,
} from './elahGame';
import { elahPointer } from './elahPointer';
import { makeElahSound } from './elahSound';
import { createElahView } from './elahView';

export function readHud(s: ElahState) {
  const phase = elahPhase(s);
  const armorNext = nextArmorPiece(s);
  const armorCount = s.armorLeft.length;
  const stonesCount = stonesPicked(s);
  const nearSt = nearbyStone(s);
  const challenged = s.challengeAt !== null;
  const resolved = s.releasedAt !== null;

  let action = 'Read verse';
  let actionTone: 'armor' | 'brook' | 'approach' | 'release' | 'read' = 'read';
  if (phase === 'armor' && armorNext) {
    action = ARMOR_LABELS[armorNext];
    actionTone = 'armor';
  } else if (phase === 'brook') {
    action = nearSt ? 'Pick smooth stone' : 'Pick stone';
    actionTone = 'brook';
  } else if (phase === 'approach') {
    action = 'Step into the valley';
    actionTone = 'approach';
  } else if (phase === 'sling') {
    action = 'Release stone';
    actionTone = 'release';
  }

  return {
    phase,
    armorCount,
    armorDone: armorCount === 0,
    armorLabel: armorNext ? ARMOR_LABELS[armorNext] : 'Saul’s armor set aside',
    stones: s.stones.map(st => ({
      id: st.id,
      label: st.label,
      done: st.at !== null,
      locked: armorCount > 0,
    })),
    stonesCount,
    challenged,
    resolved,
    action,
    actionTone,
    verseStep: s.verseStep,
    card: activeCard(s),
    message: s.message,
    paused: false,
    sound: true,
    visual: true,
    ready: false,
  };
}

export type ElahHud = ReturnType<typeof readHud>;
export type ElahController = ReturnType<typeof runElah>;

export function runElah(canvas: HTMLCanvasElement, onChange: (hud: ElahHud) => void) {
  const section = canvas.closest('section');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sound = makeElahSound();
  const held = new Set<string>();
  const keys: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],
    ArrowRight: [1, 0],
    KeyD: [1, 0],
    ArrowUp: [0, -1],
    KeyW: [0, -1],
    ArrowDown: [0, 1],
    KeyS: [0, 1],
  };

  let s = newElah();
  let paused = false;
  let audible = true;
  let ctxLost = false;
  let view: ReturnType<typeof createElahView> | undefined;
  let frame = 0;
  let last = 0;
  let revision = -1;
  let nearId: string | undefined;
  let stepShown = -1;
  let phaseShown = '';
  let dirty = true;
  let dirtyPaint = true;
  let handled = s.seq;
  let lastStepBucket = 0;
  const stop = new AbortController();

  function syncAmbiance() {
    sound.updateAmbiance(elahPhase(s), s.armorLeft.length);
  }

  function setupView() {
    view = undefined;
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const initialView = createElahView(canvas, ctx);
        initialView.draw(s, 0, motion.matches);
        view = initialView;
      }
    } catch { /* Target buttons remain operable without 2D canvas. */ }
    ctxLost = !view;
    dirty = true;
  }

  function publish() {
    const phase = elahPhase(s);
    const near = nearbyStone(s)?.id ?? (nearStandoff(s) ? 'meet' : undefined);
    if (!dirty && revision === s.seq && nearId === near && stepShown === s.verseStep && phaseShown === phase) {
      return;
    }
    revision = s.seq;
    nearId = near;
    stepShown = s.verseStep;
    phaseShown = phase;
    dirty = false;
    onChange({ ...readHud(s), paused, sound: audible, visual: !ctxLost, ready: true });
  }

  function change() {
    if (s.seq !== handled) {
      if (s.actionKind !== 'none') {
        sound.play(s.actionKind, motion.matches);
      }
      handled = s.seq;
      syncAmbiance();
    }
    publish();
  }

  function active() {
    if (document.hidden || paused) return false;
    sound.unlock();
    return true;
  }

  function perform() {
    if (!active()) return;
    act(s);
    change();
  }

  function go(id: string) {
    if (!active()) return;
    approach(s, id);
    change();
  }

  function reset() {
    sound.unlock();
    s = newElah();
    paused = false;
    held.clear();
    pointer.clear();
    handled = s.seq;
    lastStepBucket = 0;
    last = 0;
    revision = -1;
    stepShown = -1;
    phaseShown = '';
    dirty = true;
    dirtyPaint = true;
    sound.setPaused(false);
    syncAmbiance();
    view?.size();
    publish();
    canvas.focus({ preventScroll: true });
  }

  function pause(next: boolean) {
    if (paused === next) return;
    paused = next;
    held.clear();
    pointer.clear();
    last = 0;
    dirty = true;
    sound.setPaused(paused);
    publish();
  }

  function togglePause() {
    sound.unlock();
    pause(!paused);
    if (!paused) canvas.focus({ preventScroll: true });
  }

  function toggleSound() {
    audible = !audible;
    sound.setEnabled(audible);
    dirty = true;
    publish();
  }

  function animate(now: number) {
    const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 0;
    last = now;
    if (!paused && !document.hidden) {
      let { x, y } = pointer.axis;
      for (const key of held) {
        const v = keys[key];
        x += v[0];
        y += v[1];
      }
      stepElah(s, dt, x, y);
      const stepBucket = Math.floor(s.stride / Math.PI);
      if (s.walking && stepBucket > lastStepBucket) {
        lastStepBucket = stepBucket;
        if (isInBrook(s.player)) sound.play('step-brook');
        else if (s.armorLeft.length > 0) sound.play('step-heavy');
        else sound.play('step-light');
      }
      change();
    }
    if (!ctxLost && view && (!paused || dirtyPaint)) {
      try {
        view.draw(s, dt, motion.matches);
      } catch {
        ctxLost = true;
        dirty = true;
        publish();
      }
    }
    dirtyPaint = false;
    frame = requestAnimationFrame(animate);
  }

  const opts = { signal: stop.signal };
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target && target !== document.body && target !== document.documentElement && !section?.contains(target)) {
      return;
    }
    if (target?.closest('summary, a, input, textarea, select')) return;
    if (keys[e.code]) {
      e.preventDefault();
      if (active()) held.add(e.code);
    } else if (e.code === 'KeyP' || (e.code === 'Escape' && !paused && target === canvas)) {
      if (!e.repeat) {
        e.preventDefault();
        togglePause();
      }
    } else if ((e.code === 'Space' || e.code === 'Enter') && !target?.closest('button')) {
      e.preventDefault();
      if (!e.repeat) perform();
    }
  }, opts);

  window.addEventListener('keyup', (e) => held.delete(e.code), opts);
  window.addEventListener('blur', () => pause(true), opts);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(true);
  }, opts);

  const resize = new ResizeObserver(() => {
    view?.size();
    dirtyPaint = true;
  });
  const pointer = elahPointer(canvas, stop.signal, active, () => (ctxLost ? undefined : view), () => s, go);

  canvas.addEventListener('contextlost', (e) => {
    e.preventDefault();
    pointer.clear();
    ctxLost = true;
    dirty = true;
    publish();
  }, opts);
  canvas.addEventListener('contextrestored', () => {
    setupView();
    dirtyPaint = true;
    publish();
  }, opts);

  setupView();
  resize.observe(canvas);
  publish();
  frame = requestAnimationFrame(animate);

  return {
    perform,
    go,
    reset,
    togglePause,
    toggleSound,
    dispose() {
      stop.abort();
      resize.disconnect();
      cancelAnimationFrame(frame);
      sound.close();
    },
  };
}
