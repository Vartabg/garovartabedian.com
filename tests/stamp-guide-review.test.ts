import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts/scriptures/stamp-guide-review.mjs");
const GUIDE = path.join(ROOT, "public/scriptures/guides/JHN/3.json");
const baseArgs = [
  SCRIPT,
  "--status",
  "agent-reviewed",
  "--reviewer",
  "Regression editorial panel",
];

test("stamp-guide-review parses the chapter target and validates a dry run", () => {
  const before = readFileSync(GUIDE, "utf8");
  const result = spawnSync(
    process.execPath,
    [...baseArgs, "--list", "JHN/3", "--dry-run"],
    { cwd: ROOT, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /would stamp 1\/1 guides as agent-reviewed/);
  assert.doesNotMatch(result.stderr, /\bch is not defined\b/);
  assert.equal(readFileSync(GUIDE, "utf8"), before);
});

test("stamp-guide-review refuses the whole batch when one target is missing", () => {
  const before = readFileSync(GUIDE, "utf8");
  const result = spawnSync(
    process.execPath,
    [...baseArgs, "--list", "JHN/3,JHN/999"],
    { cwd: ROOT, encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JHN\/999: guide file is missing/);
  assert.match(result.stderr, /no guides were stamped/);
  assert.equal(readFileSync(GUIDE, "utf8"), before);
});

test("stamp-guide-review refuses contract-invalid question references", () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "stamp-guide-review-"));
  try {
    const guide = JSON.parse(readFileSync(GUIDE, "utf8"));
    guide.questions[0] = {
      ...guide.questions[0],
      verseRefs: ["3:999"],
      relatedVerses: [999],
    };
    const webText = JSON.parse(
      readFileSync(path.join(ROOT, "public/scriptures/text/web/JHN.json"), "utf8"),
    );
    const canons = {
      books: { JHN: { name: "John", trans: ["web"] } },
    };
    const fixtureGuide = path.join(
      fixtureRoot,
      "public/scriptures/guides/JHN/3.json",
    );
    const fixtureText = path.join(
      fixtureRoot,
      "public/scriptures/text/web/JHN.json",
    );
    mkdirSync(path.dirname(fixtureGuide), { recursive: true });
    mkdirSync(path.dirname(fixtureText), { recursive: true });
    writeFileSync(
      path.join(fixtureRoot, "public/scriptures/canons.json"),
      `${JSON.stringify(canons)}\n`,
    );
    writeFileSync(fixtureGuide, `${JSON.stringify(guide)}\n`);
    writeFileSync(fixtureText, `${JSON.stringify(webText)}\n`);

    const before = readFileSync(fixtureGuide, "utf8");
    const result = spawnSync(
      process.execPath,
      [...baseArgs, "--list", "JHN/3", "--dry-run"],
      { cwd: fixtureRoot, encoding: "utf8" },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /question .* has unresolved 3:999/);
    assert.match(result.stderr, /no guides were stamped/);
    assert.equal(readFileSync(fixtureGuide, "utf8"), before);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("stamp-guide-review requires a meaningful reviewer name", () => {
  const result = spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--status",
      "agent-reviewed",
      "--reviewer",
      "x",
      "--list",
      "JHN/3",
      "--dry-run",
    ],
    { cwd: ROOT, encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /reviewer must name who signed this pass/);
});
