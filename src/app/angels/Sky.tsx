/**
 * The night sky behind every page of the Angels & Demons world — a fixed,
 * purely decorative layer: one seeded SVG starfield, the throne's light
 * above, the abyss glow below. The field lives in a fixed viewBox cropped
 * with `slice`, so star density is the same on a phone and an ultrawide.
 * No randomness at render (stable SSR), aria-hidden, and every motion is
 * switched off under prefers-reduced-motion.
 */

const W = 1440;
const H = 900;

/** Star temperatures: ink-white, warm white, gold, faint heavens-blue. */
const COLORS = ["#e8e6db", "#f0dfae", "#d2a94f", "#aebadf"];

type Star = { x: number; y: number; r: number; o: number; c: number };

/** Tiny LCG so the field is identical on server and client. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

function field(seed: number, count: number, rMin: number, rMax: number): Star[] {
  const next = seeded(seed);
  return Array.from({ length: count }, () => {
    const cr = next();
    return {
      x: round(next() * W),
      // Denser toward the heavens, thinning down toward the abyss.
      y: round(Math.pow(next(), 1.5) * H),
      r: round(rMin + next() * (rMax - rMin)),
      o: round(0.35 + next() * 0.55),
      c: cr < 0.55 ? 0 : cr < 0.75 ? 1 : cr < 0.9 ? 2 : 3,
    };
  });
}

const FAINT = field(11, 90, 0.4, 0.9);
const MID = field(23, 40, 0.8, 1.3);
const BRIGHT = field(47, 14, 1.2, 1.8);
const FLARES = field(83, 5, 2.4, 3.4);

/** Classic four-point sparkle — concave diamond through the center. */
const sparkle = (x: number, y: number, o: number) =>
  `M ${x} ${round(y - o)} Q ${x} ${y} ${round(x + o)} ${y} ` +
  `Q ${x} ${y} ${x} ${round(y + o)} Q ${x} ${y} ${round(x - o)} ${y} ` +
  `Q ${x} ${y} ${x} ${round(y - o)} Z`;

export default function Sky() {
  return (
    <div className="an-sky" aria-hidden="true">
      <div className="an-sky-throne" />
      <svg
        className="an-sky-field"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="an-star-halo">
            <stop offset="0" stopColor="#f0dfae" stopOpacity="0.4" />
            <stop offset="1" stopColor="#f0dfae" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="an-stars-faint">
          {FAINT.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={COLORS[s.c]} opacity={s.o} />
          ))}
        </g>
        <g className="an-stars-mid">
          {MID.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={COLORS[s.c]} opacity={s.o} />
          ))}
        </g>
        {BRIGHT.map((s, i) => (
          <g
            key={i}
            className="an-star-bright"
            style={{ animationDelay: `${round((i * 1.3) % 7)}s` }}
          >
            <circle cx={s.x} cy={s.y} r={round(s.r * 3.4)} fill="url(#an-star-halo)" />
            <circle cx={s.x} cy={s.y} r={s.r} fill={COLORS[s.c]} opacity="0.95" />
          </g>
        ))}
        {FLARES.map((s, i) => (
          <g
            key={i}
            className="an-star-flare"
            style={{ animationDelay: `${round(i * 2.1)}s` }}
          >
            <circle cx={s.x} cy={s.y} r={round(s.r * 3)} fill="url(#an-star-halo)" />
            <path d={sparkle(s.x, s.y, round(s.r * 4))} fill={COLORS[s.c % 2 ? s.c : 1]} opacity="0.8" />
            <circle cx={s.x} cy={s.y} r={round(s.r * 0.55)} fill="#fff8e8" opacity="0.95" />
          </g>
        ))}
      </svg>
      <span className="an-sky-comet" />
      <div className="an-sky-abyss" />
    </div>
  );
}
