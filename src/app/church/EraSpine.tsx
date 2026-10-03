import type { RoadData } from "@/lib/church/types";

const W = 720;
const H = 76;
const BAND_Y = 28;
const BAND_H = 13;
const PAD = 10;
const END_YEAR = 2026;

/** First year in a string like "c. AD 30–49", "1914–today", "c. 30/33". */
const firstYear = (s: string): number | null => {
  const m = /\d{2,4}/.exec(s);
  return m ? Number(m[0]) : null;
};
const lastYear = (s: string): number => {
  if (/today/i.test(s)) return END_YEAR;
  const all = s.match(/\d{2,4}/g);
  return all ? Number(all[all.length - 1]) : END_YEAR;
};

/**
 * The road drawn to scale: nine eras at their true lengths, every dated
 * step a tick above the band, the tree's great forks marked beneath it.
 * Each band is a door — tap it to jump to that era in the scroll.
 * Fork years are passed from the server (no client tree fetch).
 */
export default function EraSpine({
  data,
  forks = [],
}: {
  data: RoadData;
  forks?: number[];
}) {
  const y0 = 30;
  const x = (yr: number) => PAD + ((yr - y0) / (END_YEAR - y0)) * (W - PAD * 2);

  const eras = data.eras.map((e) => {
    const from = firstYear(e.years) ?? y0;
    const to = lastYear(e.years);
    return { id: e.id, name: e.name, years: e.years, from, to };
  });

  const ticks = data.eras.flatMap((e) =>
    e.steps.map((s) => firstYear(s.year)).filter((n): n is number => n !== null),
  );

  // Forks within ~12px cluster into one mark with stacked year labels —
  // 431 and 451 are only twenty years apart, which the true scale shows.
  const clusters: number[][] = [];
  for (const f of forks) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(x(f) - x(last[last.length - 1])) < 12) last.push(f);
    else clusters.push([f]);
  }

  return (
    <div className="ch-spine">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
      >
        {eras.map((e, i) => (
          <a key={e.id} href={`#${e.id}`} tabIndex={-1}>
            <rect
              x={x(e.from)}
              y={BAND_Y}
              width={Math.max(x(e.to) - x(e.from) - 0.5, 1)}
              height={BAND_H}
              className={`ch-spine-band${i % 2 ? " alt" : ""}`}
            >
              <title>{`${e.name} · ${e.years}`}</title>
            </rect>
          </a>
        ))}
        {ticks.map((t, i) => (
          <line key={i} x1={x(t)} x2={x(t)} y1={BAND_Y - 9} y2={BAND_Y - 2} className="ch-spine-tick" />
        ))}
        {clusters.map((group) => {
          const cx = group.reduce((s, f) => s + x(f), 0) / group.length;
          return (
            <g key={group[0]} className="ch-spine-fork">
              <path d={`M ${cx} ${BAND_Y + BAND_H} v 5 m 0 0 l -4 6 m 4 -6 l 4 6`} fill="none" />
              {group.map((f, i) => (
                <text
                  key={f}
                  x={cx}
                  y={BAND_Y + BAND_H + 22 + i * 10}
                  textAnchor="middle"
                  className="ch-spine-label"
                >
                  {f}
                </text>
              ))}
            </g>
          );
        })}
        <text x={PAD} y={BAND_Y + BAND_H + 22} className="ch-spine-label">
          AD 30
        </text>
        <text x={W - PAD} y={BAND_Y + BAND_H + 22} textAnchor="end" className="ch-spine-label">
          today
        </text>
      </svg>
      <nav className="ch-spine-links" aria-label="Church history eras">
        {eras.map((era) => (
          <a key={era.id} href={`#${era.id}`}>
            <span>{era.name}</span>
            <small>{era.years}</small>
          </a>
        ))}
      </nav>
      <p className="scr-meta">
        The nine eras at their true lengths — the forks beneath are the great
        splits, from the tree. Tap a band to jump to its era.
      </p>
    </div>
  );
}
