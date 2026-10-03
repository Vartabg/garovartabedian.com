import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  parseArgs,
  parseChapterSelection,
  prepareTarget,
} from "../scripts/scriptures/build-guides-v2.mjs";
import {
  isCanonicalIsoDate,
  isCanonicalIsoTimestamp,
  parseVerseRange,
  validateGuideV2,
} from "../scripts/scriptures/guide-validation.mjs";
import type { Canons, ChapterGuide } from "../src/lib/scriptures/types";

const readJson = <T,>(file: string): T =>
  JSON.parse(readFileSync(file, "utf8")) as T;

const canons = readJson<Canons>("public/scriptures/canons.json");

test("guide-v2 chapter selection is explicit, ranged, deduplicated, and sorted", () => {
  assert.deepEqual(parseChapterSelection("3,1-2,2,7-8"), [1, 2, 3, 7, 8]);
  assert.throws(() => parseChapterSelection(""), /cannot be empty/);
  assert.throws(() => parseChapterSelection("all"), /Invalid chapter selection/);
  assert.throws(() => parseChapterSelection("8-3"), /Invalid chapter range/);
});

test("guide-v2 flags parse for template-only regeneration with per-chapter resilience", () => {
  const parsed = parseArgs([
    "node",
    "scripts/scriptures/build-guides-v2.mjs",
    "--books",
    "PSA",
    "--only-template",
    "--continue-on-reject",
    "--retries",
    "2",
    "--reject-dir",
    "/tmp/x",
  ]);
  assert.equal(parsed.onlyTemplate, true);
  assert.equal(parsed.continueOnReject, true);
  assert.equal(parsed.retries, 2);
  assert.equal(parsed.rejectDir, "/tmp/x");

  assert.throws(
    () =>
      parseArgs([
        "node",
        "scripts/scriptures/build-guides-v2.mjs",
        "--books",
        "PSA",
        "--retries",
        "nope",
      ]),
    /--retries must be a non-negative integer/,
  );
});

test("a prepared prompt binds the rubric to the complete local grounding bundle", () => {
  const first = prepareTarget("LEV", 1);
  const second = prepareTarget("LEV", 1);

  assert.equal(first.promptHash, second.promptHash);
  assert.match(first.promptHash, /^[a-f0-9]{64}$/);
  assert.match(first.prompt, /Chapter guide v2 rubric/);
  assert.match(first.prompt, /"book": "LEV"/);
  assert.match(first.prompt, /"hostedTranslation"/);
  assert.match(first.prompt, /"bookBriefing"/);
  assert.match(first.prompt, /"treasuryOfScriptureKnowledge"/);
  assert.match(first.prompt, /"naveTopicalMatches"/);
  assert.match(first.prompt, /"markExemplar"/);
});

