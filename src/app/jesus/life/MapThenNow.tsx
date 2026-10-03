import Link from "next/link";
import { PLACE_BY_ID } from "./geo";

/**
 * Answers the question every reader has: "where is this on a map I know?"
 * Shows the active biblical place with its modern equivalent.
 */
export default function MapThenNow({ placeId }: { placeId: string | null }) {
  const place = placeId ? PLACE_BY_ID.get(placeId) : null;

  return (
    <aside className="jsu-map-thennow" aria-live="polite">
      <div className="jsu-map-context">
        <strong>Modern frame</strong>
        <span>
          North-up, coordinate-based. The coast is west; the Jordan valley and Dead Sea
          anchor the east; dashed outlines are present-day reference boundaries, not
          first-century borders.
        </span>
      </div>
      {place ? (
        <>
          <p className="jsu-map-thennow-ancient">
            <span className="jsu-map-thennow-kicker">Then</span>
            {place.name}
          </p>
          <p className="jsu-map-thennow-modern">
            <span className="jsu-map-thennow-kicker">Now</span>
            {place.modern}
            <span className="jsu-map-thennow-region"> — {place.today}</span>
          </p>
          <p className="jsu-map-thennow-coords">
            <span className="jsu-map-thennow-kicker">Coords</span>
            {place.lat.toFixed(3)} N, {place.lng.toFixed(3)} E
          </p>
        </>
      ) : (
        <p className="jsu-map-thennow-hint">
          Select an event or tap a place on the map to see its modern name and
          coordinates.
        </p>
      )}
      <details className="jsu-map-guide">
        <summary>Due-diligence notes</summary>
        <p>
          Biblical regions do not match today&rsquo;s borders. <strong>Galilee</strong> sits in
          northern Israel. <strong>Samaria</strong> falls around the northern West Bank.{" "}
          <strong>Judea</strong> covers the hill country around Jerusalem and Bethlehem. The{" "}
          <strong>Sea of Galilee</strong> is the same lake also called Kinneret.
        </p>
        <p>
          Some pins are surveyed site anchors; others are traditional or regional. The{" "}
          <strong>Gerasenes</strong> marker follows the traditional Kursi / Gergesa east-shore
          site, not inland Jerash. <strong>Cana</strong> and <strong>Emmaus</strong> are
          traditional identifications. <strong>toward Egypt</strong> and the{" "}
          <strong>Judean wilderness</strong> mark direction or region, not one exact address.
        </p>
        <p>
          Dot positions use WGS84 latitude and longitude projected north-up into this
          atlas. Distances and directions are meant to transpose onto a modern map; coasts,
          lakes, and borders are simplified for small-screen reading.
        </p>
        <p style={{ marginTop: "0.75rem", fontSize: "0.82rem" }}>
          <strong>Archaeological reference points:</strong>
        </p>
        <ul style={{ margin: "0.4rem 0 0 1.2rem", fontSize: "0.85rem" }}>
          <li><strong>Capernaum:</strong> Excavations at Kfar Nahum (Roman-era fishing village)</li>
          <li><strong>Bethsaida:</strong> el-Araj and et-Tell remain competing candidates on the north shore</li>
          <li><strong>Sea of Galilee:</strong> Underwater surveys and ancient harbor sites</li>
          <li><strong>Jericho:</strong> Multiple occupation layers from Herodian period</li>
          <li><strong>Bethlehem:</strong> Church of the Nativity site traditions (pre-Constantine)</li>
          <li><strong>Jerusalem Temple:</strong> Western Wall, Temple Mount archaeology</li>
        </ul>
        <p style={{ marginTop: "0.55rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          These labels mix well-established sites, active scholarly candidates, and
          traditional placements; certainty varies by marker. See the{" "}
          <Link
            href="/sources#jesus-history"
            style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "0.18em" }}
          >
            site-wide sources and method
          </Link>{" "}
          for the project&rsquo;s evidence standard.
        </p>
      </details>
    </aside>
  );
}
