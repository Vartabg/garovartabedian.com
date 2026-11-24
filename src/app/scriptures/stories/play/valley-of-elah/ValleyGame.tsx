"use client";

import Link from "next/link";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { newElah } from "./elahGame";
import { readHud, runElah, type ElahController } from "./elahController";

class ElahBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <p className="elah-error">
          The valley could not open.{" "}
          <button type="button" onClick={() => this.setState({ failed: false })}>
            Try again
          </button>{" "}
          or read 1 Samuel 17 below.
        </p>
      );
    }
    return this.props.children;
  }
}

function ValleyStage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controls = useRef<ElahController | null>(null);
  const [hud, setHud] = useState(() => readHud(newElah()));

  useEffect(() => {
    if (!canvas.current) return;
    const game = runElah(canvas.current, setHud);
    controls.current = game;
    return () => {
      game.dispose();
      controls.current = null;
    };
  }, []);

  const phaseBadge = hud.phase === "resolved"
    ? "Valley open"
    : hud.phase === "sling"
      ? "Sling ready"
      : hud.phase === "approach"
        ? "Valley floor"
        : null;

  return (
    <section
      className="elah-stage elah-js"
      aria-label="Play the Valley of Elah"
      data-ready={hud.ready}
      aria-busy={!hud.ready}
    >
      <div className="elah-instruments">
        <div className="elah-tally">
          <span className="elah-stone-icon" aria-hidden="true" />
          <span>Stones</span> <strong>{hud.stonesCount} / 5</strong>
          <span className="elah-armor-stat">
            {hud.armorDone ? "Armor set aside" : `Armor ${hud.armorCount} / 3`}
          </span>
          {phaseBadge && <span className="elah-phase">{phaseBadge}</span>}
        </div>
        <div className="elah-tools">
          <button
            type="button"
            disabled={!hud.ready}
            onClick={() => controls.current?.toggleSound()}
            aria-pressed={hud.sound}
            aria-label={hud.sound ? "Mute sound" : "Enable sound"}
            title={hud.sound ? "Mute sound" : "Enable sound"}
          >
            <span aria-hidden="true">{hud.sound ? "♪" : "×"}</span>
            <span className="elah-sound-word"> Sound</span>
          </button>
          <button
            type="button"
            disabled={!hud.ready}
            onClick={() => controls.current?.togglePause()}
            aria-label={hud.paused ? "Resume" : "Pause"}
          >
            <span className={hud.paused ? "elah-play-mark" : "elah-pause-mark"} aria-hidden="true" />
            {hud.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <div className="elah-window">
        <canvas
          ref={canvas}
          width="1012"
          height="460"
          tabIndex={0}
          role="application"
          aria-label="Valley of Elah"
          aria-describedby="elah-move-help"
        >
          The valley targets below let you set aside Saul’s armor, choose five smooth stones from the brook, and face the Philistine.
        </canvas>
        {hud.paused && (
          <div className="elah-overlay">
            <p>Paused</p>
            <button type="button" onClick={() => controls.current?.togglePause()}>
              Return to the valley
            </button>
          </div>
        )}
        {hud.card && (
          <div className="elah-card" data-resolved={hud.resolved ? "true" : undefined}>
            <h2>{hud.card.heading}</h2>
            <p>
              {hud.card.quote} <Link href={hud.card.href}>{hud.card.ref}</Link>
            </p>
          </div>
        )}
        {!hud.visual && (
          <p className="elah-vision">
            Use Valley targets below to keep playing while the picture is unavailable.
          </p>
        )}
      </div>

      <div className="elah-control-panel">
        <button
          className="elah-action"
          type="button"
          data-tone={hud.actionTone}
          disabled={!hud.ready || hud.paused}
          onClick={() => controls.current?.perform()}
          aria-label={hud.action}
        >
          <span>{hud.action}</span>
          <kbd aria-hidden="true">Space</kbd>
        </button>
        {hud.resolved && (
          <button className="elah-replay" type="button" onClick={() => controls.current?.reset()}>
            Play again
          </button>
        )}
        <p className="elah-move-help" id="elah-move-help">
          <span className="elah-desktop-help">Move with WASD or arrow keys. </span>
          Drag to steer, or tap a stone or the valley floor.
        </p>
      </div>

      <div className="elah-response" role="status" aria-live="polite" aria-atomic="true">
        {hud.message || (hud.ready
          ? "You’re David in Saul’s heavy bronze armor. Set aside each piece before stepping toward the brook."
          : "Opening the Valley of Elah…")}
      </div>

      <details className="elah-targets" key={hud.visual ? "drawn" : "text"} open={hud.visual ? undefined : true}>
        <summary>Valley targets</summary>
        <p>Choose an action or place in the valley to walk there and act.</p>
        <div>
          <button
            type="button"
            disabled={!hud.ready || hud.armorDone || hud.paused}
            onClick={() => controls.current?.go("armor")}
          >
            {hud.armorLabel}
            {hud.armorDone && <span aria-hidden="true"> ✓</span>}
          </button>
          {hud.stones.map((st) => (
            <button
              key={st.id}
              type="button"
              disabled={!hud.ready || st.done || st.locked || hud.paused}
              onClick={() => controls.current?.go(st.id)}
            >
              {st.label}
              {st.done && <span aria-hidden="true"> ✓</span>}
            </button>
          ))}
          {hud.stonesCount === 5 && (
            <button
              type="button"
              disabled={!hud.ready || hud.challenged || hud.paused}
              onClick={() => controls.current?.go("meet")}
            >
              Step into the valley
              {hud.challenged && <span aria-hidden="true"> ✓</span>}
            </button>
          )}
          {hud.challenged && (
            <button
              type="button"
              disabled={!hud.ready || hud.resolved || hud.paused}
              onClick={() => controls.current?.go("release")}
            >
              Release stone
              {hud.resolved && <span aria-hidden="true"> ✓</span>}
            </button>
          )}
        </div>
      </details>
    </section>
  );
}

export default function ElahGame() {
  return (
    <ElahBoundary>
      <ValleyStage />
    </ElahBoundary>
  );
}
