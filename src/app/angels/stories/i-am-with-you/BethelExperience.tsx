"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

type GazeDrag = {
  pointerId: number;
  x: number;
  y: number;
  startGaze: number;
  width: number;
  claimed: boolean;
  target: HTMLElement;
};

/** The unenhanced story shows the whole painting; the camera is optional. */
export default function BethelExperience() {
  const enhanced = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [gaze, setGaze] = useState(0);
  const [travel, setTravel] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<GazeDrag | null>(null);
  const framing = enhanced ? gaze : 100;
  const scale = 1 + 2.65 * Math.pow((100 - framing) / 100, 1.25);
  const valueText = gaze === 0
    ? "Close to earth, beside the sleeping Jacob"
    : gaze === 100
      ? "The whole dream, from earth to heaven"
      : `${gaze}% of the way from earth to heaven`;

  function frameAt(value: number) {
    setTravel(true);
    setGaze(value);
  }

  function finishDrag(restore = false) {
    const current = drag.current;
    drag.current = null;
    setDragging(false);
    if (!current) return;
    if (restore && current.claimed) {
      setTravel(false);
      setGaze(current.startGaze);
    }
    if (current.target.hasPointerCapture(current.pointerId)) {
      current.target.releasePointerCapture(current.pointerId);
    }
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || drag.current) {
      finishDrag(true);
      return;
    }
    if (event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startGaze: gaze,
      width: event.currentTarget.getBoundingClientRect().width,
      claimed: false,
      target: event.currentTarget,
    };
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.claimed) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        finishDrag();
        return;
      }
      if (Math.abs(dx) < Math.abs(dy) * 1.15) return;
      current.claimed = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    setTravel(false);
    setGaze(clamp(current.startGaze + dx / current.width * 100));
  }

  function frameWithKeys(event: KeyboardEvent<HTMLElement>) {
    const next = event.key === "ArrowRight" ? gaze + 1
      : event.key === "ArrowLeft" ? gaze - 1
        : event.key === "Home" ? 0
          : event.key === "End" ? 100 : null;
    if (event.key === "Escape" && drag.current) {
      event.preventDefault();
      finishDrag(true);
    } else if (next !== null) {
      event.preventDefault();
      setTravel(false);
      setGaze(clamp(next));
    }
  }

  return (
    <section className="bethel-experience" aria-label="Explore Jacob’s dream" data-enhanced={enhanced}>
      <figure
        className="bethel-camera"
        aria-label="Jacob’s dream: from earth to heaven"
        aria-describedby={enhanced ? "bethel-camera-help" : undefined}
        tabIndex={enhanced ? 0 : undefined}
        data-travel={travel}
        data-enhanced={enhanced}
        data-dragging={dragging}
        style={{ "--bethel-camera-scale": scale } as CSSProperties}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => { if (drag.current?.pointerId === event.pointerId) finishDrag(); }}
        onPointerCancel={(event) => { if (drag.current?.pointerId === event.pointerId) finishDrag(true); }}
        onLostPointerCapture={(event) => { if (event.target === event.currentTarget && drag.current?.pointerId === event.pointerId) finishDrag(true); }}
        onPointerLeave={(event) => { if (drag.current && !event.currentTarget.hasPointerCapture(drag.current.pointerId)) finishDrag(); }}
        onBlur={() => finishDrag(true)}
        onKeyDown={frameWithKeys}
      >
        <div className="bethel-camera-art">
          <Image
            src="/angels/stories/bethel-dream.jpg"
            alt="Jacob sleeps with his head on a stone beneath an immense night sky. A luminous stairway rises from the earth into the heavens, with small angels ascending and descending. Interpretive illustration."
            fill
            quality={85}
            draggable={false}
            sizes="(max-width: 700px) 90vw, 650px"
          />
        </div>
        <div className="bethel-camera-edges" aria-hidden="true" />
        <figcaption className="bethel-camera-label">
          {framing === 0 ? "At the stone" : framing === 100 ? "Earth & heaven" : "The dream opens"}
        </figcaption>
      </figure>

      {enhanced ? (
        <div className="bethel-camera-controls">
          <div className="bethel-camera-control-title">
            <label htmlFor="bethel-gaze">Lift your gaze</label>
            <output htmlFor="bethel-gaze">{gaze}%</output>
          </div>
          <input
            id="bethel-gaze"
            type="range"
            min="0"
            max="100"
            step="1"
            value={gaze}
            aria-valuetext={valueText}
            aria-describedby="bethel-camera-help"
            onChange={(event) => { setTravel(false); setGaze(Number(event.target.value)); }}
          />
          <div className="bethel-camera-endpoints">
            <button type="button" onClick={() => frameAt(0)} aria-pressed={gaze === 0}>At the stone</button>
            <button type="button" onClick={() => frameAt(100)} aria-pressed={gaze === 100}>The whole dream <span aria-hidden="true">↗</span></button>
          </div>
          <p id="bethel-camera-help">Drag right on the painting to lift your gaze; drag left to return. Or use the slider and arrow keys. Home returns to earth; End opens the whole view.</p>
        </div>
      ) : (
        <p className="bethel-static-caption">The whole dream, from the stone beneath Jacob’s head to the stairway reaching heaven.</p>
      )}
      <p className="bethel-art-attribution">Interpretive illustration · Genesis 28:11–12</p>
    </section>
  );
}
