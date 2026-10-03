import { requestFor, rubricHash, validateReply } from "../../../scripts/research/rubric";
import { MODEL, type TextBlock, type Unit } from "../../../scripts/research/types";
import { FIND_RUBRIC, findQuestions, validateRelevance } from "../../../scripts/research/find-rubric";
import type { RelevanceReply } from "../evidence-explorer";
import { digest, type PublicPassage } from "./sources";

export type FindReply = RelevanceReply | ReturnType<typeof validateReply>;
export type Payload = {
  query: string;
  passages: PublicPassage[];
  /** A hosted anchor turns each candidate into a passage-pair comparison. */
  anchor?: PublicPassage;
  model: string;
  rubric: string;
};
export const relationshipRubric = `find-relationship-v1:${rubricHash}`;
export const evaluationRubric = (anchor?: PublicPassage) => anchor ? relationshipRubric : FIND_RUBRIC;

function block(p: PublicPassage): TextBlock {
  const s = p.source;
  return {
    id: digest(JSON.stringify(p)), source: s,
    path: s.kind === "scripture" ? `public/scriptures/text/${s.translation}/${s.book}.json` : `public/early/texts/${s.id}.json`,
    pointer: s.kind === "scripture" ? ["chapters", s.chapter - 1, s.verse - 1] : ["sections", s.section, "paragraphs", s.paragraph],
    artifactHash: p.sourceHash, textHash: p.textHash, start: p.start, end: p.end,
    text: p.text, context: p.context, title: p.title, edition: p.edition,
    role: p.role, language: "en", href: p.href,
  };
}
function unit(payload: Payload, position: number): Unit {
  if (!payload.anchor) throw new Error("Comparison anchor missing.");
  return { id: String(position), task: "relationship", left: block(payload.anchor), right: block(payload.passages[position]) };
}
export function requestForPassage(payload: Payload, position: number) {
  if (payload.anchor) return requestFor(unit(payload, position));
  const p = payload.passages[position];
  return {
    model: MODEL,
    state: { query: payload.query, candidate: { passage: p.text, context: p.context, edition: p.edition, role: p.role } },
    questions: findQuestions,
  };
}
export function validateFindReply(value: unknown, payload: Payload, position: number): FindReply {
  return payload.anchor ? validateReply(value, unit(payload, position)) : validateRelevance(value);
}
