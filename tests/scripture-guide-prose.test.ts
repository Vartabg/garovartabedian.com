import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateGuideProse, validateGuideV2 } from "../scripts/scriptures/guide-validation.mjs";
import type { Canons, ChapterGuide } from "../src/lib/scriptures/types";

const baseline = JSON.parse(readFileSync("public/scriptures/guides/LEV/1.json", "utf8")) as ChapterGuide;
const canons = JSON.parse(readFileSync("public/scriptures/canons.json", "utf8")) as Canons;
const validate = (guide: ChapterGuide) => validateGuideV2({
  guide, root: process.cwd(), canons, book: "LEV", chapter: 1,
});

test("generation self-talk is rejected in every reader-facing prose field", () => {
  const residue = "Should be valid JSON. Ensure output only JSON. final used schema probably ok.";
  const cases: [string, (guide: ChapterGuide) => void][] = [
    ["bookName", (guide) => { guide.bookName += residue; }],
    ["summary", (guide) => { guide.summary += residue; }],
    ["whyItMatters", (guide) => { guide.whyItMatters += residue; }],
    ...(["author", "audience", "date", "setting", "literaryForm"] as const).map(
      (field): [string, (guide: ChapterGuide) => void] => [
        `context.${field}`, (guide) => { guide.context[field] += residue; },
      ],
    ),
    ["outline[0].heading", (guide) => { guide.outline[0].heading += residue; }],
    ["outline[0].note", (guide) => { guide.outline[0].note += residue; }],
    ["keyVerses[0].text", (guide) => { guide.keyVerses[0].text += residue; }],
    ["keyVerses[0].why", (guide) => { guide.keyVerses[0].why += residue; }],
    ["themes[0]", (guide) => { guide.themes[0] += residue; }],
    ["questions[0].question", (guide) => { guide.questions[0].question += residue; }],
    ["questions[0].answer", (guide) => { guide.questions[0].answer += residue; }],
    ["glossary[0].term", (guide) => { guide.glossary![0].term += residue; }],
    ["glossary[0].def", (guide) => { guide.glossary![0].def += residue; }],
    ...(["before", "here", "after"] as const).map(
      (position): [string, (guide: ChapterGuide) => void] => [
        `readingContext.${position}.text`, (guide) => { guide.readingContext![position].text += residue; },
      ],
    ),
  ];

  assert.deepEqual(validate(baseline).failures, []);
  for (const [field, contaminate] of cases) {
    const guide = structuredClone(baseline);
    contaminate(guide);
    const expected = `LEV/1: ${field} contains generation/protocol residue (JSON output instruction)`;
    assert.deepEqual(validateGuideProse(guide), [expected], field);
    assert.ok(validate(guide).failures.includes(expected), field);
  }
});

test("the observed glossary delimiter suffix is rejected after JSON parsing", () => {
  const guide = structuredClone(baseline);
  guide.glossary![1].def += "},{";
  const decoded = JSON.parse(JSON.stringify(guide)) as ChapterGuide;
  assert.deepEqual(validateGuideProse(decoded), [
    "LEV/1: glossary[1].def contains generation/protocol residue (stray JSON delimiter)",
  ]);
});

test("high-confidence output instructions and protocol markers cannot hide in prose", () => {
  for (const residue of [
    "Should be valid JSON.",
    "Ensure output only JSON.",
    "Return only strict JSON.",
    "Respond with valid JSON only.",
    "final used schema probably ok.",
    "As an AI language model, I can summarize this chapter.",
    "<|im_start|>assistant",
    "<|start_header_id|>assistant<|end_header_id|>",
    "<think>Check the requested fields.</think>",
    "<analysis>Draft complete.</analysis>",
    "\n```json\n{}\n```",
    "} , {",
  ]) {
    const guide = structuredClone(baseline);
    guide.questions[2].answer += ` ${residue}`;
    assert.equal(validateGuideProse(guide).length, 1, residue);
  }
});

test("ordinary literary discussion and quoted speech remain valid prose", () => {
  for (const prose of [
    "The literary schema distinguishes offerings by herd, flock, and birds.",
    "The final form of the chapter does not resolve the question of its authorship.",
    "The narrator uses self-talk to portray the character's hesitation.",
    "The speaker says, ‘I need to return to the Lord,’ before addressing the assembly.",
    "The reader should be careful to distinguish the quoted command from its explanation.",
    "The analysis compares the words ‘return’ and ‘only’ in their literary context.",
    "Quoted [editorial additions] and {alternative readings} can require explanation.",
  ]) {
    const guide = structuredClone(baseline);
    guide.summary = prose;
    assert.deepEqual(validateGuideProse(guide), [], prose);
  }
  assert.deepEqual(validateGuideProse(baseline), []);
});

test("prose checks do not treat provenance notes or JSON structure as reader prose", () => {
  const guide = structuredClone(baseline);
  assert.ok(guide.generation);
  guide.generation.rebound = [{
    at: "2026-10-02T12:00:00.000Z",
    by: "test reviewer",
    reason: "Reviewed and removed the draft instruction ‘Ensure output only JSON.’ before rebinding citation metadata.",
    previousPromptHash: "0".repeat(64),
    changedFields: ["bookBriefing.sources.0.label"],
  }];
  const before = JSON.stringify(guide);
  assert.deepEqual(validateGuideProse(guide), []);
  assert.equal(JSON.stringify(guide), before);
});
