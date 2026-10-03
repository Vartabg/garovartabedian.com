import type { ClaimBasis, ClaimSource } from "../evidence/claims";

export type EvidenceBasis = "explicit" | "inferred" | "reception" | "disputed";

export type WitnessDateInfo = {
  composition?: string;
  earliestManuscript?: string;
  edition?: string;
  translation?: string;
};

export type WitnessLocator = {
  corpusId: string;
  editionId: string;
  section: string;
  passageRef: string;
  originalLanguage?: string;
};

export type WitnessMeta = {
  id: string;
  title: string;
  shortTitle: string;
  language: string;
  isRtl?: boolean;
  dates: WitnessDateInfo;
  primaryTradition: string;
  corpusEditionId: string;
  licenseNotice: string;
};

export type SlotCell = {
  witnessId: string;
  locator: WitnessLocator;
  basis: EvidenceBasis;
  summary: string;
  verbatimExcerpt: string;
  supportingCitations: string[];
  limits?: string;
};

export type MatrixSlot = {
  id: string;
  label: string;
  description: string;
  cells: Record<string, SlotCell>;
};

export type EdgeRelationship =
  | "direct-citation"
  | "allusion"
  | "shared-tradition"
  | "theological-divergence"
  | "independent";

export type ScholarlyConsensus = "strong" | "debated" | "minority-view";

export type WitnessEdge = {
  id: string;
  sourceWitnessId: string;
  targetWitnessId: string;
  relationship: EdgeRelationship;
  scholarlyConsensus: ScholarlyConsensus;
  basisNote: string;
  citations: string[];
};

export type ReceptionClaim = {
  id: string;
  tradition: "jewish" | "christian" | "islamic" | "academic";
  subject: string;
  text: string;
  basis: ClaimBasis;
  sources: ClaimSource[];
  refs: string[];
  limit?: string;
};

export type MatrixProvenance = {
  reviewStatus: "draft" | "machine-checked" | "agent-reviewed" | "human-approved";
  reviewer: string;
  rubricVersion: string;
  reviewedContentHash: string;
  reviewedAt: string;
  reviewScope: string;
};

export type ContextGuard = {
  requiresFullPericope?: boolean;
  misuseNotice?: string;
};

export type ParallelMatrix = {
  schemaVersion: "1.0.0";
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  axis?: string;
  witnesses: WitnessMeta[];
  slots: MatrixSlot[];
  edges: WitnessEdge[];
  receptionClaims: ReceptionClaim[];
  contextGuard?: ContextGuard;
  provenance: MatrixProvenance;
};

export type RightsManifest = {
  schemaVersion: string;
  generatedBy: string;
  note: string;
  generatedAt: string;
  corpora: Record<string, CorpusRights>;
};

/**
 * What the site took from one corpus, and under what terms.
 *
 * The split matters and the field names carry it. Bibliography, licence, and
 * notice are authored — a human read a licence and wrote down what it says.
 * The last four are measured by scripts/parallels/build-rights-manifest.mjs and
 * recomputed by tests/parallels-integrity.test.ts.
 *
 * The predecessor had a bare `sha256` that nothing verified; `oshb-wlc` carried
 * the SHA-256 of the empty string while the page promised readers
 * "cryptographic hash verification". A digest that names what it covers, beside
 * a count of what it covers, cannot fail that way quietly.
 */
export type CorpusRights = {
  id: string;
  title: string;
  translator?: string;
  publishedYear?: number;
  publisher?: string;
  version?: string;
  upstreamUrl: string;
  license: string;
  licenseUrl?: string;
  notice: string;
  permittedTransformations: string;
  jurisdiction: string;
  /** Measured: did upstreamUrl answer when it was last visited? */
  upstreamStatus: "ok" | "blocked" | "dead" | "error" | "unchecked";
  /** Measured: the date of that visit. Null only when never checked. */
  upstreamCheckedAt: string | null;
  /** Measured: how many verbatim strings the digest below covers. */
  reproducedExcerpts: number;
  /** Measured: SHA-256 over every verbatim string the site publishes from this
   *  corpus, canonically ordered. Recomputable from the repository. */
  reproducedTextSha256: string;
};
