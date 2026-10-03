import test from "node:test";
import assert from "node:assert/strict";
import { loadReadingJourney } from "../src/lib/evidence/reading-journey-server";
import { passageSegments, readingPreferences, defaultReadingPreferences } from "../src/lib/evidence/reading-journey";
import { resolvePublicSource } from "../src/lib/find-server/sources";
import { evaluationRubric, requestForPassage, validateFindReply, type Payload } from "../src/lib/find-server/evaluation";
import { MODEL } from "../scripts/research/types";

test("reading path preserves hosted text and exact annotation spans without losing the chapter context", async () => {
  const journey = await loadReadingJourney();
  const { packet } = journey;
  assert.equal(journey.scripture[4], packet.excerpts[0].exact);
  const pieces = passageSegments(journey.early[0], packet.excerpts.slice(1).map(e => ({ id: e.id, start: e.selector.start, end: e.selector.end })));
  assert.equal(pieces.map(p => p.text).join(""), journey.early[0]);
  for (const p of pieces.filter(p => p.note)) assert.equal(p.text, packet.excerpts.find(e => e.id === p.note)!.exact);
  assert.equal(resolvePublicSource(journey.candidate).text, journey.early[0]);
  assert.equal(resolvePublicSource(journey.candidate).href, "/early/1clement#chapter-16");
  assert.equal(packet.editorialReview.status, "draft");
});
test("invalid or overlapping annotation spans fail instead of altering the source", () => {
  assert.throws(() => passageSegments("abcdef", [{ id: "a", start: 1, end: 5 }, { id: "b", start: 4, end: 6 }]), /span/);
  assert.throws(() => passageSegments("abc", [{ id: "a", start: 0, end: 4 }]), /span/);
  assert.equal(passageSegments("alpha 🕊 beta", []).map(p => p.text).join(""), "alpha 🕊 beta");
});
test("appearance settings are allowlisted and do not persist a Trace default", () => {
  assert.deepEqual(readingPreferences(null), defaultReadingPreferences);
  assert.deepEqual(readingPreferences({ size: "huge", theme: "url(evil)", monochrome: "true", mode: "trace" }), defaultReadingPreferences);
  assert.deepEqual(readingPreferences({ size: "largest", theme: "night", monochrome: true }), { size: "largest", theme: "night", monochrome: true });
});
test("the pair request uses the existing bounded relationship rubric and the full source context", async () => {
  const journey = await loadReadingJourney();
  const anchor = resolvePublicSource(journey.anchor), candidate = resolvePublicSource(journey.candidate);
  const payload: Payload = { query: journey.packet.question, anchor, passages: [candidate], model: MODEL, rubric: evaluationRubric(anchor) };
  const request = requestForPassage(payload, 0);
  assert.ok("left" in request.state && "right" in request.state);
  assert.equal(request.state.left?.passage, journey.scripture[4]);
  assert.equal(request.state.right.passage, journey.early[0]);
  assert.ok(Buffer.byteLength(JSON.stringify(request)) < 24000);
  assert.ok(!JSON.stringify(request).includes("TYPESAFE_API_KEY"));
  const response = { model: MODEL, answers: { judgment: { type: "choice", choice: "close-wording", confidence: 0.8, probabilities: { "close-wording": 0.8, "substantial-paraphrase": 0.1, "thematic-overlap": 0.05, unrelated: 0.02, "insufficient-context": 0.03 } } }, usage: { input_tokens: 10, output_tokens: 5 } };
  assert.deepEqual(validateFindReply(response, payload, 0), response);
  assert.throws(() => validateFindReply({ ...response, model: "changed" }, payload, 0), /model/);
  assert.throws(() => validateFindReply({ ...response, answers: { judgment: { ...response.answers.judgment, choice: "directly-supported" } } }, payload, 0), /judgment/);
});
