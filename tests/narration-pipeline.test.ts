import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();
const BATCH = path.join(ROOT, "scripts/scriptures/batch-narration.py");
const VERIFIER = path.join(ROOT, "scripts/scriptures/verify-narration.py");

function dryRun(...args: string[]) {
  return spawnSync(
    "python3",
    [BATCH, ...args, "--dry-run", "--json"],
    { cwd: ROOT, encoding: "utf8" },
  );
}

describe("Scripture narration batch planner", () => {
  it("plans a bounded chapter range without loading the voice model", () => {
    const result = dryRun(
      "--translation",
      "kjv",
      "--book",
      "PSA",
      "--start-chapter",
      "23",
      "--end-chapter",
      "24",
      "--bitrate",
      "56",
    );

    assert.equal(result.status, 0, result.stderr);
    const plan = JSON.parse(result.stdout) as {
      taskCount: number;
      wordCount: number;
      bitrateKbps: number;
      first: { id: string; objectKey: string };
      last: { id: string };
    };
    assert.equal(plan.taskCount, 2);
    assert.ok(plan.wordCount > 0);
    assert.equal(plan.bitrateKbps, 56);
    assert.equal(plan.first.id, "kjv:PSA:23");
    assert.equal(
      plan.first.objectKey,
      "narration/smooth-baritone-v2/kjv/PSA/23.m4a",
    );
    assert.equal(plan.last.id, "kjv:PSA:24");
  });

  it("accounts for every available chapter across all translations", () => {
    const result = dryRun("--all-translations", "--bitrate", "48");

    assert.equal(result.status, 0, result.stderr);
    const plan = JSON.parse(result.stdout) as {
      taskCount: number;
      wordCount: number;
      estimatedListeningHours: number;
    };
    assert.equal(plan.taskCount, 5_042);
    assert.ok(plan.wordCount > 3_300_000);
    assert.ok(plan.estimatedListeningHours > 400);
  });

  it("keeps an explicit cross-book priority list in requested order", () => {
    const result = dryRun(
      "--target",
      "web:PSA:23",
      "--target",
      "web:GEN:1",
      "--target",
      "web:ROM:8",
    );

    assert.equal(result.status, 0, result.stderr);
    const plan = JSON.parse(result.stdout) as {
      taskCount: number;
      first: { id: string };
      last: { id: string };
    };
    assert.equal(plan.taskCount, 3);
    assert.equal(plan.first.id, "web:PSA:23");
    assert.equal(plan.last.id, "web:ROM:8");
  });

  it("rejects ambiguous chapter ranges", () => {
    const result = dryRun("--translation", "web", "--start-chapter", "2");

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /require exactly one --book/);
  });

  it("resumes only a verified file whose checksum still matches", () => {
    const temporaryRoot = mkdtempSync(
      path.join(os.tmpdir(), "scripture-ledger-test-"),
    );
    const script = `
import pathlib
import sys
sys.path.insert(0, ${JSON.stringify(path.dirname(BATCH))})
from narration_pipeline import RenderLedger, file_sha256, load_task

root = pathlib.Path(${JSON.stringify(temporaryRoot)})
output = root / "audio" / "kjv" / "PSA" / "23.m4a"
output.parent.mkdir(parents=True)
output.write_bytes(b"verified audio")
task = load_task("kjv", "PSA", 23)
ledger = RenderLedger(root / "state.sqlite3")
ledger.prepare(task, output)
receipt = {"sha256": file_sha256(output)}
ledger.update(task, "structural_verified", receipt=receipt)
assert ledger.completed(task, output)
output.write_bytes(b"changed audio")
assert not ledger.completed(task, output)
ledger.close()
`;
    try {
      const result = spawnSync("python3", ["-c", script], {
        cwd: ROOT,
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("does not count an impossible Whisper repetition as spoken audio", () => {
    const script = `
import importlib.util
import pathlib
import sys

scripts = pathlib.Path(${JSON.stringify(path.dirname(BATCH))})
sys.path.insert(0, str(scripts))
spec = importlib.util.spec_from_file_location("verify_narration", ${JSON.stringify(VERIFIER)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
expected = "Because I have called, and you have refused."
transcript = " ".join([expected] * 5)
errors, words, evaluated, trimmed = module.evaluate_transcript(
    expected, transcript, 3.5
)
assert trimmed
assert errors == 0
assert len(module.normalized_words(evaluated)) == words
`;
    const result = spawnSync("python3", ["-c", script], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
  });
});
