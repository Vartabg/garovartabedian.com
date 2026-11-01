import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const episodes = read("src/lib/research-audio/episodes.json");
const manifest = read("public/research-audio/manifest.json");
const verification = read("public/research-audio/verification.json");
const renderReceipts = read("public/research-audio/render-receipts.json");
const hash = (data) => createHash("sha256").update(data).digest("hex");
// Match Python's canonical encoding, including the spaces in its JSON separators.
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(", ")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}: ${canonical(value[key])}`).join(", ")}}`;
  return JSON.stringify(value);
};

for (const episode of episodes) {
  test(`${episode.id}: published audio, transcript, chapter map and ASR receipt agree`, () => {
    const media = manifest[episode.id];
    assert.ok(media.src.startsWith("/research-audio/"));
    assert.equal(hash(readFileSync(path.join(root, "public", media.src))), media.sha256);
    assert.equal(hash(canonical(episode)), media.scriptSha256, "script changed without re-rendering");
    assert.equal(hash(readFileSync(path.join(root, "scripts/scriptures/reference/smooth-baritone.wav"))), media.voiceReferenceSha256);
    assert.ok(media.durationSeconds >= 300 && media.durationSeconds <= 480, "overview should last five to eight minutes");
    assert.equal(media.chapters.length, episode.sections.length);
    let previousEnd = 0;
    for (const [index, chapter] of media.chapters.entries()) {
      assert.ok(Math.abs(chapter.startSeconds - previousEnd) < 0.02);
      assert.ok(chapter.durationSeconds > 5);
      previousEnd = chapter.startSeconds + chapter.durationSeconds;
      assert.ok(episode.sections[index].sourceIds.length);
      for (const id of episode.sections[index].sourceIds) assert.ok(episode.sources.some((source) => source.id === id));
    }
    assert.ok(Math.abs(previousEnd - media.durationSeconds) < 1);
    assert.ok(existsSync(path.join(root, "src/app", episode.route, "page.tsx")));
    const receipt = verification[episode.id];
    assert.equal(receipt.sha256, media.sha256);
    assert.equal(receipt.scriptSha256, media.scriptSha256);
    assert.equal(receipt.checks.length, episode.sections.length);
    assert.ok(receipt.checks.every((check) => check.passed && check.wordErrorRate <= 0.20));
    const rendered = renderReceipts[episode.id];
    assert.equal(rendered.sha256, media.sha256);
    assert.equal(rendered.scriptSha256, media.scriptSha256);
    assert.ok(rendered.sections.length);
    for (const section of rendered.sections) {
      assert.ok(section.section >= 1 && section.section <= episode.sections.length);
      assert.ok(section.checks.length > 0);
      assert.deepEqual(section.checks.map((check) => check.text), section.chunks.map((chunk) => chunk.text));
      assert.ok(section.checks.every((check) => check.wordCount > 0 && check.errors <= Math.max(1, Math.floor(check.wordCount * 0.06))));
    }
  });
}
