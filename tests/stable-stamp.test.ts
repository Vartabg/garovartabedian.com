import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  readJsonOrNull,
  stableGeneratedAt,
  writeStableJson,
} from "../scripts/site/stable-stamp.mjs";

const scratch = () => path.join(mkdtempSync(path.join(tmpdir(), "stamp-")), "artefact.json");

test("a rebuild that produces the same data keeps the original timestamp", () => {
  // The whole point: `npm run build` must not dirty the worktree for a stamp
  // nobody asked to move.
  const file = scratch();
  writeStableJson(file, { generatedAt: "2026-01-01T00:00:00.000Z", value: 1 });
  const first = readFileSync(file, "utf8");

  const changed = writeStableJson(file, { generatedAt: "2026-09-09T00:00:00.000Z", value: 1 });
  assert.equal(changed, false, "an unchanged artefact should not be rewritten");
  assert.equal(readFileSync(file, "utf8"), first);
});

test("a rebuild that produces different data takes the new timestamp", () => {
  const file = scratch();
  writeStableJson(file, { generatedAt: "2026-01-01T00:00:00.000Z", value: 1 });

  const changed = writeStableJson(file, { generatedAt: "2026-09-09T00:00:00.000Z", value: 2 });
  assert.equal(changed, true);
  const written = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(written.generatedAt, "2026-09-09T00:00:00.000Z");
  assert.equal(written.value, 2);
});

test("the stamp keeps its place in the file", () => {
  // Preserving the value must not reorder the keys, or every artefact would
  // churn the first time this ran.
  const file = scratch();
  writeStableJson(file, { schemaVersion: 1, generatedAt: "2026-01-01T00:00:00.000Z", value: 1 });
  writeStableJson(file, { schemaVersion: 1, generatedAt: "2026-09-09T00:00:00.000Z", value: 1 });
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(file, "utf8"))), [
    "schemaVersion",
    "generatedAt",
    "value",
  ]);
});

test("a generator that clears its output directory can still preserve the stamp", () => {
  // build-neighbors and build-allusions delete their output before writing, so
  // there is nothing on disk to compare against by the time they write. They
  // capture the old artefact first and hand it in.
  const file = scratch();
  const previous = { generatedAt: "2026-01-01T00:00:00.000Z", value: 1 };
  assert.equal(
    stableGeneratedAt(file, { generatedAt: "2026-09-09T00:00:00.000Z", value: 1 }, "generatedAt", previous),
    "2026-01-01T00:00:00.000Z",
  );
  assert.equal(
    stableGeneratedAt(file, { generatedAt: "2026-09-09T00:00:00.000Z", value: 2 }, "generatedAt", previous),
    "2026-09-09T00:00:00.000Z",
  );
});

test("a missing or corrupt artefact is not treated as agreement", () => {
  const file = scratch();
  assert.equal(readJsonOrNull(file), null);
  assert.equal(
    stableGeneratedAt(file, { generatedAt: "2026-09-09T00:00:00.000Z", value: 1 }),
    "2026-09-09T00:00:00.000Z",
  );

  writeFileSync(file, "{ not json", "utf8");
  assert.equal(readJsonOrNull(file), null);
  assert.equal(
    stableGeneratedAt(file, { generatedAt: "2026-09-09T00:00:00.000Z", value: 1 }),
    "2026-09-09T00:00:00.000Z",
  );
});
