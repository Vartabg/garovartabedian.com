import { runStoryStage } from '../_shared/storyStage';
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
  walkTo,
  type ElahState,
} from './elahGame';
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
  const sound = makeElahSound();
  let s = newElah();
  let audible = true;
  let ctxLost = false;
  let view: ReturnType<typeof createElahView> | undefined;
  let revision = -1;
  let nearId: string | undefined;
  let stepShown = -1;
  let phaseShown = '';
  let dirty = true;
  let handled = s.seq;
  let lastStepBucket = 0;
  let lastWhirlBucket = -1;

  function syncAmbiance() {
    sound.updateAmbiance(elahPhase(s), s.armorLeft.length);
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
    onChange({ ...readHud(s), paused: stage.isPaused(), sound: audible, visual: !ctxLost, ready: true });
  }

  function change() {
    if (s.seq !== handled) {
      if (s.actionKind !== 'none') {
        sound.play(s.actionKind, stage.reduced());
      }
      handled = s.seq;
      syncAmbiance();
    }
    publish();
  }

  function perform() {
    if (!stage.isActive()) return;
    act(s);
    change();
  }

  function go(id: string) {
    if (!stage.isActive()) return;
    approach(s, id);
    change();
  }

  function setupView(reduced: boolean) {
    view = undefined;
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const initialView = createElahView(canvas, ctx);
        initialView.draw(s, 0, reduced);
        view = initialView;
      }
    } catch { /* Target buttons remain operable without 2D canvas. */ }
    ctxLost = !view;
    dirty = true;
  }

  const stage = runStoryStage(canvas, {
    onInteract: () => sound.unlock(),
    onPerform: perform,
    toWorld: (x, y) => (!ctxLost && view ? view.toWorld(x, y) : undefined),
    onTap(position) {
      if (ctxLost || !view) return;
      const hitId = view.hit(s, position);
      if (hitId) go(hitId);
      else walkTo(s, position);
    },
    onStep(dt, x, y, _now, reduced) {
      stepElah(s, dt, x, y);
      const stepBucket = Math.floor(s.stride / Math.PI);
      if (s.walking && stepBucket > lastStepBucket) {
        lastStepBucket = stepBucket;
        if (isInBrook(s.player)) sound.play('step-brook');
        else if (s.armorLeft.length > 0) sound.play('step-heavy');
        else sound.play('step-light');
      }
      if (!reduced && elahPhase(s) === 'sling') {
        const whirlBucket = Math.floor((s.time * 8.2) / (Math.PI * 2));
        if (whirlBucket > lastWhirlBucket) {
          lastWhirlBucket = whirlBucket;
          sound.play('whirl');
        }
      } else {
        lastWhirlBucket = -1;
      }
      change();
    },
    onDraw(dt, reduced) {
      if (!ctxLost && view) view.draw(s, dt, reduced);
    },
    onResize: () => view?.size(),
    onContextLost() {
      ctxLost = true;
      dirty = true;
      publish();
    },
    onContextRestored() {
      setupView(stage.reduced());
      publish();
    },
    onPauseChange(paused) {
      sound.setPaused(paused);
      dirty = true;
      publish();
    },
    onVisualError() {
      ctxLost = true;
      dirty = true;
      publish();
    },
  });

  function reset() {
    sound.unlock();
    s = newElah();
    stage.setPaused(false);
    stage.clearInput();
    handled = s.seq;
    lastStepBucket = 0;
    lastWhirlBucket = -1;
    revision = -1;
    stepShown = -1;
    phaseShown = '';
    dirty = true;
    sound.setPaused(false);
    syncAmbiance();
    view?.size();
    stage.requestPaint();
    publish();
    canvas.focus({ preventScroll: true });
  }

  function toggleSound() {
    audible = !audible;
    sound.setEnabled(audible);
    dirty = true;
    publish();
  }

  setupView(stage.reduced());
  publish();

  return {
    perform,
    go,
    reset,
    togglePause: () => stage.togglePause(),
    toggleSound,
    dispose() {
      stage.dispose();
      sound.close();
    },
  };
}
