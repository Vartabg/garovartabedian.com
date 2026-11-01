import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkReleaseRecord } from "../scripts/release/check-release-record.mjs";
import { buildReleaseRecord, classify, readReports } from "../scripts/release/release-record.mjs";

const at = (minute: number) => new Date(Date.UTC(2026, 9, 30, 20, minute)).toISOString();
const step = (name: string, status = "passed") => ({ name, status, startedAt: at(0), completedAt: at(1) });
const secret = {
  commit: "a".repeat(40),
  url: "https://portfolio-abc123-example.vercel.app",
  stagedUrl: "https://portfolio-abc123-example.vercel.app",
  deploymentId: "dpl_secret",
  error: "failed in /Users/someone/release",
};

const live = { ...secret, status: "complete", startedAt: at(0), completedAt: at(30), steps: [step("Lint"), step("Promote verified artifact"), step("Remove release checkout")] };
const failedStep = { ...secret, status: "failed", startedAt: at(0), completedAt: at(9), steps: [step("Lint"), step("Browser tests", "failed"), step("Remove release checkout")] };
const rejected = { ...secret, status: "failed", startedAt: at(0), completedAt: at(2), steps: [step("Lint"), step("Verify merged PR"), step("Remove release checkout")] };
const interrupted = { status: "running", startedAt: at(0), steps: [step("Lint"), step("Typecheck", "running")] };
const recovery = { kind: "verified-artifact-transport-recovery", status: "complete", startedAt: at(0), completedAt: at(5), steps: [step("Verify staged READY identity"), step("Promote exact verified artifact")] };

test("each attempt is live, stopped at its failing step, or ended early", () => {
  assert.deepEqual(classify(live), { outcome: "live", stop: null });
  assert.deepEqual(classify(failedStep), { outcome: "stopped", stop: 1 });
  // The step passed but a code check rejected its result; cleanup is not the cause.
  assert.deepEqual(classify(rejected), { outcome: "stopped", stop: 1 });
  assert.deepEqual(classify(interrupted), { outcome: "interrupted", stop: 1 });
  assert.deepEqual(classify(recovery), { outcome: "live", stop: null });
});

test("reports that never recorded a result still get one outcome", () => {
  // Refused before the release could record a failure (wrong origin, lock held), or killed between steps.
  const refused = { status: "running", startedAt: at(0), steps: [step("Locate repository"), step("Verify repository")] };
  assert.deepEqual(classify(refused), { outcome: "interrupted", stop: 1 });
  // A rejected result followed by a failed cleanup still stops at the rejected step.
  const cleanupFailed = { status: "failed", startedAt: at(0), steps: [step("Lint"), step("Check generated source"), step("Remove release checkout", "failed")] };
  assert.deepEqual(classify(cleanupFailed), { outcome: "stopped", stop: 1 });
  assert.throws(() => classify({ status: "complete", steps: [step("Lint")] }), /no passed Promote step/);
});

test("the public record keeps only dates, outcomes, steps reached and minutes", () => {
  const entries = [live, failedStep, rejected, interrupted, recovery].map((report, i) => ({ file: `/r/${i}.json`, report }));
  const record = buildReleaseRecord(entries);
  assert.deepEqual(Object.keys(record), ["schemaVersion", "steps", "attempts"]);
  for (const attempt of record.attempts) assert.deepEqual(Object.keys(attempt), ["date", "outcome", "ran", "stop", "minutes"]);

  const [first, second, third, fourth] = record.attempts;
  assert.deepEqual(first, { date: "2026-10-30", outcome: "live", ran: [0, 1], stop: null, minutes: 30 });
  assert.equal(record.steps[second.ran[second.stop!]], "Browser tests");
  assert.equal(second.ran.length, 2, "cleanup after a stop is not a step reached");
  assert.equal(record.steps[third.ran[third.stop!]], "Verify merged PR");
  assert.equal(fourth.minutes, null);

  const text = JSON.stringify(record);
  assert.doesNotMatch(text, /[0-9a-f]{40}/);
  assert.doesNotMatch(text, /https?:/);
  assert.doesNotMatch(text, /\/Users\/|dpl_|failed in/);
});

test("a step name that could carry private text stops the release", () => {
  const leaky = (name: string) => [{ file: "/r/x.json", report: { status: "failed", steps: [step(name, "failed")] } }];
  assert.throws(() => buildReleaseRecord(leaky("Fetch https://example.com/x")), /Refusing to publish release step name/);
  assert.throws(() => buildReleaseRecord(leaky("Read /Users/someone/file")), /Refusing to publish release step name/);
  assert.throws(() => buildReleaseRecord(leaky(`Deploy ${"b".repeat(40)}`)), /Refusing to publish release step name/);
  assert.throws(() => buildReleaseRecord(leaky("Verify portfolio-abc123-example.vercel.app")), /Refusing to publish release step name/);
  assert.throws(() => buildReleaseRecord(leaky("Deploy 1c06180f")), /Refusing to publish release step name/);
  // The production domains are public and stay.
  assert.equal(buildReleaseRecord(leaky("Verify alias www.garovartabedian.com")).steps[0], "Verify alias www.garovartabedian.com");
});

test("the running release is left out of its own record", () => {
  const entries = [{ file: "/r/old.json", report: live }, { file: "/r/current.json", report: interrupted }];
  assert.equal(buildReleaseRecord(entries, { exclude: "/r/../r/current.json" }).attempts.length, 1);
});

test("unreadable reports are skipped and a missing folder is an empty record", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "release-record-"));
  try {
    await writeFile(path.join(dir, "1-good.json"), JSON.stringify(live));
    await writeFile(path.join(dir, "2-broken.json"), "{ not json");
    await writeFile(path.join(dir, "3-shape.json"), JSON.stringify({ status: "complete" }));
    await writeFile(path.join(dir, "4-empty.json"), JSON.stringify({ status: "running", steps: [] }));
    await writeFile(path.join(dir, "notes.txt"), "ignored");
    assert.equal((await readReports(dir)).length, 1);
    assert.deepEqual(await readReports(path.join(dir, "missing")), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the release fails when the built page shows the fallback instead of the record", () => {
  const record = JSON.stringify({ schemaVersion: 1, steps: ["Lint"], attempts: [{}, {}] });
  assert.equal(checkReleaseRecord(record, `<div data-release-attempts="2">`), 2);
  assert.throws(() => checkReleaseRecord(record, `<p class="note">The release record is added…</p>`), /does not show the 2-attempt/);
  assert.throws(() => checkReleaseRecord(JSON.stringify({ attempts: [] }), ""), /no attempts/);
});
