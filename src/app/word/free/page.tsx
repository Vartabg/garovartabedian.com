import { getFreeChain } from "@/lib/public-json";
import FreeRoom from "./FreeRoom";

/** The free way, checked — every hosted text's chain resolved on the server. */
export default function FreePage() {
  return <FreeRoom data={getFreeChain()} />;
}
