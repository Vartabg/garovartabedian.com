import { flightFeel } from '@/game/flightFeel';
import type { PointerEvent } from 'react';
import { useRef } from 'react';
import { useGame } from '@/game/store';
import styles from './Experience.module.css';
import { useMouseLook } from './useMouseLook';
import { useTwinStick } from './useTwinStick';
import { useTouchCapable } from './useTouchCapable';
import { touchCapable } from '@/game/pointerMode';
import { useClassicThumbs } from './useClassicThumbs';
import TwinStickOverlay from './TwinStickOverlay';
import TouchCluster from './TouchCluster';

// Lazy flight pointer layer: mouse pointers go to desktop mouse look (drag-to-look / Pointer Lock), while touch and pen
// route to the active touch scheme (One finger or Twin stick).
export default function TouchControls() {
  const surface = useRef<HTMLDivElement>(null);
  const desktop = useMouseLook(surface);
  const paused = useGame(s => s.paused);
  const twinOn = useGame(s => s.touchScheme) === 'twin';
  const capable = useTouchCapable();
  const twin = useTwinStick(surface, twinOn && capable);
  const classic = useClassicThumbs(surface);
  if (paused) return null;
  const scheme = twinOn ? twin : classic;
  const isDesktop = (e: PointerEvent<HTMLDivElement>) => e.pointerType === 'mouse' || !touchCapable();
  const start = (e: PointerEvent<HTMLDivElement>) => {
    if (isDesktop(e)) {
      if (!scheme.busy()) desktop.start(e);
      return;
    }
    desktop.cancel();
    scheme.start(e);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (isDesktop(e)) desktop.move(e); else scheme.move(e);
  };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (isDesktop(e)) desktop.end(e); else scheme.end(e);
  };
  const cancel = (e: PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointercancel') { flightFeel.brake = true; flightFeel.serial++; }
    if (!isDesktop(e)) { scheme.cancel(e); return; }
    if (e.type === 'lostpointercapture') desktop.lostCapture(); else desktop.cancel();
  };
  const o = twin.overlay;
  return <>
    <div ref={surface} className={styles.flightSurface} aria-hidden="true" data-testid="flight-surface" data-play-surface=""
      data-scheme={twinOn ? 'twin' : 'classic'} data-control-mode="idle" data-fire-held="false" data-boost="false" data-cruise="false"
      data-layout={twinOn ? o.view?.layout.variant ?? 'normal' : 'classic'}
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel}
      onPointerLeave={e => { if (isDesktop(e)) desktop.leave(); }} />
    {!capable ? null : twinOn
      ? <TwinStickOverlay {...o}>{o.view && <TouchCluster layout={o.view.layout} onChange={twin.sync} onDescend={twin.cancelCruise} />}</TwinStickOverlay>
      : classic.overlay}
  </>;
}
