"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const chapters = [
  { id: "surrounded", label: "Surrounded" },
  { id: "afraid", label: "Afraid" },
  { id: "the-prayer", label: "The prayer" },
  { id: "eyes-opened", label: "Eyes opened" },
  { id: "reflection", label: "Reflection" },
];

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Keep every image readable without JavaScript; add controls after hydration. */
function useEnhanced() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

export function ChapterNavigation() {
  const [active, setActive] = useState("surrounded");

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const entered = entries.filter((entry) => entry.isIntersecting);
      if (entered.length) setActive(entered[0].target.id);
    }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("[data-story-chapter]").forEach((chapter) => observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="dothan-chapter-nav" aria-label="Story chapters">
      <a className="dothan-nav-title" href="#story-top">Open his eyes.</a>
      <ol>{chapters.map((chapter, index) => <li key={chapter.id}><a href={`#${chapter.id}`} aria-current={active === chapter.id ? "step" : undefined}><span className="dothan-nav-number" aria-hidden="true">0{index + 1}</span><span>{chapter.label}</span></a></li>)}</ol>
      <span className="dothan-nav-reference">2 Kings 6</span>
    </nav>
  );
}

type ComparisonGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
};

const clampReveal = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** One registered image pair, shared by the reveal, native range, and artwork handle. */
export function Revelation() {
  const enhanced = useEnhanced();
  const [reveal, setReveal] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animate, setAnimate] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const revealButton = useRef<HTMLButtonElement>(null);
  const gesture = useRef<ComparisonGesture | null>(null);
  const valueText = reveal === 0 ? "Only the first view is shown" : reveal === 100 ? "The revealed view is fully shown" : `${reveal}% of the revealed view is shown`;
  const status = reveal === 0 ? "The mountain as the servant first saw it." : reveal === 100 ? "The mountain is full of horses and chariots of fire." : "Both views of the same mountain.";

  function endGesture(pointerId?: number) {
    const active = gesture.current;
    if (!active || (pointerId !== undefined && active.pointerId !== pointerId)) return;
    gesture.current = null;
    setDragging(false);
    if (frame.current?.hasPointerCapture(active.pointerId)) {
      frame.current.releasePointerCapture(active.pointerId);
    }
  }

  function showView(value: number, withMotion = false) {
    endGesture();
    setAnimate(withMotion);
    setReveal(clampReveal(value));
  }

  function resetView() {
    showView(0, true);
    revealButton.current?.focus({ preventScroll: true });
  }

  function revealAt(clientX: number) {
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) return;
    setReveal(clampReveal(((clientX - bounds.left) / bounds.width) * 100));
  }

  function startGesture(event: PointerEvent<HTMLDivElement>) {
    if (!enhanced) return;
    if (!event.isPrimary || event.button !== 0) {
      endGesture();
      return;
    }
    if (gesture.current) return;
    gesture.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dragging: false };
    // Touch keeps the browser's native pan/pinch arbitration until horizontal intent is clear.
    if (event.pointerType === "mouse") event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveGesture(event: PointerEvent<HTMLDivElement>) {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (event.pointerType === "mouse" && event.buttons === 0) {
      endGesture(event.pointerId);
      return;
    }
    if (!active.dragging) {
      const dx = Math.abs(event.clientX - active.startX);
      const dy = Math.abs(event.clientY - active.startY);
      if (Math.max(dx, dy) < 6) return;
      if (dy >= dx) {
        endGesture(event.pointerId);
        return;
      }
      active.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setAnimate(false);
      setDragging(true);
    }
    revealAt(event.clientX);
  }

  function finishGesture(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    if (gesture.current.dragging) revealAt(event.clientX);
    endGesture(event.pointerId);
  }

  function handleArtworkKey(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp": next = reveal + 1; break;
      case "ArrowLeft":
      case "ArrowDown": next = reveal - 1; break;
      case "PageUp": next = reveal + 10; break;
      case "PageDown": next = reveal - 10; break;
      case "Home": next = 0; break;
      case "End": next = 100; break;
      default: return;
    }
    event.preventDefault();
    showView(next);
  }

  return (
    <section className="dothan-comparison" aria-label="Compare the two views" data-enhanced={enhanced} data-dragging={dragging} data-animate={animate} data-reveal={reveal}>
      <div ref={frame} className="dothan-compare-views" id="dothan-revelation-image" style={{ "--dothan-reveal": `${reveal}%` } as CSSProperties} onPointerDown={startGesture} onPointerMove={moveGesture} onPointerUp={finishGesture} onPointerCancel={(event) => endGesture(event.pointerId)} onLostPointerCapture={(event) => { if (event.target === event.currentTarget) endGesture(event.pointerId); }}>
        <figure className="dothan-compare-before" aria-hidden={enhanced && reveal === 100}>
          <Image src="/angels/stories/dothan-unseen.jpg" alt="Before: Dothan surrounded by a human army, with the mountain dim beyond it." width={1672} height={941} sizes="100vw" draggable={false} />
          <figcaption>What he first saw</figcaption>
        </figure>
        <figure className="dothan-compare-after" aria-hidden={enhanced && reveal === 0}>
          <Image src="/angels/stories/dothan-revealed.jpg" alt="The same city, army, and mountain, now with luminous horses and chariots of fire filling the ridge around Elisha. Interpretive illustration." width={1672} height={941} sizes="100vw" loading="eager" draggable={false} />
          <figcaption>What he saw next</figcaption>
        </figure>
        {enhanced ? <>
          <div className="dothan-compare-divider" aria-hidden="true" />
          <div className="dothan-compare-handle" role="slider" tabIndex={0} aria-label="Reveal on the artwork" aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reveal} aria-valuetext={valueText} aria-describedby="dothan-comparison-help" onKeyDown={handleArtworkKey}><span aria-hidden="true">↔</span></div>
        </> : null}
      </div>
      {enhanced ? <div className="dothan-viewer-controls dothan-inset">
        <div className="dothan-revelation-actions">
          <div className="dothan-revelation-buttons">
            <button ref={revealButton} type="button" className="dothan-reveal-button" aria-pressed={reveal === 100} aria-controls="dothan-revelation-image" onClick={() => showView(100, true)}><span className="dothan-eye-mark" aria-hidden="true">✧</span>Open his eyes<span aria-hidden="true">{reveal === 100 ? "✓" : "→"}</span></button>
            {reveal > 0 ? <button className="dothan-reset-button" type="button" onClick={resetView}>See the first view again</button> : null}
          </div>
          <p className="dothan-reveal-status" role="status">{status}</p>
          <span className="dothan-art-note">Interpretive illustration · 2 Kings 6:17</span>
        </div>
        <div className="dothan-compare-controls">
          <div className="dothan-compare-control-title"><label htmlFor="dothan-comparison-range">Reveal the unseen</label><span className="dothan-compare-value" aria-hidden="true">{reveal}% revealed</span></div>
          <div className="dothan-compare-input-row">
            <button type="button" onClick={() => showView(0)} aria-pressed={reveal === 0}>Before</button>
            <input id="dothan-comparison-range" type="range" min="0" max="100" value={reveal} aria-valuetext={valueText} aria-describedby="dothan-comparison-help" onChange={(event) => showView(Number(event.target.value))} />
            <button type="button" onClick={() => showView(100)} aria-pressed={reveal === 100}>After</button>
          </div>
          <p id="dothan-comparison-help">Drag the line across the painting. You can also use the slider or arrow keys.</p>
        </div>
      </div> : <p className="dothan-static-compare-note dothan-inset">Two complete views of the same landscape, before and after the servant’s eyes are opened. Interpretive illustration · 2 Kings 6:17.</p>}
    </section>
  );
}
