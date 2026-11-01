import {
  getChristianWitnesses,
  getHistory,
  getJesusEssays,
  getJesusHistorySources,
  getReadyStonePlates,
  getStones,
} from "@/lib/jesus/server";
import HistoryRoom from "./HistoryRoom";
import ResearchAudio from "../../_components/ResearchAudio";

/** Historical record — ink, stone, synthesis essays, and research corpus from the server. */
export default function HistoryPage() {
  return (
    <HistoryRoom
      audioOverview={<ResearchAudio id="historical-jesus" />}
      christianWitnesses={getChristianWitnesses()}
      items={getHistory()}
      stones={getStones()}
      plates={getReadyStonePlates()}
      essays={getJesusEssays()}
      sources={getJesusHistorySources()}
    />
  );
}
