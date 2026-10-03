export const MODEL = "jev-1.13.0";
export const RUBRIC_VERSION = "text-grounded-v1";
export const RELATIONS = ["close-wording", "substantial-paraphrase", "thematic-overlap", "unrelated", "insufficient-context"] as const;
export const SUPPORT = ["directly-supported", "interpretive-step", "contradicted", "not-addressed", "insufficient-context"] as const;
export type Task = "relationship" | "claim-support";
export type Label = typeof RELATIONS[number] | typeof SUPPORT[number];
export type SourceSpec =
  | { kind: "scripture"; book: string; chapter?: number; verse?: number; endVerse?: number; translation?: string }
  | { kind: "early"; id: string; chapter?: number; section?: number; paragraph?: number }
  | { kind: "library"; id: string; section?: string; block?: number }
  | { kind: "file"; path: string; start?: number; end?: number; language?: string };
export type TextBlock = {
  id: string; source: SourceSpec; path: string; artifactHash: string; pointer: (string | number)[];
  start: number; end: number; text: string; textHash: string; context: string;
  title: string; edition: string; role: string; language: string; href?: string;
};
export type Job = {
  id?: string; mode: "compare" | "discover" | "check-claim";
  left?: SourceSpec; right?: SourceSpec; source?: SourceSpec; claim?: string;
  targets?: SourceSpec[]; corpus?: "scripture-web" | "early";
};
export type Unit = { id: string; task: Task; left?: TextBlock; right: TextBlock; claim?: string; explicit?: boolean; baselineMatch?: boolean };
export type Choice = { type: "choice"; choice: Label; probabilities: Record<string, number>; confidence: number };
export type Outcome = {
  unit: Unit; status: "complete" | "incomplete"; error?: string; answer?: Choice;
  exactMatch: boolean; cached: boolean; milliseconds: number; model?: string;
  inputTokens?: number; outputTokens?: number; fingerprint: string;
};
export type Run = {
  schemaVersion: 1; id: string; createdAt: string; model: string; rubric: string;
  jobs?: Job[];
  status: "dry-run" | "complete" | "incomplete"; planned: number; attempts: number;
  usage?: { inputTokens: number; outputTokens: number; meteredResponses: number };
  coverage: { sourceBlocks: number; targetBlocks: number; shortlistedPairs: number; explicitPairs: number; scope: string };
  issues: string[]; outcomes: Outcome[];
};
export type Decision = { unitId: string; outcomeHash: string; action: "accept" | "reject" | "defer"; reviewer: string; date: string; notes: string };
export type BenchmarkCase = {
  id: string; group: string; split: "development" | "held-out"; task: Task; expected: Label;
  job: Job; rationale: string; sourceHashes: Record<string, string>;
};
