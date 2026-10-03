import { getArt, getLensTexts, getPerspectives } from "@/lib/jesus/server";
import LensRoom from "./LensRoom";

/** How communities, readers, and legends understand Jesus. */
export default function LensPage() {
  return (
    <LensRoom
      perspectives={getPerspectives()}
      entries={getLensTexts()}
      art={getArt()}
    />
  );
}
