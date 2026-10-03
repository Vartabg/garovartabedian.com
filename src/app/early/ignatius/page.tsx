import { getIgnatius } from "@/lib/public-json";
import IgnatiusRoom from "./IgnatiusRoom";

export default function IgnatiusPage() {
  return <IgnatiusRoom data={getIgnatius()} />;
}
