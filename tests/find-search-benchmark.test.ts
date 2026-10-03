import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  acceptedLabels,
  scoreObservation,
  validateCases,
  type Review,
  type SearchObservation,
} from "../scripts/research/search-benchmark";
import {
  resolvePublicSource,
  parsePublicSource,
} from "../src/lib/find-server/sources";

test("100 query fixtures keep paraphrase groups together and balance splits", () => {
  const cases = JSON.parse(
    fs.readFileSync("scripts/research/search-pilot/queries.json", "utf8"),
  ).cases;
  validateCases(cases);
  for (const family of new Set(cases.map((c: { family: string }) => c.family)))
    assert.equal(
      cases.filter((c: { family: string }) => c.family === family).length,
      20,
    );
  const broken = structuredClone(cases);
  broken[1].split = "held-out";
  assert.throws(() => validateCases(broken), /group crosses/);
});
const review = (reviewer: string, grade: 0 | 1 | 2 | 3): Review => ({
  queryId: "q",
  passageId: "p",
  sourceHash: "source",
  grade,
  reviewer,
  date: "2026-09-24T00:00:00Z",
  notes: "Fixture judgment",
});
test("one reviewer and unresolved disagreements do not establish labels", () => {
  assert.equal(acceptedLabels([review("a", 3)], []).size, 0);
  assert.equal(acceptedLabels([review("a", 3), review("b", 0)], []).size, 0);
  assert.equal(acceptedLabels([review("a", 3), review("b", 3)], []).size, 1);
  assert.equal(
    acceptedLabels(
      [review("a", 3), review("b", 0)],
      [{ ...review("editor", 2), reviewers: ["a", "b"] }],
    ).get("q:p")?.grade,
    2,
  );
  assert.throws(
    () => acceptedLabels([review("a", 3), review("a", 3)], []),
    /Duplicate/,
  );
});
test("unreviewed or stale candidates cannot count as correct; missing targets stay missing", () => {
  const row = {
    queryId: "q",
    variant: "baseline",
    family: "fixture",
    milliseconds: 1,
    run: { hits: [{ block: { id: "p", artifactHash: "source" } }], issues: [] },
  } as unknown as SearchObservation;
  const blank = scoreObservation(row, new Map());
  assert.equal(blank.precision5, null);
  assert.equal(blank.knownTargetCoverage, null);
  const labels = acceptedLabels([review("a", 3), review("b", 3)], []);
  const scored = scoreObservation(row, labels);
  assert.equal(scored.precision5, 0.2);
  assert.equal(scored.ndcg10, 1);
  assert.equal(scored.knownTargetCoverage, 1);
  labels.set("q:missing", { ...review("editor", 3), passageId: "missing" });
  assert.equal(scoreObservation(row, labels).knownTargetCoverage, 0.5);
  row.run.hits[0].block.artifactHash = "changed";
  assert.equal(scoreObservation(row, labels).reviewed, 0);
  assert.equal(scoreObservation(row, labels).precision5, null);
});
test("public source adapter keeps native DRB numbering and exact offsets", () => {
  const p = resolvePublicSource({
    kind: "scripture",
    translation: "drb",
    book: "PSA",
    chapter: 22,
    verse: 1,
  });
  assert.match(p.href, /PSA\/22\?t=drb#v1/);
  assert.equal(p.text.slice(p.start, p.end), p.text);
  assert.match(p.text, /Lord ruleth me/);
  assert.throws(
    () => parsePublicSource({ kind: "file", path: "/etc/passwd" }),
    /hosted/,
  );
  assert.throws(
    () =>
      parsePublicSource({
        kind: "early",
        id: "../../private",
        section: 0,
        paragraph: 0,
      }),
    /hosted/,
  );
  assert.throws(
    () =>
      resolvePublicSource({
        kind: "scripture",
        translation: "web",
        book: "JHN",
        chapter: 999,
        verse: 1,
      }),
    /unavailable/,
  );
});
