#!/usr/bin/env node
/**
 * Generate and validate V2 chapter guides for Romans 1–16.
 *
 * Usage: node scripts/scriptures/generate-romans-v2.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareTarget } from "./build-guides-v2.mjs";
import { validateGuideV2 } from "./guide-validation.mjs";
import { ROMANS_PART1 } from "./romans-data-1.mjs";
import { ROMANS_PART2 } from "./romans-data-2.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CANONS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public/scriptures/canons.json"), "utf8"),
);
const GUIDES_DIR = path.join(ROOT, "public/scriptures/guides/ROM");

if (!fs.existsSync(GUIDES_DIR)) {
  fs.mkdirSync(GUIDES_DIR, { recursive: true });
}

const ALL_GUIDES = [...ROMANS_PART1, ...ROMANS_PART2];

console.log(`Processing ${ALL_GUIDES.length} Romans V2 chapter guides...`);

let totalFailures = 0;

for (const guide of ALL_GUIDES) {
  const target = prepareTarget(guide.book, guide.chapter);
  guide.generation.promptHash = target.promptHash;

  const outPath = path.join(GUIDES_DIR, `${guide.chapter}.json`);
  fs.writeFileSync(outPath, JSON.stringify(guide, null, 2) + "\n", "utf8");

  const { failures } = validateGuideV2({
    guide,
    root: ROOT,
    canons: CANONS,
    book: guide.book,
    chapter: guide.chapter,
    expectedPromptHash: target.promptHash,
  });

  if (failures.length > 0) {
    console.error(`\nValidation failures for ROM/${guide.chapter}:`, failures);
    totalFailures += failures.length;
  } else {
    console.log(`✓ ROM/${guide.chapter} passed validateGuideV2 (hash: ${target.promptHash.slice(0, 10)}...)`);
  }
}

if (totalFailures > 0) {
  console.error(`\nTOTAL FAILURES: ${totalFailures}`);
  process.exit(1);
} else {
  console.log(`\nALL 16 ROMANS CHAPTER GUIDES PASSED V2 VALIDATION!`);
}
