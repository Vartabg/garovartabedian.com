import { getCouncils, getReadyCouncilPlates } from "@/lib/church/server";
import CouncilsRoom from "./CouncilsRoom";

export default function CouncilsPage() {
  return (
    <CouncilsRoom data={getCouncils()} plates={getReadyCouncilPlates()} />
  );
}
