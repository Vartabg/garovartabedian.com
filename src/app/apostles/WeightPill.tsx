import type { TraditionWeight } from "@/lib/apostles/types";
import { GRADE_LABEL, GRADE_MEANING } from "@/lib/evidence/claims";

/**
 * Both the wording and its meaning come from the shared claim registry, so the
 * pill in this room and the row on the How We Know index cannot describe the
 * same grade in two different ways.
 */
const LABEL: Record<TraditionWeight, string> = GRADE_LABEL;
const TITLE: Record<TraditionWeight, string> = GRADE_MEANING;

/** The honesty grade a claim wears: scripture, early source, or later tradition. */
export default function WeightPill({ weight }: { weight: TraditionWeight }) {
  return (
    <span className={`ap-weight ap-weight-${weight}`} title={TITLE[weight]}>
      {LABEL[weight]}
    </span>
  );
}
