import { runtime } from './runtime';
import { useGame } from './store';
type Sample = { deltaX?: number; deltaY?: number; deltaMode?: number; momentum?: boolean; isTrusted?: boolean };
type Row = Sample & { event: string; ms: number; speed: number; flying: boolean; shooter: boolean; touchScheme: string };
const LIMIT = 6000;
export const gestureLog = { enabled: false, rows: [] as Row[], count: 0, start: 0 };
export function startGestureLog() { gestureLog.rows = []; gestureLog.count = 0; gestureLog.start = performance.now(); gestureLog.enabled = true; }
export function recordGesture(event: string, sample: Sample = {}) {
  if (!gestureLog.enabled) return;
  const g = useGame.getState();
  const { deltaX, deltaY, deltaMode, momentum, isTrusted } = sample;
  gestureLog.rows[gestureLog.count++ % LIMIT] = {
    event, ms: Math.round(performance.now() - gestureLog.start),
    deltaX, deltaY, deltaMode, momentum, isTrusted,
    speed: runtime.speed, flying: g.flying, shooter: g.shooter, touchScheme: g.touchScheme,
  };
}
export function gestureRecording() {
  const g = useGame.getState();
  const start = gestureLog.count > LIMIT ? gestureLog.count % LIMIT : 0;
  return {
    browser: navigator.userAgent, date: new Date().toISOString(), viewport: [innerWidth, innerHeight],
    settings: { lookSensitivity: g.lookSensitivity, invertY: g.invertY, touchScheme: g.touchScheme, shooter: g.shooter },
    scope: 'Latest 6,000 locally recorded input events.',
    rows: [...gestureLog.rows.slice(start), ...gestureLog.rows.slice(0, start)],
  };
}
