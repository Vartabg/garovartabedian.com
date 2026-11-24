import { runStoryStage } from "../_shared/storyStage";
import {
  act, activeCard, actTwoCount, approach, courtComplete, eveningAt, eveningReady,
  nearby, nearbyEncounter, newCourt, stepCourt, visibleEncounters, walkTo, type Court,
} from "./courtGame";
import { createView } from "./courtView";
import { makeCourtSound } from "./courtSound";

export function readHud(s: Court) {
  const nearFix = nearby(s);
  const complete = courtComplete(s);
  const nearEnc = complete ? nearbyEncounter(s) : undefined;
  const actions = { gate: "Bar passage", seat: "Tip seat", table: "Flip table" };
  const encActions = { lame: "Heal", blind: "Heal", scribes: "Answer scribes", depart: "Leave at evening" };
  const action = complete
    ? (nearEnc ? encActions[nearEnc.kind] : "Teach")
    : (nearFix ? actions[nearFix.kind] : "Shove");

  return {
    fixtures: s.fixtures.map(f => ({ id: f.id, label: f.label, done: f.at !== null, kind: f.kind })),
    encounters: visibleEncounters(s).map(e => ({ id: e.id, label: e.label, done: e.at !== null, kind: e.kind })),
    action,
    actionTone: nearEnc ? nearEnc.kind : (complete ? "teach" : "shove"),
    count: s.fixtures.filter(f => f.kind !== "gate" && f.at !== null).length,
    barred: s.fixtures.some(f => f.kind === "gate" && f.at !== null),
    complete,
    actTwoDone: actTwoCount(s),
    evening: eveningAt(s) !== null,
    departed: s.departedAt !== null,
    teachingStep: s.teachingStep,
    card: activeCard(s),
    message: s.message,
    paused: false, sound: true, visual: true, ready: false,
  };
}
export type CourtHud = ReturnType<typeof readHud>;
export type CourtController = ReturnType<typeof runCourt>;

export function runCourt(canvas: HTMLCanvasElement, onChange: (hud: CourtHud) => void) {
  const sound = makeCourtSound();
  let s = newCourt();
  let audible = true;
  let ctxLost = false;
  let view: ReturnType<typeof createView> | undefined;
  let revision = -1, nearId: string | undefined, stepShown = -1, dirty = true;
  let lastShove = s.shoveAt, handled = s.seq;
  let lastCoinKick = s.coinKickAt, lastCoinSoundMs = -Infinity;
  let lastStepBucket = 0;
  let duskSoundPlayed = false;

  function syncAmbiance() {
    const tablesLeft = s.fixtures.filter(f => f.kind === "table" && f.at === null).length;
    const seatsLeft = s.fixtures.filter(f => f.kind === "seat" && f.at === null).length;
    const barred = s.fixtures.some(f => f.kind === "gate" && f.at !== null);
    sound.updateAmbiance(tablesLeft + seatsLeft, barred, tablesLeft, seatsLeft);
  }

  function publish() {
    const near = (courtComplete(s) ? nearbyEncounter(s) : nearby(s))?.id;
    if (!dirty && revision === s.seq && nearId === near && stepShown === s.teachingStep) return;
    revision = s.seq; nearId = near; stepShown = s.teachingStep; dirty = false;
    onChange({ ...readHud(s), paused: stage.isPaused(), sound: audible, visual: !ctxLost, ready: true });
  }

  function change() {
    if (s.seq !== handled) {
      if (s.actionKind === "heal" || s.actionKind === "answer" || s.actionKind === "depart" || s.actionKind === "teach") {
        sound.play(s.actionKind);
      } else if (s.shoveAt !== lastShove || s.time === 0) {
        const struck = s.fixtures.find(f => f.at === s.shoveAt);
        sound.play(struck?.kind ?? "air");
      }
      handled = s.seq; lastShove = s.shoveAt;
      syncAmbiance();
      if (eveningReady(s) && !duskSoundPlayed) {
        duskSoundPlayed = true;
        sound.play("dusk");
      }
    }
    publish();
  }

  function perform() {
    if (!stage.isActive() || s.departedAt !== null) return;
    act(s);
    change();
  }

  function go(id: string) {
    if (!stage.isActive() || s.departedAt !== null) return;
    approach(s, id);
    change();
  }

  function setupView(reduced: boolean) {
    view = undefined;
    try {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const initialView = createView(canvas, ctx);
        initialView.draw(s, 0, reduced);
        view = initialView;
      }
    } catch { /* The target buttons still run the court. */ }
    ctxLost = !view;
    dirty = true;
  }

  const stage = runStoryStage(canvas, {
    onInteract: () => sound.unlock(),
    onPerform: perform,
    toWorld: (x, y) => (!ctxLost && view ? view.toWorld(x, y) : undefined),
    onTap(position) {
      if (ctxLost || !view || s.departedAt !== null) return;
      const fixture = view.hit(s, position);
      if (fixture) go(fixture.id);
      else walkTo(s, position);
    },
    onStep(dt, x, y, now) {
      stepCourt(s, dt, x, y);
      if (s.coinKickAt > lastCoinKick) {
        lastCoinKick = s.coinKickAt;
        if (now - lastCoinSoundMs >= 110) {
          lastCoinSoundMs = now;
          sound.play("coin");
        }
      }
      const stepBucket = Math.floor(s.stride / Math.PI);
      if (s.walking && stepBucket > lastStepBucket) {
        lastStepBucket = stepBucket;
        sound.play("step");
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
    s = newCourt();
    stage.setPaused(false);
    stage.clearInput();
    handled = s.seq; lastShove = s.shoveAt;
    lastCoinKick = s.coinKickAt; lastStepBucket = 0; duskSoundPlayed = false;
    revision = -1; stepShown = -1; dirty = true;
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
