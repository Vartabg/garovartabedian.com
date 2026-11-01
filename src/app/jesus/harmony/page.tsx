import Link from "next/link";
import { getSynopticPericopes } from "@/lib/jesus/server";
import SynopticComparator from "../_components/SynopticComparator";

/**
 * Gospels word by word. The header uses the world's own kicker, title and
 * lede so it follows the light and dark themes (its hard-coded white title
 * vanished on the ivory page).
 */
export default function SynopticHarmonyPage() {
  const pericopes = getSynopticPericopes();

  return (
    <div className="synoptic-harmony-room">
      <p className="kicker">
        <Link href="/jesus">Jesus Christ</Link>
      </p>
      <h1>Gospels word by word</h1>
      <p className="lede">
        Compare {pericopes.length} selected Gospel passages in English (World
        English Bible) and Greek (SBL Greek New Testament). Read the accounts
        together and inspect their shared vocabulary.
      </p>
      <p>
        Highlights compare normalized word forms within the selected passages.
        Shared vocabulary can help you explore similarities; it does not by
        itself establish which Gospel used another or whether a lost source
        existed. Every passage links to the hosted text.
      </p>
      <p>
        <Link href="/jesus/dossier?preset=synoptic-problem-q" className="textlink">
          Open the synoptic problem research worksheet →
        </Link>
      </p>

      <SynopticComparator pericopes={pericopes} />
    </div>
  );
}
