import { getGiants } from "@/lib/church/server";
import GiantsRoom from "./GiantsRoom";

export default function GiantsPage() {
  return <GiantsRoom data={getGiants()} />;
}
