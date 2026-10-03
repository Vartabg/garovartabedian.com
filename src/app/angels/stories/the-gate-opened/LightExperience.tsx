"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

type View = "before" | "spot" | "after";
type Position = { x: number; y: number };
type LightDrag = {
  pointerId: number;
  x: number;
  y: number;
  startPosition: Position;
  startView: View;
  claimed: boolean;
  target: HTMLDivElement;
};

/** The light uncovers a second painting registered to the same cell. */
export default function LightExperience() {
  const enhanced = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [view, setView] = useState<View>("before");
  const [position, setPosition] = useState<Position>({ x: 50, y: 45 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<LightDrag | null>(null);
  const status = view === "before" ? "Before the light"
    : view === "after" ? "The whole cell in light" : "Exploring the light";

  function finishDrag(restore = false) {
    const current = drag.current;
    drag.current = null;
    setDragging(false);
    if (!current) return;
    if (restore && current.claimed) {
      setPosition(current.startPosition);
      setView(current.startView);
    }
    if (current.target.hasPointerCapture(current.pointerId)) {
      current.target.releasePointerCapture(current.pointerId);
    }
  }

  function illuminate(point: Position) {
    setPosition({ x: clamp(point.x), y: clamp(point.y) });
    setView("spot");
  }

  function pointerPosition(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width * 100,
      y: (event.clientY - bounds.top) / bounds.height * 100,
    };
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    // A second contact belongs to the browser's pinch gesture.
    if (!event.isPrimary || drag.current) {
      finishDrag(true);
      return;
    }
    if (event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startPosition: position,
      startView: view,
      claimed: false,
      target: event.currentTarget,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = Math.abs(event.clientX - current.x);
    const dy = Math.abs(event.clientY - current.y);
    if (!current.claimed) {
      if (Math.max(dx, dy) < 8) return;
      if (event.pointerType === "touch") {
        if (dy > dx * 1.15) {
          finishDrag();
          return;
        }
        if (dx < dy * 1.15) return;
      }
      current.claimed = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    illuminate(pointerPosition(event));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    // A stationary contact places the light; vertical travel was released above.
    if (current.claimed || Math.max(Math.abs(event.clientX - current.x), Math.abs(event.clientY - current.y)) < 8) {
      illuminate(pointerPosition(event));
    }
    finishDrag();
  }

  function moveWithKeys(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1;
    const next = event.key === "ArrowLeft" ? { ...position, x: position.x - step }
      : event.key === "ArrowRight" ? { ...position, x: position.x + step }
        : event.key === "ArrowUp" ? { ...position, y: position.y - step }
          : event.key === "ArrowDown" ? { ...position, y: position.y + step } : null;
    if (next) {
      event.preventDefault();
      illuminate(next);
    } else if (["Home", "End", "Escape", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      finishDrag(true);
      setView(event.key === "End" ? "after" : event.key === "Home" || event.key === "Escape" ? "before" : "spot");
    }
  }

  return (
    <section className="cell-light" aria-label="Light in the cell" data-enhanced={enhanced}>
      <div
        className="cell-light-frame"
        role="group"
        aria-label="Explore the cell illustration"
        aria-describedby={enhanced ? "cell-light-help" : undefined}
        tabIndex={enhanced ? 0 : undefined}
        data-enhanced={enhanced}
        data-view={enhanced ? view : "both"}
        data-dragging={dragging}
        style={{ "--cell-light-x": `${position.x}%`, "--cell-light-y": `${position.y}%` } as CSSProperties}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={(event) => { if (drag.current?.pointerId === event.pointerId) finishDrag(true); }}
        onLostPointerCapture={(event) => { if (event.target === event.currentTarget && drag.current?.pointerId === event.pointerId) finishDrag(true); }}
        onPointerLeave={(event) => { if (drag.current && !event.currentTarget.hasPointerCapture(drag.current.pointerId)) finishDrag(); }}
        onBlur={() => finishDrag(true)}
        onKeyDown={moveWithKeys}
      >
        <figure className="cell-light-before">
          <Image src="/angels/stories/peter-cell.jpg" alt="Before: Peter asleep in a dim prison cell, bound between two soldiers. Interpretive illustration." width={1672} height={941} quality={85} sizes="(max-width: 700px) 100vw, 90vw" draggable={false} />
          <figcaption>Before the light</figcaption>
        </figure>
        <figure className="cell-light-after">
          <Image src="/angels/stories/peter-cell-light.jpg" alt="The same cell in light: an angel stands beside Peter as he wakes, with fallen chains at his feet; the soldiers and walls remain in place. Interpretive illustration." width={1672} height={941} quality={85} sizes="(max-width: 700px) 100vw, 90vw" draggable={false} />
          <figcaption>A light shone in the cell</figcaption>
        </figure>
      </div>

      {enhanced ? (
        <div className="cell-light-controls">
          <div className="cell-light-control-heading">
            <p className="cell-light-status" role="status">{status}</p>
            <div className="cell-light-buttons">
              <button type="button" aria-pressed={view === "spot"} onClick={() => setView("spot")}>Explore the light</button>
              <button type="button" aria-pressed={view === "before"} onClick={() => setView("before")}>Before</button>
              <button type="button" aria-pressed={view === "after"} onClick={() => setView("after")}>After</button>
            </div>
          </div>
          <div className="cell-light-ranges">
            <label htmlFor="cell-light-x">Move light across the cell<input id="cell-light-x" type="range" min="0" max="100" step="1" value={position.x} aria-valuetext={`${position.x}% across the cell`} onChange={(event) => illuminate({ ...position, x: Number(event.target.value) })} /></label>
            <label htmlFor="cell-light-y">Move light up or down<input id="cell-light-y" type="range" min="0" max="100" step="1" value={position.y} aria-valuetext={`${position.y}% down the cell`} onChange={(event) => illuminate({ ...position, y: Number(event.target.value) })} /></label>
          </div>
          <p id="cell-light-help">Drag across the painting or tap to place the light. Arrow keys move it; Home shows before and End shows after.</p>
        </div>
      ) : <p className="cell-light-static-note">Two interpretive views of the same cell: before the light, and the angel waking Peter.</p>}
      <p className="cell-light-art-note">Interpretive illustrations · Acts 12:6–7. The circle of light lets you explore the artwork.</p>
    </section>
  );
}
