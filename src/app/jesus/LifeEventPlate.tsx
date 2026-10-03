import InlineMediaPlate from "../_components/InlineMediaPlate";
import type { LifePlateMeta } from "@/lib/jesus/life-plates";

/** Event-level gospel illumination — same frame grammar as Early Writings chapters. */
export default function LifeEventPlate({ plate }: { plate: LifePlateMeta }) {
  return <InlineMediaPlate plate={plate} />;
}
