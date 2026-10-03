import { getDemons, getReadyAngelsPlates } from "@/lib/angels/server";
import { canons } from "@/lib/scriptures/server/canons";
import DemonsRoom from "./DemonsRoom";

export default function DemonsPage() {
  return (
    <DemonsRoom
      data={getDemons()}
      canons={canons}
      plates={getReadyAngelsPlates()}
    />
  );
}
