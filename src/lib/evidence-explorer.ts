import type { TextBlock, Outcome } from "../../scripts/research/types";
export type FindScope = "scripture" | "early" | "all" | "text";
export type EvidenceQuery = { query: string; scope: FindScope; translation: "web" | "kjv" | "drb" | "brenton"; text?: string; name?: string };
export const RELEVANCE = ["directly-relevant", "indirectly-relevant", "unrelated", "insufficient-context"] as const;
export type Relevance = typeof RELEVANCE[number];
export type RelevanceReply = {
  model: string;
  answers: { useful: { type: "noul"; noul: number }; relation: { type: "choice"; choice: Relevance; confidence: number; probabilities: Record<Relevance, number> } };
  usage: { input_tokens: number; output_tokens: number };
};
export type EvidenceHit = {
  block: TextBlock; channels: string[]; rank: number; phrase: boolean;
  judgment?: RelevanceReply; cached?: boolean; error?: string;
};
export type EvidenceRun = {
  id: string; createdAt: string; request: EvidenceQuery; hits: EvidenceHit[];
  coverage: { passages: number; sources: number; semantic: number; returned: number; notes: string[] };
  issues: string[]; status: "retrieved" | "complete" | "incomplete";
  attempts: number; inputTokens: number; outputTokens: number; model: string; rubric: string;
  connections?: { from: string; runId: string; outcomes: Outcome[] };
};

/** Review order follows the displayed label, then the estimate within that label. */
export function compareEvidenceRelevance(a: EvidenceHit, b: EvidenceHit): number {
  const priority: Record<Relevance, number> = {
    "directly-relevant": 0,
    "indirectly-relevant": 1,
    "insufficient-context": 2,
    unrelated: 3,
  };
  const labelRank = (hit: EvidenceHit) => hit.judgment && !hit.error
    ? priority[hit.judgment.answers.relation.choice] : 4;
  return labelRank(a) - labelRank(b)
    || (b.judgment?.answers.useful.noul ?? -1) - (a.judgment?.answers.useful.noul ?? -1)
    || a.rank - b.rank;
}
