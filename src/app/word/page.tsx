import ResearchAudio from "../_components/ResearchAudio";
import XrayTag from "@/app/_components/xray/XrayTag";
import { getWordData } from "@/lib/public-json";
import { wordFacts, worldXrayTag } from "@/lib/site/world-xray";
import WordHome from "./WordHome";

/** World home — ownership ledger resolved on the server. */
export default function WordPage() {
  const data = getWordData();
  return (
    <>
      <XrayTag {...worldXrayTag("word", wordFacts(data))} />
      <WordHome data={data} audioOverview={<ResearchAudio id="bible-ownership" />} />
    </>
  );
}
