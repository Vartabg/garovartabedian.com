import type { InlineMediaPlateMeta } from "../_components/InlineMediaPlate";
import InlineMediaPlate from "../_components/InlineMediaPlate";

/** Chapter-level illustration — smaller than the text hero plate. */
export default function EarlySectionPlate({
  plate,
}: {
  plate: InlineMediaPlateMeta;
}) {
  return <InlineMediaPlate plate={plate} />;
}
