export type InvestigationSource = {
  id: string;
  edition: string;
  language: string;
  attribution: string;
  rights: string;
  upstreamUrl: string;
  artifact: string;
  sha256: string;
} & (
  | { kind: "scripture"; translation: string; book: string }
  | { kind: "early-writing"; work: string }
);

export type PassageLocator =
  | { kind: "verse"; chapter: number; verse: number }
  | { kind: "paragraph"; chapter: number; paragraph: number };

export type InvestigationExcerpt = {
  id: string;
  sourceId: string;
  label: string;
  locator: PassageLocator;
  /** Exact contiguous text, including punctuation; never an ellipsis or paraphrase. */
  exact: string;
};

export type InvestigationClaim = {
  id: string;
  statement: string;
  basis: "textual-observation" | "reception-interpretation";
  evidenceIds: string[];
  limits: string;
};

export type InvestigationDefinition = {
  schemaVersion: "1.0.0";
  id: string;
  title: string;
  question: string;
  scope: string;
  sources: InvestigationSource[];
  excerpts: InvestigationExcerpt[];
  claims: InvestigationClaim[];
  relationship: {
    kind: "direct-citation";
    basis: "reception-identification";
    citingWork: string;
    receivedPassage: string;
    evidenceIds: string[];
    limits: string;
  };
  /** Review is independent of the deterministic source checks. */
  editorialReview: { status: "draft"; author: string; scope: string };
  openQuestions: string[];
};

export type VerifiedExcerpt = InvestigationExcerpt & {
  passageId: string;
  href: string;
  context: string;
  selector: { unit: "UTF-16-code-unit"; start: number; end: number; exactSha256: string };
};

export type InvestigationPacket = Omit<InvestigationDefinition, "excerpts"> & {
  excerpts: VerifiedExcerpt[];
  verification: {
    status: "source-checked";
    algorithm: "sha256";
    canonicalization: string;
    contentHash: string;
    scope: string;
  };
};
