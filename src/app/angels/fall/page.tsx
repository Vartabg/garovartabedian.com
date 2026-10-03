import { getFall, getReadyAngelsPlates } from "@/lib/angels/server";
import { canons } from "@/lib/scriptures/server/canons";
import { originalManifest } from "@/lib/scriptures/server";
import FallRoom from "./FallRoom";

export default function FallPage() {
  return (
    <FallRoom data={getFall()} canons={canons} plates={getReadyAngelsPlates()} originalEditions={originalManifest.books} />
  );
}
