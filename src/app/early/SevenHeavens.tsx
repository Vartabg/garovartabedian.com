/**
 * The Ascension of Isaiah's own cosmos, drawn: seven heavens stacked above
 * the firmament and the earth. On the left, the Beloved descends — taking
 * the form of the angels at every level, unrecognized. On the right, he
 * ascends in glory, and every heaven sees him. The text says it (chs. 10–11);
 * this shows it.
 */

const BANDS: { key: string; label: string; note?: string; kind: "heaven" | "firmament" | "earth"; glow: number }[] = [
  { key: "h7", label: "The seventh heaven", note: "the Beloved's home — a light no angel below can bear", kind: "heaven", glow: 0.34 },
  { key: "h6", label: "The sixth heaven", note: "no throne, no left hand — every voice sings as one", kind: "heaven", glow: 0.27 },
  { key: "h5", label: "The fifth heaven", kind: "heaven", glow: 0.21 },
  { key: "h4", label: "The fourth heaven", note: "at every level he takes the form of its angels", kind: "heaven", glow: 0.16 },
  { key: "h3", label: "The third heaven", kind: "heaven", glow: 0.12 },
  { key: "h2", label: "The second heaven", kind: "heaven", glow: 0.08 },
  { key: "h1", label: "The first heaven", note: "a throne, angels of the right and of the left", kind: "heaven", glow: 0.05 },
  { key: "firm", label: "The firmament", note: "Sammael and his hosts — “there was great fighting therein” (7:9)", kind: "firmament", glow: 0 },
  { key: "earth", label: "Earth", note: "born, hidden, crucified — and they knew him not (ch. 11)", kind: "earth", glow: 0 },
];

const W = 720;
const TOP = 16;
const BAND_H = 56;
const DESC_X = 190;
const ASC_X = 530;

export default function SevenHeavens() {
  const bandY = (i: number) => TOP + i * BAND_H;
  const midY = (i: number) => bandY(i) + BAND_H / 2;
  const height = TOP + BANDS.length * BAND_H + 46;

  // Descent: a gentle zigzag left of center, one node per level.
  const descPts = BANDS.map((_, i) => `${DESC_X + (i % 2 === 0 ? -18 : 18)},${midY(i)}`).join(" ");

  return (
    <div className="ew-sh-scroll">
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className="ew-sevenheavens"
      role="img"
      aria-label="The cosmos of the Ascension of Isaiah: seven heavens above the firmament and the earth. The Beloved descends on the left, disguised at every level; he ascends on the right in glory, recognized by all."
    >
      {BANDS.map((b, i) => (
        <g key={b.key}>
          <rect
            x="8"
            y={bandY(i)}
            width={W - 16}
            height={BAND_H}
            className={`ew-sh-band ${b.kind}`}
            style={b.kind === "heaven" ? { fillOpacity: b.glow } : undefined}
            rx={i === 0 ? 10 : 0}
          />
          <line x1="8" y1={bandY(i)} x2={W - 8} y2={bandY(i)} className="ew-sh-line" />
          <text x="22" y={midY(i) - 4} className="ew-sh-label">
            {b.label}
          </text>
          {b.note && (
            <text x="22" y={midY(i) + 13} className="ew-sh-note">
              {b.note}
            </text>
          )}
        </g>
      ))}

      {/* The descent — dashed, dimming, disguised */}
      <polyline points={descPts} className="ew-sh-desc" fill="none" />
      {BANDS.map((b, i) => (
        <circle
          key={`d-${b.key}`}
          cx={DESC_X + (i % 2 === 0 ? -18 : 18)}
          cy={midY(i)}
          r="5"
          className="ew-sh-node desc"
          style={{ opacity: 1 - i * 0.09 }}
        />
      ))}
      <text x={DESC_X} y={height - 14} textAnchor="middle" className="ew-sh-cap">
        the descent — at every gate a password, at every level their form; none recognize him
      </text>

      {/* The ascent — straight, bright, seen by all */}
      <line x1={ASC_X} y1={midY(BANDS.length - 1)} x2={ASC_X} y2={midY(0)} className="ew-sh-asc" />
      <path
        d={`M ${ASC_X} ${midY(0) - 2} l -7 12 h 14 z`}
        className="ew-sh-asc-head"
      />
      {BANDS.map((b, i) => (
        <circle key={`a-${b.key}`} cx={ASC_X} cy={midY(i)} r="4.5" className="ew-sh-node asc" />
      ))}
      <text x={ASC_X} y={height - 14} textAnchor="middle" className="ew-sh-cap asc">
        the ascent — his own form, unhidden; every heaven sees him and worships
      </text>
    </svg>
    </div>
  );
}
