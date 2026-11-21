import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildGrounding, buildGuidePrompt, prepareTarget } from "../scripts/scriptures/build-guides-v2.mjs";
import {
  GUIDE_RUBRICS,
  GUIDE_RUBRIC_VERSION,
  isSupportedRubric,
  validateGuideV2,
} from "../scripts/scriptures/guide-validation.mjs";
import type { Canons, ChapterGuide } from "../src/lib/scriptures/types";

// Garo, 2026-11-21: "C, widen rubric". The hand-written Mark guides are the
// standard, and guide-v2 rejected them, so a second rubric has wider limits.
// The guides already locked to guide-v2 must not move.

const readJson = <T,>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const canons = readJson<Canons>("public/scriptures/canons.json");
const GUIDES = "public/scriptures/guides";
const romans8 = () => readJson<ChapterGuide>(`${GUIDES}/ROM/8.json`);
const web = readJson<{ chapters: string[][] }>("public/scriptures/text/web/ROM.json").chapters[7];

/** Failures for a Romans 8 variant measured under one rubric's limits. */
const measure = (guide: ChapterGuide, rubricVersion: string) =>
  validateGuideV2({ guide, root: process.cwd(), canons, book: "ROM", chapter: 8, rubricVersion }).failures;
const v2 = (guide: ChapterGuide) => measure(guide, "guide-v2");
const v3 = (guide: ChapterGuide) => measure(guide, "guide-v3");

test("guide-v3 only widens guide-v2", () => {
  const a = GUIDE_RUBRICS["guide-v2"];
  const b = GUIDE_RUBRICS["guide-v3"];
  assert.equal(GUIDE_RUBRIC_VERSION, "guide-v2", "drafting stays on guide-v2");
  assert.deepEqual(Object.keys(GUIDE_RUBRICS), ["guide-v2", "guide-v3"]);
  assert.ok(b.questions[0] <= a.questions[0] && b.questions[1] >= a.questions[1]);
  assert.ok(b.keyVerses[0] <= a.keyVerses[0] && b.keyVerses[1] >= a.keyVerses[1]);
  assert.ok(b.outlineMax >= a.outlineMax);
  assert.ok(a.requireWord && !b.requireWord);
  assert.ok(!a.glossaryVerseTie && b.glossaryVerseTie);
  assert.ok(isSupportedRubric("guide-v3"));
  assert.ok(!isSupportedRubric("guide-v4") && !isSupportedRubric(undefined) && !isSupportedRubric("toString"));
});

test("every guide locked to guide-v2 also meets guide-v3's limits", () => {
  let checked = 0;
  for (const book of readdirSync(GUIDES)) {
    for (const file of readdirSync(path.join(GUIDES, book))) {
      const guide = readJson<ChapterGuide>(path.join(GUIDES, book, file));
      if (guide.generation?.rubricVersion !== "guide-v2") continue;
      const { failures } = validateGuideV2({
        guide,
        root: process.cwd(),
        canons,
        book,
        chapter: Number.parseInt(file, 10),
        rubricVersion: "guide-v3",
      });
      assert.deepEqual(failures, [], `${book}/${file}`);
      checked += 1;
    }
  }
  assert.ok(checked >= 560, `only ${checked} guide-v2 guides were found`);
});

test("guide-v3 accepts the shapes of the Mark guides and stops one past each limit", () => {
  assert.deepEqual(v2(romans8()), []);
  assert.deepEqual(v3(romans8()), []);

  // Questions: guide-v2 stops at 9, guide-v3 at 14 (Mark 15 has 14).
  const withQuestions = (count: number) => {
    const guide = romans8();
    const [first] = guide.questions;
    while (guide.questions.length < count) guide.questions.push({ ...first, id: `extra-${guide.questions.length}` });
    return guide;
  };
  assert.match(v2(withQuestions(10)).join("\n"), /questions must contain 7-9 grounded entries/);
  assert.deepEqual(v3(withQuestions(14)), []);
  assert.match(v3(withQuestions(15)).join("\n"), /questions must contain 7-14 grounded entries/);

  // Outline: guide-v2 stops at 7 parts, guide-v3 at 9 (Mark 14 has 9). One verse per part until the count is reached.
  const withOutline = (count: number) => {
    const guide = romans8();
    const total = web.length;
    guide.outline = Array.from({ length: count }, (_, index) => ({
      heading: `Part ${index + 1}`,
      verses: index === count - 1 ? `${index + 1}-${total}` : `${index + 1}`,
      note: "A movement of the chapter, one verse at a time until the last",
    }));
    return guide;
  };
  assert.match(v2(withOutline(8)).join("\n"), /outline must contain 3-7 chapter-specific movements/);
  assert.deepEqual(v3(withOutline(9)), []);
  assert.match(v3(withOutline(10)).join("\n"), /outline must contain 3-9 chapter-specific movements/);

  // Key verses: guide-v2 stops at 4, guide-v3 at 5 (Mark 8 has 5). Each added one quotes the hosted text.
  const withKeyVerses = (count: number) => {
    const guide = romans8();
    const used = new Set(guide.keyVerses.map((keyVerse) => keyVerse.ref));
    for (let verse = 1; guide.keyVerses.length < count; verse += 1) {
      if (used.has(`8:${verse}`)) continue;
      guide.keyVerses.push({ ref: `8:${verse}`, text: web[verse - 1], why: "A further verse the chapter turns on, added for the limit test." });
    }
    return guide;
  };
  assert.match(v2(withKeyVerses(5)).join("\n"), /keyVerses must contain 2-4 quotations/);
  assert.deepEqual(v3(withKeyVerses(5)), []);
  assert.match(v3(withKeyVerses(6)).join("\n"), /keyVerses must contain 2-5 quotations/);

  // A word question: guide-v2 requires one, guide-v3 does not. A hard-verse question stays required in both.
  const without = (category: string) => {
    const guide = romans8();
    guide.questions = guide.questions.map((question) =>
      question.category === category ? { ...question, category: "context" } : question,
    ) as ChapterGuide["questions"];
    return guide;
  };
  assert.match(v2(without("word")).join("\n"), /needs a chapter-specific word question/);
  assert.deepEqual(v3(without("word")), []);
  assert.match(v3(without("hard_verse")).join("\n"), /needs an honest hard-verse question/);
});

