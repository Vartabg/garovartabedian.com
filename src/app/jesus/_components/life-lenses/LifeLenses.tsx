"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { ERA_SHORT, isLens, type LifeLens, type LifeLensesIndex } from "@/lib/jesus/life-lenses";
import { useLifeDetail } from "./detail";
import FindMoment from "./FindMoment";
import LifeMap from "./LifeMap";
import MomentPanel from "./MomentPanel";

const STORE_KEY = "jesus-life-lenses:v1";

type Saved = { id?: unknown; lens?: unknown };
function momentFromHash() {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}

function readSaved(): Saved {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    // Storage can be unavailable (private windows); the page still works.
    return {};
  }
}

/**
 * His life as forty moments, birth to ascension. The visitor chooses a moment
 * on the line, on the map or by name; his words, the four Gospels and the
 * prophecy pairs then all show that same moment, and the choice (and the lens)
 * stays as they switch, move along, or come back later.
 */
export default function LifeLenses({ data }: { data: LifeLensesIndex }) {
  const [id, setId] = useState<string | null>(null);
  const [lens, setLens] = useState<LifeLens>("words");
  const [restored, setRestored] = useState(false);
  const lineRef = useRef<HTMLElement>(null);
  const position = useMemo(() => new Map(data.moments.map((m, i) => [m.id, i])), [data]);
  const at = id === null ? -1 : (position.get(id) ?? -1);
  const moment = at >= 0 ? data.moments[at] : null;
  const { detail, failed, retry } = useLifeDetail(moment !== null);

  // Restore after the first paint, so the server-drawn page is the same for
  // everyone: a #moment link wins, then this device's last moment and lens.
  useEffect(() => {
    const saved = readSaved();
    const fromHash = momentFromHash();
    const start = position.has(fromHash) ? fromHash : typeof saved.id === "string" && position.has(saved.id) ? saved.id : null;
    if (start) setId(start);
    if (isLens(saved.lens)) setLens(saved.lens);
    setRestored(true);
    const onHash = () => {
      const next = momentFromHash();
      if (position.has(next)) setId(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [position]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ id, lens }));
    } catch {
      // Storage can be unavailable; the address still carries the moment.
    }
    const address = id ? `#${id}` : window.location.pathname + window.location.search;
    if (id ? window.location.hash !== `#${id}` : window.location.hash) {
      window.history.replaceState(window.history.state, "", address);
    }
  }, [restored, id, lens]);

  // Keep the chosen moment in view on the line (it scrolls sideways on a
  // phone) without moving the page.
  useEffect(() => {
    const line = lineRef.current;
    const dot = line?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!line || !dot) return;
    const offset = dot.getBoundingClientRect().left - line.getBoundingClientRect().left + line.scrollLeft;
    line.scrollTo({ left: Math.max(0, offset - line.clientWidth / 2 + dot.offsetWidth / 2) });
  }, [at]);

  const choose = useCallback((next: string) => {
    if (position.has(next)) setId(next);
  }, [position]);

  const begin = (next: string, nextLens: LifeLens) => {
    if (!position.has(next)) return;
    setId(next);
    setLens(nextLens);
  };

  const onLineKey = (event: KeyboardEvent<HTMLElement>) => {
    const step = ({ ArrowRight: 1, ArrowLeft: -1 } as Record<string, number>)[event.key];
    const jump = event.key === "Home" ? 0 : event.key === "End" ? data.moments.length - 1 : null;
    if (step === undefined && jump === null) return;
    event.preventDefault();
    const next = jump ?? Math.max(0, Math.min(data.moments.length - 1, (at < 0 ? -1 : at) + (step ?? 0)));
    choose(data.moments[next].id);
    lineRef.current?.querySelectorAll<HTMLElement>(".jl-dot")[next]?.focus();
  };

  const eraName = useMemo(() => new Map(data.eras.map((e) => [e.id, e.name])), [data]);
  const placeName = (place: string) => data.places.find((p) => p.id === place)?.name ?? place;
  const withWords = data.moments.filter((m) => m.counts.words).length;
  const withProphecy = data.moments.filter((m) => m.counts.prophecy).length;
  const focusable = at >= 0 ? at : 0;

  return (
    <section className="jl" aria-label="His life">
      <nav className="jl-starts" aria-label="Start exploring Jesus">
        <p>Choose a starting point, or explore a moment below.</p>
        <ul>
          <li><button type="button" onClick={() => begin("annunciation", "gospels")}>Begin his life</button></li>
          <li><button type="button" onClick={() => begin("sermon-on-the-mount", "words")}>Read the Sermon on the Mount</button></li>
          <li><Link href="/jesus/history">Examine the historical evidence</Link></li>
        </ul>
      </nav>
      <FindMoment data={data} onChoose={choose} />

      <nav
        className="jl-line"
        ref={lineRef}
        aria-label={`His life, ${data.moments.length} moments from birth to ascension`}
        onKeyDown={onLineKey}
      >
        <div className="jl-track">
          {data.eras.map((era) => {
            const moments = data.moments.filter((m) => m.era === era.id);
            return (
              <div key={era.id} className="jl-era" style={{ "--n": moments.length } as CSSProperties}>
                <span className="jl-era-name" aria-hidden="true">
                  {ERA_SHORT[era.id] ?? era.name}
                </span>
                <div className="jl-dots" role="group" aria-label={era.name}>
                  {moments.map((m) => {
                    const i = position.get(m.id) ?? 0;
                    return (
                      <a
                        key={m.id}
                        href={`/jesus/life#life-event-${m.id}`}
                        className={`jl-dot${m.counts.words ? " has-words" : ""}`}
                        aria-label={m.title}
                        aria-current={i === at ? "true" : undefined}
                        title={m.title}
                        tabIndex={i === focusable ? 0 : -1}
                        onClick={(event) => {
                          event.preventDefault();
                          choose(m.id);
                        }}
                      >
                        <i aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="jl-now">
        <button
          type="button"
          aria-label="Previous moment"
          disabled={at <= 0}
          onClick={() => at > 0 && choose(data.moments[at - 1].id)}
        >
          ←
        </button>
        <p aria-live="polite">
          {moment ? (
            <>
              <strong>{moment.title}</strong> · {at + 1} of {data.moments.length}
            </>
          ) : (
            <>
              {data.moments.length} moments, birth to ascension ·{" "}
              <span className="jl-legend">
                <i aria-hidden="true" /> he speaks
              </span>
            </>
          )}
        </p>
        <button
          type="button"
          aria-label="Next moment"
          disabled={at === data.moments.length - 1}
          onClick={() => choose(data.moments[Math.min(data.moments.length - 1, at + 1)].id)}
        >
          →
        </button>
      </div>

      <div className="jl-stage">
        <LifeMap data={data} at={at} onChoose={choose} />
        {moment ? (
          <MomentPanel
            moment={moment}
            eraName={eraName.get(moment.era) ?? moment.era}
            placeName={placeName(moment.place)}
            lens={lens}
            onLens={setLens}
            detail={detail?.moments[moment.id] ?? null}
            failed={failed}
            onRetry={retry}
            before={at > 0 ? data.moments[at - 1] : null}
            after={at < data.moments.length - 1 ? data.moments[at + 1] : null}
            onChoose={choose}
          />
        ) : (
          <div className="jl-moment is-rest">
            <h2>Choose a moment on the line or a place on the map.</h2>
            <p>
              {data.moments.length} moments from his birth to his ascension, at {data.places.length} places. His own
              words are recorded at {withWords} of them, and {withProphecy} are paired with an Old Testament prophecy.
            </p>
            <p>Whatever you choose stays chosen as you switch between his words, the four Gospels and prophecy.</p>
          </div>
        )}
      </div>
    </section>
  );
}
