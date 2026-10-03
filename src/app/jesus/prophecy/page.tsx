import { getProphecies } from "@/lib/jesus/server";
import { canons } from "@/lib/scriptures/server/canons";
import { originalManifest } from "@/lib/scriptures/server";
import ProphecyRoom from "./ProphecyRoom";

/** Prophecy → fulfillment — pair index from the server; verses on demand. */
export default function ProphecyPage() {
  return <ProphecyRoom pairs={getProphecies()} canons={canons} originalEditions={originalManifest.books} />;
}
