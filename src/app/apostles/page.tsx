import { getSent, getTwelve } from "@/lib/apostles/server";
import ApostlesHome from "./ApostlesHome";

/** World home — the band, the four roll-calls, and the doors in. */
export default function ApostlesPage() {
  return <ApostlesHome data={getTwelve()} sent={getSent()} />;
}
