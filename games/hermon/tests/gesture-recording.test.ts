import { afterEach, expect, it, vi } from 'vitest';
import { gestureLog, gestureRecording, recordGesture, startGestureLog } from '@/game/gestureLog';

afterEach(() => {
  gestureLog.enabled = false;
  gestureLog.rows = [];
  gestureLog.count = 0;
  vi.unstubAllGlobals();
});

it('exports a trackpad recording in order only after the player starts it', () => {
  vi.stubGlobal('innerWidth', 1100);
  vi.stubGlobal('innerHeight', 760);
  vi.stubGlobal('WheelEvent', class {});
  recordGesture('ignored');
  expect(gestureLog.rows).toEqual([]);
  startGestureLog();
  for (let i = 0; i < 6001; i++) recordGesture('wheel', { deltaY: i });
  recordGesture('pause');
  gestureLog.enabled = false;
  recordGesture('ignored');
  const report = gestureRecording();
  expect(report.viewport).toEqual([1100, 760]);
  expect(report.rows).toHaveLength(6000);
  expect(report.rows[0]).toMatchObject({ event: 'wheel', deltaY: 2 });
  expect(report.rows.at(-1)).toMatchObject({ event: 'pause' });
});
