import { afterEach, describe, expect, it, vi } from 'vitest';
import { SHIELD } from '../src/game/commands';
import { commandKeyDown, commandKeyUp } from '../src/game/commandKeys';
import { TERMINAL_IDS, terminalById } from '../src/game/navigation';
import { clearInput, look, readIntent, releaseKeys, runtime } from '../src/game/runtime';
import { CONTROLS_VERSION, hydrateGame, persistGame, useGame, validDiscoveredTablets } from '../src/game/store';
import { desktopLandStep } from '../src/game/touchFlight';
import { keyDown, mouseDown, mouseUp } from '../src/ui/shooterKeys';

afterEach(() => {
  clearInput(true);
  vi.unstubAllGlobals();
  useGame.setState({
    desktopMode: 'mouse',
    shooter: false,
    controlLab: 'standard',
    flying: false,
    landing: false,
    discovered: false,
    discoveredTablets: [],
    controlsVersion: CONTROLS_VERSION,
  });
});

describe('v7 store defaults, migration, and tablet sanitization', () => {
  it('defaults to unified standard desktop flight in calm exploration mode', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    hydrateGame();
    const s = useGame.getState();
    expect(s.desktopMode).toBe('mouse');
    expect(s.shooter).toBe(false);
    expect(s.controlLab).toBe('standard');
    expect(s.controlsVersion).toBe(7);
    expect(s.discoveredTablets).toEqual([]);
  });

  it('migrates pre-v7 saved desktop trackpad/shooter/lab state cleanly and hydrates legacy discovered boolean', () => {
    const storage = new Map<string, string>([
      ['hermon.flight.v1', JSON.stringify({
        controlsVersion: 6,
        desktopMode: 'trackpad',
        trackpadSteering: 'free',
        shooter: true,
        controlLab: 'draw',
        discovered: true,
      })],
    ]);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    hydrateGame();
    const s = useGame.getState();
    expect(s.desktopMode).toBe('mouse');
    expect(s.shooter).toBe(false);
    expect(s.controlLab).toBe('standard');
    expect(s.discovered).toBe(true);
    expect(s.discoveredTablets).toEqual(['hermon-oath-01']);
  });

  it('preserves v7 user choices and sanitizes discoveredTablets', () => {
    expect(validDiscoveredTablets(['hermon-oath-01', 'bogus', 'hermon-oath-01', 'east-flats-14'])).toEqual([
      'hermon-oath-01',
      'east-flats-14',
    ]);
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    useGame.setState({ shooter: true, discoveredTablets: ['west-flats-09'], discovered: true, controlsVersion: 7 });
    persistGame();
    useGame.setState({ shooter: false, discoveredTablets: [], discovered: false });
    hydrateGame();
    expect(useGame.getState().shooter).toBe(true);
    expect(useGame.getState().discoveredTablets).toEqual(['west-flats-09']);
    expect(TERMINAL_IDS).toHaveLength(5);
    expect(terminalById('west-flats-09')?.location).toBe('Tablet of Azazel');
  });
});

describe('unified desktop flight vertical intent, look sensitivity/invertY, and descend landing', () => {
  it('reads Space as vertical rise and F/Ctrl as descend, dropping descend once keyDescendUsed latches', () => {
    useGame.setState({ desktopMode: 'mouse', controlLab: 'standard' });
    runtime.keys.add('Space');
    expect(readIntent().vertical).toBe(1);
    runtime.keys.delete('Space');

    runtime.keys.add('KeyF');
    expect(readIntent().vertical).toBe(-1);
    runtime.keyDescendUsed = true;
    expect(readIntent().vertical).toBe(0);
    runtime.keys.delete('KeyF');
    runtime.keyDescendUsed = false;

    runtime.keys.add('ControlLeft');
    expect(readIntent().vertical).toBe(-1);
    runtime.keys.delete('ControlLeft');
  });

  it('applies lookSensitivity and invertY to look()', () => {
    runtime.yaw = 0; runtime.pitch = 0;
    look(100, 100, 1.5, false);
    expect(runtime.yaw).toBeCloseTo(-0.45, 5);
    expect(runtime.pitch).toBeCloseTo(-0.45, 5);

    runtime.yaw = 0; runtime.pitch = 0;
    look(100, 100, 1.5, true);
    expect(runtime.pitch).toBeCloseTo(0.45, 5);
  });

  it('desktopLandStep latches landGoal and keyDescendUsed when descending near flat ground', () => {
    runtime.keys.add('KeyF');
    const fakeWorld = {
      castRayAndGetNormal: () => ({ timeOfImpact: 2.0, normal: { x: 0, y: 1, z: 0 } }),
    };
    const fakeRapier = { Ray: class { origin; dir; constructor(o: unknown, d: unknown) { this.origin = o; this.dir = d; } } };
    const started = desktopLandStep({
      world: fakeWorld as never,
      rapier: fakeRapier as never,
      collider: {} as never,
      safe: { canLand: () => true },
      position: { x: 0, y: 22, z: 65 },
      flying: true,
    });
    expect(started).toBe(true);
    expect(runtime.keyDescendUsed).toBe(true);
    expect(runtime.landGoal).not.toBeNull();
    expect(readIntent().vertical).toBe(0);
    runtime.keys.delete('KeyF');
    desktopLandStep({
      world: fakeWorld as never,
      rapier: fakeRapier as never,
      collider: {} as never,
      safe: { canLand: () => true },
      position: { x: 0, y: 22, z: 65 },
      flying: true,
    });
    expect(runtime.keyDescendUsed).toBe(false);
  });
});

describe('opt-in Watchers desktop combat bindings', () => {
  it('maps locked right-click to SHIELD.mouse, retires KeyQ ADS zoom, and allows Digit1 rebuke in standard desktop mode', () => {
    const s = runtime.shooter;
    const env = { enabled: true, started: true, paused: false, aimToggle: false, desktopMode: 'mouse' as const, steering: 'free', locked: true };
    expect(keyDown({ code: 'KeyQ', repeat: false, metaKey: false, ctrlKey: false, altKey: false, targetTag: 'MAIN' }, env, s)).toBe(false);
    expect(mouseDown(2, env, s)).toBe(true);
    expect(s.input.shield & SHIELD.mouse).toBe(SHIELD.mouse);
    mouseUp(2, env, s);
    expect(s.input.shield & SHIELD.mouse).toBe(0);

    useGame.setState({ desktopMode: 'mouse', controlLab: 'standard', shooter: true });
    const beforeCmd = s.input.cmd;
    const handled = commandKeyDown({ code: 'Digit1', repeat: false, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false, target: null } as unknown as KeyboardEvent, true, s);
    expect(handled).toBe(true);
    expect(s.input.cmd).toBe(beforeCmd + 1);

    commandKeyDown({ code: 'KeyV', repeat: false, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false, target: null } as unknown as KeyboardEvent, true, s);
    expect(s.input.shield & SHIELD.keys).toBe(SHIELD.keys);
    releaseKeys();
    expect(s.input.shield & SHIELD.keys).toBe(0);
    commandKeyUp('KeyV', s);
  });
});
