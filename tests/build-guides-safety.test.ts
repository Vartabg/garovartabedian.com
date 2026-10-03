import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts/scriptures/build-guides.mjs");
const GUIDE = path.join(ROOT, "public/scriptures/guides/JHN/3.json");

test("build-guides refuses implicit placeholder publication before touching output", () => {
  const before = readFileSync(GUIDE, "utf8");
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--books=JHN", "--chapters=3", "--force"],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, OPENAI_API_KEY: "" },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to publish placeholders without explicit intent/);
  assert.equal(readFileSync(GUIDE, "utf8"), before);
});
