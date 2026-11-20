import { act, approach, courtComplete, nearby, newCourt, stepCourt, type Court } from "./courtGame";
import { createView } from "./courtView";
import { courtPointer } from "./courtPointer";
import { makeCourtSound } from "./courtSound";

export function readHud(s: Court) {
  const near = nearby(s);
  const actions = { gate: "Bar passage", seat: "Tip seat", table: "Flip table" };
  return {
    fixtures: s.fixtures.map(f => ({ id: f.id, label: f.label, done: f.at !== null, kind: f.kind })),
    action: near ? actions[near.kind] : "Shove",
    count: s.fixtures.filter(f => f.kind !== "gate" && f.at !== null).length,
    barred: s.fixtures.some(f => f.kind === "gate" && f.at !== null), complete: courtComplete(s), message: s.message,
    paused: false, sound: true, visual: true, ready: false,
  };
}
export type CourtHud = ReturnType<typeof readHud>;
export type CourtController = ReturnType<typeof runCourt>;

export function runCourt(canvas: HTMLCanvasElement, onChange: (hud: CourtHud) => void) {
  const section = canvas.closest("section");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sound = makeCourtSound();
  const held = new Set<string>();
  const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };
  let s = newCourt(), paused = false, audible = true, ctxLost = false;
  let view: ReturnType<typeof createView> | undefined;
  let frame = 0, last = 0, revision = -1, nearId: string | undefined, dirty = true;
  let lastShove = s.shoveAt, handled = s.seq;
  const stop = new AbortController();
  function setupView() {
    view = undefined;
    try {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const initialView = createView(canvas, ctx);
        initialView.draw(s, 0, motion.matches);
        view = initialView;
      }
    } catch { /* The target buttons still run the court. */ }
    ctxLost = !view; dirty = true;
  }
  function publish() {
    const near = nearby(s)?.id;
    if (!dirty && revision === s.seq && nearId === near) return;
    revision = s.seq; nearId = near; dirty = false;
    onChange({ ...readHud(s), paused, sound: audible, visual: !ctxLost, ready: true });
  }
  function change() {
    if (s.seq !== handled) {
      if (s.shoveAt !== lastShove || s.time === 0) {
        const struck = s.fixtures.find(f => f.at === s.shoveAt);
        sound.play(struck?.kind ?? "air");
      }
      handled = s.seq; lastShove = s.shoveAt;
    }
    publish();
  }
  function active() {
    if (document.hidden || paused) return false;
    sound.unlock();
    return true;
  }
  function perform() { if (!active()) return; act(s); change(); }
  function go(id: string) { if (!active()) return; approach(s, id); change(); }
  function reset() {
    sound.unlock(); s = newCourt(); paused = false; held.clear(); pointer.clear(); handled = s.seq; lastShove = s.shoveAt;
    last = 0; revision = -1; dirty = true; view?.size(); publish(); canvas.focus({ preventScroll: true });
  }
  function pause(next: boolean) {
    if (paused === next) return;
    paused = next; held.clear(); pointer.clear(); last = 0; dirty = true; publish();
  }
  function togglePause() { sound.unlock(); pause(!paused); if (!paused) canvas.focus({ preventScroll: true }); }
  function toggleSound() { audible = !audible; sound.setEnabled(audible); dirty = true; publish(); }
  function animate(now: number) {
    const dt = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 0; last = now;
    if (!paused && !document.hidden) {
      let { x, y } = pointer.axis;
      for (const key of held) { const v = keys[key]; x += v[0]; y += v[1]; }
      stepCourt(s, dt, x, y); change();
    }
    if (!ctxLost && view && (!paused || dirtyPaint)) {
      try { view.draw(s, dt, motion.matches); } catch {
        ctxLost = true; dirty = true; publish();
      }
    }
    dirtyPaint = false;
    frame = requestAnimationFrame(animate);
  }
  let dirtyPaint = true;
  const opts = { signal: stop.signal };
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target && target !== document.body && target !== document.documentElement && !section?.contains(target)) return;
    if (target?.closest("summary, a, input, textarea, select")) return;
    if (keys[e.code]) {
      e.preventDefault();
      if (active()) held.add(e.code);
    } else if (e.code === "KeyP" || e.code === "Escape" && (!paused && target === canvas)) {
      if (!e.repeat) { e.preventDefault(); togglePause(); }
    } else if ((e.code === "Space" || e.code === "Enter") && !target?.closest("button")) {
      e.preventDefault(); if (!e.repeat) perform();
    }
  }, opts);
  window.addEventListener("keyup", e => held.delete(e.code), opts);
  window.addEventListener("blur", () => pause(true), opts);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(true); }, opts);
  const resize = new ResizeObserver(() => { view?.size(); dirtyPaint = true; });
  const pointer = courtPointer(canvas, stop.signal, active, () => ctxLost ? undefined : view, () => s, go);
  canvas.addEventListener("contextlost", e => {
    e.preventDefault(); pointer.clear(); ctxLost = true; dirty = true; publish();
  }, opts);
  canvas.addEventListener("contextrestored", () => { setupView(); dirtyPaint = true; publish(); }, opts);
  setupView();
  resize.observe(canvas);
  publish();
  frame = requestAnimationFrame(animate);
  return {
    perform, go, reset, togglePause, toggleSound,
    dispose() {
      stop.abort();
      resize.disconnect();
      cancelAnimationFrame(frame);
      sound.close();
    },
  };
}
