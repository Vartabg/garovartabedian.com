import { getEncounters, getReadyAngelsPlates } from "@/lib/angels/server";
import { canons } from "@/lib/scriptures/server/canons";
import EncountersRoom from "./EncountersRoom";

export default function EncountersPage() {
  return (
    <EncountersRoom
      data={getEncounters()}
      canons={canons}
      plates={getReadyAngelsPlates()}
    />
  );
}
