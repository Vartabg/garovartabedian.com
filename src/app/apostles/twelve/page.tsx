import { getTwelve } from "@/lib/apostles/server";
import TwelveRoom from "./TwelveRoom";

export default function TwelvePage() {
  return <TwelveRoom data={getTwelve()} />;
}
