"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LifeEvent } from "@/lib/jesus/types";
import { useTranslation } from "@/lib/i18n";
import GalileeMap, { type RoutePoint } from "./GalileeMap";
import { PLACE_BY_ID, PLACES } from "./geo";
import MapThenNow from "./MapThenNow";

const ImmersiveHolyLandMap = dynamic(
  () => import("./ImmersiveHolyLandMap"),
  {
    ssr: false,
    loading: () => <div className="jsu-terrain-shell-loading" />,
  },
);

type MapView = "overview" | "terrain";
type TerrainMode = "story" | "explore";

export default function LifeMapExperience({
  activeEvent,
  activeEventIndex,
  activeRouteStep,
  events,
  route,
  onFocusEvent,
  onFocusPlace,
  onReadEvent,
}: {
  activeEvent: LifeEvent | null;
  activeEventIndex: number | null;
  activeRouteStep: number | null;
  events: LifeEvent[];
  route: RoutePoint[];
  onFocusEvent: (eventId: string) => void;
  onFocusPlace: (placeId: string) => void;
  onReadEvent: () => void;
}) {
  const { t } = useTranslation();
  // Render the static atlas first so reduced-motion visitors (and accessibility
  // tooling that requests that preference) never have to initialize WebGL.
  // Everyone else still gets Terrain as the hydrated default.
  const [view, setView] = useState<MapView>("overview");
  const [terrainMode, setTerrainMode] = useState<TerrainMode>("story");
  const [isPlaying, setIsPlaying] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [terrainUnavailable, setTerrainUnavailable] = useState(false);

  const pause = useCallback(() => setIsPlaying(false), []);
  const useAtlasFallback = useCallback(() => {
    setTerrainUnavailable(true);
    setView("overview");
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView("terrain");
    }
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) pause(); };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => { if (motion.matches) { pause(); setView("overview"); } };
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, [pause]);

  const focusEvent = useCallback(
    (index: number) => {
      const next = events[Math.max(0, Math.min(events.length - 1, index))];
      if (next) onFocusEvent(next.id);
    },
    [events, onFocusEvent],
  );

  useEffect(() => {
    if (!isPlaying) return;

    const current = activeEventIndex ?? -1;
    if (current >= events.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      focusEvent(current + 1);
    }, current < 0 ? 250 : 3600);

    return () => window.clearTimeout(timer);
  }, [activeEventIndex, events.length, focusEvent, isPlaying]);

  const selectView = (next: MapView) => {
    setView(next);
    if (next === "terrain") setTerrainUnavailable(false);
    if (next === "overview") setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (
      activeEventIndex == null ||
      activeEventIndex >= events.length - 1
    ) {
      focusEvent(0);
    }
    setTerrainMode("story");
    setIsPlaying(true);
  };

  const activePlace = activeEvent
    ? PLACE_BY_ID.get(activeEvent.place)
    : null;
  const activeEraName = activeEvent
    ? t(`life.era.${activeEvent.era}.name`)
    : "";
  const eraStops = useMemo(() => {
    const rows: Array<{ id: string; index: number; count: number }> = [];
    const byId = new Map<string, (typeof rows)[number]>();
    for (const [index, event] of events.entries()) {
      let row = byId.get(event.era);
      if (!row) {
        row = { id: event.era, index, count: 0 };
        rows.push(row);
        byId.set(event.era, row);
      }
      row.count += 1;
    }
    return rows;
  }, [events]);

  const journeyConsole = (
    <div className={`jsu-journey-console is-${view}`}>
      <label className="jsu-journey-scrubber">
        <span>Explore the journey</span>
        <input type="range" min={0} max={Math.max(0, events.length - 1)}
          value={activeEventIndex ?? 0}
          aria-label="Journey position"
          aria-valuetext={`${(activeEventIndex ?? 0) + 1} of ${events.length}: ${activeEvent?.title ?? "First stop"}`}
          onChange={(event) => { pause(); focusEvent(Number(event.target.value)); }} />
      </label>
      <button
        type="button"
        aria-label={t("life.map.previousStop")}
        disabled={activeEventIndex == null || activeEventIndex <= 0}
        onClick={() => { pause(); focusEvent((activeEventIndex ?? 0) - 1); }}
      >
        ←
      </button>
      <label className="jsu-journey-picker">
        <span aria-live="polite">
          {activeEraName && (
            <>
              <span className="jsu-journey-progress">
                {activeEraName}
              </span>
              {" · "}
            </>
          )}
          {activeEventIndex == null
            ? t("life.map.ready")
            : t("life.map.stopCount", {
                current: activeEventIndex + 1,
                total: events.length,
              })}
        </span>
        <select
          aria-label={t("life.map.currentStop")}
          value={activeEvent?.id ?? ""}
          onChange={(event) => { pause(); onFocusEvent(event.target.value); }}
        >
          {events.map((event, index) => (
            <option key={event.id} value={event.id}>
              {String(index + 1).padStart(2, "0")} · {event.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        aria-label={t("life.map.nextStop")}
        disabled={
          activeEventIndex != null &&
          activeEventIndex >= events.length - 1
        }
        onClick={() => { pause(); focusEvent((activeEventIndex ?? -1) + 1); }}
      >
        →
      </button>
      <button
        type="button"
        className="jsu-journey-play"
        onClick={togglePlayback}
      >
        <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
        {isPlaying
          ? t("life.map.pauseJourney")
          : t("life.map.playJourney")}
      </button>
    </div>
  );

  const eraNavigation = (
    <nav
      className={`jsu-terrain-era-nav is-${view}`}
      aria-label={t("life.rail.label")}
    >
      {eraStops.map((era, index) => (
        <button
          type="button"
          key={era.id}
          className={activeEvent?.era === era.id ? "is-active" : ""}
          aria-current={activeEvent?.era === era.id ? "step" : undefined}
          onClick={() => { pause(); focusEvent(era.index); }}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{t(`life.era.${era.id}.name`)}</strong>
          <small>{era.count}</small>
        </button>
      ))}
    </nav>
  );

  const eventCard = activeEvent ? (
    <article
      className="jsu-map-event-card"
    >
      <span className="jsu-map-event-number" aria-hidden="true">
        {String((activeEventIndex ?? 0) + 1).padStart(2, "0")}
      </span>
      <div className="jsu-map-event-copy">
        <span>
          {activeEraName}
          {activePlace ? ` · ${activePlace.name}` : ""}
        </span>
        <strong>{activeEvent.title}</strong>
        <small>{activeEvent.line}</small>
        {activePlace && (
          <span className="jsu-map-event-place">
            {activePlace.modern} · {activePlace.lat.toFixed(2)} N,{" "}
            {activePlace.lng.toFixed(2)} E
          </span>
        )}
      </div>
      <button type="button" onClick={() => { pause(); onReadEvent(); }}>
        {t("life.map.readEvent")}
      </button>
    </article>
  ) : null;

  return (
    <section
      className={`jsu-map-experience is-${view}`}
      aria-labelledby="life-map-title"
    >
      <header className="jsu-map-experience-head">
        <div>
          <p className="jsu-map-experience-kicker">
            {t("life.map.experienceKicker")}
          </p>
          <h2 id="life-map-title">{t("life.map.experienceTitle")}</h2>
          <p>{t("life.map.experienceText")}</p>
        </div>
        <div
          className="jsu-map-view-switch"
          role="group"
          aria-label={t("life.map.viewLabel")}
        >
          <button
            type="button"
            aria-pressed={view === "overview"}
            aria-controls="life-map-panel"
            className={view === "overview" ? "is-active" : ""}
            onClick={() => selectView("overview")}
          >
            {t("life.map.overview")}
          </button>
          <button
            type="button"
            aria-pressed={view === "terrain"}
            aria-controls="life-map-panel"
            className={view === "terrain" ? "is-active" : ""}
            onClick={() => selectView("terrain")}
          >
            <span aria-hidden="true">◇</span>
            {t("life.map.terrain")}
          </button>
        </div>
      </header>
      {terrainUnavailable && <p className="scr-meta" role="status">Terrain could not load. The atlas keeps every journey stop available.</p>}

      <label className="jsu-map-place-picker">
        <span>{t("life.map.placePickerLabel")}</span>
        <select
          data-ui-target="standard"
          value={activeEvent?.place ?? ""}
          onChange={(event) => {
            if (event.currentTarget.value) {
              pause();
              onFocusPlace(event.currentTarget.value);
            }
          }}
        >
          <option value="">{t("life.map.placePickerOverview")}</option>
          {PLACES.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name} · {place.modern}
            </option>
          ))}
        </select>
      </label>

      <div
        id="life-map-panel"
        className={`jsu-map-panel is-${view}`}
      >
        {view === "overview" ? (
          <div className="jsu-atlas-frame">
            <div className="jsu-atlas-map">
              <GalileeMap
                active={activeEvent?.place ?? null}
                route={route}
                activeEra={activeEvent?.era ?? null}
                activeStep={activeRouteStep}
              />
            </div>
            <aside className="jsu-atlas-dossier">
              {eraNavigation}
              {eventCard}
              {journeyConsole}
            </aside>
          </div>
        ) : (
          <>
            <div className="jsu-terrain-workspace">
            <div className="jsu-terrain-frame">
              <ImmersiveHolyLandMap
                activePlaceId={activeEvent?.place ?? null}
                activeStep={activeRouteStep}
                mode={terrainMode}
                resetSignal={resetSignal}
                route={route}
                loadingLabel={t("life.map.loadingTerrain")}
                unavailableLabel={t("life.map.terrainUnavailable")}
                onSelectPlace={onFocusPlace}
                onInteract={pause}
                onUnavailable={useAtlasFallback}
              />

              <div className="jsu-cartography-title" aria-hidden="true">
                <span>A GOSPEL ATLAS</span>
                <strong>From Galilee to Judea</strong>
              </div>

              <div className="jsu-terrain-toolbar">
                <div
                  className="jsu-terrain-modes"
                  role="group"
                  aria-label={t("life.map.modeLabel")}
                >
                  <button
                    type="button"
                    className={terrainMode === "story" ? "is-active" : ""}
                    aria-pressed={terrainMode === "story"}
                    onClick={() => setTerrainMode("story")}
                  >
                    {t("life.map.storyMode")}
                  </button>
                  <button
                    type="button"
                    className={terrainMode === "explore" ? "is-active" : ""}
                    aria-pressed={terrainMode === "explore"}
                    onClick={() => {
                      setTerrainMode("explore");
                      setIsPlaying(false);
                    }}
                  >
                    {t("life.map.exploreMode")}
                  </button>
                </div>
                <button
                  type="button"
                  className="jsu-terrain-reset"
                  onClick={() => { pause(); setResetSignal((value) => value + 1); }}
                >
                  {t("life.map.wholeRegion")}
                </button>
              </div>

            </div>
            <aside className="jsu-terrain-dossier" aria-label="Selected journey stop">
              {eraNavigation}
              {eventCard}
              {journeyConsole}
            </aside>
            </div>

            <p className="jsu-terrain-boundary">
              <span className="jsu-cartography-key"><i aria-hidden="true" /> Gospel journey</span>
              {t("life.map.routeBoundary")} Contemporary land, water, and roads provide geographic context; they are not a reconstruction of the first century.
            </p>
          </>
        )}
      </div>

      <MapThenNow placeId={activeEvent?.place ?? null} />
      <p className="scr-meta jsu-map-note">
        {t("life.map.note")}
        <span className="jsu-map-note-fine">
          {" "}
          {t("life.map.noteHover")}
        </span>
        <span className="jsu-map-note-coarse">
          {" "}
          {t("life.map.noteTap")}
        </span>
      </p>
      <details className="jsu-map-help">
        <summary>{t("life.map.keyboardShortcutsTitle")}</summary>
        <p>{t("life.map.keyboardShortcutsText")}</p>
      </details>
    </section>
  );
}