test("a guide-v3 glossary entry may be tied to verses; the tie must resolve in the chapter", () => {
  const withEntry = (verses?: unknown) => {
    const guide = romans8();
    guide.glossary = [
      ...(guide.glossary ?? []),
      { term: "Zzyzx", def: "A term the chapter shows without spelling it out anywhere.", ...(verses === undefined ? {} : { verses }) } as never,
    ];
    return guide;
  };
  const inactive = /glossary term “Zzyzx” is not active in the hosted chapter/;
  const unresolved = /glossary term “Zzyzx” has an unresolved or off-chapter verse tie/;

  assert.match(v3(withEntry()).join("\n"), inactive);
  assert.deepEqual(v3(withEntry(["8:1"])), []);
  assert.deepEqual(v3(withEntry(["8:1-4", "8:39"])), []);
  for (const bad of [[], ["9:1"], ["8:999"], ["first"], "8:1"]) {
    assert.match(v3(withEntry(bad)).join("\n"), unresolved, JSON.stringify(bad));
  }
  // guide-v2 does not read `verses` at all: the entry fails exactly as it did before.
  assert.match(v2(withEntry(["8:1"])).join("\n"), inactive);
  assert.doesNotMatch(v2(withEntry(["9:1"])).join("\n"), unresolved);
});

test("the prompt is unchanged unless guide-v3 is asked for", () => {
  const grounding = buildGrounding("ROM", 8);
  const drafting = buildGuidePrompt(grounding);
  assert.equal(buildGuidePrompt(grounding, { rubricVersion: "guide-v2" }), drafting);
  assert.match(drafting, /^Rubric version: guide-v2$/m);
  assert.equal(prepareTarget("ROM", 8).promptHash, romans8().generation?.promptHash, "Romans 8 is still locked");

  const wider = buildGuidePrompt(grounding, { rubricVersion: "guide-v3" });
  assert.match(wider, /^Rubric version: guide-v3$/m);
  assert.match(wider, /seven to fourteen questions/);
  assert.notEqual(prepareTarget("ROM", 8, { rubricVersion: "guide-v3" }).promptHash, prepareTarget("ROM", 8).promptHash);

  assert.throws(() => buildGuidePrompt(grounding, { rubricVersion: "guide-v9" }), /Unknown rubric "guide-v9"/);
  assert.throws(() => measure(romans8(), "guide-v9"), /Unknown rubric "guide-v9"/);
});

test("the exemplar inside every prompt is frozen", () => {
  const exemplar = readJson<Record<string, unknown>>("scripts/scriptures/mark-exemplar.json");
  // Reader-facing fields only: nothing a review stamp or a binding can change.
  assert.deepEqual(Object.keys(exemplar), [
    "book", "chapter", "bookName", "summary", "whyItMatters", "context", "outline", "keyVerses", "themes", "questions", "glossary",
  ]);
  assert.equal(
    createHash("sha256").update(JSON.stringify(exemplar, null, 2)).digest("hex"),
    "0b2cfefb6cd7a94c0b34a1e1a1d955822dbc76519f16e8cb3794affadcee0158",
    "scripts/scriptures/mark-exemplar.json is inside the prompt hash of every guide. Changing it breaks the lock on all of them, and no tool can re-bind that. Edit public/scriptures/guides/MRK/1.json instead; it no longer feeds the prompt.",
  );
  assert.deepEqual(buildGrounding("ROM", 8).markExemplar, exemplar);
});

test("the stamp tool will not restamp or move a guide under another rubric", () => {
  const run = (...args: string[]) =>
    spawnSync(process.execPath, ["scripts/scriptures/stamp-guide-review.mjs", "--status", "agent-reviewed", "--reviewer", "test reviewer", "--dry-run", ...args], {
      encoding: "utf8",
    });

  const moved = run("--list", "ROM/8", "--rubric", "guide-v3");
  assert.equal(moved.status, 1);
  assert.match(moved.stderr, /ROM\/8: locked to guide-v2; --rubric guide-v3 cannot restamp or move it/);
  assert.match(moved.stderr, /no guides were stamped/);

  const same = run("--list", "ROM/8", "--rubric", "guide-v2");
  assert.equal(same.status, 0, same.stderr);
  assert.match(same.stdout, /\[dry-run\] would stamp 1\/1 guides/);

  assert.match(run("--list", "ROM/8", "--rubric", "guide-v9").stderr, /--rubric must be one of guide-v2, guide-v3/);
  assert.match(
    run("--list", "ROM/8", "--bind-hand-authored", "--generated-at", "2026-08-04T15:51:37.000Z", "--grounding-bundle-reviewed").stderr,
    /--bind-hand-authored requires --rubric \(one of guide-v2, guide-v3\)/,
  );
});
