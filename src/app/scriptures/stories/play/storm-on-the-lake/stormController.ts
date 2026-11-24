import { createActionBuffer } from '../_shared/storyMotion';
import { runStoryStage } from '../_shared/storyStage';
import {
  act,
  activeCard,
  approach,
  launchDoneCount,
  nearStern,
  nearbyTask,
  newStorm,
  squallDoneCount,
  stepStorm,
  stormPhase,
  tryImmediateAct,
  walkTo,
  type StormState,
} from './stormGame';
import { makeStormSound } from './stormSound';
import { createStormView } from './stormView';

export function readHud(s: StormState) {
  const phase = stormPhase(s);
  const launchDone = launchDoneCount(s);
  const squallDone = squallDoneCount(s);
  const near = nearbyTask(s);

  let action = 'Read verse';
  let actionTone: 'launch' | 'squall' | 'wake' | 'rebuke' | 'calm' = 'calm';
  if (phase === 'launch') {
    action = near ? near.actionLabel : 'Work deck';
    actionTone = 'launch';
  } else if (phase === 'squall') {
    action = near ? near.actionLabel : 'Fight squall';
    actionTone = 'squall';
  } else if (phase === 'wake') {
    action = 'Wake Jesus';
    actionTone = 'wake';
  } else if (phase === 'rebuke') {
    action = 'Speak to the sea';
    actionTone = 'rebuke';
  }

  const visibleTasks = s.tasks
    .filter(t => t.stage === 'launch' || phase !== 'launch')
    .map(t => ({
      id: t.id,
      label: t.label,
      done: t.at !== null,
      locked: false,
    }));

  return {
    phase,
    launchDone,
    squallDone,
    waterPercent: Math.round(s.waterLevel * 100),
    tasks: visibleTasks,
    canWake: phase === 'wake' || s.wokeAt !== null,
    woke: s.wokeAt !== null,
    calmed: s.calmedAt !== null,
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

export type StormHud = ReturnType<typeof readHud>;
export type StormController = ReturnType<typeof runStorm>;

export function runStorm(canvas: HTMLCanvasElement, onChange: (hud: StormHud) => void) {
  const sound = makeStormSound();
  const actionBuffer = createActionBuffer(0.14);
  let s = newStorm();
  let audible = true;
  let ctxLost = false;
  let view: ReturnType<typeof createStormView> | undefined;
  let revision = -1;
  let nearId: string | undefined;
  let stepShown = -1;
  let phaseShown = '';
  let dirty = true;
  let handled = s.seq;
  let lastWaveHitSeq = s.waveHitSeq;
  let lastStepBucket = 0;

  function syncAmbiance() {
    sound.updateAmbiance(stormPhase(s), s.stormIntensity);
  }

  function publish() {
    const phase = stormPhase(s);
    const near = nearbyTask(s)?.id ?? (nearStern(s) ? 'stern' : undefined);
    if (!dirty && revision === s.seq && nearId === near && stepShown === s.verseStep && phaseShown === phase) {
      return;
    }
    if (phaseShown && phaseShown !== phase) {
      actionBuffer.clear();
    }
    revision = s.seq;
    nearId = near;
    stepShown = s.verseStep;
    phaseShown = phase;
    dirty = false;
    onChange({ ...readHud(s), paused: stage.isPaused(), sound: audible, visual: !ctxLost, ready: true });
  }

  function change() {
    if (s.waveHitSeq !== lastWaveHitSeq) {
      lastWaveHitSeq = s.waveHitSeq;
      sound.play('wave-slam');
      handled = s.seq;
      syncAmbiance();
    } else if (s.seq !== handled) {
      if (s.actionKind !== 'none') {
        sound.play(s.actionKind);
      }
      handled = s.seq;
      syncAmbiance();
    }
    publish();
  }

  function perform() {
    if (!stage.isActive()) return;
    if (tryImmediateAct(s)) {
      actionBuffer.clear();
      change();
      return;
    }
    // If actively moving toward a station, hold input for 140 ms so near-reach presses land smoothly.
    if (s.walking || s.destination !== null) {
      actionBuffer.arm();
      return;
    }
    act(s);
    change();
  }

  function go(id: string) {
    if (!stage.isActive()) return;
    actionBuffer.clear();
    approach(s, id);
    change();
  }

  function setupView(reduced: boolean) {
    view = undefined;
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const initialView = createStormView(canvas, ctx);
        initialView.draw(s, 0, reduced);
        view = initialView;
      }
    } catch { /* Boat targets remain operable without 2D canvas. */ }
    ctxLost = !view;
    dirty = true;
  }

  const stage = runStoryStage(canvas, {
    onInteract: () => sound.unlock(),
    onPerform: perform,
    toWorld: (x, y) => (!ctxLost && view ? view.toWorld(x, y) : undefined),
    onHover(deckPt) {
      if (ctxLost || !view || !deckPt) {
        view?.setHovered(undefined);
        return false;
      }
      const hitId = view.hit(s, deckPt);
      view.setHovered(hitId);
      return Boolean(hitId);
    },
    onTap(deckPt) {
      if (ctxLost || !view) return;
      actionBuffer.clear();
      const hitId = view.hit(s, deckPt);
      if (hitId) go(hitId);
      else walkTo(s, deckPt);
    },
    onStep(dt, x, y) {
      stepStorm(s, dt, x, y);
      actionBuffer.tick(
        dt,
        () => tryImmediateAct(s),
        () => act(s),
      );
      const stepBucket = Math.floor(s.stride / Math.PI);
      if (s.walking && stepBucket > lastStepBucket) {
        lastStepBucket = stepBucket;
        sound.play('step');
      }
      change();
    },
    onDraw(dt, reduced) {
      if (!ctxLost && view) view.draw(s, dt, reduced, stage.getDragState());
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
      if (paused) actionBuffer.clear();
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
    actionBuffer.clear();
    s = newStorm();
    stage.setPaused(false);
    stage.clearInput();
    handled = s.seq;
    lastWaveHitSeq = s.waveHitSeq;
    lastStepBucket = 0;
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
