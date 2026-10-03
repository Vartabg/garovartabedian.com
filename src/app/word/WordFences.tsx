import ResponsiveSvgFrame from "../_components/ResponsiveSvgFrame";

const W = 720;
const Y0 = 1600;
const Y1 = 2120;
const NOW = 2026;
const PAD_L = 68;
const PAD_R = 44;
const ROW_H = 24;
const TOP = 26;
/* A row's hover band is the full row height, so the hit target is 24px even
   though the run itself is a 4px rule — a pinpoint target on a 4px line is
   unusable with a trackpad and impossible on a phone. */
const HIT_H = ROW_H;

const xOf = (yr: number) => PAD_L + ((yr - Y0) / (Y1 - Y0)) * (W - PAD_L - PAD_R);

/**
 * Each translation's fence, and when it falls. `pub` is publication; a
 * fenced work is fenced until `pd` (public domain), then free. `pd` for the
 * still-fenced ones is publication + 95 years — the current US term, the
 * same projection the RSV entry already states (1952 → 2048). The freely
 * given ones are free from the start. The rows come from the same records
 * the cards above are drawn from (WordHome builds them from `data`), so a
 * translation cannot appear on a card and go missing from the chart.
 */
export type Fence = { abbr: string; name: string; pub: number; pd: number; note: string };

/** A colored run from year a to b, split at NOW into solid (past) and
 *  dashed (still-to-come projection). */
function Run({ a, b, y, cls }: { a: number; b: number; y: number; cls: string }) {
  if (b <= a) return null;
  const segs: { x1: number; x2: number; dashed: boolean }[] = [];
  if (a < NOW) segs.push({ x1: xOf(a), x2: xOf(Math.min(b, NOW)), dashed: false });
  if (b > NOW) segs.push({ x1: xOf(Math.max(a, NOW)), x2: xOf(b), dashed: true });
  return (
    <>
      {segs.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={y}
          x2={s.x2}
          y2={y}
          className={`${cls}${s.dashed ? " projected" : ""}`}
        />
      ))}
    </>
  );
}

/** Status marks never carry meaning in color alone: fenced runs open with a
 *  closed-shackle glyph, free runs with an open one. Drawn at the run's start
 *  so the two states stay distinguishable in grayscale, in print, and for a
 *  red-green reader — for whom the two hues sit at ΔE 10.4, above the target
 *  but nowhere near obvious. */
function StateGlyph({ x, y, state }: { x: number; y: number; state: "fenced" | "free" }) {
  return (
    <g className={`wd-fn-glyph is-${state}`} aria-hidden="true">
      <rect x={x - 3} y={y - 1} width="6" height="5.5" rx="1.2" />
      <path
        d={
          state === "fenced"
            ? `M ${x - 1.7} ${y - 1} v -2 a 1.7 1.7 0 0 1 3.4 0 v 2`
            : `M ${x - 1.7} ${y - 1} v -2 a 1.7 1.7 0 0 1 3.4 0`
        }
        fill="none"
      />
    </g>
  );
}

/**
 * The life of every fence: when each English translation was published, how
 * long its copyright holds, and when it falls into the public domain. The
 * old and the deliberately-freed run free; the modern ones stay fenced for
 * ninety-five years — most of that still ahead of us.
 */
