'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProphecyWeight = 'explicit' | 'echo' | 'typology';

export interface Passage {
  ref: string;
  text: string;
  original?: string;
  language?: 'hebrew' | 'greek' | 'aramaic';
}

export interface ProphecyConnection {
  id: string;
  source: Passage;
  target: Passage;
  weight: ProphecyWeight;
  theme: string;
  note?: string;
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
  label: string;
}

export const WEIGHT_VISUALS: Record<ProphecyWeight, WeightVisual> = {
  explicit: {
    stroke: '#FFD700', // solid gold
    strokeWidth: 2.5,
    strokeDasharray: 'none', // solid
    opacity: 1,
    label: 'explicit — solid gold',
  },
  echo: {
    stroke: '#D4AF37',
    strokeWidth: 2,
    strokeDasharray: '8 6', // dashed
    opacity: 0.95,
    label: 'echo — dashed',
  },
  typology: {
    stroke: '#C9A86A',
    strokeWidth: 2.2,
    strokeDasharray: '2 6', // dotted
    opacity: 0.9,
    label: 'typology — dotted',
  },
};

export function getWeightVisual(weight: ProphecyWeight): WeightVisual {
  return WEIGHT_VISUALS[weight];
}

// ---------------------------------------------------------------------------
// OriginalLine — renders a passage line with original language support
// ---------------------------------------------------------------------------

