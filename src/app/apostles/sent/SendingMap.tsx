import mapLand from "@/lib/apostles/map-land.json";
import type { MapCity, SentData, SentRoute } from "@/lib/apostles/types";

const GEO = mapLand as {
  bounds: { west: number; east: number; south: number; north: number };
  xscale: number;
  scale: number;
  pad: number;
  view: { w: number; h: number };
  land: string[];
  lakes: string[];
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Same equirectangular the land was baked with — constants come from the asset. */
function project(lat: number, lng: number) {
  return {
    x: r1(GEO.pad + (lng - GEO.bounds.west) * GEO.xscale * GEO.scale),
    y: r1(GEO.pad + (GEO.bounds.north - lat) * GEO.scale),
  };
}

type Pt = { x: number; y: number };

/** Catmull-Rom through the corridor points, emitted as cubic Béziers. */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y}`;
  }
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: r1(p1.x + (p2.x - p0.x) / 6), y: r1(p1.y + (p2.y - p0.y) / 6) };
    const c2 = { x: r1(p2.x - (p3.x - p1.x) / 6), y: r1(p2.y - (p3.y - p1.y) / 6) };
    d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function legPoints(leg: { via?: [number, number][] }, from: MapCity, to: MapCity): Pt[] {
  return [
    project(from.lat, from.lng),
    ...(leg.via ?? []).map(([lat, lng]) => project(lat, lng)),
    project(to.lat, to.lng),
  ];
}

function graticule() {
  const lines: { d: string; key: string }[] = [];
  for (let lng = 0; lng <= 80; lng += 10) {
    const a = project(GEO.bounds.south, lng);
    const b = project(GEO.bounds.north, lng);
    lines.push({ d: `M${a.x} ${a.y} L${b.x} ${b.y}`, key: `g${lng}` });
  }
  for (let lat = 10; lat <= 40; lat += 10) {
    const a = project(lat, GEO.bounds.west);
    const b = project(lat, GEO.bounds.east);
    lines.push({ d: `M${a.x} ${a.y} L${b.x} ${b.y}`, key: `t${lat}` });
  }
  return lines;
}

/**
 * The sending on real geography: Natural Earth coastlines, cities at true
 * latitude and longitude, and each road drawn along its claimed corridor —
 * stroke style grading every segment (solid scripture, dashed early source,
 * dotted later tradition). Where even the destination is disputed, the whole
 * road fades and takes a question mark; where the record gives a direction
 * with no destination, the road is a stub that ends in open country.
 */
export default function SendingMap({ data }: { data: SentData }) {
  const cityById = new Map(data.cities.map((c) => [c.id, c]));
  const hub = data.cities.find((c) => c.hub);

  // Which apostle names sit at which pin, ? included.
  const namesAt = new Map<string, string[]>();
  for (const route of data.routes) {
    const label = route.name + (route.uncertain ? " ?" : "");
    for (const at of [route.label.at, ...(route.label.alsoAt ?? [])]) {
      namesAt.set(at, [...(namesAt.get(at) ?? []), label]);
    }
  }
  const stayed = data.rays.filter((ray) => ray.reach === 0);

  const routePath = (route: SentRoute) =>
    route.legs.map((leg) => {
      const from = cityById.get(leg.from);
      const to = cityById.get(leg.to);
      if (!from || !to) return null;
      return { leg, d: smoothPath(legPoints(leg, from, to)) };
    });

  return (
    <figure className="ap-smap">
      <div
        className="ap-smap-scroll"
        tabIndex={0}
        role="group"
        aria-label="Sending map — scrolls sideways on narrow screens"
      >
        {/* role="img": the in-map links are sighted-keyboard redundancy; the
            same #sent-* targets exist as real HTML links in the list below. */}
        <svg
          viewBox={`0 0 ${GEO.view.w} ${GEO.view.h}`}
          role="img"
          aria-labelledby="sending-map-title sending-map-desc"
        >
          <title id="sending-map-title">
            The sending of the twelve, from Jerusalem, on the map of the known world
          </title>
          <desc id="sending-map-desc">
            A map from Rome to southern India. Roads run from Jerusalem along
            their claimed corridors: Peter through Antioch to Rome; Andrew to
            Scythia and down to Patras; John and Philip to Ephesus, Patmos,
            and Hierapolis; Thaddaeus into Armenia — his Edessa leg drawn
            faded, since Eusebius credits that mission to a Thaddaeus of the
            seventy, not the twelve; Bartholomew&rsquo;s road also ends in
            Armenia, at a disputed site. Thomas goes down the Red Sea and
            across the monsoon lane to Muziris and Mylapore in India, with a
            short unfinished spur marking Parthia, his assignment in the
            earliest list. Matthew&rsquo;s conflicting roads to Aksum and
            Persia and Simon&rsquo;s to Persia are drawn faded with question
            marks. A ring at Jerusalem marks James of Zebedee, who never left.
            Solid lines are scripture, dashed lines early sources, dotted
            lines later tradition.
          </desc>

          <rect width={GEO.view.w} height={GEO.view.h} className="ew-map-sea" />
          <g className="ap-smap-graticule" aria-hidden="true">
            {graticule().map((l) => (
              <path key={l.key} d={l.d} />
            ))}
          </g>
          {GEO.land.map((d, i) => (
            <path key={`land${i}`} d={d} className="ew-map-land" />
          ))}
          {GEO.lakes.map((d, i) => (
            <path key={`lake${i}`} d={d} className="ap-smap-lake" />
          ))}

          {data.seas.map((sea) => {
            const p = project(sea.lat, sea.lng);
            return (
              <text key={sea.name} x={p.x} y={p.y} className="ew-map-region" textAnchor="middle">
                {sea.name}
              </text>
            );
          })}

          {/* Roads under pins, each linked to its record below. */}
          {data.routes.map((route) => (
            <a key={route.apostleId} href={`#sent-${route.apostleId}`} className="ap-smap-roadlink">
              <title>{`${route.name} — open the graded claims`}</title>
              <g className={`ap-smap-road${route.uncertain ? " ap-smap-uncertain" : ""}`}>
                {routePath(route).map(
                  (seg, i) =>
                    seg && (
                      <path
                        key={i}
                        d={seg.d}
                        className={`ap-smap-leg ap-smap-${seg.leg.weight}${seg.leg.uncertain ? " ap-smap-leg-uncertain" : ""}`}
                      />
                    ),
                )}
                {route.stub && hub && (
                  <g className="ap-smap-stub">
                    <path
                      d={smoothPath([
                        project(hub.lat, hub.lng),
                        project(route.stub.toward[0], route.stub.toward[1]),
                      ])}
                      className={`ap-smap-leg ap-smap-${route.stub.weight}`}
                    />
                    <text
                      {...project(route.stub.toward[0], route.stub.toward[1] + 1)}
                      className="ap-smap-stubnote"
                      textAnchor="start"
                    >
                      {route.stub.note} ?
                    </text>
                  </g>
                )}
              </g>
            </a>
          ))}

          {/* Cities. */}
          {data.cities.map((city) => {
            const p = project(city.lat, city.lng);
            const names = namesAt.get(city.id) ?? [];
            return (
              <g key={city.id} className="ap-smap-pin">
                {city.hub ? (
                  stayed.length > 0 ? (
                    // Dot and ring share the link so the whole hub is a target.
                    <a href={`#sent-${stayed[0].apostleId}`} className="ap-smap-roadlink">
                      <title>{stayed.map((s) => `${s.name} — ${s.to}`).join("; ")}</title>
                      <circle cx={p.x} cy={p.y} r={4.4} className="ap-smap-dot ap-smap-hub" />
                      {stayed.map((s, i) => (
                        <circle
                          key={s.apostleId}
                          cx={p.x}
                          cy={p.y}
                          r={10 + i * 5}
                          className="ap-smap-stayed"
                        />
                      ))}
                    </a>
                  ) : (
                    <circle cx={p.x} cy={p.y} r={4.4} className="ap-smap-dot ap-smap-hub" />
                  )
                ) : (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={3.4}
                    className={`ap-smap-dot${city.uncertainSite ? " ap-smap-dot-uncertain" : ""}`}
                  />
                )}
                <text
                  x={p.x + city.dx}
                  y={p.y + city.dy}
                  textAnchor={city.anchor}
                  className="ap-smap-city"
                >
                  {city.name}
                </text>
                {names.map((name, i) => (
                  <text
                    key={name}
                    x={p.x + city.dx}
                    y={p.y + city.dy + 13 + i * 13}
                    textAnchor={city.anchor}
                    className="ap-smap-name"
                  >
                    {name}
                  </text>
                ))}
                {city.hub &&
                  stayed.map((s, i) => (
                    <text
                      key={s.apostleId}
                      x={p.x + city.dx}
                      y={p.y + city.dy + 13 + ((namesAt.get(city.id)?.length ?? 0) + i) * 13}
                      textAnchor={city.anchor}
                      className="ap-smap-name"
                    >
                      {s.name} — never left
                    </text>
                  ))}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        Real coastlines (Natural Earth, public domain); cities sit at true
        coordinates except where the pin itself says the site is disputed.
        Each road follows its claim&rsquo;s corridor as an illustration — the
        era&rsquo;s documented Red Sea and monsoon lane for Thomas, the
        Antioch road for Peter — never a surveyed itinerary; the grades belong
        to the claims, not the waypoints. Thaddaeus&rsquo;s Edessa leg is
        faded because Eusebius credits that story to a Thaddaeus of the
        seventy. The ring at Jerusalem is James of Zebedee, who never left
        the city.
      </figcaption>
    </figure>
  );
}
