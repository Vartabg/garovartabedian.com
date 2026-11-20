import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it('remembers twenty active seconds for one control on this device', async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  const first = await import('@/ui/controls/playedControls');
  for (let i = 0; i < 19; i++) first.recordPlayedSecond('desktop', 'draw');
  expect(first.triedIds('desktop')).toEqual([]);
  first.recordPlayedSecond('desktop', 'draw');
  first.savePlayedControls();
  expect([...storage.keys()]).toEqual(['hermon.controls.played.v1']);
  vi.resetModules();
  const next = await import('@/ui/controls/playedControls');
  expect(next.triedIds('desktop')).toEqual(['draw']);
  expect(next.triedIds('touch')).toEqual([]);
});

it('keeps controls usable if storage is blocked', async () => {
  const deny = () => { throw new Error('Storage unavailable'); };
  vi.stubGlobal('localStorage', { getItem: deny, setItem: deny });
  const { triedIds, recordPlayedSecond, savePlayedControls } = await import('@/ui/controls/playedControls');
  for (let i = 0; i < 20; i++) recordPlayedSecond('touch', 'one-finger');
  expect(triedIds('touch')).toEqual(['one-finger']);
  expect(savePlayedControls).not.toThrow();
});
