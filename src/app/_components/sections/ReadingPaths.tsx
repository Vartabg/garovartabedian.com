import Wheel from "../Wheel";
import Link from "next/link";
import readingPaths from "../../../../public/meta/reading-paths.json";

type Step = { href: string; label: string; note: string };
type Path = { id: string; title: string; line: string; steps: Step[] };

/**
 * Named walks through the record, on the front door.
 *
 * The rooms were all built and the door was a directory of them — eight
 * entrances and no sequence, which asks a first-time visitor to already know
 * what they are looking for. These give them somewhere to start and somewhere
 * to end up.
 *
 * Every step is a plain link to a page that already exists, checked at build
 * time by scripts/site/build-reading-paths.mjs. Nothing here runs in the
 * browser and nothing tracks where a reader got to.
 *
 * The front door shows each walk as one row: its title, then its steps in
 * order. The data still carries a line per walk and a note per step; they
 * were 312 of the page's 759 words and are not printed here.
 */
export default function ReadingPaths() {
  const paths = readingPaths.paths as Path[];
  if (paths.length === 0) return null;

  return (
    <section className="st-paths reveal" id="paths" aria-labelledby="paths-h">
      <div className="st-paths-heading">
        <Wheel />
        <h2 id="paths-h">Walks through the record.</h2>
      </div>

      <ol className="st-paths-list">
        {paths.map((path) => (
          <li key={path.id} className="st-path">
            <h3>{path.title}</h3>
            <ol className="st-path-steps">
              {path.steps.map((step, index) => (
                <li key={step.href}>
                  {index > 0 && (
                    <span className="st-path-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                  <Link href={step.href}>{step.label}</Link>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}