export function OriginalLine({
  passage,
  align = 'left',
}: {
  passage: Passage;
  align?: 'left' | 'right';
}) {
  const isRtl = passage.language === 'hebrew' || passage.language === 'aramaic';
  return (
    <div className={`flex flex-col gap-1.5 ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{passage.ref}</div>
      {passage.original ? (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          lang={passage.language ?? undefined}
          className={`rounded bg-white/[0.04] px-2.5 py-1.5 font-serif text-sm leading-6 text-amber-100/90 ${isRtl ? 'text-right' : 'text-left'}`}
          style={{ fontFamily: isRtl ? '"Times New Roman", "Noto Serif Hebrew", serif' : undefined }}
        >
          {passage.original}
        </div>
      ) : null}
      <div className="text-sm leading-6 text-white/80">{passage.text}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo data (used when no connections prop is supplied)
// ---------------------------------------------------------------------------

const DEMO_CONNECTIONS: ProphecyConnection[] = [
  {
    id: 'isa53-mt8',
    theme: 'Suffering Servant',
    weight: 'explicit',
    source: {
      ref: 'Isaiah 53:5',
      text: 'But he was pierced for our transgressions, he was crushed for our iniquities.',
      original: 'וְהוּא מְחֹלָל מִפְּשָׁעֵנוּ מְדֻכָּא מֵעֲוֺנֹתֵינוּ',
      language: 'hebrew',
    },
    target: {
      ref: 'Matthew 8:17',
      text: 'He took up our infirmities and bore our diseases.',
      original: 'αὐτὸς τὰς ἀσθενείας ἡμῶν ἔλαβεν καὶ τὰς νόσους ἐβάστασεν',
      language: 'greek',
    },
    note: 'Direct quotation fulfillment',
  },
  {
    id: 'ps22-mt27',
    theme: 'Forsaken Cry',
    weight: 'explicit',
    source: {
      ref: 'Psalm 22:1',
      text: 'My God, my God, why have you forsaken me?',
      original: 'אֵלִי אֵלִי לָמָה עֲזַבְתָּנִי',
      language: 'hebrew',
    },
    target: {
      ref: 'Matthew 27:46',
      text: 'Eli, Eli, lema sabachthani? — My God, my God, why have you forsaken me?',
      original: 'Ἠλὶ Ἠλὶ λεμὰ σαβαχθανί',
      language: 'greek',
    },
  },
  {
    id: 'isa40-jn1',
    theme: 'Voice in Wilderness',
    weight: 'echo',
    source: {
      ref: 'Isaiah 40:3',
      text: 'A voice of one calling: In the wilderness prepare the way for the LORD.',
      original: 'קוֹל קוֹרֵא בַּמִּדְבָּר פַּנּוּ דֶּרֶךְ יְהוָה',
      language: 'hebrew',
    },
    target: {
      ref: 'John 1:23',
      text: 'I am the voice of one calling in the wilderness, “Make straight the way for the Lord.”',
      original: 'ἐγὼ φωνὴ βοῶντος ἐν τῇ ἐρήμῳ· εὐθύνατε τὴν ὁδὸν κυρίου',
      language: 'greek',
    },
  },
  {
    id: 'jonah-mt12',
    theme: 'Sign of Jonah',
    weight: 'typology',
    source: {
      ref: 'Jonah 1:17',
      text: 'Jonah was in the belly of the fish three days and three nights.',
      original: 'וַיְהִי יוֹנָה בִּמְעֵי הַדָּג שְׁלֹשָׁה יָמִים וּשְׁלֹשָׁה לֵילֹות',
      language: 'hebrew',
    },
    target: {
      ref: 'Matthew 12:40',
      text: 'For as Jonah was three days and three nights in the belly of a huge fish, so the Son of Man will be three days and three nights in the heart of the earth.',
      original: 'ὥσπερ γὰρ ἦν Ἰωνᾶς ἐν τῇ κοιλίᾳ τοῦ κήτους τρεῖς ἡμέρας καὶ τρεῖς νύκτας',
      language: 'greek',
    },
    note: 'Typological pattern — not direct quotation',
  },
  {
    id: 'ps110-heb7',
    theme: 'Melchizedek Priest',
    weight: 'typology',
    source: {
      ref: 'Psalm 110:4',
      text: 'You are a priest forever, in the order of Melchizedek.',
      original: 'אַתָּה־כֹהֵן לְעוֹלָם עַל־דִּבְרָתִי מַלְכִּי־צֶדֶק',
      language: 'hebrew',
    },
    target: {
      ref: 'Hebrews 7:17',
      text: 'You are a priest forever, in the order of Melchizedek.',
      original: 'σὺ ἱερεὺς εἰς τὸν αἰῶνα κατὰ τὴν τάξιν Μελχισέδεκ',
      language: 'greek',
    },
  },
  {
    id: 'isa61-lk4',
    theme: 'Good News to Poor',
    weight: 'echo',
    source: {
      ref: 'Isaiah 61:1',
      text: 'The Spirit of the Sovereign LORD is on me, because the LORD has anointed me to proclaim good news to the poor.',
      original: 'רוּחַ אֲדֹנָי יְהוִה עָלָי יַעַן מָשַׁח יְהוָה אֹתִי לְבַשֵּׂר עֲנָוִים',
      language: 'hebrew',
    },
    target: {
      ref: 'Luke 4:18',
      text: 'The Spirit of the Lord is on me, because he has anointed me to proclaim good news to the poor.',
      original: 'Πνεῦμα κυρίου ἐπ᾽ ἐμέ, οὗ εἵνεκεν ἔχρισέν με εὐαγγελίσασθαι πτωχοῖς',
      language: 'greek',
    },
  },
];

// ---------------------------------------------------------------------------
// Main component — ProphecyThemeGraph
// ---------------------------------------------------------------------------

export default function ProphecyThemeGraph({
  connections = DEMO_CONNECTIONS,
  className = '',
}: {
  connections?: ProphecyConnection[];
  className?: string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hovered = hoveredId ? connections.find((c) => c.id === hoveredId) ?? null : null;

  return (
    <div className={`relative w-full rounded-xl border border-white/10 bg-[#0A0C1A] p-4 sm:p-6 ${className}`}>
      {/* Legend — documents the weight → stroke mapping */}
      <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-white/10 pb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Connection weight</h3>
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
              <span className="font-mono text-[11px] capitalize tracking-wide text-white/70">
                {weight} <span className="text-white/40">— {visual.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG connection map */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox="0 0 720 320"
          className="h-[320px] w-[720px] max-w-full"
          role="img"
          aria-label="Prophecy theme map showing weighted connections between Old and New Testament passages"
        >
          {/* subtle grid */}
          <defs>
            <pattern id="prophecy-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="720" height="320" fill="url(#prophecy-grid)" rx="8" />

          {/* column labels */}
          <text x="120" y="22" textAnchor="middle" className="fill-white/40 font-mono text-[10px] uppercase tracking-[0.18em]">
            Hebrew Bible
          </text>
          <text x="600" y="22" textAnchor="middle" className="fill-white/40 font-mono text-[10px] uppercase tracking-[0.18em]">
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
                tabIndex={0}
                role="button"
                aria-label={`${conn.theme}: ${conn.source.ref} to ${conn.target.ref}, weight ${conn.weight}`}
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
                    x="320"
                    y={y - 10}
                    width="80"
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
                    className="fill-white/70 font-mono text-[7px] uppercase tracking-wide"
                  >
                    {conn.theme.slice(0, 18)}
                  </text>
                </g>
                {/* endpoints */}
                <circle cx="200" cy={y} r={isHovered ? 5 : 3.5} fill={visual.stroke} opacity={isHovered ? 1 : 0.9} />
                <circle cx="520" cy={y} r={isHovered ? 5 : 3.5} fill={visual.stroke} opacity={isHovered ? 1 : 0.9} />
                {/* passage refs */}
                <text x="196" y={y + 1} textAnchor="end" dominantBaseline="middle" className="fill-white/85 text-[10px] font-medium">
                  {conn.source.ref}
                </text>
                <text x="524" y={y + 1} textAnchor="start" dominantBaseline="middle" className="fill-white/85 text-[10px] font-medium">
                  {conn.target.ref}
                </text>
                {/* weight badge */}
                <text x="360" y={y - 14} textAnchor="middle" className="fill-white/35 font-mono text-[7px] uppercase tracking-widest">
                  {conn.weight}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover card — shows both passages side-by-side with OriginalLine */}
      {hovered ? (
        <div
          className="pointer-events-none absolute left-1/2 top-[46%] z-10 w-[min(640px,95%)] -translate-x-1/2 rounded-xl border border-amber-200/20 bg-[#141726]/95 p-4 shadow-2xl backdrop-blur-md sm:p-5"
          role="tooltip"
          aria-live="polite"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/70">{hovered.theme}</div>
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
              style={{
                borderColor: WEIGHT_VISUALS[hovered.weight].stroke + '55',
                color: WEIGHT_VISUALS[hovered.weight].stroke,
                background: WEIGHT_VISUALS[hovered.weight].stroke + '14',
              }}
            >
              {hovered.weight} — {WEIGHT_VISUALS[hovered.weight].label}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Source</div>
              <OriginalLine passage={hovered.source} />
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Fulfillment</div>
              <OriginalLine passage={hovered.target} />
            </div>
          </div>
          {hovered.note ? <div className="mt-3 text-center font-mono text-[10px] italic text-white/45">{hovered.note}</div> : null}
          <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/25">
            <span
              className="inline-block h-[2px] w-6 rounded"
              style={{
                background: WEIGHT_VISUALS[hovered.weight].stroke,
                opacity: 0.9,
              }}
            />
            <span>
              {hovered.weight === 'explicit' ? 'solid gold' : hovered.weight === 'echo' ? 'dashed' : 'dotted'} connection
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-center font-mono text-[10px] tracking-wide text-white/30">
          Hover or focus a connection to see both passages side-by-side with original language
        </div>
      )}

      {/* Accessible list fallback for keyboard / screen readers */}
      <ul className="sr-only">
        {connections.map((c) => (
          <li key={c.id}>
            {c.theme}: {c.source.ref} ({c.source.text}) connects to {c.target.ref} ({c.target.text}) weight {c.weight}
          </li>
        ))}
      </ul>
    </div>
  );
}
