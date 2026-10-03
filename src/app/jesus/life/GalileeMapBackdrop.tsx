import { ATLAS_LAND, ATLAS_WATER } from "./atlas-geography";
import {
  GRATICULE_LINES,
  MODERN_BOUNDARY_PATHS,
  MODERN_REFERENCE_CITIES,
  MODERN_REFERENCE_LABELS,
  SCALE_BAR,
  jordanRiverPath,
  project,
  ringPath,
} from "./geo";

const galileeLabel = project(32.95, 35.38);
const samariaLabel = project(32.28, 35.34);
const judeaLabel = project(31.62, 35.2);
const decapolisLabel = project(32.38, 35.82);
const seaLabel = project(32.55, 34.56);

export function GalileeMapBackdrop() {
  return (
    <>
      <rect x="0" y="0" width="400" height="560" className="jsu-map-sea" />
      {ATLAS_LAND.map((ring, index) => <path key={`land-${index}`} d={ringPath(ring.map(([lng, lat]) => [lat, lng]))} className="jsu-map-land" />)}
      <g aria-hidden="true">
        {GRATICULE_LINES.map((line) => (
          <g key={line.id}>
            <path d={line.d} className="jsu-map-grid" />
            <text x={line.labelX} y={line.labelY} className="jsu-map-grid-label">
              {line.label}
            </text>
          </g>
        ))}
        {MODERN_BOUNDARY_PATHS.map((boundary) => (
          <path
            key={boundary.id}
            d={boundary.d}
            className={`jsu-map-modern-boundary is-${boundary.kind}`}
          />
        ))}
        {MODERN_REFERENCE_LABELS.map((label) => (
          <text
            key={label.id}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor ?? "start"}
            className="jsu-map-modern-label"
          >
            {label.label}
          </text>
        ))}
        {MODERN_REFERENCE_CITIES.map((city) => {
          const anchor = city.side === "left" ? "end" : "start";
          const dx = city.side === "left" ? -6 : 6;
          return (
            <g key={city.id} className="jsu-map-reference-city">
              <circle cx={city.x} cy={city.y} r="1.8" className="jsu-map-reference-city-dot" />
              <text x={city.x + dx} y={city.y + 3.2} textAnchor={anchor} className="jsu-map-reference-city-label">
                {city.name}
              </text>
            </g>
          );
        })}
      </g>
      <text x={seaLabel.x} y={seaLabel.y} className="jsu-map-region jsu-map-sea-label" transform={`rotate(-90 ${seaLabel.x} ${seaLabel.y})`}>
        MEDITERRANEAN
      </text>
      {ATLAS_WATER.map((ring, index) => <path key={`water-${index}`} d={ringPath(ring.map(([lng, lat]) => [lat, lng]))} className="jsu-map-water" />)}
      <path d={jordanRiverPath()} className="jsu-map-river" fill="none" />
      <text x={galileeLabel.x} y={galileeLabel.y} className="jsu-map-region">GALILEE</text>
      <text x={decapolisLabel.x} y={decapolisLabel.y} className="jsu-map-region" textAnchor="middle">DECAPOLIS</text>
      <text x={samariaLabel.x} y={samariaLabel.y} className="jsu-map-region">SAMARIA</text>
      <text x={judeaLabel.x} y={judeaLabel.y} className="jsu-map-region">JUDEA</text>
      <g className="jsu-map-compass" aria-hidden="true">
        <path d="M 52 45 L 52 82" className="jsu-map-compass-line" />
        <path d="M 52 34 L 45 51 L 59 51 Z" className="jsu-map-compass-arrow" />
        <text x="52" y="28" textAnchor="middle">N</text>
      </g>
      <g className="jsu-map-scale" aria-hidden="true">
        <path d={`M ${SCALE_BAR.x1} ${SCALE_BAR.y} L ${SCALE_BAR.x2} ${SCALE_BAR.y}`} className="jsu-map-scale-line" />
        <path
          d={`M ${SCALE_BAR.x1} ${SCALE_BAR.y - 4} L ${SCALE_BAR.x1} ${SCALE_BAR.y + 4} M ${SCALE_BAR.x2} ${SCALE_BAR.y - 4} L ${SCALE_BAR.x2} ${SCALE_BAR.y + 4}`}
          className="jsu-map-scale-tick"
        />
        <text x={SCALE_BAR.labelX} y={SCALE_BAR.labelY} textAnchor="middle">{SCALE_BAR.label}</text>
      </g>
    </>
  );
}
