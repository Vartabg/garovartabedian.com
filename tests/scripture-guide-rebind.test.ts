import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareTarget } from "../scripts/scriptures/build-guides-v2.mjs";
import {
  REBIND_ALLOWED_FIELD,
  validateGuideV2,
  validateRebindRecord,
} from "../scripts/scriptures/guide-validation.mjs";
import {
  changedGroundingFields,
  rebindGuide,
} from "../scripts/scriptures/rebind-guide-grounding.mjs";
import type { BookBriefing, Canons, ChapterGuide } from "../src/lib/scriptures/types";

const readJson = <T,>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const canons = readJson<Canons>("public/scriptures/canons.json");
const BOOK = "ENO";
const CHAPTER = 1;
const GUIDE_PATH = `public/scriptures/guides/${BOOK}/${CHAPTER}.json`;
const BRIEFING_PATH = `public/scriptures/books/${BOOK}.json`;
const AT = "2026-09-01T12:00:00.000Z";
const BY = "test reviewer";
const REASON =
  "A cited source URL returned 404; replaced with the verified catalogue page for the same work.";

/**
 * The published guide must be bound to the published briefing for these tests
 * to mean anything. `bound` is the guide re-pointed at a briefing that differs
 * only in citation metadata, so that "previous" == the published bundle and
 * "current" == the corrected one, without touching the disk.
 */
const publishedGuide = readJson<ChapterGuide>(GUIDE_PATH);
const publishedBriefing = readJson<BookBriefing>(BRIEFING_PATH);
const publishedHash = prepareTarget(BOOK, CHAPTER).promptHash;

/** A briefing that differs from the published one only in one source's url. */
const briefingWithFixedUrl = (): BookBriefing => {
  const next = clone(publishedBriefing);
  next.sources![0].url = "https://example.org/corrected-catalogue-page";
  return next;
};

/**
 * Bind a guide to `briefing` as its previous grounding, so a rebind from that
 * briefing to the published one exercises exactly the allowed path.
 */
const guideBoundTo = (briefing: BookBriefing): ChapterGuide => {
  const guide = clone(publishedGuide);
  guide.generation = {
    ...guide.generation!,
    promptHash: prepareTarget(BOOK, CHAPTER, { bookBriefing: briefing }).promptHash,
  };
  return guide;
};

test("the published Enoch guide is bound to the published briefing", () => {
  assert.equal(publishedGuide.generation?.promptHash, publishedHash);
});

test("only citation url/label paths are re-bindable", () => {
  assert.ok(REBIND_ALLOWED_FIELD.test("bookBriefing.sources.0.url"));
  assert.ok(REBIND_ALLOWED_FIELD.test("bookBriefing.sources.12.label"));
  assert.ok(!REBIND_ALLOWED_FIELD.test("bookBriefing.sources.0.says"));
  assert.ok(!REBIND_ALLOWED_FIELD.test("bookBriefing.oneLine"));
  assert.ok(!REBIND_ALLOWED_FIELD.test("hostedTranslation.verses.0.text"));
  assert.ok(!REBIND_ALLOWED_FIELD.test("treasuryOfScriptureKnowledge.1:1.0"));
});

test("the grounding diff names exactly the fields that moved", () => {
  const before = prepareTarget(BOOK, CHAPTER, { bookBriefing: briefingWithFixedUrl() }).grounding;
  const after = prepareTarget(BOOK, CHAPTER).grounding;
  assert.deepEqual(changedGroundingFields(before, after), ["bookBriefing.sources.0.url"]);
  assert.deepEqual(changedGroundingFields(after, after), []);
});

