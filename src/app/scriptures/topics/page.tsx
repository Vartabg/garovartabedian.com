import { naveIndex } from "@/lib/scriptures/server/nave-index";
import TopicsRoom from "./TopicsRoom";

export default function TopicsPage() {
  return <TopicsRoom data={naveIndex} />;
}
