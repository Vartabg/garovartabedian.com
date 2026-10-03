import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync } from "node:fs";
import path from "node:path";
import canons from "../public/scriptures/canons.json";
import snapshot from "../public/meta/corpus-health.json";
import { collectCorpusHealth } from "../scripts/site/build-corpus-health.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

test("the public corpus-health snapshot matches the repository", () => {
  assert.deepEqual(snapshot, collectCorpusHealth());
});

test("corpus health keeps automated validation separate from editorial review", () => {
  // Guide coverage may be incomplete only by whole unguided books (e.g. the
  // newly hosted 1 Enoch, pending its guide batch) — never by guides
  // disappearing from books that are in the guide program.
  const coverage = snapshot.validation.guides.coverage;
  assert.ok(
    coverage.status === "complete" || coverage.status === "incomplete",
    `invalid coverage status ${coverage.status}`,
  );
  const guidedBooks = new Set(
    readdirSync(path.join(ROOT, "public/scriptures/guides"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  );
  const unguidedChapters = Object.entries(canons.books)
    .filter(([bookId]) => !guidedBooks.has(bookId))
    .reduce((sum, [, meta]) => sum + meta.chapters, 0);
  assert.equal(
    coverage.chapterSlots - coverage.guides,
    unguidedChapters,
    "coverage gap must equal exactly the chapters of unguided books",
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
