import type { Evidence, EvidenceStatus } from "@/lib/angels/types";
import {
  GRADE_LABEL,
  GRADE_MEANING,
  TEXTUAL_GRADES,
} from "@/lib/evidence/claims";

/**
 * The wording comes from the shared claim registry, not from this file. A
 * grade used to be labelled here and again on the browsable index, and the two
 * could drift into describing the same claim differently depending on which
 * page a reader was standing on.
 */
const EVIDENCE_LABEL: Record<EvidenceStatus, string> = GRADE_LABEL;

const EVIDENCE_GUIDE: { status: EvidenceStatus; note: string }[] =
  TEXTUAL_GRADES.map((status) => ({ status, note: GRADE_MEANING[status] }));

export function EvidenceLegend() {
  return (
    <div className="an-evidence-legend" aria-label="Evidence status guide">
      {EVIDENCE_GUIDE.map((item) => (
        <div className="an-evidence-key" key={item.status}>
          <span className={`an-evidence-badge ${item.status}`}>
            {EVIDENCE_LABEL[item.status]}
          </span>
          <small>{item.note}</small>
        </div>
      ))}
    </div>
  );
}

export default function EvidenceNote({
  evidence,
  compact = false,
}: {
  evidence: Evidence;
  compact?: boolean;
}) {
  return (
    <aside
      className={`an-evidence-note ${evidence.status}${compact ? " compact" : ""}`}
      aria-label={`Evidence status: ${EVIDENCE_LABEL[evidence.status]}`}
    >
      <span className={`an-evidence-badge ${evidence.status}`}>
        {EVIDENCE_LABEL[evidence.status]}
      </span>
      <p>{evidence.note}</p>
    </aside>
  );
}
