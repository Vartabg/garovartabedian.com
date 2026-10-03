import { getLexicon } from "@/lib/angels/server";
import { canons } from "@/lib/scriptures/server/canons";
import VocabularyRoom from "./VocabularyRoom";

/** The vocabulary of the unseen — lexicon counted at build, rendered on the server. */
export default function VocabularyPage() {
  return <VocabularyRoom data={getLexicon()} canons={canons} />;
}
