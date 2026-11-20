import assert from "node:assert/strict";
import test from "node:test";
import snapshot from "../public/meta/corpus-health.json";
import { collectCorpusHealth } from "../scripts/site/build-corpus-health.mjs";

test("the public corpus-health snapshot matches the repository", () => {
  assert.deepEqual(snapshot, collectCorpusHealth());
});

test("corpus health keeps automated validation separate from editorial review", () => {
  // A chapter may have no guide: the v1 batch-template files were removed on
  // 2026-11-19, so coverage is counted per chapter. Finished guides must not
  // disappear, and a template file must not come back.
  const coverage = snapshot.validation.guides.coverage;
  assert.ok(
    coverage.status === "complete" || coverage.status === "incomplete",
    `invalid coverage status ${coverage.status}`,
  );
  assert.equal(coverage.guides, snapshot.corpus.guides.files);
  assert.equal(
    snapshot.corpus.guides.batchTemplateGuides,
    0,
    "no batch-template guide may ship",
  );
  assert.ok(
    snapshot.corpus.guides.files >= 757,
    "published guides must not fall below the count at template removal",
  );
  assert.equal(
    coverage.status,
    coverage.guides === coverage.chapterSlots ? "complete" : "incomplete",
  );
  assert.equal(
    snapshot.validation.guides.referencesAndQuotations.status,
    "automated",
  );
  const review = snapshot.validation.guides.editorialReview;
  assert.ok(
    ["untracked", "in-progress", "agent-reviewed", "complete"].includes(
      review.status,
    ),
  );
  assert.equal(
    review.agentReviewed + review.humanReviewed + review.untracked,
    snapshot.corpus.guides.files,
  );
  assert.equal(
    snapshot.corpus.guides.review.agentReviewed,
    review.agentReviewed,
  );
  assert.equal(
    snapshot.corpus.guides.review.humanReviewed,
    review.humanReviewed,
  );
  assert.equal(
    snapshot.corpus.guides.questionsWithVerseRefs +
      snapshot.corpus.guides.questionsWithoutVerseRefs,
    snapshot.corpus.guides.questions,
  );
  assert.equal(
    snapshot.corpus.guides.batchTemplateGuides +
      snapshot.corpus.guides.customStructuredGuides,
    snapshot.corpus.guides.files,
  );
  assert.equal(snapshot.validation.guides.v2Rubric.status, "passing");
  assert.equal(snapshot.corpus.guides.v2.failing, 0);
  assert.equal(
    snapshot.corpus.guides.v2.passing,
    snapshot.corpus.guides.v2.provenance,
  );
  assert.ok(
    snapshot.corpus.guides.v2.provenance >= 27,
    "guide-v2 coverage must not regress below the Leviticus batch",
  );
  assert.deepEqual(snapshot.coverage.search.translationIds, [
    "brenton",
    "charles",
    "drb",
    "kjv",
    "web",
  ]);
  assert.equal(snapshot.coverage.originalLanguages.hasGreekSeptuagint, true);
  assert.equal(snapshot.coverage.originalLanguages.hasTextualApparatus, false);
});
