"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPassage, type Passage } from "@/lib/jesus/client";
import type { LifePlateMeta } from "@/lib/jesus/life-plates";
import type { LifeData, LifeEvent } from "@/lib/jesus/types";
import { useTranslation } from "@/lib/i18n";
import GlossText from "@/app/_components/GlossText";
import LifeEventPlate from "../LifeEventPlate";
import LifeDataTable from "./LifeDataTable";
import type { RoutePoint } from "./GalileeMap";
import { LifeEraRail } from "./LifeEraRail";
import LifeMapExperience from "./LifeMapExperience";
import { JourneyNarrative } from "./JourneyNarrative";
import LanguageSelector from "./LanguageSelector";
import MapThenNow from "./MapThenNow";
import { PLACE_BY_ID } from "./geo";

/** Gold → stone: the incarnation's light settling into the dust of history. */
const GOLD = [210, 169, 79];
const STONE = [122, 106, 82];
const lifeNodeColor = (t: number) => {
  const c = GOLD.map((g, i) => Math.round(g + (STONE[i] - g) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

function LifeProgress({ events }: { events: LifeEvent[] }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const els = events
      .map((e) => document.getElementById(`life-stop-${e.id}`))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null;
        for (const e of entries) {
          const idx = els.indexOf(e.target as HTMLElement);
          if (idx === -1) continue;
          if (e.isIntersecting && (!best || e.intersectionRatio > best.ratio))
            best = { idx, ratio: e.intersectionRatio };
        }
        if (best) setActive(best.idx);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const first = els[0];
        const last = els[els.length - 1];
        if (!first || !last) return;
        const top = first.offsetTop;
        const bottom = last.offsetTop + last.offsetHeight;
        const vh = window.innerHeight;
        const scrolled = window.scrollY + vh * 0.5;
        const t = Math.max(0, Math.min(1, (scrolled - top) / Math.max(1, bottom - top)));
        setProgress(t);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [events]);

  return (
    <div className="jsu-life-progress" aria-hidden="true">
      <div className="jsu-life-progress-track">
        <div className="jsu-life-progress-fill" style={{ height: `${progress * 100}%` }} />
        {events.map((e, i) => (
          <a
            key={e.id}
            href={`#life-stop-${e.id}`}
            className={`jsu-life-progress-dot${i === active ? " active" : ""}`}
            style={
              {
                top: `${events.length > 1 ? (i / (events.length - 1)) * 100 : 0}%`,
                ["--node" as string]: lifeNodeColor(events.length > 1 ? i / (events.length - 1) : 0),
              } as React.CSSProperties
            }
            aria-label={`${i + 1}. ${e.title}`}
            /* The whole scrubber is aria-hidden because it duplicates the
               stops below, each of which is a real heading-led block in
               reading order. These anchors stayed focusable inside it, so a
               keyboard user could tab into content no screen reader would
               announce — axe flags it as aria-hidden-focus. Taking them out of
               the tab order keeps the visual scrubber and loses nothing: the
               stop it jumps to is already reachable by reading the page. */
            tabIndex={-1}
          />
        ))}
      </div>
      <span className="jsu-life-progress-label">
        {active + 1} / {events.length}
      </span>
    </div>
  );
}

/** Interactive life room — harmony index + plates from the server; gospel text on demand. */
export default function LifeRoom({
  data,
  plates,
}: {
  data: LifeData;
  plates: Record<string, LifePlateMeta>;
}) {
  const { t } = useTranslation();
  /** Map highlight / journey step — may change on hover without opening text. */
  const [focus, setFocus] = useState<LifeEvent | null>(
    () => data.events[0] ?? null,
  );
  /** Expanded event whose gospel text is open. */
  const [openId, setOpenId] = useState<string | null>(null);
  const [passages, setPassages] = useState<Record<string, Passage[] | "error">>({});

  // The journey, place to place in the harmony's order — consecutive
  // events at the same place collapse into one stop. `stepOf` maps each
  // event to its stop, so the map can draw the move for the selected one.
  const { route, stepOf, eventIndex } = useMemo(() => {
    const pts: RoutePoint[] = [];
    const stepOf = new Map<string, number>();
    const eventIndex = new Map<string, number>();
    for (const [index, e] of data.events.entries()) {
      if (!pts.length || pts[pts.length - 1].placeId !== e.place) {
        pts.push({ placeId: e.place, era: e.era });
      }
      stepOf.set(e.id, pts.length - 1);
      eventIndex.set(e.id, index);
    }
    return { route: pts, stepOf, eventIndex };
  }, [data]);

  const loadPassages = async (event: LifeEvent) => {
    // Already loaded (including a finished empty/error attempt).
    if (passages[event.id] !== undefined) return;
    try {
      const loaded = (
        await Promise.all(event.refs.map((r) => getPassage(r.ref)))
      ).filter((p): p is Passage => p !== null);
      setPassages((prev) => ({ ...prev, [event.id]: loaded }));
    } catch {
      setPassages((prev) => ({ ...prev, [event.id]: "error" }));
    }
  };

  const openEvent = (event: LifeEvent) => {
    setFocus(event);
    setOpenId(event.id);
    void loadPassages(event);
  };

  const toggle = (event: LifeEvent) => {
    if (openId === event.id) {
      setOpenId(null);
      return;
    }
    openEvent(event);
  };

  const eventForPlace = (placeId: string) => {
    const candidates = data.events.filter((event) => event.place === placeId);
    if (candidates.length < 2 || !focus) return candidates[0];

    const currentIndex = eventIndex.get(focus.id) ?? 0;
    return candidates.reduce((nearest, event) => {
      const nearestDistance = Math.abs(
        (eventIndex.get(nearest.id) ?? 0) - currentIndex,
      );
      const eventDistance = Math.abs(
        (eventIndex.get(event.id) ?? 0) - currentIndex,
      );
      return eventDistance < nearestDistance ? event : nearest;
    });
  };

  const focusPlace = (placeId: string) => {
    const event = eventForPlace(placeId);
    if (event) setFocus(event);
  };

  const focusEvent = (eventId: string) => {
    const event = data.events[eventIndex.get(eventId) ?? -1];
    if (event) setFocus(event);
  };

  const scrollToEvent = (event: LifeEvent) => {
    document
      .getElementById(`life-stop-${event.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const mapEvent = focus;
  const activeEventIndex = mapEvent ? eventIndex.get(mapEvent.id) ?? null : null;

  return (
    <>
      <p className="kicker">
        <Link href="/jesus">Jesus Christ</Link>
      </p>
      <h1>{t("life.title")}</h1>

      <LifeMapExperience
        activeEvent={mapEvent}
        activeEventIndex={activeEventIndex}
        activeRouteStep={
          mapEvent ? stepOf.get(mapEvent.id) ?? null : null
        }
        events={data.events}
        route={route}
        onFocusEvent={focusEvent}
        onFocusPlace={focusPlace}
        onReadEvent={() => {
          if (!mapEvent) return;
          openEvent(mapEvent);
          scrollToEvent(mapEvent);
        }}
      />

      <MapThenNow placeId={mapEvent?.place ?? null} />

      <div className="jsu-life-guide-intro">
        <p className="lede">
          {t("life.lede")}
        </p>
        <LanguageSelector />
      </div>

      <LifeEraRail data={data} activeEra={mapEvent?.era ?? null} />

      <div className="jsu-life-rail-wrap">
        <LifeProgress events={data.events} />
        <div className="jsu-life">
          <div>
            {data.eras.map((era) => {
              const events = data.events.filter((e) => e.era === era.id);
              if (events.length === 0) return null;
              const eraName = t(`life.era.${era.id}.name`);
              return (
                <section
                  className="jsu-life-era-section"
                  key={era.id}
                  id={`life-era-${era.id}`}
                >
                  <h2 className="jsu-chapter">{eraName}</h2>
                  <div className="jsu-life-era-events">
                    {events.map((event) => {
                      const isOpen = openId === event.id;
                      const isMapActive = mapEvent?.id === event.id;
                      const stopNumber = (eventIndex.get(event.id) ?? 0) + 1;
                      const place = PLACE_BY_ID.get(event.place);
                      const loaded = passages[event.id];
                      return (
                        <article
                          className={`jsu-pair-block jsu-life-stop${isMapActive ? " is-map-active" : ""}${isOpen ? " is-open" : ""}`}
                          id={`life-stop-${event.id}`}
                          key={event.id}
                        >
                          <button
                            type="button"
                            className="jsu-pair-head"
                            onClick={() => toggle(event)}
                            onMouseEnter={() => setFocus(event)}
                            onFocus={() => setFocus(event)}
                            aria-expanded={isOpen}
                            aria-controls={`life-event-${event.id}`}
                            aria-current={isMapActive ? "step" : undefined}
                          >
                            <span className="jsu-life-stop-meta">
                              {String(stopNumber).padStart(2, "0")} ·{" "}
                              {place?.name ?? event.place}
                            </span>
                            <strong>{event.title}</strong>
                            <span className="scr-meta jsu-pair-refs">
                              {event.line}
                            </span>
                          </button>
                          {isOpen && (
                            <div
                              className="jsu-panel jsu-life-panel"
                              id={`life-event-${event.id}`}
                            >
                              {plates[event.id] && (
                                <LifeEventPlate plate={plates[event.id]} />
                              )}
                              {loaded === undefined && (
                                <p className="scr-empty" role="status">
                                  Opening the text…
                                </p>
                              )}
                              {loaded === "error" && (
                                <p className="scr-empty">
                                  The passage didn&rsquo;t load — try again.
                                </p>
                              )}
                              {Array.isArray(loaded) && loaded.length === 0 && (
                                <p className="scr-empty">
                                  No hosted text for this reference yet.
                                </p>
                              )}
                              {Array.isArray(loaded) &&
                                loaded.map((p) => (
                                  <div key={p.ref}>
                                    <Link className="scr-ref" href={p.href}>
                                      {p.label}
                                    </Link>
                                    <p>
                                      <GlossText text={p.text} />
                                    </p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      <LifeDataTable data={data} />

      <details className="jsu-narrative-toggle" open={false}>
        <summary>{t("life.narrative.title")}</summary>
        <JourneyNarrative data={data} />
      </details>
    </>
  );
}
