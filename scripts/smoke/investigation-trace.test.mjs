import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkInvestigationTrace } from "../site/check-investigation-trace.mjs";

const SOURCES = ["public/scriptures/text/web/ISA.json", "public/early/texts/1clement.json"];
const TRACES = [
  ".next/server/app/scriptures/read/isaiah-53-clement-16/page.js.nft.json",
  ".next/server/app/scriptures/investigations/isaiah-53-clement-16/page.js.nft.json",
];

async function fixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), "investigation-trace-"));
  async function writeProjectFile(relative) {
    const filename = path.join(root, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, "{}");
  }
  async function writeTrace(relative, files = SOURCES) {
    const filename = path.join(root, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, JSON.stringify({ version: 1, files: files.map((file) =>
      `unused/../${path.relative(path.dirname(filename), path.join(root, file))}`) }));
  }
  try {
    for (const source of SOURCES) await writeProjectFile(source);
    for (const trace of TRACES) await writeTrace(trace);
    await run({ root, writeProjectFile, writeTrace });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("both evidence traces require both source artifacts even when public files exist", async () => {
  await fixture(async ({ root, writeTrace }) => {
    assert.equal(await checkInvestigationTrace(root), 2);
    for (const trace of TRACES) {
      for (const missing of SOURCES) {
        await writeTrace(trace, SOURCES.filter((source) => source !== missing));
        await assert.rejects(checkInvestigationTrace(root), /missing investigation source/);
        await writeTrace(trace);
      }
    }
    await rm(path.join(root, SOURCES[0]));
    await assert.rejects(checkInvestigationTrace(root), /ENOENT/);
  });
});

test("evidence traces reject project caches and broad root tracing even when those files exist", async () => {
  await fixture(async ({ root, writeProjectFile, writeTrace }) => {
    const contaminants = [
      "tsconfig.tsbuildinfo", "other.tsbuildinfo", "test-results/report.json",
      "logs/verification.txt", "build.log", "scripts/site/build.mjs", "tests/example.ts", "docs/example.md",
    ];
    for (const contaminant of contaminants) {
      await writeProjectFile(contaminant);
      for (const trace of TRACES) {
        // Include a noncanonical path so classification must follow resolution
        // from the manifest directory rather than inspect the raw trace entry.
        await writeTrace(trace, [...SOURCES, contaminant]);
        await assert.rejects(checkInvestigationTrace(root), /includes build-only project file/);
        await writeTrace(trace);
      }
    }
  });
});

test("similarly named dependency paths remain valid trace entries", async () => {
  await fixture(async ({ root, writeProjectFile, writeTrace }) => {
    const dependencyFiles = [
      "node_modules/example/tsconfig.tsbuildinfo", "node_modules/example/test-results/report.json",
      "node_modules/example/logs/build.log", "node_modules/example/scripts/build.mjs",
      "node_modules/example/tests/example.js", "node_modules/example/docs/example.md",
    ];
    for (const file of dependencyFiles) await writeProjectFile(file);
    for (const trace of TRACES) await writeTrace(trace, [...SOURCES, ...dependencyFiles]);
    assert.equal(await checkInvestigationTrace(root), 2);
  });
});
