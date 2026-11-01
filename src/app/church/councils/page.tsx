import { getCouncils, getReadyCouncilPlates } from "@/lib/church/server";
import CouncilsRoom from "./CouncilsRoom";
import ResearchAudio from "../../_components/ResearchAudio";

export default function CouncilsPage() {
  return (
    <CouncilsRoom data={getCouncils()} plates={getReadyCouncilPlates()} audioOverview={<ResearchAudio id="nicaea" />} />
  );
}