test("a citation-url correction re-binds and leaves an auditable record", () => {
  const previous = briefingWithFixedUrl();
  const guide = guideBoundTo(previous);
  const previousHash = guide.generation!.promptHash;

  const result = rebindGuide({
    guide,
    book: BOOK,
    chapter: CHAPTER,
    previousBriefing: previous,
    by: BY,
    reason: REASON,
    at: AT,
    canons,
  });

  assert.ok(result.ok, result.ok ? "" : result.reason);
  const rebound = result.guide as ChapterGuide;
  assert.equal(rebound.generation?.promptHash, publishedHash);
  // Records accumulate: a guide that has been re-bound before keeps that
  // history, and this move is appended after it.
  const priorRecords = publishedGuide.generation?.rebound ?? [];
  assert.equal(rebound.generation?.rebound?.length, priorRecords.length + 1);
  assert.deepEqual(rebound.generation?.rebound?.slice(0, priorRecords.length), priorRecords);
  assert.deepEqual(rebound.generation?.rebound?.at(-1), {
    at: AT,
    by: BY,
    reason: REASON,
    previousPromptHash: previousHash,
    changedFields: ["bookBriefing.sources.0.url"],
  });
  // Nothing about authorship or review is touched.
  assert.equal(rebound.generation?.attributedModel, publishedGuide.generation?.attributedModel);
  assert.equal(rebound.generation?.model, publishedGuide.generation?.model);
  assert.equal(rebound.generation?.generatedAt, publishedGuide.generation?.generatedAt);
  assert.equal(rebound.reviewStatus, publishedGuide.reviewStatus);
  assert.equal(rebound.reviewer, publishedGuide.reviewer);
  assert.equal(rebound.reviewedAt, publishedGuide.reviewedAt);
  // The input was not mutated.
  assert.equal(guide.generation?.promptHash, previousHash);
  assert.deepEqual(guide.generation?.rebound, publishedGuide.generation?.rebound);
  // And the result passes the strict validator against the current grounding.
  const validation = validateGuideV2({
    guide: rebound,
    root: process.cwd(),
    canons,
    book: BOOK,
    chapter: CHAPTER,
    expectedPromptHash: publishedHash,
  });
  assert.deepEqual(validation.failures, []);
});

test("a change to what a source says is substance and refuses", () => {
  const previous = clone(publishedBriefing);
  previous.sources![0].says = `${previous.sources![0].says} (an earlier, different claim)`;
  const result = rebindGuide({
    guide: guideBoundTo(previous),
    book: BOOK,
    chapter: CHAPTER,
    previousBriefing: previous,
    by: BY,
    reason: REASON,
    at: AT,
    canons,
  });
  assert.ok(!result.ok);
  assert.match(result.reason, /outside citation metadata/);
  assert.match(result.reason, /bookBriefing\.sources\.0\.says/);
  assert.match(result.reason, /needs review, not a re-bind/);
});

test("a url fix bundled with a substantive change still refuses", () => {
  const previous = briefingWithFixedUrl();
  previous.oneLine = `${previous.oneLine} Earlier wording.`;
  const result = rebindGuide({
    guide: guideBoundTo(previous),
    book: BOOK,
    chapter: CHAPTER,
    previousBriefing: previous,
    by: BY,
    reason: REASON,
    at: AT,
    canons,
  });
  assert.ok(!result.ok);
  assert.match(result.reason, /bookBriefing\.oneLine/);
  assert.doesNotMatch(result.reason, /sources\.0\.url/);
});

test("a guide whose stored hash cannot be reproduced refuses", () => {
  const previous = briefingWithFixedUrl();
  const guide = guideBoundTo(previous);
  guide.generation!.promptHash = "0".repeat(64);
  const result = rebindGuide({
    guide,
    book: BOOK,
    chapter: CHAPTER,
    previousBriefing: previous,
    by: BY,
    reason: REASON,
    at: AT,
    canons,
  });
  assert.ok(!result.ok);
  assert.match(result.reason, /cannot prove what this guide was bound to/);
});

test("an unchanged grounding has nothing to re-bind", () => {
  const result = rebindGuide({
    guide: publishedGuide,
    book: BOOK,
    chapter: CHAPTER,
    previousBriefing: publishedBriefing,
    by: BY,
    reason: REASON,
    at: AT,
    canons,
  });
  assert.ok(!result.ok);
  assert.match(result.reason, /unchanged/);
});

