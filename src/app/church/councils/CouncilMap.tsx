import type { CouncilsData } from "@/lib/church/types";
import ResponsiveSvgFrame from "../../_components/ResponsiveSvgFrame";
import {
  ANATOLIA_LAND,
  GREECE_LAND,
  ITALY_LAND,
  MED_CITIES,
  medCityXY,
  medProject,
  type MedCityId,
} from "@/lib/maps/med-geo";

type CouncilCityId = Extract<
  MedCityId,
  "trent" | "rome" | "constantinople" | "chalcedon" | "nicaea" | "ephesus"
>;

const LABEL_SIDE: Record<CouncilCityId, "left" | "right" | "above"> = {
  trent: "left",
  rome: "left",
  constantinople: "above",
  chalcedon: "right",
  nicaea: "right",
  ephesus: "left",
};

// Chalcedon (Kadıköy) sits directly across the Bosphorus from Constantinople,
// and Nicaea (İznik) just southeast — on this projection their pins nearly
// coincide. Nudge the eastern cluster apart in screen space so every city's
// pin and label stays legible; a faint leader line ties each back to its true
// coastal point.
const NUDGE: Partial<Record<CouncilCityId, { dx: number; dy: number }>> = {
  chalcedon: { dx: 16, dy: 22 },
  nicaea: { dx: 30, dy: 52 },
};

/** Match a council's place string to one of the six cities. */
function cityOf(place: string): CouncilCityId | null {
  const p = place.toLowerCase();
  if (p.includes("trent")) return "trent";
  if (p.includes("rome") || p.includes("vatican") || p.includes("peter")) return "rome";
  if (p.includes("chalcedon")) return "chalcedon";
  if (p.includes("nicaea") || p.includes("i̇znik") || p.includes("iznik")) return "nicaea";
  if (p.includes("constantinople") || p.includes("hagia irene")) return "constantinople";
  if (p.includes("ephesus")) return "ephesus";
  return null;
}

const isPapal = (calledBy: string) => /^\s*pope/i.test(calledBy);
const shortYear = (year: string) => (/\d{3,4}/.exec(year)?.[0] ?? year);

const mareLabel = medProject(38.2, 18.5);

/**
 * The councils on the map — seven crowd the eastern shores under the emperors
 * who summoned them, then the whole enterprise jumps west to Trent and Rome under the
 * popes. Pins use real lat/lng on the same projection as the Ignatius road.
 */
export default function CouncilMap({ data }: { data: CouncilsData }) {
  const cities = new Map<
    string,
    { years: string[]; papal: boolean; firstId: string }
  >();
  for (const c of data.councils) {
    const key = cityOf(c.place);
    if (!key) continue;
    const entry = cities.get(key);
    if (entry) entry.years.push(shortYear(c.year));
    else
      cities.set(key, {
        years: [shortYear(c.year)],
        papal: isPapal(c.calledBy),
        firstId: c.id,
      });
  }

  return (
    <div className="ch-cmap">
      <ResponsiveSvgFrame label="Map of the ecumenical councils">
        <svg
          viewBox="0 0 720 420"
          role="group"
          aria-label="Map of the ecumenical councils with places positioned from real geography: seven met around Constantinople and the Aegean under Roman and Byzantine emperors, then the councils moved west to Trent and Rome under the popes"
        >
        <rect x="0" y="0" width="720" height="420" className="world-map-sea" />
        <path d={ITALY_LAND} className="world-map-land" />
        <path d={GREECE_LAND} className="world-map-land" />
        <path d={ANATOLIA_LAND} className="world-map-land" />

        <text
          x={mareLabel.x}
          y={mareLabel.y}
          className="world-map-region"
          textAnchor="middle"
        >
          MARE NOSTRUM
        </text>

        {[...cities.entries()].map(([key, info]) => {
          const id = key as CouncilCityId;
          const meta = MED_CITIES[id];
          const { x, y } = medCityXY(id);
          const nudge = NUDGE[id] ?? { dx: 0, dy: 0 };
          const px = x + nudge.dx;
          const py = y + nudge.dy;
          const nudged = nudge.dx !== 0 || nudge.dy !== 0;
          const side = LABEL_SIDE[id];
          const above = side === "above";
          const lx = side === "left" ? px - 10 : side === "right" ? px + 10 : px;
          const cityY = above ? py - 19 : py + 4;
          const yearsY = above ? py - 7 : py + 17;
          const anchor = side === "left" ? "end" : side === "right" ? "start" : "middle";
          return (
            <a
              key={key}
              href={`#${info.firstId}`}
              aria-label={`${meta.name}: councils of ${info.years.join(", ")}. Today: ${meta.modern}`}
            >
              <g className={`ch-cmap-pin${info.papal ? " papal" : ""}`}>
                {nudged && (
                  <line x1={x} y1={y} x2={px} y2={py} className="ch-cmap-leader" />
                )}
                <circle cx={px} cy={py} r="5" />
                <text x={lx} y={cityY} textAnchor={anchor} className="ch-cmap-city">
                  {meta.name}
                </text>
                <text x={lx} y={yearsY} textAnchor={anchor} className="ch-cmap-years">
                  {info.years.join(" · ")}
                </text>
                <text x={lx} y={yearsY + 12} textAnchor={anchor} className="ch-cmap-modern">
                  {meta.modern}
                </text>
              </g>
            </a>
          );
        })}
        </svg>
      </ResponsiveSvgFrame>
      <p className="scr-meta ch-cmap-key">
        <span className="ch-cmap-dot imperial" /> summoned by emperors &nbsp;·&nbsp;
        <span className="ch-cmap-dot papal" /> summoned by popes. Tap a city to reach its
        councils. Pins from real latitude and longitude; modern cities in small type.
      </p>
    </div>
  );
}
