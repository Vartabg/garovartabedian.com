import type { ChristianWitness, HistoryItem, StoneItem } from "@/lib/jesus/types";
import ResponsiveSvgFrame from "../../_components/ResponsiveSvgFrame";

const W = 720;
const H = 270;
const AXIS_Y = 116;
const Y0 = -50;
const Y1 = 125;
const PAD_L = 46;
const PAD_R = 46;

const xOf = (year: number) => PAD_L + ((year - Y0) / (Y1 - Y0)) * (W - PAD_L - PAD_R);

const STONE_SPAN: Record<string, { short: string; from: number; to: number }> = {
  "galilee-boat": { short: "Galilee boat", from: -50, to: 50 },
  "capernaum-house": { short: "Capernaum house", from: -30, to: 60 },
  "caiaphas-ossuary": { short: "Caiaphas ossuary", from: 20, to: 60 },
  "magdala-stone": { short: "Magdala synagogue", from: 1, to: 70 },
  "yehohanan-heel": { short: "Crucified Yehohanan", from: 7, to: 70 },
  "pilate-stone": { short: "Pilate stone", from: 26, to: 36 },
};

type Mark = {
  year: number;
  label: string;
  id: string;
  kind: "christian" | "jewish" | "roman";
};

function sourceMarks(christianWitnesses: ChristianWitness[], items: HistoryItem[]): Mark[] {
  const christian: Mark[] = christianWitnesses.map((witness) => ({
    year: witness.sourceYear,
    label: witness.name.replace("The Gospel of ", "").replace("'s undisputed letters", ""),
    id: witness.id,
    kind: "christian",
  }));
  const grouped = new Map<string, Mark>();
  for (const item of items) {
    if (item.sourceYear === null || item.sourceYear < Y0 || item.sourceYear > Y1) {
      continue;
    }
    const key = `${item.sourceYear}-${item.lane}`;
    const author = item.author.replace(" the Younger", "");
    const current = grouped.get(key);
    if (current && current.label !== author) current.label = `${current.label} & ${author}`;
    else grouped.set(key, {
      year: item.sourceYear,
      label: author,
      id: item.id,
      kind: item.lane === "Jewish" ? "jewish" : "roman",
    });
  }
  return [...christian, ...grouped.values()].sort((a, b) => a.year - b.year);
}

export default function InkAndStone({
  christianWitnesses,
  items,
  stones,
}: {
  christianWitnesses: ChristianWitness[];
  items: HistoryItem[];
  stones: StoneItem[];
}) {
  const levelEndX: number[] = [];
  const marks = sourceMarks(christianWitnesses, items).map((mark) => {
    const x = xOf(mark.year);
    let level = 0;
    while (level < levelEndX.length && x - levelEndX[level] < 108) level++;
    levelEndX[level] = x;
    return { ...mark, x, level };
  });
  const stoneRows = stones
    .map((stone) => ({ stone, span: STONE_SPAN[stone.id] }))
    .filter((row) => row.span)
    .sort((a, b) => a.span.from - b.span.from);
  const cruxL = xOf(30);
  const cruxR = xOf(33);

  return (
    <figure className="jsu-inkstone">
      <div className="jsu-evidence-legend" aria-label="Timeline legend">
        <span className="is-christian">Early Christian</span>
        <span className="is-jewish">Jewish</span>
        <span className="is-roman">Roman</span>
        <span className="is-stone">Archaeology</span>
      </div>
      <ResponsiveSvgFrame label="Evidence timeline from 50 BC to AD 125">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Evidence timeline from 50 BC to AD 125 showing early Christian, Jewish, Roman, and archaeological records by date"
        >
        <rect x={cruxL} y={6} width={Math.max(cruxR - cruxL, 2)} height={H - 30} className="jsu-is-crux" />
        <text x={(cruxL + cruxR) / 2} y={H - 10} textAnchor="middle" className="jsu-is-cruxlabel">
          crucifixion window, c. 30–33
        </text>
        <line x1={xOf(Y0)} y1={AXIS_Y} x2={xOf(Y1)} y2={AXIS_Y} className="jsu-is-axis" />
        {[
          { year: -50, label: "50 BC" },
          { year: 1, label: "AD 1" },
          { year: 50, label: "AD 50" },
          { year: 100, label: "AD 100" },
        ].map((tick) => (
          <g key={tick.year}>
            <line x1={xOf(tick.year)} y1={AXIS_Y - 3} x2={xOf(tick.year)} y2={AXIS_Y + 3} className="jsu-is-axis" />
            <text x={xOf(tick.year)} y={AXIS_Y - 8} textAnchor="middle" className="jsu-is-tick">{tick.label}</text>
          </g>
        ))}
        {marks.map((mark) => {
          const y = AXIS_Y - 18 - mark.level * 21;
          return (
            <a key={`${mark.kind}-${mark.year}`} href={`#${mark.id}`} aria-label={`${mark.label}, AD ${mark.year}`}>
              <g className={`jsu-is-ink is-${mark.kind}`}>
                <line x1={mark.x} y1={AXIS_Y} x2={mark.x} y2={y} />
                <circle cx={mark.x} cy={y} r="3.5" />
                <text x={mark.x} y={y - 6} textAnchor="middle" className="jsu-is-inklabel">
                  {mark.label} · {mark.year}
                </text>
              </g>
            </a>
          );
        })}
        {stoneRows.map((row, index) => {
          const y = AXIS_Y + 18 + index * 18;
          const x1 = xOf(row.span.from);
          const x2 = xOf(row.span.to);
          return (
            <a key={row.stone.id} href={`#${row.stone.id}`} aria-label={`${row.span.short}, ${row.stone.artifactDate}`}>
              <g className="jsu-is-stone">
                <line x1={x1} y1={y} x2={x2} y2={y} />
                <text x={x2 + 6} y={y + 3} className="jsu-is-stonelabel">{row.span.short}</text>
              </g>
            </a>
          );
        })}
        </svg>
      </ResponsiveSvgFrame>
      <figcaption className="scr-meta">
        Source distance is visible at a glance: Christian letters arrive first,
        narrative Gospels follow, then Josephus and the Roman record. Objects below
        the line overlap the first-century setting but do not name Jesus. Later or
        uncertain-date reception records remain in the evidence cards and are omitted
        from this AD 125 timeline.
      </figcaption>
    </figure>
  );
}
