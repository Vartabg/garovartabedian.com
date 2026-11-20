import XrayTag from "@/app/_components/xray/XrayTag";
import { getClaimRegistry, getEvidenceData } from "@/lib/evidence/server";
import { evidenceFacts, worldXrayTag } from "@/lib/site/world-xray";
import EvidenceHome from "./EvidenceHome";

export default function EvidencePage() {
  const data = getEvidenceData();
  const registry = getClaimRegistry();
  return (
    <>
      <XrayTag {...worldXrayTag("evidence", evidenceFacts(data, registry.claims, registry.generatedBy))} />
      <EvidenceHome data={data} claims={registry.claims} />
    </>
  );
}
