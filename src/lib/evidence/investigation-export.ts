import type { InvestigationPacket } from "./investigation-types";

export function investigationMarkdown(packet: InvestigationPacket): string {
  const lines = [
    `# ${packet.title}`, "", packet.question, "", packet.scope, "",
    `Source checks: ${packet.verification.status}. Editorial review: ${packet.editorialReview.status}.`,
    packet.verification.scope, "", packet.editorialReview.scope, "",
    "## Sources", "",
  ];
  for (const source of packet.sources) {
    lines.push(`### ${source.edition}`, "", source.attribution, "", source.rights, "",
      `Source ID: ${source.id}`, `Upstream: ${source.upstreamUrl}`,
      `Hosted artifact: ${source.artifact}`, `Artifact SHA-256: ${source.sha256}`, "");
  }
  lines.push("## Evidence", "");
  for (const excerpt of packet.excerpts) {
    lines.push(`### ${excerpt.label}`, "", `Evidence ID: ${excerpt.id}`,
      `Passage ID: ${excerpt.passageId}`, `Reader path: ${excerpt.href}`, "",
      `> ${excerpt.exact}`, "",
      `Exact span: [${excerpt.selector.start}, ${excerpt.selector.end}) in ${excerpt.selector.unit}s of the passage below.`,
      `Quotation SHA-256: ${excerpt.selector.exactSha256}`, "",
      "Full containing verse or paragraph:", "", excerpt.context, "");
  }
  lines.push("## Editorial findings", "");
  for (const claim of packet.claims) {
    lines.push(`### ${claim.id}`, "", claim.statement, "", `Basis: ${claim.basis}.`,
      `Evidence: ${claim.evidenceIds.join(", ")}.`, `Limits: ${claim.limits}`, "");
  }
  lines.push("## Relationship", "", `${packet.relationship.citingWork} → ${packet.relationship.receivedPassage}: ${packet.relationship.kind}.`,
    `Basis: ${packet.relationship.basis}.`,
    `Evidence: ${packet.relationship.evidenceIds.join(", ")}.`, packet.relationship.limits, "",
    "## Open questions", "", ...packet.openQuestions.map((question) => `- ${question}`), "",
    "## Reproducibility", "", `Packet content SHA-256: ${packet.verification.contentHash}`,
    packet.verification.canonicalization, "Source artifact hashes cover raw file bytes.", "",
    "## Instructions for downstream analysis", "",
    "Cite evidence IDs and editions. Preserve the difference between the hosted text and editorial interpretation. Identify unsupported claims and missing sources. Do not treat an exact-text check, a hash, or agreement between models as scholarly approval.", "",
  );
  return lines.join("\n");
}
