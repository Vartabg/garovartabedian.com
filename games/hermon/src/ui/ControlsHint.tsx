import FlightFeel from './FlightFeel';
import { useEffect, useRef, useState } from 'react';
import { HINT_STEPS, persistGame, useGame, type HintSeries } from '@/game/store';
import { runtime } from '@/game/runtime';
import { LINE_MS, hintDone, hintText, hintTrack, nextStep, progressToSave, type HintObs, type HintTrack } from './hintSteps';
import { slotBusy } from './hintQueue';

const EVERY_MS = 150, MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF'];
const line = { ms: 0, flown: false, touched: false };
const gone = (t: HintTrack) => t === 'tap' ? line.ms >= LINE_MS : (t === 'classic' || t === 'drag') && (line.flown || line.touched);
const trail = { series: null as HintSeries | null, since: null as HintObs | null, look: 0, yaw: 0, pitch: 0, moved: false,
  landed: false, wasFlying: false };
const session: Record<HintSeries, number> = { touch: 0, mouse: 0 };
const timedOut: Record<HintSeries, number> = { touch: -1, mouse: -1 };
const isLocked = () => typeof document !== 'undefined' && !!document.pointerLockElement;

export default function ControlsHint({ coarse }: { coarse: boolean }) {
  const shooter = useGame(s => s.shooter), tapControls = useGame(s => s.tapControls), progress = useGame(s => s.hintProgress),
    scheme = useGame(s => s.touchScheme);
  const track = hintTrack({ shooter, coarse, tapControls, scheme });
  const series = track === 'touch' || track === 'mouse' ? track : null;
  const [captured, setCaptured] = useState(isLocked), [said, setSaid] = useState(''), [, rerender] = useState(0);
  useState(() => { if (!line.flown) line.ms = 0; });
  const step = series ? Math.max(progress[series], session[series]) : 0;
  const capRef = useRef(captured), shownAt = useRef(0);

  useEffect(() => {
    if (!series || step >= HINT_STEPS[series]) return;
    let done = false;
    const observe = (cap: boolean): HintObs => {
      const st = runtime.shooter.stats, stick = runtime.stick, flying = useGame.getState().flying;
      if (MOVE_KEYS.some(k => runtime.keys.has(k)) || (trail.since && flying !== trail.since.flying)) trail.moved = true;
      if (trail.since && trail.wasFlying && !flying) trail.landed = true;
      trail.wasFlying = flying;
      return { flying, captured: cap, look: trail.look, hits: st.hits, shots: st.shots, moved: trail.moved,
        moves: stick.moves, climbs: stick.climbs, touchLook: stick.lookTravel, landed: trail.landed };
    };
    if (trail.series !== series) {
      Object.assign(trail, { series, since: null, look: 0, yaw: runtime.yaw, pitch: runtime.pitch, moved: false, landed: false,
        wasFlying: useGame.getState().flying });
      trail.since = observe(isLocked());
    }
    shownAt.current = performance.now();
    const evaluate = () => {
      if (done) return;
      const cap = isLocked();
      if (cap !== capRef.current) { capRef.current = cap; setCaptured(cap); }
      const game = useGame.getState();
      if (game.paused) { shownAt.current += EVERY_MS; return; }
      if (slotBusy(game)) shownAt.current += EVERY_MS;
      if (cap) trail.look += Math.abs(runtime.yaw - trail.yaw) + Math.abs(runtime.pitch - trail.pitch);
      trail.yaw = runtime.yaw; trail.pitch = runtime.pitch;
      const now = observe(cap), verdict = hintDone(series, step, now, trail.since!, (performance.now() - shownAt.current) / 1000, shooter);
      if (!verdict) return;
      done = true;
      if (verdict === 'timeout' && timedOut[series] < 0) timedOut[series] = step;
      session[series] = nextStep(series, step + 1, now, trail.since!, shooter);
      const save = progressToSave(session[series], timedOut[series]), p = useGame.getState().hintProgress;
      if (save > p[series]) { useGame.setState({ hintProgress: { ...p, [series]: save } }); persistGame(); }
      rerender(n => n + 1);
    };
    const id = setInterval(evaluate, EVERY_MS);
    document.addEventListener('pointerlockchange', evaluate);
    return () => { clearInterval(id); document.removeEventListener('pointerlockchange', evaluate); };
  }, [series, step, shooter]);

  useEffect(() => {
    if (series || track === 'none') return;
    const touch = (e: Event) => { if ((e.target as Element | null)?.closest?.('[data-play-surface]')) line.touched = true; };
    document.addEventListener('pointerdown', touch, true);
    const id = setInterval(() => {
      const game = useGame.getState(), was = gone(track);
      if (game.flying) line.flown = true;
      if (!was && !game.paused && !slotBusy(game)) line.ms += EVERY_MS;
      if (gone(track) !== was) rerender(n => n + 1);
    }, EVERY_MS);
    return () => { document.removeEventListener('pointerdown', touch, true); clearInterval(id); };
  }, [series, track]);

  const text = gone(track) ? null : hintText(track, step, { captured, shooter });
  useEffect(() => { setSaid(text ?? ''); useGame.setState({ coach: text === null ? null : { text, track, step } }); }, [text, track, step]);
  useEffect(() => () => useGame.setState({ coach: null }), []);
  return <><FlightFeel /><div className="sr-only" aria-live="polite" data-testid="hint-live">{said}</div></>;
}
