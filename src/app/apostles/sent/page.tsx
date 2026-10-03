import { getSent } from "@/lib/apostles/server";
import SendingMap from "./SendingMap";
import SentRoom from "./SentRoom";
import ApostlesStoryPlate from "../ApostlesStoryPlate";
import { APOSTLES_STORY_PLATES } from "@/lib/apostles/story-plates";

/** The map and illustration render on the server and arrive as slots. */
export default function SentPage() {
  const data = getSent();
  return (
    <SentRoom
      data={data}
      map={<SendingMap data={data} />}
      illustration={<ApostlesStoryPlate plate={APOSTLES_STORY_PLATES.sending} />}
    />
  );
}
