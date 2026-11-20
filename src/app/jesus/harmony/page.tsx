import Link from "next/link";
import { getSynopticPericopes } from "@/lib/jesus/server";
import { parseRef } from "@/lib/scriptures/refs";
import SynopticComparator from "../_components/SynopticComparator";

/**
 * Gospels word by word. The header uses the world's own kicker, title and
 * lede so it follows the light and dark themes (its hard-coded white title
 * vanished on the ivory page).
 */
export default function SynopticHarmonyPage() {
  const pericopes = getSynopticPericopes();
  const opening = (["MAT", "LUK"] as const).flatMap((book) => {
    const witness = pericopes[0]?.witnesses[book];
    const verse = witness?.verses[0];
    const parsed = witness ? parseRef(witness.ref) : null;
    if (!witness || !verse || !parsed) return [];
    return [{
      cite: `${witness.bookName} ${parsed.chapter}:${verse.number}`,
      href: `/scriptures/protestant/${parsed.book}/${parsed.chapter}#v${verse.number}`,
      text: verse.text,
    }];
  });

  return (
    <div className="synoptic-harmony-room">
      <h1>Gospels word by word</h1>
      <div className="lede">
        {opening.map((line) => (
          <blockquote key={line.href}>
            <p>{line.text}</p>
            <footer><Link href={line.href}>{line.cite}</Link></footer>
          </blockquote>
        ))}
      </div>
      <p>
        Highlights compare normalized word forms within the selected passages.
        Shared vocabulary can help you explore similarities; it does not by
        itself establish which Gospel used another or whether a lost source
        existed. Every passage links to the hosted text.
      </p>
      <SynopticComparator pericopes={pericopes} />
      <p>
        <Link href="/jesus/dossier?preset=synoptic-problem-q" className="textlink">
          Open the synoptic problem research worksheet →
        </Link>
      </p>
    </div>
  );
}
