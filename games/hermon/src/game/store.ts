import { create } from 'zustand';
import { START, validCheckpoint, type Vec } from './motion';
import { TERMINAL_IDS } from './navigation';
import type { LimitCue } from './limitCue';
export type CameraMode = 'third' | 'first';
export type TrackpadProfile = 'simple' | 'free' | 'captured' | 'flow';
/**
 * 2: one finger + keyboard became the trackpad default. A save from before it that holds the old default ('free') moves to 'simple'.
 * 3: industry touch controls, Garo 2026-09-24 (twin stick, Aim button shown, the touch hints start over).
 * 4: the classic free trackpad is the desktop default again (Garo 2026-09-24). A save from before 4 holding 'simple' returns to 'free'.
 * 5: easier 360 turns (Garo 2026-09-25). A save from before 5 turns look acceleration and sustained edges on and gains edge rest on;
 *    a save at 5 or later keeps its own choices.
 * 6: one-finger flight is the phone default again (Garo 2026-09-26). A save from before 6 moves touchScheme to 'classic' (the twin
 *    default of 3-5 cannot be told apart from a choice); an explicit 'twin' saved at 6 or later persists.
 * 7: unified standard 3D desktop flight + calm exploration default (Garo 2026-11-23). Pre-v7 saves migrate to desktopMode 'mouse',
 *    shooter false (opt-in Watchers battle), and controlLab 'standard'.
 */
