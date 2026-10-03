import EvidenceHome from "./EvidenceHome";
import { getClaimRegistry, getEvidenceData } from "@/lib/evidence/server";

export default function EvidencePage() {
  return (
    <EvidenceHome data={getEvidenceData()} claims={getClaimRegistry().claims} />
  );
}
