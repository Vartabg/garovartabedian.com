"use client";

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  ScaleControl,
  type GeoJSONSource,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RoutePoint } from "./GalileeMap";
import {
  BOUNDS,
  PLACE_BY_ID,
  PLACES,
} from "./geo";

type MapMode = "story" | "explore";

type ImmersiveHolyLandMapProps = {
  activePlaceId: string | null;
  activeStep: number | null;
  mode: MapMode;
  resetSignal: number;
  route: RoutePoint[];
  loadingLabel: string;
  unavailableLabel: string;
  onSelectPlace: (placeId: string) => void;
  onInteract: () => void;
  onUnavailable: () => void;
};

type MarkerRecord = {
  element: HTMLButtonElement;
  marker: Marker;
  placeId: string;
};

const DEFAULT_CAMERA = {
  center: [35.3, 32.36] as [number, number],
  zoom: 7.55,
  pitch: 0,
  bearing: 0,
};

function routeCoordinates(route: RoutePoint[]): [number, number][] {
  return route.flatMap((stop) => {
    const place = PLACE_BY_ID.get(stop.placeId);
    return place ? ([[place.lng, place.lat]] as [number, number][]) : [];
  });
}

function routeFeature(coordinates: [number, number][]) {
  const line =
    coordinates.length === 1 ? [coordinates[0], coordinates[0]] : coordinates;

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: line,
    },
  };
}

/** Contemporary physical geography; Gospel places are a separate authored overlay.
 * OpenMapTiles schema: https://openmaptiles.org/schema/
 * Provider: https://openfreemap.org/quick_start/ (no key or account required).
 */
function buildStyle(route: RoutePoint[]): StyleSpecification {
  const fullRoute = routeCoordinates(route.filter((stop) => stop.era === route[0]?.era));
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      geography: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
      terrain: {
        type: "raster-dem",
        tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"],
        tileSize: 512, minzoom: 0, maxzoom: 12, encoding: "terrarium",
        attribution: 'Relief <a href="https://mapterhorn.com/attribution/" target="_blank" rel="noreferrer">Mapterhorn</a>',
      },
      route: { type: "geojson", data: routeFeature(fullRoute) },
      progress: { type: "geojson", data: routeFeature(fullRoute.slice(0, 1)) },
      regions: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            { name: "GALILEE", coordinates: [35.25, 32.97] },
            { name: "SAMARIA", coordinates: [35.12, 32.36] },
            { name: "JUDEA", coordinates: [35.08, 31.56] },
            { name: "DECAPOLIS", coordinates: [35.89, 32.49] },
            { name: "MEDITERRANEAN SEA", coordinates: [34.65, 32.7], water: true },
            { name: "DEAD SEA", coordinates: [35.52, 31.48], water: true },
          ].map(({ name, coordinates, water }) => ({
            type: "Feature", properties: { name, water: !!water },
            geometry: { type: "Point", coordinates },
          })),
        },
      },
      places: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: PLACES.map((place) => ({
            type: "Feature", properties: { id: place.id, anchor: Boolean(place.anchor) },
            geometry: { type: "Point", coordinates: [place.lng, place.lat] },
          })),
        },
      },
    },
    terrain: { source: "terrain", exaggeration: 1 },
    layers: [
      { id: "land", type: "background", paint: { "background-color": "#e9e9da" } },
      {
        id: "vegetation", type: "fill", source: "geography", "source-layer": "landcover",
        paint: { "fill-color": ["match", ["get", "class"], "wood", "#c3cfb1", "grass", "#d8dec6", "scrub", "#d8dbbd", "sand", "#edddbe", "#e0e2cd"], "fill-opacity": 0.68 },
      },
      {
        id: "settlements", type: "fill", source: "geography", "source-layer": "landuse",
        filter: ["match", ["get", "class"], ["residential", "commercial", "industrial"], true, false],
        paint: { "fill-color": "#ded6c6", "fill-opacity": 0.6 },
      },
      {
        id: "terrain-shade", type: "hillshade", source: "terrain",
        paint: {
          "hillshade-accent-color": "#a3a58a", "hillshade-exaggeration": 0.42,
          "hillshade-highlight-color": "#fffff2", "hillshade-shadow-color": "#697969",
          "hillshade-illumination-anchor": "map", "hillshade-illumination-direction": 315,
        },
      },
      {
        id: "water", type: "fill", source: "geography", "source-layer": "water",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: { "fill-color": "#97c1c5", "fill-outline-color": "#7eaaad" },
      },
      {
        id: "waterways", type: "line", source: "geography", "source-layer": "waterway",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: { "line-color": "#78a9ad", "line-opacity": 0.8, "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.6, 12, 1.7] },
      },
      {
        id: "roads", type: "line", source: "geography", "source-layer": "transportation", minzoom: 8,
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary", "tertiary"], true, false],
        paint: { "line-color": "#fffcf0", "line-opacity": 0.8, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.55, 12, 2.2] },
      },
      {
        id: "regions", type: "symbol", source: "regions",
        layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-letter-spacing": 0.23, "text-max-width": 9, "text-size": ["interpolate", ["linear"], ["zoom"], 7, 11, 10, 15] },
        paint: { "text-color": ["case", ["get", "water"], "#326b76", "#77715b"], "text-halo-color": "#ececdc", "text-halo-width": 1, "text-opacity": 0.78 },
      },
      {
        id: "journey-shadow", type: "line", source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#744d43", "line-dasharray": [1.2, 2], "line-opacity": 0.45, "line-width": 1.8 },
      },
      {
        id: "journey-progress", type: "line", source: "progress",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#fff9e8", "line-opacity": 0.9, "line-width": 6 },
      },
      {
        id: "journey-progress-core", type: "line", source: "progress",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#a34836", "line-opacity": 0.95, "line-width": 2.6 },
      },
      {
        id: "place-halo", type: "circle", source: "places", filter: ["==", ["get", "id"], ""],
        paint: { "circle-color": "#a34836", "circle-opacity": 0.12, "circle-radius": 19, "circle-stroke-color": "#a34836", "circle-stroke-opacity": 0.5, "circle-stroke-width": 1 },
      },
      {
        id: "place-points", type: "circle", source: "places",
        paint: { "circle-color": "#6c5141", "circle-radius": 2.8, "circle-stroke-color": "#fffdf2", "circle-stroke-width": 1.5 },
      },
    ],
  };
}

