import { Fragment, useEffect, useRef, useState } from 'react';
import { gestureLog, gestureRecording, startGestureLog } from '@/game/gestureLog';
import { persistGame, useGame } from '@/game/store';
import { runtime } from '@/game/runtime';
import { touchMode } from '@/game/pointerMode';
import { BUILD_STAMP, HERMON_PATH } from '@/paths';
import Modal from './Modal';
import styles from './Experience.module.css';
import TouchSettings from './TouchSettings';
import { readInsets } from './touchInsets';
import { isStandalone } from './playSession';
import { unlockBlasterAudio } from './audioUnlock';
import { setWatchersMode } from './hermonActions';
import { ControlsRow } from './controls/PauseControls';
import { LabStatsTable } from './gesture/LabPanel';

function measurements() {
  const frames = [...runtime.frames].sort((a, b) => a - b);
  const percentile = (p: number) => frames.length ? Math.round(frames[Math.floor((frames.length - 1) * p)] * 10) / 10 : 0;
  return {
    seconds: Math.round(runtime.elapsed), samples: frames.length, p50Ms: percentile(.5), p95Ms: percentile(.95),
    stallsOver50Ms: frames.filter(v => v > 50).length, browser: navigator.userAgent,
    viewport: [innerWidth, innerHeight], pixelRatio: devicePixelRatio, quality: useGame.getState().quality,
    camera: useGame.getState().camera, resources: runtime.resources, peakResources: runtime.peakResources,
    build: BUILD_STAMP, deployment: new URL(HERMON_PATH, window.location.origin).href,
    scope: 'Latest 18,000 active frames; first resume frame excluded. Resource peaks cover the session.',
  };
}

type Reading = [label: string, value: string][];
const r1 = (n: number) => String(Math.round(n * 10) / 10);
function read(probe: HTMLElement | null): Reading {
  const vv = window.visualViewport, i = readInsets(probe);
  return [
    ['Inner size', `${innerWidth} × ${innerHeight}`],
    ['Visual size', vv ? `${r1(vv.width)} × ${r1(vv.height)}` : 'not available'],
    ['Scale', vv ? String(Math.round(vv.scale * 1000) / 1000) : 'not available'],
    ['Offset top', vv ? r1(vv.offsetTop) : 'not available'],
    ['Safe insets t/r/b/l', `${r1(i.top)} / ${r1(i.right)} / ${r1(i.bottom)} / ${r1(i.left)}`],
    ['Home Screen app', isStandalone() ? 'yes' : 'no'],
    ['Touch mode', touchMode() ? 'yes' : 'no'],
  ];
}
const PROBE = { position: 'fixed', inset: 0, visibility: 'hidden', pointerEvents: 'none',
  padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)' } as const;

