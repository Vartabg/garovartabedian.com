"use client";

import Link from "next/link";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { newCourt } from "./courtGame";
import { readHud, runCourt, type CourtController } from "./courtController";

class CourtBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p className="court-error">The court could not open. <button type="button" onClick={() => this.setState({ failed: false })}>Try again</button> or read the Gospel accounts below.</p>;
    return this.props.children;
  }
}

function Courtyard() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controls = useRef<CourtController | null>(null);
  const [hud, setHud] = useState(() => readHud(newCourt()));
  useEffect(() => {
    if (!canvas.current) return;
    const game = runCourt(canvas.current, setHud);
    controls.current = game;
    return () => { game.dispose(); controls.current = null; };
  }, []);
  return (
    <section className="court-stage court-js" aria-label="Play the Temple courtyard" data-ready={hud.ready} aria-busy={!hud.ready}>
      <div className="court-instruments">
        <div className="court-tally">
          <span className="court-fixture-icon" aria-hidden="true" />
          <span>Stalls</span> <strong>{hud.count} / 5</strong>
          <span className="court-gate">{hud.barred ? "Passage barred" : "Passage open"}</span>
        </div>
        <div className="court-tools">
          <button type="button" disabled={!hud.ready} onClick={() => controls.current?.toggleSound()} aria-pressed={hud.sound} aria-label={hud.sound ? "Mute sound" : "Enable sound"} title={hud.sound ? "Mute sound" : "Enable sound"}>
            <span aria-hidden="true">{hud.sound ? "♪" : "×"}</span><span className="court-sound-word"> Sound</span>
          </button>
          <button type="button" disabled={!hud.ready} onClick={() => controls.current?.togglePause()} aria-label={hud.paused ? "Resume" : "Pause"}>
            <span className={hud.paused ? "court-play-mark" : "court-pause-mark"} aria-hidden="true" />{hud.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
      <div className="court-window">
        <canvas ref={canvas} width="1012" height="460" tabIndex={0} role="application" aria-label="Temple courtyard" aria-describedby="court-move-help">
          The courtyard targets below let you approach and overturn each stall.
        </canvas>
        {hud.paused && <div className="court-overlay"><p>Paused</p><button type="button" onClick={() => controls.current?.togglePause()}>Return to the court</button></div>}
        {hud.complete && <div className="court-teaching"><h2>A house of prayer</h2><p>“My house will be called a house of prayer for all the nations.” <Link href="/scriptures/protestant/MRK/11?t=web#v17">Mark 11:17</Link></p></div>}
        {!hud.visual && <p className="court-vision">Use Courtyard targets below to keep playing while the picture is unavailable.</p>}
      </div>
      <div className="court-control-panel">
        <button className="court-strike" type="button" disabled={!hud.ready || hud.paused} onClick={() => controls.current?.perform()} aria-label={hud.action}>
          <span>{hud.action}</span><kbd aria-hidden="true">Space</kbd>
        </button>
        {hud.complete && <button className="court-replay" type="button" onClick={() => controls.current?.reset()}>Play again</button>}
        <p className="court-move-help" id="court-move-help"><span className="court-desktop-help">Move with WASD or arrow keys. </span>Drag to steer, or tap a stall to overturn it.</p>
      </div>
      <div className="court-response" role="status" aria-live="polite" aria-atomic="true">{hud.message || (hud.ready ? "You’re Jesus. The first money table is within reach." : "Opening the courtyard…")}</div>
      <details className="court-targets" key={hud.visual ? "drawn" : "text"} open={hud.visual ? undefined : true}>
        <summary>Courtyard targets</summary>
        <p>Choose a place to walk there and act.</p>
        <div>{hud.fixtures.map(f => <button key={f.id} type="button" disabled={!hud.ready || f.done || hud.paused} onClick={() => controls.current?.go(f.id)}>{f.label}{f.done && <span aria-hidden="true"> ✓</span>}</button>)}</div>
      </details>
    </section>
  );
}

export default function TempleGame() {
  return <CourtBoundary><Courtyard /></CourtBoundary>;
}