function cameraBearing(placeId: string): number {
  const bearings: Record<string, number> = {
    "tyre-sidon": 18,
    "caesarea-philippi": -22,
    capernaum: 24,
    "sea-of-galilee": 16,
    nazareth: -18,
    samaria: -8,
    jericho: 24,
    jerusalem: -20,
    bethlehem: -16,
    egypt: 12,
  };
  return bearings[placeId] ?? -10;
}

export default function ImmersiveHolyLandMap({
  activePlaceId,
  activeStep,
  mode,
  resetSignal,
  route,
  loadingLabel,
  unavailableLabel,
  onSelectPlace,
  onInteract,
  onUnavailable,
}: ImmersiveHolyLandMapProps) {
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MarkerRecord[]>([]);
  const reducedMotionRef = useRef(false);
  const callbacks = useRef({ onSelectPlace, onInteract, onUnavailable });
  useEffect(() => { callbacks.current = { onSelectPlace, onInteract, onUnavailable }; }, [onSelectPlace, onInteract, onUnavailable]);
  const lastReset = useRef(resetSignal);
  const hasFramedRegion = useRef(false);
  const arrangeMarkers = useRef<() => void>(() => {});
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: mapNodeRef.current,
        style: buildStyle(route),
        center: DEFAULT_CAMERA.center,
        zoom: DEFAULT_CAMERA.zoom,
        pitch: DEFAULT_CAMERA.pitch,
        bearing: DEFAULT_CAMERA.bearing,
        minZoom: 6,
        maxZoom: 12.2,
        maxPitch: 68,
        maxBounds: [
          [32, 29],
          [39, 36],
        ],
        attributionControl: false,
        cooperativeGestures: true,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        canvasContextAttributes: {
          antialias: true,
        },
      });
    } catch {
      setStatus("error");
      callbacks.current.onUnavailable();
      return;
    }

    mapRef.current = map;
    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right",
    );
    map.addControl(
      new AttributionControl({
        compact: true,
      }),
      "bottom-right",
    );

    map.addControl(new ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");

    const routePlaces = new Set(route.map((stop) => stop.placeId));
    for (const place of PLACES.filter((place) => routePlaces.has(place.id))) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = [
        "jsu-terrain-marker",
        place.anchor ? "is-anchor" : "",
      ]
        .filter(Boolean)
        .join(" ");
      element.dataset.place = place.id;
      element.setAttribute("aria-label", `Explore ${place.name}`);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        callbacks.current.onInteract();
        callbacks.current.onSelectPlace(place.id);
      });

      const label = document.createElement("span");
      label.textContent = place.name;
      element.append(label);
      const marker = new Marker({
        element,
        anchor: "center",
      })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      markersRef.current.push({
        element,
        marker,
        placeId: place.id,
      });
    }

    // Keep direct map targets separated. The place selector always exposes
    // every stop, including marks hidden at the current zoom.
    arrangeMarkers.current = () => {
      const occupied: Array<{ x: number; y: number; labelWidth: number }> = [];
      const size = map.getContainer();
      const mapBounds = size.getBoundingClientRect();
      const toolbar = size.closest(".jsu-terrain-frame")?.querySelector(".jsu-terrain-toolbar")?.getBoundingClientRect();
      const records = [...markersRef.current].sort((a, b) =>
        Number(b.element.classList.contains("is-active")) - Number(a.element.classList.contains("is-active")) ||
        Number(b.element.classList.contains("is-anchor")) - Number(a.element.classList.contains("is-anchor")),
      );
      for (const record of records) {
        const point = map.project(record.marker.getLngLat());
        const labelWidth = record.element.firstElementChild?.getBoundingClientRect().width ?? 80;
        const underToolbar = toolbar && point.x + 24 > toolbar.left - mapBounds.left && point.x - 24 < toolbar.right - mapBounds.left &&
          point.y + 24 > toolbar.top - mapBounds.top && point.y - 40 < toolbar.bottom - mapBounds.top;
        const hidden = point.x < 24 || point.y < 85 || point.x > size.clientWidth - 55 || point.y > size.clientHeight - 45 || underToolbar ||
          occupied.some((other) => Math.abs(other.y - point.y) < 50 &&
            Math.abs(other.x - point.x) < Math.max(48, (other.labelWidth + labelWidth) / 2 + 8));
        record.element.style.visibility = hidden ? "hidden" : "visible";
        if (!hidden) occupied.push({ ...point, labelWidth });
      }
    };
    map.on("move", () => arrangeMarkers.current());
    map.on("dragstart", () => callbacks.current.onInteract());
    map.on("zoomstart", (event) => { if (event.originalEvent) callbacks.current.onInteract(); });
    map.on("webglcontextlost", () => callbacks.current.onUnavailable());
    const loadTimeout = window.setTimeout(() => callbacks.current.onUnavailable(), 20_000);

    map.once("load", () => {
      window.clearTimeout(loadTimeout);
      setStatus("ready");
      map.resize();
      arrangeMarkers.current();
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapNodeRef.current);

    return () => {
      window.clearTimeout(loadTimeout);
      resizeObserver.disconnect();
      for (const record of markersRef.current) record.marker.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      hasFramedRegion.current = false;
    };
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    if (mode === "story") {
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
    } else {
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();
    }
  }, [mode, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    // Draw the selected era, including the leg into it. Repeated visits across
    // all six eras otherwise make the Galilee–Jerusalem corridor an opaque knot.
    const step = activeStep ?? 0;
    const era = route[step]?.era;
    const first = Math.max(0, route.findIndex((stop) => stop.era === era) - 1);
    const last = route.reduce((end, stop, index) => stop.era === era ? index : end, step);
    (map.getSource("route") as GeoJSONSource | undefined)?.setData(
      routeFeature(routeCoordinates(route.slice(first, last + 1))),
    );
    (map.getSource("progress") as GeoJSONSource | undefined)?.setData(
      routeFeature(routeCoordinates(route.slice(first, step + 1))),
    );

    map.setFilter("place-halo", [
      "==",
      ["get", "id"],
      activePlaceId ?? "",
    ]);

    for (const record of markersRef.current) {
      const isActive = record.placeId === activePlaceId;
      record.element.classList.toggle("is-active", isActive);
      record.element.setAttribute("aria-pressed", String(isActive));
    }
    arrangeMarkers.current();
    map.stop();
    if (!hasFramedRegion.current || lastReset.current !== resetSignal) {
      const firstFrame = !hasFramedRegion.current;
      hasFramedRegion.current = true;
      lastReset.current = resetSignal;
      map.fitBounds([[BOUNDS.west, BOUNDS.south], [BOUNDS.east, BOUNDS.north]], {
        padding: { top: 100, right: 65, bottom: map.getContainer().clientWidth < 600 ? 150 : 55, left: 30 },
        pitch: 0, bearing: 0, duration: firstFrame || reducedMotionRef.current ? 0 : 900, essential: false,
      });
      return;
    }

    if (!activePlaceId) return;
    const place = PLACE_BY_ID.get(activePlaceId);
    if (!place) return;

    map.flyTo({
      center: [place.lng, place.lat],
      zoom: place.anchor ? 9.65 : 9.2,
      pitch: mode === "story" ? 38 : map.getPitch(),
      bearing: mode === "story" ? cameraBearing(place.id) : map.getBearing(),
      duration: reducedMotionRef.current ? 0 : 1550,
      essential: false,
    });
  }, [activePlaceId, activeStep, mode, resetSignal, route, status]);

  return (
    <div className="jsu-terrain-stage">
      <div
        ref={mapNodeRef}
        className="jsu-terrain-map"
        role="region"
        aria-label="Interactive terrain map of Galilee, Judea, and the surrounding region"
      />
      {status === "loading" && (
        <div className="jsu-terrain-status" role="status">
          <span className="jsu-terrain-spinner" aria-hidden="true" />
          {loadingLabel}
        </div>
      )}
      {status === "error" && (
        <div className="jsu-terrain-status is-error" role="alert">
          {unavailableLabel}
        </div>
      )}
    </div>
  );
}