test("guide-v2 fails closed without credentials and leaves the published guide untouched", () => {
  const guidePath = "public/scriptures/guides/LEV/1.json";
  const before = readFileSync(guidePath, "utf8");
  const {
    OPENAI_API_KEY: _key,
    OPENAI_MODEL: _model,
    GEMINI_API_KEY: _geminiKey,
    GOOGLE_API_KEY: _googleKey,
    GEMINI_MODEL: _geminiModel,
    GUIDE_PROVIDER: _provider,
    ...cleanEnv
  } = process.env;
  void _key;
  void _model;
  void _geminiKey;
  void _googleKey;
  void _geminiModel;
  void _provider;

  // Every provider must fail the same way: no key, no draft, no write. The
  // error has to name the variable the operator actually has to set, since a
  // generic message sends someone hunting for the wrong credential.
  const cases = [
    { args: [] as string[], expected: /OPENAI_API_KEY is required for provider "openai"/ },
    {
      args: ["--provider", "gemini"],
      expected: /GEMINI_API_KEY or GOOGLE_API_KEY is required for provider "gemini"/,
    },
  ];

  for (const { args, expected } of cases) {
    const result = spawnSync(
      process.execPath,
      [
        "scripts/scriptures/build-guides-v2.mjs",
        "--books",
        "LEV",
        "--chapters",
        "1",
        "--force",
        ...args,
      ],
      { cwd: process.cwd(), env: cleanEnv, encoding: "utf8" },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
    assert.match(result.stderr, /v2 never writes placeholders/);
    assert.equal(readFileSync(guidePath, "utf8"), before);
  }

  // A key without a model is still fail-closed: an unstamped draft would be
  // a guide nobody could trace back to what wrote it.
  const noModel = spawnSync(
    process.execPath,
    [
      "scripts/scriptures/build-guides-v2.mjs",
      "--books",
      "LEV",
      "--chapters",
      "1",
      "--force",
      "--provider",
      "gemini",
    ],
    {
      cwd: process.cwd(),
      env: { ...cleanEnv, GEMINI_API_KEY: "not-a-real-key" },
      encoding: "utf8",
    },
  );
  assert.notEqual(noModel.status, 0);
  assert.match(noModel.stderr, /GEMINI_MODEL \(or --model\) is required/);
  assert.equal(readFileSync(guidePath, "utf8"), before);
});

test("prompt-bundle preparation cannot overwrite the published guide tree", () => {
  const guidePath = "public/scriptures/guides/LEV/1.json";
  const before = readFileSync(guidePath, "utf8");
  const directResult = spawnSync(
    process.execPath,
    [
      "scripts/scriptures/build-guides-v2.mjs",
      "--books",
      "LEV",
      "--chapters",
      "1",
      "--prepare-dir",
      "public/scriptures/guides",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const temporary = mkdtempSync(path.join(tmpdir(), "guide-v2-prepare-"));
  const linkedGuideRoot = path.join(temporary, "published-guides");
  symlinkSync(path.resolve("public/scriptures/guides"), linkedGuideRoot, "dir");
  const linkedResult = spawnSync(
    process.execPath,
    [
      "scripts/scriptures/build-guides-v2.mjs",
      "--books",
      "LEV",
      "--chapters",
      "1",
      "--prepare-dir",
      linkedGuideRoot,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  rmSync(temporary, { recursive: true, force: true });

  assert.notEqual(directResult.status, 0);
  assert.match(directResult.stderr, /must not be the published guide directory/);
  assert.notEqual(linkedResult.status, 0);
  assert.match(linkedResult.stderr, /must not be the published guide directory/);
  assert.equal(readFileSync(guidePath, "utf8"), before);
});

test("guide-v2 preflights existing targets before making a model call", () => {
  const guidePath = "public/scriptures/guides/LEV/1.json";
  const before = readFileSync(guidePath, "utf8");
  const result = spawnSync(
    process.execPath,
    ["scripts/scriptures/build-guides-v2.mjs", "--books", "LEV", "--chapters", "1"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        OPENAI_API_KEY: "not-a-real-key",
        OPENAI_MODEL: "not-a-real-model",
      },
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /LEV\/1 already exist/);
  assert.equal(readFileSync(guidePath, "utf8"), before);
});

test("review-bound provenance requires exact grounding-bundle attestation", () => {
  const guidePath = "public/scriptures/guides/LEV/1.json";
  const before = readFileSync(guidePath, "utf8");
  const result = spawnSync(
    process.execPath,
    [
      "scripts/scriptures/stamp-guide-review.mjs",
      "--status",
      "agent-reviewed",
      "--reviewer",
      "test reviewer",
      "--books",
      "LEV",
      "--chapters",
      "1",
      "--rubric",
      "guide-v2",
      "--bind-hand-authored",
      "--generated-at",
      "2026-08-28T12:00:00.000Z",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires --grounding-bundle-reviewed/);
  assert.equal(readFileSync(guidePath, "utf8"), before);
});

test("review stamping rejects ambiguous targets and impossible calendar dates", () => {
  const guidePath = "public/scriptures/guides/LEV/1.json";
  const before = readFileSync(guidePath, "utf8");
  const common = [
    "scripts/scriptures/stamp-guide-review.mjs",
    "--status",
    "agent-reviewed",
    "--reviewer",
    "test reviewer",
  ];
  const malformedTarget = spawnSync(
    process.execPath,
    [...common, "--list", "LEV/1/EXTRA"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const impossibleDate = spawnSync(
    process.execPath,
    [...common, "--list", "LEV/1", "--reviewed-at", "2026-99-99"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(isCanonicalIsoDate("2026-02-30"), false);
  assert.equal(isCanonicalIsoDate("2026-08-28"), true);
  assert.notEqual(malformedTarget.status, 0);
  assert.match(malformedTarget.stderr, /Bad --list target/);
  assert.notEqual(impossibleDate.status, 0);
  assert.match(impossibleDate.stderr, /real ISO calendar date/);
  assert.equal(readFileSync(guidePath, "utf8"), before);
});

test("generation timestamps must be real canonical ISO instants at every boundary", () => {
  const guidePath = "public/scriptures/guides/LEV/1.json";
  const before = readFileSync(guidePath, "utf8");
  const impossible = "2026-02-30T12:00:00.000Z";
  const { OPENAI_API_KEY: _key, OPENAI_MODEL: _model, ...cleanEnv } = process.env;
  void _key;
  void _model;

  assert.equal(isCanonicalIsoTimestamp(impossible), false);
  assert.equal(isCanonicalIsoTimestamp("2026-08-28T07:00:00-05:00"), false);
  assert.equal(isCanonicalIsoTimestamp("2026-08-28T12:00:00.000Z"), true);

  const buildResult = spawnSync(
    process.execPath,
    [
      "scripts/scriptures/build-guides-v2.mjs",
      "--books",
      "LEV",
      "--chapters",
      "1",
      "--generated-at",
      impossible,
    ],
    { cwd: process.cwd(), env: cleanEnv, encoding: "utf8" },
  );
  const stampResult = spawnSync(
    process.execPath,
    [
      "scripts/scriptures/stamp-guide-review.mjs",
      "--status",
      "agent-reviewed",
      "--reviewer",
      "test reviewer",
      "--list",
      "LEV/1",
      "--rubric",
      "guide-v2",
      "--bind-hand-authored",
      "--generated-at",
      impossible,
      "--grounding-bundle-reviewed",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(buildResult.status, 0);
  assert.match(buildResult.stderr, /real canonical ISO timestamp/);
  assert.notEqual(stampResult.status, 0);
  assert.match(stampResult.stderr, /real canonical ISO timestamp/);

  const prepared = prepareTarget("LEV", 1);
  const guide = readJson<ChapterGuide>(guidePath);
  guide.generation = {
    attributedModel: "test/model",
    promptHash: prepared.promptHash,
    generatedAt: impossible,
    rubricVersion: "guide-v2",
    method: "review-bound",
  };
  const validation = validateGuideV2({
    guide,
    root: process.cwd(),
    canons,
    book: "LEV",
    chapter: 1,
    expectedPromptHash: prepared.promptHash,
  });
  assert.ok(
    validation.failures.some((failure: string) =>
      /malformed guide-v2 generation provenance/.test(failure),
    ),
  );
  assert.equal(readFileSync(guidePath, "utf8"), before);
});

test("strict validation binds provenance to current grounding and quotations to WEB", () => {
  const prepared = prepareTarget("LEV", 1);
  const guide = readJson<ChapterGuide>("public/scriptures/guides/LEV/1.json");
  guide.generation = {
    attributedModel: "test/model",
    promptHash: prepared.promptHash,
    generatedAt: "2026-08-28T12:00:00.000Z",
    rubricVersion: "guide-v2",
    method: "review-bound",
  };

  const baseline = validateGuideV2({
    guide,
    root: process.cwd(),
    canons,
    book: "LEV",
    chapter: 1,
    expectedPromptHash: prepared.promptHash,
  });
  assert.deepEqual(baseline.failures, []);

  const stale = structuredClone(guide);
  assert.ok(stale.generation);
  stale.generation.promptHash = "0".repeat(64);
  const staleValidation = validateGuideV2({
    guide: stale,
    root: process.cwd(),
    canons,
    book: "LEV",
    chapter: 1,
    expectedPromptHash: prepared.promptHash,
  });
  assert.ok(
    staleValidation.failures.some((failure: string) =>
      /does not match current grounding/.test(failure),
    ),
  );

  const kjv = readJson<{ chapters: string[][] }>(
    "public/scriptures/text/kjv/LEV.json",
  );
  const wrongTranslation = structuredClone(guide);
  for (const keyVerse of wrongTranslation.keyVerses) {
    const range = parseVerseRange(keyVerse.ref);
    assert.ok(range);
    keyVerse.text = kjv.chapters[range.chapter - 1]
      .slice(range.start - 1, range.end)
      .join(" ");
  }
  const translationValidation = validateGuideV2({
    guide: wrongTranslation,
    root: process.cwd(),
    canons,
    book: "LEV",
    chapter: 1,
    expectedPromptHash: prepared.promptHash,
  });
  assert.ok(
    translationValidation.failures.some((failure: string) =>
      /does not quote the bundled WEB chapter/.test(failure),
    ),
  );
});

test("the strict validator rejects template residue and uncited questions", () => {
  const prepared = prepareTarget("LEV", 1);
  const guide = readJson<ChapterGuide>("public/scriptures/guides/LEV/1.json");
  guide.generation = {
    attributedModel: "test/model",
    promptHash: prepared.promptHash,
    generatedAt: "2026-08-28T12:00:00.000Z",
    rubricVersion: "guide-v2",
    method: "review-bound",
  };
  const baseline = validateGuideV2({
    guide,
    root: process.cwd(),
    canons,
    book: "LEV",
    chapter: 1,
    expectedPromptHash: prepared.promptHash,
  });
  assert.deepEqual(baseline.failures, []);

  const broken = structuredClone(guide);
  broken.summary = "Leviticus 1 (17 verses) continues the story of Israel.";
  broken.questions[0].verseRefs = [];
  const validation = validateGuideV2({
    guide: broken,
    root: process.cwd(),
    canons,
    book: "LEV",
    chapter: 1,
    expectedPromptHash: prepared.promptHash,
  });
  assert.ok(validation.failures.some((failure: string) => /template signature/.test(failure)));
  assert.ok(validation.failures.some((failure: string) => /has no verseRefs/.test(failure)));
});

test("Leviticus risk chapters preserve the batch's interpretive guardrails", () => {
  const guide = (chapter: number) =>
    JSON.stringify(
      readJson<ChapterGuide>(`public/scriptures/guides/LEV/${chapter}.json`),
    );

  assert.match(guide(11), /no health rationale|no medical or scientific mechanism/i);
  assert.doesNotMatch(guide(11), /public-health code|dietary laws prevented disease/i);
  assert.match(guide(12), /not.*moral sin|no moral offense/i);
  assert.match(guide(12), /gives no reason|does not explain the rationale/i);
  assert.match(guide(13), /Hansen.?s disease/i);
  assert.match(guide(13), /should not be assumed|not a modern account/i);
  assert.match(guide(16), /animal remains alive when it is released/i);
  assert.match(guide(16), /Azazel.*(dispute|uncertain)|dispute.*Azazel/i);
  assert.match(guide(18), /does not define modern categories of sexual orientation/i);
  assert.match(guide(18), /gives no procedure for carrying out the cutting-off sanction/i);
  assert.match(guide(19), /enslaved woman/i);
  assert.match(guide(19), /without describing her consent, the form of punishment, or any grant of freedom/i);
  assert.match(guide(20), /assigns death to both participants/i);
  assert.match(guide(20), /severe rule about an act in ancient Israelite law.*modern sexual identity or civil marriage/i);
  assert.match(guide(20), /do not.*supply an investigation of consent, coercion/i);
  assert.match(guide(21), /without assigning personal fault/i);
  assert.match(guide(21), /food permission.*alongside that restriction/i);
  assert.match(guide(25), /inherited.*held permanently/i);
  assert.match(guide(25), /release for Israelite debt servants does not extend to these foreign slaves/i);
  assert.match(guide(26), /diagnose an individual sufferer.*would move beyond the audience and claims/i);
  assert.match(guide(27), /monetary obligation.*silver payments/i);
  assert.match(guide(27), /names no particular case or procedure/i);
  assert.match(guide(27), /cannot be treated as saying every vow.*calls for human sacrifice/i);
});
