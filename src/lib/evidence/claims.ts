/**
 * One registry for every graded claim on the site.
 *
 * Four worlds grew their own evidence vocabulary independently, and the same
 * claim could wear a different pill depending on which room a reader entered
 * from. This is the single source those pills read.
 *
 * It is deliberately NOT one flattened five-point scale. The two vocabularies
 * measure different things and collapsing them would lose the distinction that
 * makes each one useful:
 *
 *   textual     — how a claim stands to the text it cites. "Explicit" and
 *                 "disputed" are about whether the passage says the thing.
 *   attestation — how early the witness is. "Scripture" and "later tradition"
 *                 are about when someone first wrote it down.
 *
 * A claim can be explicit in a late source, or disputed in scripture. Forcing
 * both onto one axis would make those two indistinguishable, so the registry
 * carries the axis with the grade and the index filters on either.
 */

export const TEXTUAL_GRADES = [
  "explicit",
  "inferred",
  "disputed",
  "tradition",
  "extra-canonical",
] as const;

export const ATTESTATION_GRADES = ["scripture", "early", "late"] as const;

export type TextualGrade = (typeof TEXTUAL_GRADES)[number];
export type AttestationGrade = (typeof ATTESTATION_GRADES)[number];

export type ClaimBasis =
  | { axis: "textual"; grade: TextualGrade }
  | { axis: "attestation"; grade: AttestationGrade };

export type ClaimSource = { label: string; url?: string };

export type Claim = {
  id: string;
  /** The room the claim lives in. */
  world: "angels" | "apostles";
  /** What or who the claim is about. */
  subject: string;
  /** The claim itself, in the wording the room already publishes. */
  text: string;
  basis: ClaimBasis;
  /** Named witnesses, with a link where one is published. */
  sources: ClaimSource[];
  /** Scripture references the claim rests on. */
  refs: string[];
  /** The stated boundary — what the claim does not establish. */
  limit?: string;
  /** Where the claim is shown on the site. */
  href: string;
};

export type ClaimRegistry = {
  schemaVersion: number;
  generatedBy: string;
  generatedAt: string;
  claims: Claim[];
};

/**
 * The words each grade wears, and what it commits the site to. Both rooms and
 * the index read these, so a grade cannot be labelled one way in a world and
 * another way on the browsable page.
 */
export const GRADE_LABEL: Record<TextualGrade | AttestationGrade, string> = {
  explicit: "Explicit in the text",
  inferred: "Interpretive connection",
  disputed: "Disputed reading",
  tradition: "Later tradition",
  "extra-canonical": "Extra-canonical witness",
  scripture: "scripture",
  early: "early source",
  late: "later tradition",
};

export const GRADE_MEANING: Record<TextualGrade | AttestationGrade, string> = {
  explicit: "The cited passage says the central claim directly.",
  inferred: "The sources are direct; the connection or arrangement is editorial.",
  disputed: "The reading is historic and plausible, but the passage does not require it.",
  tradition: "The idea developed after the biblical text and is labeled as such.",
  "extra-canonical": "The witness stands outside most biblical canons; its source is named.",
  scripture: "Stated in the New Testament itself.",
  early: "Named by a source within roughly a century of the apostles.",
  late: "First appears centuries on — tradition, not evidence.",
};

export const AXIS_LABEL: Record<ClaimBasis["axis"], string> = {
  textual: "How it stands to the text",
  attestation: "How early the witness is",
};

export const AXIS_NOTE: Record<ClaimBasis["axis"], string> = {
  textual:
    "Whether the passage cited actually says the thing, or whether the connection is an editorial one.",
  attestation:
    "When someone first wrote it down — scripture itself, a source within about a century, or centuries later.",
};

export const isTextualGrade = (value: string): value is TextualGrade =>
  (TEXTUAL_GRADES as readonly string[]).includes(value);

export const isAttestationGrade = (value: string): value is AttestationGrade =>
  (ATTESTATION_GRADES as readonly string[]).includes(value);
