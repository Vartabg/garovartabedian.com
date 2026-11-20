import { controlKey, controlsFor, type ControlFamily, type ControlId } from '@/game/controlTypes';

const STORAGE_KEY = 'hermon.controls.played.v1';
const TRIED_SECONDS = 20;
type PlayTime = Partial<Record<string, number>>;
let seconds: PlayTime | undefined;

function playTime(): PlayTime {
  if (seconds) return seconds;
  seconds = {};
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const [key, value] of Object.entries(saved)) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) seconds[key] = value;
      }
    }
  } catch { /* The controls also work when browser storage is unavailable. */ }
  return seconds;
}

export function recordPlayedSecond(family: ControlFamily, control: ControlId) {
  const play = playTime(), key = controlKey(family, control);
  play[key] = Math.min(TRIED_SECONDS, (play[key] ?? 0) + 1);
}

export function triedIds(family: ControlFamily): ControlId[] {
  const play = playTime();
  return controlsFor(family).filter(control => (play[controlKey(family, control.id)] ?? 0) >= TRIED_SECONDS)
    .map(control => control.id);
}

export function savePlayedControls() {
  try { if (seconds) localStorage.setItem(STORAGE_KEY, JSON.stringify(seconds)); } catch { /* Memory still holds this session. */ }
}
