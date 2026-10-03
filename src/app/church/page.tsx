import { churchSpineForks, getChurchRoad } from "@/lib/public-json";
import roadLinks from "../../../public/church/road-links.json";
import ChurchHome, { type RoadStepLinks } from "./ChurchHome";

/** World home — road + tree forks resolved on the server. */
export default function ChurchPage() {
  return (
    <ChurchHome
      data={getChurchRoad()}
      forks={churchSpineForks()}
      links={roadLinks.steps as RoadStepLinks[]}
    />
  );
}
