import Wheel from "../Wheel";
import Link from "next/link";
import type { CSSProperties } from "react";
import { HOME, WORLDS } from "@/lib/portfolio-content";

/**
 * One ordered rail instead of card grids.
 *
 * A walk is a sequence: the eight worlds in walk order, one row at a time.
 * Each row carries only its world's accent (mixed toward white for the dark
 * panel); nothing else is tinted, so palettes never collide. Mirrors the
 * numbered-list vocabulary of the reading-paths section above it.
 */
const RAIL_ORDER = [
  "jesus",
  "scriptures",
  "apostles",
  "early",
  "church",
  "word",
  "angels",
  "evidence",
] as const;

const DOORS_BY_ID = new Map(WORLDS.doors.map((door) => [door.id, door]));

export default function WorldsRail() {
  const doors = RAIL_ORDER.map((id) => DOORS_BY_ID.get(id)).filter(
    (door): door is NonNullable<typeof door> => Boolean(door),
  );

  return (
    <section className="st-worlds reveal" id="worlds" aria-labelledby="rail-h">
      <header className="st-worlds-heading">
        <Wheel />
        <h2 className="st-h2" id="rail-h">
          {HOME.pathsHeading}
        </h2>
      </header>

      <ol className="st-rail">
        {doors.map((d, index) => (
          <li
            key={d.id}
            className="st-rail-row"
            style={{ "--rail-accent": d.accent } as CSSProperties}
          >
            <span className="st-rail-num" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="st-rail-copy">
              <Link href={d.href} className="st-rail-title">
                {d.title}
              </Link>
              <small className="st-rail-line">{d.line}</small>
            </span>
            <span className="st-rail-go" aria-hidden="true">
              →
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
