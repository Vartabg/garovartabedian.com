import { getLife, getReadyLifePlates } from "@/lib/jesus/server";
import LifeRoom from "./LifeRoom";

/** His life — harmony + plates from the server; verse text still on demand. */
export default function LifePage() {
  return <LifeRoom data={getLife()} plates={getReadyLifePlates()} />;
}
