import { getRisen } from "@/lib/jesus/server";
import RisenRoom from "./RisenRoom";

/** Cross to ascension — the dataset is static, so the room renders on the server. */
export default function RisenPage() {
  return <RisenRoom data={getRisen()} />;
}
