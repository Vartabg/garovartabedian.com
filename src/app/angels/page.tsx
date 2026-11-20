import {
  getAngelsOrder,
  getDemons,
  getEncounters,
  getFall,
  getLexicon,
  getTeaching,
  getReadyAngelsPlates,
} from "@/lib/angels/server";
import { canons } from "@/lib/scriptures/server/canons";
import XrayTag from "@/app/_components/xray/XrayTag";
import { angelsFacts, worldXrayTag } from "@/lib/site/world-xray";
import AngelsHome from "./AngelsHome";

/** World home — order + canons resolved on the server. */
export default function AngelsPage() {
  const order = getAngelsOrder();
  const fall = getFall();
  const encounters = getEncounters();
  const demons = getDemons();
  const lexicon = getLexicon();
  const stats = {
    fallFragments: fall.steps.length,
    appearances: encounters.appeared.length,
    confrontations: encounters.castOut.length,
    namedDemons: demons.demons.length,
    vocabularyTerms: lexicon.totals.terms,
    vocabularyOccurrences: lexicon.totals.tokens,
  };

  return (
    <>
      <XrayTag {...worldXrayTag("angels", angelsFacts(stats))} />
      <AngelsHome
        data={order}
        fall={fall}
        encounters={encounters}
        teaching={getTeaching()}
        plates={getReadyAngelsPlates()}
        canons={canons}
        stats={stats}
      />
    </>
  );
}
