import { churchSpineForks, getChurchRoad } from "@/lib/public-json";
import roadLinks from "../../../public/church/road-links.json";
import XrayTag from "@/app/_components/xray/XrayTag";
import { churchFacts, worldXrayTag } from "@/lib/site/world-xray";
import ChurchHome, { type RoadStepLinks } from "./ChurchHome";

/** World home — road + tree forks resolved on the server. */
export default function ChurchPage() {
  const road = getChurchRoad();
  const forks = churchSpineForks();
  return (
    <>
      <XrayTag {...worldXrayTag("church", churchFacts(road, forks, roadLinks))} />
      <ChurchHome
        data={road}
        forks={forks}
        links={roadLinks.steps as RoadStepLinks[]}
      />
    </>
  );
}