function ScreenDiagnostics() {
  const probe = useRef<HTMLDivElement>(null), [rows, setRows] = useState<Reading | null>(null);
  const refresh = () => setRows(read(probe.current));
  return <details data-testid="screen-diagnostics" onToggle={e => { if ((e.currentTarget as HTMLDetailsElement).open && !rows) refresh(); }}>
    <summary>Screen diagnostics</summary>
    <div ref={probe} aria-hidden="true" style={PROBE} />
    <p>Values from this screen, for checking touch layout on a real phone. Sizes are CSS pixels.</p>
    {rows && <dl className={styles.stats}>{rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>}
    <button type="button" className={styles.secondary} onClick={refresh}>Refresh</button>
  </details>;
}

export default function TestPanel({ onClose, onResume, ready }: { onClose: () => void; onResume: () => void; ready: boolean }) {
  const state = useGame(), [stats, setStats] = useState<ReturnType<typeof measurements> | null>(null);
  const [recording, setRecording] = useState(gestureLog.enabled);
  const [coarse] = useState(() => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  const [anyCoarse] = useState(() => typeof matchMedia === 'function' && matchMedia('(any-pointer: coarse)').matches);
  useEffect(() => { setStats(measurements()); }, []);
  const save = (patch: Parameters<typeof state.set>[0]) => { state.set(patch); persistGame(); };

  return <Modal title="Flight settings" onClose={onClose}>
    <p>Adjust flight feel, view, and sound, then resume over Mount Hermon.</p>

    <fieldset><legend>Perspective</legend><div className={styles.segment}>
      <button type="button" aria-pressed={state.camera === 'third'} onClick={() => save({ camera: 'third' })}>Third person</button>
      <button type="button" aria-pressed={state.camera === 'first'} onClick={() => save({ camera: 'first' })}>First person</button>
    </div></fieldset>

    <fieldset><legend>Flight &amp; camera</legend>
      <p className={styles.muted}>
        {coarse
          ? 'Drag to look, hold Fly to soar, release to hover, and tap a Watcher to strike when the host is active.'
          : 'WASD flies at full momentum (dive for speed, pull up to climb, release to flare into hover). Shift surges, Space takes off and rises, F or Ctrl descends to land, B brakes, L lands on flat ledges, E reads tablets. Drag the scene to look or click to lock mouse look; Esc pauses.'}
      </p>
      <label className={styles.setting}>Look sensitivity · {state.lookSensitivity.toFixed(1)}×
        <input type="range" min=".5" max="2" step=".1" value={state.lookSensitivity} onChange={e => save({ lookSensitivity: e.target.valueAsNumber })} />
      </label>
      <label className={styles.check}><input type="checkbox" checked={state.invertY} onChange={e => save({ invertY: e.target.checked })} /> Invert vertical look</label>
      <label className={styles.check}><input type="checkbox" checked={state.heroPoses} onChange={e => save({ heroPoses: e.target.checked })} /> Expressive wing and flight poses</label>
      <label className={styles.check}><input type="checkbox" checked={state.reduced} onChange={e => save({ reduced: e.target.checked })} /> Reduced camera motion</label>
    </fieldset>

    <fieldset><legend>The Watchers’ host</legend>
      <label className={styles.check}>
        <input type="checkbox" checked={state.shooter} onChange={e => setWatchersMode(e.target.checked, false)} />
        Challenge the Watchers in the gorge
      </label>
      <p className={styles.muted}>
        When active: click (while mouse-locked) or press C to strike with the flaming sword, hold right-click or V to raise the shield, and press 1 to rebuke. Turn off anytime for a calm dawn sky.
      </p>
    </fieldset>

    {coarse && <ControlsRow fromPanel />}
    {anyCoarse && <TouchSettings />}

    <fieldset><legend>Graphics &amp; audio</legend>
      <label className={styles.setting}>Graphics detail
        <select value={state.quality} onChange={e => save({ quality: e.target.value as 'high' | 'low' })}>
          <option value="high">Full detail</option>
          <option value="low">Lighter · lower resolution, no shadows</option>
        </select>
      </label>
      <label className={styles.check}><input type="checkbox" checked={!state.muted} onChange={e => {
        save({ muted: !e.target.checked }); if (e.target.checked) unlockBlasterAudio();
      }} /> Wind and battle audio</label>
      <label className={styles.check}><input type="checkbox" checked={state.tapControls} onChange={e => save({ tapControls: e.target.checked })} /> Show single-tap movement controls (no dragging)</label>
    </fieldset>

    <button type="button" className={styles.secondary} onClick={() => { runtime.reset = true; onClose(); }}>Return to summit altar</button>

    <details><summary>Diagnostics &amp; playtest downloads</summary>
      <p className={styles.muted}>Local frame timings and optional input logs stay in this browser. Build {BUILD_STAMP}.</p>
      {stats && <dl className={styles.stats}><dt>Time sampled</dt><dd>{stats.seconds}s</dd><dt>Median frame</dt><dd>{stats.p50Ms}ms</dd><dt>95th percentile</dt><dd>{stats.p95Ms}ms</dd><dt>Frames above 50ms</dt><dd>{stats.stallsOver50Ms}</dd></dl>}
      <button type="button" className={styles.secondary} onClick={() => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(measurements(), null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'hermon-playtest.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}>Download frame measurements</button>
      <button type="button" className={styles.secondary} aria-pressed={recording} onClick={() => {
        if (recording) gestureLog.enabled = false; else startGestureLog(); setRecording(!recording);
      }}>{recording ? 'Stop input recording' : 'Start local input recording'}</button>
      <button type="button" className={styles.secondary} onClick={() => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(gestureRecording(), null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'hermon-gestures.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}>Download input recording</button>
      <LabStatsTable />
      {anyCoarse && <ScreenDiagnostics />}
    </details>

    <div className={styles.modalFoot} data-testid="settings-foot"><button type="button" className={styles.primary} aria-label="Resume flight" disabled={!ready} onClick={onResume}>Resume</button></div>
  </Modal>;
}
