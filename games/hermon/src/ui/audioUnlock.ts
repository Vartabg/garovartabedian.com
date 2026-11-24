// AudioContext singleton, synchronous user-gesture unlock (required on iOS), and release for Mount Hermon combat audio.
// With Watchers off or audio muted, nothing is created and the browser audio session is never touched.
import { useGame } from '../game/store';
type Session = { type: string };
let ctx: AudioContext | null = null, sessionSet = false, watching = false;

function session(): Session | undefined {
  try { return typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { audioSession?: Session }).audioSession; }
  catch { return undefined; }
}
function restoreSession() {
  if (!sessionSet) return;
  sessionSet = false;
  try { const s = session(); if (s) s.type = 'auto'; } catch { /* unsupported */ }
}
function makeContext() {
  const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}
/** The live combat audio context, or null before first unlock and after release. */
export const hermonAudioContext = () => ctx;

/** Suspends the context (pause, mute, hidden tab) and restores the audio session. */
export function quietHermonAudio() {
  const c = ctx;
  if (c && c.state === 'running' && typeof c.suspend === 'function') {
    try { void c.suspend().catch(() => {}); } catch { /* already closing */ }
  }
  restoreSession();
}
/** Closes the context completely (Watchers off, fault). */
export function releaseHermonAudio() {
  const c = ctx; ctx = null;
  if (c) { try { void c.close().catch(() => {}); } catch { /* already closed */ } }
  restoreSession();
}
function watch() {
  if (watching) return;
  watching = true;
  useGame.subscribe((s, p) => {
    if (!s.shooter) { if (p.shooter) releaseHermonAudio(); return; }
    if ((s.muted && !p.muted) || (s.paused && !p.paused) || (!s.started && p.started)) quietHermonAudio();
  });
  if (typeof document !== 'undefined')
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') quietHermonAudio(); });
}
/**
 * Call inside a click, key, mouse press or pointerup handler. Returns immediately while Watchers are off or muted.
 */
export function unlockHermonAudio() {
  const g = useGame.getState();
  if (!g.shooter || g.muted) return;
  watch();
  try {
    if (!ctx || ctx.state === 'closed') ctx = makeContext();
    if (ctx) void ctx.resume().catch(() => {});
  } catch { ctx = null; }
  try { const s = session(); if (s) { s.type = 'playback'; sessionSet = true; } } catch { /* unsupported */ }
}