export const CONTROLS_VERSION = 7;
export type TouchScheme = 'twin' | 'classic';
export type HintSeries = 'touch' | 'simple' | 'mouse';
/** The Gesture Lab (docs: gesture lab spec 8). 'standard' is the restored desktop controls and, on a phone, one-finger flight with tap-a-drone; it stays the default. */
export type ControlLab = 'standard' | 'draw' | 'conduct' | 'brush';
export const CONTROL_LABS: readonly ControlLab[] = ['standard', 'draw', 'conduct', 'brush'];
export const isControlLab = (v: unknown): v is ControlLab => typeof v === 'string' && (CONTROL_LABS as readonly string[]).includes(v);
export type HintProgress = Record<HintSeries, number>;
/** A controls lesson for the hint slot: its text, the track that teaches it and the step it is on (data-track and data-step in the slot). */
export interface Coach { text: string; track: string; step: number }
/** Steps per progressive hint series; progress === HINT_STEPS[series] means done. */
export const HINT_STEPS: Readonly<HintProgress> = { touch: 4, simple: 4, mouse: 4 };
/** Each field: finite → floored and clamped to [0, HINT_STEPS[k]]; otherwise 0. A non-object → all 0. */
export function validHintProgress(raw: unknown): HintProgress {
  const o = raw !== null && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const one = (k: HintSeries) => { const v = o[k]; return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(HINT_STEPS[k], Math.floor(v))) : 0; };
  return { touch: one('touch'), simple: one('simple'), mouse: one('mouse') };
}
type GameState = {
  started: boolean; paused: boolean; ready: boolean; panel: boolean; journal: boolean;
  camera: CameraMode; quality: 'high' | 'low'; reduced: boolean; muted: boolean; tapControls: boolean;
  desktopMode: 'trackpad' | 'mouse'; trackpadFlying: boolean;
  trackpadSteering: TrackpadProfile; sustainedEdges: boolean; reverseScroll: boolean; cruiseSpeed: number; heroPoses: boolean;
  lookSensitivity: number; flowIntroSeen: boolean;
  shooter: boolean; aimToggle: boolean; aimAssist: number; controlsVersion: number;
  autoFire: boolean; aimButton: boolean; hintProgress: HintProgress;
  /** Touch controls (v3). touchLook/touchAim/controlSize/controlOpacity are multipliers clamped to TOUCH_RANGES. */
  touchScheme: TouchScheme; touchLook: number; touchAim: number; lookAccel: boolean; invertY: boolean; flipSides: boolean;
  /** Twin look thumb: a fast swipe that rests at an edge keeps turning (v5, on by default). */
  edgeRest: boolean;
  controlSize: number; controlOpacity: number; flyWhereILook: boolean; homeTipSeen: boolean;
  /** Gesture Lab scheme. */
  controlLab: ControlLab;
  /** Runtime only: a landable surface is within reach below (Descend reads Land), the Leave card, the pinch-zoom note, and a held
   *  Descend that the clearance assist stopped with no landable spot near (Descend reads "No landing"). */
  nearGround: boolean; leavePrompt: boolean; zoomNote: boolean; descendBlocked: boolean;
  /** Runtime only (never saved): the controls lesson ControlsHint has published for the one hint slot, or null. A sound notice and the
   *  one-finger panel wait while one is pending (one message at a time); the slot decides whether it is on screen (src/ui/hintQueue.ts). */
  coach: Coach | null;
  /** Runtime only (never saved): the Controls sheet is open. */
  controlsOpen: boolean;
  /** Runtime only (never saved): pointer lock is active on the flight surface. */
  pointerLocked: boolean;
  flying: boolean; landing: boolean; canLand: boolean; nearTerminal: boolean;
  nearTerminalId: string | null; nearTerminalLabel: string; journalTerminalId: string | null;
  limitCue: LimitCue; limitHint: string; clearanceActive: boolean; inputEpoch: number;
  checkpoint: Vec; discovered: boolean; discoveredTablets: string[]; message: string;
  set: (patch: Partial<Omit<GameState, 'set'>>) => void;
};
export const useGame = create<GameState>((set) => ({
  started: false, paused: true, ready: false, panel: false, journal: false,
  camera: 'third', quality: 'high', reduced: false, muted: true, tapControls: false,
  desktopMode: 'mouse', trackpadFlying: false,
  trackpadSteering: 'free', sustainedEdges: true, reverseScroll: false, cruiseSpeed: 8, heroPoses: true,
  lookSensitivity: 1, flowIntroSeen: false,
  shooter: false, aimToggle: false, aimAssist: 1, controlsVersion: CONTROLS_VERSION,
  autoFire: true, aimButton: true, hintProgress: { touch: 0, simple: 0, mouse: 0 }, coach: null,
  touchScheme: 'classic', touchLook: 1, touchAim: 1, lookAccel: true, edgeRest: true, invertY: false, flipSides: false,
  controlSize: 1, controlOpacity: .85, flyWhereILook: false, homeTipSeen: false, controlLab: 'standard',
  nearGround: false, leavePrompt: false, zoomNote: false, descendBlocked: false, controlsOpen: false, pointerLocked: false,
  flying: false, landing: false, canLand: false, nearTerminal: false, nearTerminalId: null, nearTerminalLabel: '', journalTerminalId: null,
  limitCue: '', limitHint: '', clearanceActive: false, inputEpoch: 0,
  checkpoint: START, discovered: false, discoveredTablets: [], message: '', set,
}));
const STORAGE = 'hermon.flight.v1';
const VALID_TABLETS = new Set(TERMINAL_IDS);
export function validDiscoveredTablets(raw: unknown, legacyDiscovered = false): string[] {
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === 'string' && VALID_TABLETS.has(item) && !out.includes(item)) out.push(item);
    }
    return out;
  }
  return legacyDiscovered ? ['hermon-oath-01'] : [];
}
// The single authoritative list of fields saved between sessions. persistGame
// writes exactly these keys; tests/desktop-flight.test.ts pins hydrateGame to
// restore every entry and to ignore runtime-only state.
export const PERSISTED_KEYS = ['checkpoint', 'camera', 'quality', 'reduced', 'muted', 'discovered', 'discoveredTablets', 'tapControls', 'desktopMode', 'trackpadSteering', 'sustainedEdges', 'reverseScroll', 'cruiseSpeed', 'heroPoses', 'lookSensitivity', 'flowIntroSeen', 'shooter', 'aimToggle', 'aimAssist', 'controlsVersion', 'autoFire', 'aimButton', 'hintProgress',
  'touchScheme', 'touchLook', 'touchAim', 'lookAccel', 'edgeRest', 'invertY', 'flipSides', 'controlSize', 'controlOpacity', 'flyWhereILook', 'homeTipSeen', 'controlLab'] as const;
