"use client";

import Link from "next/link";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { readHud, runStorm, type StormController } from "./stormController";
import { newStorm } from "./stormGame";

class StormBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <p className="storm-error">
          The boat could not launch.{" "}
          <button type="button" onClick={() => this.setState({ failed: false })}>
            Try again
          </button>{" "}
          or read the Gospel accounts below.
        </p>
      );
    }
    return this.props.children;
  }
}

function GalileeBoat() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controls = useRef<StormController | null>(null);
  const [hud, setHud] = useState(() => readHud(newStorm()));

  useEffect(() => {
    if (!canvas.current) return;
    const game = runStorm(canvas.current, setHud);
    controls.current = game;
    return () => {
      game.dispose();
      controls.current = null;
    };
  }, []);

  const seaStatus = hud.phase === "calm"
    ? "Great calm"
    : hud.phase === "rebuke"
      ? "Jesus in the stern"
      : hud.phase === "wake"
        ? "Boat filling"
        : hud.phase === "squall"
          ? `Squall ${hud.squallDone} / 3`
          : `Evening ${hud.launchDone} / 2`;

  return (
    <section
      className="storm-stage storm-js"
      aria-label="Play the storm on the Sea of Galilee"
      data-ready={hud.ready}
      aria-busy={!hud.ready}
    >
      <div className="storm-instruments">
        <div className="storm-tally">
          <span className="storm-wave-icon" aria-hidden="true" />
          <span className="storm-sea-word">Sea</span> <strong>{seaStatus}</strong>
          <span className="storm-hull-stat">
            {hud.calmed ? "Water still" : `Hull ${hud.waterPercent}%`}
          </span>
        </div>
        <div className="storm-tools">
          <button
            type="button"
            disabled={!hud.ready}
            onClick={() => controls.current?.toggleSound()}
            aria-pressed={hud.sound}
            aria-label={hud.sound ? "Mute sound" : "Enable sound"}
            title={hud.sound ? "Mute sound" : "Enable sound"}
          >
            <span aria-hidden="true">{hud.sound ? "♪" : "×"}</span>
            <span className="storm-sound-word"> Sound</span>
          </button>
          <button
            type="button"
            disabled={!hud.ready}
            onClick={() => controls.current?.togglePause()}
            aria-label={hud.paused ? "Resume" : "Pause"}
          >
            <span className={hud.paused ? "storm-play-mark" : "storm-pause-mark"} aria-hidden="true" />
            {hud.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <div className="storm-window">
        <canvas
          ref={canvas}
          width="1012"
          height="460"
          tabIndex={0}
          role="application"
          aria-label="Galilee fishing boat"
          aria-describedby="storm-move-help"
        >
          The boat targets below let you set sail, fight the squall, wake Jesus in the stern, and read the Gospel calm.
        </canvas>
        {hud.paused && (
          <div className="storm-overlay">
            <p>Paused</p>
            <button type="button" onClick={() => controls.current?.togglePause()}>
              Return to the boat
            </button>
          </div>
        )}
        {hud.card && (
          <div className="storm-card" data-calm={hud.calmed ? "true" : undefined}>
            <h2>{hud.card.heading}</h2>
            <p>
              {hud.card.quote} <Link href={hud.card.href}>{hud.card.ref}</Link>
            </p>
          </div>
        )}
        {!hud.visual && (
          <p className="storm-vision">
            Use Boat targets below to keep playing while the picture is unavailable.
          </p>
        )}
      </div>

      <div className="storm-control-panel">
        <button
          className="storm-action"
          type="button"
          data-tone={hud.actionTone}
          disabled={!hud.ready || hud.paused}
          onClick={() => controls.current?.perform()}
          aria-label={hud.action}
        >
          <span>{hud.action}</span>
          <kbd aria-hidden="true">Space</kbd>
        </button>
        {hud.calmed && (
          <button className="storm-replay" type="button" onClick={() => controls.current?.reset()}>
            Play again
          </button>
        )}
        <p className="storm-move-help" id="storm-move-help">
          <span className="storm-desktop-help">Move along deck with WASD or arrow keys. </span>
          Drag to steer, or tap the mast, oars, hull, or stern.
        </p>
      </div>

      <div className="storm-response" role="status" aria-live="polite" aria-atomic="true">
        {hud.message || (hud.ready
          ? "Evening on the Sea of Galilee. Jesus rests on the cushion in the stern — set the sail and pull the oars."
          : "Launching the boat…")}
      </div>

      <details className="storm-targets" key={hud.visual ? "drawn" : "text"} open={hud.visual ? undefined : true}>
        <summary>Boat targets</summary>
        <p>Choose a station on deck to walk there and act.</p>
        <div>
          {hud.tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!hud.ready || t.done || hud.paused}
              onClick={() => controls.current?.go(t.id)}
            >
              {t.label}
              {t.done && <span aria-hidden="true"> ✓</span>}
            </button>
          ))}
          {hud.canWake && (
            <button
              type="button"
              disabled={!hud.ready || hud.woke || hud.paused}
              onClick={() => controls.current?.go("stern")}
            >
              Wake Jesus
              {hud.woke && <span aria-hidden="true"> ✓</span>}
            </button>
          )}
          {hud.woke && (
            <button
              type="button"
              disabled={!hud.ready || hud.calmed || hud.paused}
              onClick={() => controls.current?.go("still")}
            >
              Speak to the sea
              {hud.calmed && <span aria-hidden="true"> ✓</span>}
            </button>
          )}
        </div>
      </details>
    </section>
  );
}

export default function StormStage() {
  return (
    <StormBoundary>
      <GalileeBoat />
    </StormBoundary>
  );
}
