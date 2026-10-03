import { getWordData } from "@/lib/public-json";
import WordHome from "./WordHome";

/** World home — ownership ledger resolved on the server. */
export default function WordPage() {
  return <WordHome data={getWordData()} />;
}