/** [min, max, default] for the numeric touch settings. */
export const TOUCH_RANGES = { touchLook: [.5, 2, 1], touchAim: [.5, 1.5, 1], controlSize: [.85, 1.2, 1], controlOpacity: [.4, 1, .85] } as const;
const ranged = (v: unknown, [lo, hi, fallback]: readonly [number, number, number]) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
const strict = (v: unknown, fallback: boolean) => typeof v === 'boolean' ? v : fallback;
export type PersistedKey = typeof PERSISTED_KEYS[number];
export function hydrateGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    const version = typeof saved.controlsVersion === 'number' && Number.isFinite(saved.controlsVersion) ? saved.controlsVersion : 0;
    const steering = version < 4 && saved.trackpadSteering === 'simple' ? 'free' : saved.trackpadSteering;
    const before3 = version < 3, hints = validHintProgress(saved.hintProgress);
    const before5 = version < 5;
    const before6 = version < 6;
    const before7 = version < 7;
    if (before3) hints.touch = 0;
    const discoveredTablets = validDiscoveredTablets(saved.discoveredTablets, saved.discovered === true);
    useGame.setState({
      checkpoint: validCheckpoint(saved.checkpoint) ? saved.checkpoint : START,
      camera: saved.camera === 'first' ? 'first' : 'third',
      quality: saved.quality === 'low' ? 'low' : 'high',
      reduced: typeof saved.reduced === 'boolean' ? saved.reduced : matchMedia('(prefers-reduced-motion: reduce)').matches,
      muted: saved.muted !== false,
      discoveredTablets,
      discovered: discoveredTablets.length > 0,
      tapControls: saved.tapControls === true,
      desktopMode: before7 ? 'mouse' : saved.desktopMode === 'trackpad' ? 'trackpad' : 'mouse',
      trackpadSteering: ['simple', 'free', 'captured', 'flow'].includes(steering) ? steering : 'free',
      sustainedEdges: before5 || strict(saved.sustainedEdges, true), reverseScroll: saved.reverseScroll === true,
      cruiseSpeed: typeof saved.cruiseSpeed === 'number' && Number.isFinite(saved.cruiseSpeed) ? Math.max(3, Math.min(34, saved.cruiseSpeed)) : 8,
      heroPoses: saved.heroPoses !== false,
      lookSensitivity: typeof saved.lookSensitivity === 'number' && Number.isFinite(saved.lookSensitivity) ? Math.max(.5, Math.min(2, saved.lookSensitivity)) : 1,
      flowIntroSeen: saved.flowIntroSeen === true,
      shooter: before7 ? false : saved.shooter === true,
      aimToggle: saved.aimToggle === true,
      aimAssist: typeof saved.aimAssist === 'number' && Number.isFinite(saved.aimAssist) ? Math.max(0, Math.min(1.5, saved.aimAssist)) : 1,
      controlsVersion: Math.max(CONTROLS_VERSION, version),
      autoFire: saved.autoFire !== false, aimButton: before3 || strict(saved.aimButton, true),
      hintProgress: hints,
      touchScheme: !before6 && saved.touchScheme === 'twin' ? 'twin' : 'classic',
      touchLook: ranged(saved.touchLook, TOUCH_RANGES.touchLook), touchAim: ranged(saved.touchAim, TOUCH_RANGES.touchAim),
      lookAccel: before5 || strict(saved.lookAccel, true), edgeRest: before5 || strict(saved.edgeRest, true), invertY: strict(saved.invertY, false), flipSides: strict(saved.flipSides, false),
      controlSize: ranged(saved.controlSize, TOUCH_RANGES.controlSize), controlOpacity: ranged(saved.controlOpacity, TOUCH_RANGES.controlOpacity),
      flyWhereILook: strict(saved.flyWhereILook, false), homeTipSeen: strict(saved.homeTipSeen, false),
      controlLab: before7 ? 'standard' : isControlLab(saved.controlLab) ? saved.controlLab : 'standard',
    });
  } catch { useGame.setState({ reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }); }
}
// A session override (?shooter=0/1, ?controls=, a fault) is not saved: persistGame keeps writing the stored value while the state
// still equals the session value, and drops the pin once the player changes that field. One pin per state key; a key that is
// already pinned keeps its ORIGINAL saved value when it is pinned again.
const pins: Record<string, { session: unknown; saved: unknown }> = {};
function pinFields(patch: Partial<GameState>) {
  const state = useGame.getState() as Record<string, unknown>, next = patch as Record<string, unknown>;
  for (const key in next) (pins[key] ??= { session: next[key], saved: state[key] }).session = next[key];
  useGame.setState(patch);
}
export type ControlFields = Pick<GameState, 'controlLab' | 'touchScheme' | 'trackpadSteering' | 'desktopMode'>;
export const overrideShooter = (on: boolean) => pinFields({ shooter: on });
/** This session only (?controls=, a lab fault): the saved choices stay. */
export const overrideControlFields: (patch: Partial<ControlFields>) => void = pinFields;
/** The player's own choice: saved, and it ends the session override of exactly the fields in the patch. `more` rides in the same single state change. */
export function saveControlFields(patch: Partial<ControlFields>, more?: Partial<GameState>) {
  for (const key in patch) delete pins[key];
  useGame.setState({ ...patch, ...more }); persistGame();
}
export function persistGame() {
  try {
    const state = useGame.getState() as Record<string, unknown>;
    const saved: Record<string, unknown> = {};
    for (const key of PERSISTED_KEYS) saved[key] = state[key];
    for (const key in pins) if (state[key] === pins[key].session) saved[key] = pins[key].saved; else delete pins[key];
    localStorage.setItem(STORAGE, JSON.stringify(saved));
  }
  catch { /* Private browsing may prohibit storage; play remains available. */ }
}