export default function WordFences({ fences }: { fences: Fence[] }) {
  // Oldest first; ties keep the card order the data gives them.
  const FENCES = [...fences].sort((a, b) => a.pub - b.pub);
  const H = TOP + FENCES.length * ROW_H + 30;
  const stillFenced = FENCES.filter((f) => f.pd > NOW);
  const freeToday = FENCES.filter((f) => f.pd <= NOW);

  return (
    <div className="wd-fences">
      {/* Identity is never color-alone: the legend names each state and
          carries its glyph, so the encoding survives grayscale and CVD. */}
      <ul className="wd-fn-legend">
        <li>
          <svg viewBox="0 0 12 12" aria-hidden="true" className="wd-fn-legend-swatch is-fenced">
            <line x1="0" y1="6" x2="12" y2="6" />
          </svg>
          Fenced — under copyright
        </li>
        <li>
          <svg viewBox="0 0 12 12" aria-hidden="true" className="wd-fn-legend-swatch is-free">
            <line x1="0" y1="6" x2="12" y2="6" />
          </svg>
          Free — public domain or given away
        </li>
        <li>
          <svg viewBox="0 0 12 12" aria-hidden="true" className="wd-fn-legend-swatch is-projected">
            <line x1="0" y1="6" x2="12" y2="6" />
          </svg>
          Dashed — hasn&rsquo;t happened yet
        </li>
      </ul>

      <ResponsiveSvgFrame label="Copyright life of English Bible translations">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="A chart of each English Bible translation's copyright life from 1600 to 2120: the old and freely-given translations run free (public domain), while the modern copyrighted ones stay fenced for ninety-five years, most of it still in the future"
        >
          {/* Century gridlines — solid hairlines, one shade off the surface. */}
          {[1700, 1800, 1900, 2000, 2100].map((yr) => (
            <g key={yr}>
              <line x1={xOf(yr)} y1={TOP - 10} x2={xOf(yr)} y2={H - 22} className="wd-fn-grid" />
              <text x={xOf(yr)} y={H - 8} textAnchor="middle" className="wd-fn-tick">{yr}</text>
            </g>
          ))}
          {/* "Now" is a threshold, not a gridline — the one dashed rule here. */}
          <line x1={xOf(NOW)} y1={TOP - 14} x2={xOf(NOW)} y2={H - 22} className="wd-fn-now" />
          <text x={xOf(NOW)} y={TOP - 18} textAnchor="middle" className="wd-fn-nowlabel">now</text>

          {FENCES.map((f, i) => {
            const y = TOP + i * ROW_H + 10;
            const fenced = f.pd > f.pub;
            const fallsAhead = f.pd > NOW;
            return (
              <g key={f.abbr} className="wd-fn-row">
                {/* Full-row hit band: gives hover and the native tooltip a
                    24px target instead of a 4px line. */}
                <rect
                  x={0}
                  y={y - HIT_H / 2}
                  width={W}
                  height={HIT_H}
                  className="wd-fn-hit"
                >
                  <title>
                    {`${f.name} (${f.abbr}) — published ${f.pub}. ${
                      fallsAhead
                        ? `Fenced until ${f.pd}; ${f.pd - NOW} years still to run.`
                        : `Free since ${f.pd}.`
                    } ${f.note.charAt(0).toUpperCase()}${f.note.slice(1)}.`}
                  </title>
                </rect>
                <text x={PAD_L - 14} y={y + 3.5} textAnchor="end" className="wd-fn-abbr">{f.abbr}</text>
                {fenced && <Run a={f.pub} b={f.pd} y={y} cls="wd-fn-fenced" />}
                <Run a={f.pd} b={Y1} y={y} cls="wd-fn-free" />
                <StateGlyph x={xOf(f.pub) + 4} y={y} state={fenced ? "fenced" : "free"} />
                {fenced && f.pd <= Y1 && (
                  <circle cx={xOf(f.pd)} cy={y} r="3.2" className="wd-fn-freed" />
                )}
                {/* Direct-labelled selectively: only the fences that outlive
                    us. That set is the chart's whole argument, and it is the
                    number a reader actually wants. Sits above the transition
                    rather than beside it — beside it, the label lands on top
                    of the free run and neither survives. */}
                {fallsAhead && (
                  <text
                    x={xOf(f.pd)}
                    y={y - 6}
                    textAnchor="middle"
                    className="wd-fn-falls"
                  >
                    {f.pd}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </ResponsiveSvgFrame>

      <p className="scr-meta">
        Each fenced run is ninety-five years — the current US copyright term — so
        the modern translations stay locked long past everyone now alive (the
        dashed part hasn&rsquo;t happened yet). The old ones and the ones given
        away — {freeToday.map((f) => f.abbr).join(", ")} — are free already.{" "}
        <strong>{stillFenced.length} of {FENCES.length}</strong> are still fenced
        today.
      </p>

      {/* The table is the chart's WCAG-clean twin: every value here is
          readable without color, hover, or a pointing device. */}
      <details className="wd-fn-table">
        <summary>Read the same data as a table</summary>
        <div className="wd-fn-table-body">
          <table>
            <caption className="sr-fallback">
              Publication year, public-domain year, and current status of each
              English Bible translation
            </caption>
            <thead>
              <tr>
                <th scope="col">Translation</th>
                <th scope="col">Published</th>
                <th scope="col">Public domain</th>
                <th scope="col">Status today</th>
              </tr>
            </thead>
            <tbody>
              {FENCES.map((f) => (
                <tr key={f.abbr}>
                  <th scope="row">
                    {f.abbr} <span className="wd-fn-table-name">{f.name}</span>
                  </th>
                  <td>{f.pub}</td>
                  <td>{f.pd}</td>
                  <td>
                    {f.pd > NOW
                      ? `Fenced — ${f.pd - NOW} years to run`
                      : `Free — ${f.note}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
