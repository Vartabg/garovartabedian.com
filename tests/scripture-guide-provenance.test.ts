import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

import { HAND_AUTHORED_MODEL } from "../scripts/scriptures/stamp-guide-review.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const GUIDES = path.join(ROOT, "public/scriptures/guides");

const stamp = (args: string[]) =>
  spawnSync(process.execPath, ["scripts/scriptures/stamp-guide-review.mjs", ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });

test("a model name cannot be asserted by hand", () => {
  // The hole this closes. `--generation-model <anything>` let an operator write
  // a provenance block from scratch onto a draft the named model had never
  // seen — and three guides shipped stamped `gemini-2.5-pro`, rendered to the
  // reader on the page, written by an agent with a dead Gemini key. Every
  // machine check passed, because none of them could tell.
  const result = stamp([
    "--status",
    "agent-reviewed",
    "--reviewer",
    "test panel",
    "--books",
    "LEV",
    "--chapters",
    "1",
    "--rubric",
    "guide-v2",
    "--generation-model",
    "gemini-2.5-pro",
    "--generated-at",
    "2026-08-29T00:00:00.000Z",
    "--grounding-bundle-reviewed",
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown arg --generation-model/);
});

test("binding a hand-authored draft still requires the grounding bundle be reviewed", () => {
  const noBundle = stamp([
    "--status",
    "agent-reviewed",
    "--reviewer",
    "test panel",
    "--books",
    "LEV",
    "--chapters",
    "1",
    "--rubric",
    "guide-v2",
    "--bind-hand-authored",
    "--generated-at",
    "2026-08-29T00:00:00.000Z",
  ]);
  assert.notEqual(noBundle.status, 0);
  assert.match(noBundle.stderr, /--bind-hand-authored requires --grounding-bundle-reviewed/);

  const noTimestamp = stamp([
    "--status",
    "agent-reviewed",
    "--reviewer",
    "test panel",
    "--books",
    "LEV",
    "--chapters",
    "1",
    "--rubric",
    "guide-v2",
    "--bind-hand-authored",
    "--grounding-bundle-reviewed",
  ]);
  assert.notEqual(noTimestamp.status, 0);
  assert.match(noTimestamp.stderr, /must be supplied together/);
});

test("the hand-authored marker is a fixed literal, not operator input", () => {
  // If this could be varied, the hole reopens under a different flag name.
  assert.equal(HAND_AUTHORED_MODEL, "hand-authored");
});

test("a model name is only ever recorded as measured when a run measured it", () => {
  // The corpus-wide invariant. A guide may say which model generated it, or
  // say plainly that none did. There is no third answer, and no guide may
  // carry a model name that no run produced.
  const offenders: string[] = [];
  for (const book of readdirSync(GUIDES)) {
    const dir = path.join(GUIDES, book);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const guide = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
      const generation = guide.generation;
      if (!generation) continue;
      // `model` is a measurement and may only come from a real run. An
      // unmeasured claim belongs in `attributedModel`, where the page renders
      // it as an attribution rather than as a fact about this file.
      if (generation.model && generation.method !== "direct-generation") {
        offenders.push(
          `${book}/${file}: "${generation.model}" recorded as measured via ${generation.method}`,
        );
      }
      if (generation.model && generation.attributedModel) {
        offenders.push(`${book}/${file}: carries both a measurement and an attribution`);
      }
      if (!generation.model && !generation.attributedModel) {
        offenders.push(`${book}/${file}: names neither a model nor an attribution`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `guides naming a model no run produced:\n  ${offenders.join("\n  ")}`,
  );
});
