import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();
const BUILDER = path.join(ROOT, "scripts/early/build-section-manifest.mjs");
const MANIFEST = path.join(
  ROOT,
  "public/early/sections/apocalypse-paul.json",
);

describe("section manifest lock", () => {
  it("marks Apocalypse of Paul as curated-locked", () => {
    const raw = JSON.parse(readFileSync(MANIFEST, "utf8")) as {
      $lock?: { curated?: boolean };
      "chapter-1"?: { prompt?: string };
    };
    assert.equal(raw.$lock?.curated, true);
    assert.ok(
      (raw["chapter-1"]?.prompt?.length ?? 0) > 100,
      "curated chapter-1 prompt present",
    );
  });

  it("build-section-manifest refuses to overwrite a locked text", () => {
    const before = readFileSync(MANIFEST, "utf8");
    const result = spawnSync(
      process.execPath,
      [BUILDER, "apocalypse-paul"],
      { encoding: "utf8", env: { ...process.env, EARLY_SECTION_UNLOCK: "" } },
    );
    assert.notEqual(result.status, 0, "must exit non-zero when locked");
    assert.match(result.stderr || "", /LOCKED/);
    const after = readFileSync(MANIFEST, "utf8");
    assert.equal(after, before, "manifest bytes must be unchanged");
  });

  it("build-section-manifest still refuses with only --force-unlock (no env)", () => {
    const before = readFileSync(MANIFEST, "utf8");
    const result = spawnSync(
      process.execPath,
      [BUILDER, "apocalypse-paul", "--force-unlock"],
      { encoding: "utf8", env: { ...process.env, EARLY_SECTION_UNLOCK: "" } },
    );
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(MANIFEST, "utf8"), before);
  });

  it("detects drift without rewriting an unlocked manifest", () => {
    const unlocked = path.join(ROOT, "public/early/sections/1clement.json");
    const before = readFileSync(unlocked, "utf8");
    const result = spawnSync(
      process.execPath,
      [BUILDER, "1clement", "--check"],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /1clement: 59 chapters checked/);
    assert.match(result.stdout, /chapter manifests verified/);
    assert.equal(readFileSync(unlocked, "utf8"), before);
  });
});
