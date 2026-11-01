import { getFall, getReadyAngelsPlates } from "@/lib/angels/server";
import { canons } from "@/lib/scriptures/server/canons";
import { originalManifest } from "@/lib/scriptures/server";
import FallRoom from "./FallRoom";
import ResearchAudio from "../../_components/ResearchAudio";

export default function FallPage() {
  return (
    <FallRoom data={getFall()} canons={canons} plates={getReadyAngelsPlates()} originalEditions={originalManifest.books} audioOverview={<ResearchAudio id="watchers" />} />
  );
}
