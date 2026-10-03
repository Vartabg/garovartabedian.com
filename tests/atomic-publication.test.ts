import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  atomicWriteJsonSync,
  publishStagedEntriesSync,
} from "../scripts/lib/atomic-publication.mjs";

const withTempRoot = (run: (root: string) => void) => {
  const root = mkdtempSync(path.join(tmpdir(), "garovartabedian-publish-"));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test("atomicWriteJsonSync leaves a complete, parseable file and no temporary sibling", () => {
  withTempRoot((root) => {
    const file = path.join(root, "nested", "artifact.json");
    atomicWriteJsonSync(file, { status: "complete", count: 3 });

    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
      status: "complete",
      count: 3,
    });
    assert.deepEqual(
      readdirSync(path.dirname(file)).filter((entry) => entry.endsWith(".tmp")),
      [],
    );
  });
});

test("publishStagedEntriesSync replaces a validated set and preserves unrelated files", () => {
  withTempRoot((root) => {
    const stage = path.join(root, "stage");
    const output = path.join(root, "output");
    mkdirSync(stage, { recursive: true });
    mkdirSync(output, { recursive: true });
    atomicWriteJsonSync(path.join(output, "one.json"), { version: "old" });
    atomicWriteJsonSync(path.join(output, "unrelated.json"), { keep: true });
    atomicWriteJsonSync(path.join(stage, "one.json"), { version: "new" });
    atomicWriteJsonSync(path.join(stage, "nested", "two.json"), { version: "new" });

    publishStagedEntriesSync(stage, output, ["one.json", "nested/two.json"], {
      label: "test",
    });

    assert.deepEqual(JSON.parse(readFileSync(path.join(output, "one.json"), "utf8")), {
      version: "new",
    });
    assert.deepEqual(
      JSON.parse(readFileSync(path.join(output, "nested", "two.json"), "utf8")),
      { version: "new" },
    );
    assert.equal(existsSync(path.join(output, "unrelated.json")), true);
  });
});

test("publication preflight leaves live output unchanged when staging is incomplete", () => {
  withTempRoot((root) => {
    const stage = path.join(root, "stage");
    const output = path.join(root, "output");
    mkdirSync(stage, { recursive: true });
    atomicWriteJsonSync(path.join(output, "one.json"), { version: "old" });
    atomicWriteJsonSync(path.join(stage, "one.json"), { version: "new" });

    assert.throws(
      () =>
        publishStagedEntriesSync(stage, output, ["one.json", "missing.json"], {
          label: "test",
        }),
      /staged entry is missing: missing\.json/,
    );
    assert.deepEqual(JSON.parse(readFileSync(path.join(output, "one.json"), "utf8")), {
      version: "old",
    });
  });
});
