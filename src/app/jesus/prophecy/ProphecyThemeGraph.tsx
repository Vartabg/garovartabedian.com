'use client';

import { useState, type KeyboardEvent } from 'react';
import type { ProphecyPair } from '@/lib/jesus/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProphecyWeight = ProphecyPair['connection'];

/**
 * One featured pair as the graph draws it. Every field is read from the
 * room's own pairs, so the graph cannot disagree with the list below it (it
 * once carried six hand-typed pairs whose labels and verses had drifted).
 */
export interface ProphecyConnection {
  id: string;
  theme: string;
  line: string;
  weight: ProphecyWeight;
  /** Readable references, e.g. "Isaiah 53:4". */
  source: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Weight → visual mapping
// explicit = solid gold
// echo     = dashed
// typology = dotted
// ---------------------------------------------------------------------------

interface WeightVisual {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  opacity: number;
}

export const WEIGHT_VISUALS: Record<ProphecyWeight, WeightVisual> = {
  explicit: {
    stroke: '#FFD700', // solid gold
    strokeWidth: 2.5,
    strokeDasharray: 'none', // solid
    opacity: 1,
  },
  echo: {
    stroke: '#D4AF37',
    strokeWidth: 2,
    strokeDasharray: '8 6', // dashed
    opacity: 0.95,
  },
  typology: {
    stroke: '#C9A86A',
    strokeWidth: 2.2,
    strokeDasharray: '2 6', // dotted
    opacity: 0.9,
  },
};

// ---------------------------------------------------------------------------
// Main component — ProphecyThemeGraph
// ---------------------------------------------------------------------------

export default function ProphecyThemeGraph({
  connections,
  onSelect,
  className = '',
}: {
  connections: ProphecyConnection[];
  /** Opens the chosen pair in the list, where both passages load in full. */
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (connections.length === 0) return null;

  const hovered = hoveredId ? connections.find((c) => c.id === hoveredId) ?? null : null;
  const height = 48 + connections.length * 42;

  const activate = (event: KeyboardEvent, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect?.(id);
  };

  return (
    <div className={`relative w-full rounded-xl border border-white/10 bg-[#0A0C1A] p-4 sm:p-6 ${className}`}>
      {/* Legend — documents the weight → stroke mapping */}
      <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-white/10 pb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Connection weight</h3>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(WEIGHT_VISUALS) as [ProphecyWeight, WeightVisual][]).map(([weight, visual]) => (
            <div key={weight} className="flex items-center gap-2">
              <svg width="28" height="8" aria-hidden="true" className="shrink-0">
                <line
                  x1="0"
                  y1="4"
                  x2="28"
                  y2="4"
                  stroke={visual.stroke}
                  strokeWidth={visual.strokeWidth}
                  strokeDasharray={visual.strokeDasharray === 'none' ? undefined : visual.strokeDasharray}
                  strokeLinecap="round"
                  opacity={visual.opacity}
                />
              </svg>
              <span className="font-mono text-[11px] capitalize tracking-wide text-white/80">{weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG connection map */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 720 ${height}`}
          className="w-[720px] max-w-full"
          style={{ height }}
          role="group"
          aria-label="Featured prophecy pairs, two of each connection type"
        >
          {/* subtle grid */}
          <defs>
            <pattern id="prophecy-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="720" height={height} fill="url(#prophecy-grid)" rx="8" />

          {/* column labels */}
          <text x="120" y="22" textAnchor="middle" className="fill-white/60 font-mono text-[10px] uppercase tracking-[0.18em]">
            Hebrew Bible
          </text>
          <text x="600" y="22" textAnchor="middle" className="fill-white/60 font-mono text-[10px] uppercase tracking-[0.18em]">
            New Testament
          </text>

          {/* connections — weight determines stroke style */}
          {connections.map((conn, index) => {
            const visual = WEIGHT_VISUALS[conn.weight];
            // stagger y positions for readability
            const y = 48 + index * 42;
            const isHovered = hoveredId === conn.id;
            return (
              <g
                key={conn.id}
                onMouseEnter={() => setHoveredId(conn.id)}
                onMouseLeave={() => setHoveredId((prev) => (prev === conn.id ? null : prev))}
                onFocus={() => setHoveredId(conn.id)}
                onBlur={() => setHoveredId((prev) => (prev === conn.id ? null : prev))}
                onClick={() => onSelect?.(conn.id)}
                onKeyDown={(event) => activate(event, conn.id)}
                tabIndex={0}
                role="button"
                aria-label={`${conn.line}: ${conn.source} to ${conn.target}, ${conn.weight}. Open both passages.`}
                className="cursor-pointer outline-none"
              >
                {/* wider invisible hit area */}
                <line
                  x1="200"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke="transparent"
                  strokeWidth="16"
                  className="pointer-events-stroke"
                />
                {/* visible weighted line */}
                <line
                  x1="200"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke={visual.stroke}
                  strokeWidth={isHovered ? visual.strokeWidth + 1.2 : visual.strokeWidth}
                  strokeDasharray={visual.strokeDasharray === 'none' ? undefined : visual.strokeDasharray}
                  strokeLinecap="round"
                  opacity={isHovered ? 1 : visual.opacity}
                  className="transition-all duration-150"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 6px ${visual.stroke}66)` : undefined,
                  }}
                />
                {/* theme label in middle */}
                <g pointerEvents="none">
                  <rect
                    x="310"
                    y={y - 10}
                    width="100"
                    height="16"
                    rx="8"
                    fill={isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <text
                    x="360"
                    y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white/80 font-mono text-[7px] uppercase tracking-wide"
                  >
                    {conn.theme}
                  </text>
                </g>
                {/* endpoints */}
                <circle cx="200" cy={y} r={isHovered ? 5 : 3.5} fill={visual.stroke} opacity={isHovered ? 1 : 0.9} />
                <circle cx="520" cy={y} r={isHovered ? 5 : 3.5} fill={visual.stroke} opacity={isHovered ? 1 : 0.9} />
                {/* passage refs */}
                <text x="196" y={y + 1} textAnchor="end" dominantBaseline="middle" className="fill-white/85 text-[10px] font-medium">
                  {conn.source}
                </text>
                <text x="524" y={y + 1} textAnchor="start" dominantBaseline="middle" className="fill-white/85 text-[10px] font-medium">
                  {conn.target}
                </text>
                {/* weight badge */}
                <text x="360" y={y - 14} textAnchor="middle" className="fill-white/60 font-mono text-[7px] uppercase tracking-widest">
                  {conn.weight}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover card — names the pair; the passages themselves load in the list */}
      {hovered ? (
        <div
          className="pointer-events-none absolute left-1/2 top-[46%] z-10 w-[min(560px,95%)] -translate-x-1/2 rounded-xl border border-amber-200/20 bg-[#141726]/95 p-4 shadow-2xl backdrop-blur-md sm:p-5"
          role="tooltip"
          aria-live="polite"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/80">{hovered.theme}</div>
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
              style={{
                borderColor: WEIGHT_VISUALS[hovered.weight].stroke + '55',
                color: WEIGHT_VISUALS[hovered.weight].stroke,
                background: WEIGHT_VISUALS[hovered.weight].stroke + '14',
              }}
            >
              {hovered.weight}
            </span>
          </div>
          <p className="font-serif text-base leading-6 text-white/90">{hovered.line}</p>
          <p className="mt-2 text-sm text-white/75">
            {hovered.source} → {hovered.target}
          </p>
        </div>
      ) : null}
      <p className="mt-3 text-center font-mono text-[10px] tracking-wide text-white/70">
        Choose a line to read both passages in full below.
      </p>
    </div>
  );
}