test("the validator rejects a re-bind record that does not explain itself", () => {
  const promptHash = publishedHash;
  const good = {
    at: AT,
    by: BY,
    reason: REASON,
    previousPromptHash: "a".repeat(64),
    changedFields: ["bookBriefing.sources.0.url"],
  };
  const label = `${BOOK}/${CHAPTER}`;

  assert.deepEqual(validateRebindRecord({ promptHash, rebound: [good] }, label), []);
  assert.match(
    validateRebindRecord({ promptHash, rebound: [] }, label).join("\n"),
    /non-empty array/,
  );
  assert.match(
    validateRebindRecord({ promptHash, rebound: [{ ...good, at: "2026-09-01" }] }, label).join("\n"),
    /canonical ISO timestamp/,
  );
  assert.match(
    validateRebindRecord({ promptHash, rebound: [{ ...good, by: "" }] }, label).join("\n"),
    /must name who/,
  );
  assert.match(
    validateRebindRecord({ promptHash, rebound: [{ ...good, reason: "fixed link" }] }, label).join("\n"),
    /at least 40 characters/,
  );
  assert.match(
    validateRebindRecord({ promptHash, rebound: [{ ...good, previousPromptHash: promptHash }] }, label).join("\n"),
    /must differ from the current prompt hash/,
  );
  assert.match(
    validateRebindRecord(
      { promptHash, rebound: [{ ...good, changedFields: ["bookBriefing.sources.0.says"] }] },
      label,
    ).join("\n"),
    /may only name citation url\/label fields; found bookBriefing\.sources\.0\.says/,
  );
  assert.match(
    validateRebindRecord({ promptHash, rebound: [{ ...good, changedFields: [] }] }, label).join("\n"),
    /must list the grounding fields/,
  );
  assert.match(
    validateRebindRecord({ promptHash, rebound: [good, { ...good }] }, label).join("\n"),
    /repeats an earlier entry/,
  );

  // The strict guide validator carries the same verdict.
  const guide = clone(publishedGuide);
  guide.generation = {
    ...guide.generation!,
    rebound: [{ ...good, changedFields: ["bookBriefing.oneLine"] }],
  };
  const validation = validateGuideV2({
    guide,
    root: process.cwd(),
    canons,
    book: BOOK,
    chapter: CHAPTER,
    expectedPromptHash: publishedHash,
  });
  assert.match(validation.failures.join("\n"), /bookBriefing\.oneLine/);
});

test("the CLI is all-or-nothing and writes nothing when it refuses", () => {
  const before = readFileSync(GUIDE_PATH, "utf8");
  const temporary = mkdtempSync(path.join(tmpdir(), "guide-rebind-"));
  const unchanged = path.join(temporary, "unchanged.json");
  const substantive = path.join(temporary, "substantive.json");
  writeFileSync(unchanged, JSON.stringify(publishedBriefing));
  const changed = clone(publishedBriefing);
  changed.sources![0].says = `${changed.sources![0].says} (earlier claim)`;
  writeFileSync(substantive, JSON.stringify(changed));

  const run = (...extra: string[]) =>
    spawnSync(
      process.execPath,
      [
        "scripts/scriptures/rebind-guide-grounding.mjs",
        "--list",
        `${BOOK}/${CHAPTER}`,
        "--by",
        BY,
        "--reason",
        REASON,
        ...extra,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

  try {
    const same = run("--previous-briefing-file", unchanged);
    assert.notEqual(same.status, 0);
    assert.match(same.stderr, /unchanged/);
    assert.match(same.stderr, /nothing was written/);

    // The published guide is bound to the published briefing, so a "previous"
    // briefing that differs in substance cannot be what it was bound to. The
    // proof-of-binding check fires before the field diff, and that ordering
    // matters: a guide we cannot place is never inspected for leniency.
    const substance = run("--previous-briefing-file", substantive);
    assert.notEqual(substance.status, 0);
    assert.match(substance.stderr, /cannot prove what this guide was bound to/);
    assert.match(substance.stderr, /nothing was written/);

    const noReason = spawnSync(
      process.execPath,
      ["scripts/scriptures/rebind-guide-grounding.mjs", "--list", `${BOOK}/${CHAPTER}`, "--by", BY, "--reason", "short"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    assert.notEqual(noReason.status, 0);
    assert.match(noReason.stderr, /at least 40 characters/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
  assert.equal(readFileSync(GUIDE_PATH, "utf8"), before);
});
