/** Local cache benchmark: frozen baseline/current sources, no provider or relevance labels. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getLibrarySearchRows } from "../../src/lib/early/library-server";
import { runChild, type ChildConfig, type ChildResult } from "./library-search-runner";

const BASELINE = "833f637746a8e951eb1a34ee41b63f2eae8db117";
const ENTRY = "src/lib/early/library-search.ts";
const FIXTURE = "docs/research/all-text-coverage-2026-09.json";
const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const json = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8"));

function snapshot(root: string, destination: string, revision?: string) {
  const sources: Record<string, string> = {};
  function copy(file: string) {
    if (sources[file]) return;
    const source = revision ? execFileSync("git", ["show", `${revision}:${file}`], { cwd: root, encoding: "utf8" }) : fs.readFileSync(path.join(root, file), "utf8");
    sources[file] = hash(source);
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, source);
    for (const match of source.matchAll(/(?:from\s*|import\s*)(["'])(\.[^"']+)\1/g)) {
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[2]));
      copy(path.extname(dependency) ? dependency : `${dependency}.ts`);
    }
  }
  copy(ENTRY);
  return sources;
}

async function main() {
  if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("Run this benchmark with Node 24, matching package.json engines.");
  const root = process.cwd(), temporary = fs.mkdtempSync(path.join(os.tmpdir(), "library-cache-benchmark-"));
  try {
    const fixtureBytes = fs.readFileSync(path.join(root, FIXTURE));
    const fixture = JSON.parse(fixtureBytes.toString()) as { writings: { query: string }[] };
    const queries = fixture.writings.map(item => item.query);
    assert.equal(queries.length, 58); assert.equal(new Set(queries).size, 58);
    const loadStart = performance.now(), rows = await getLibrarySearchRows(), rowLoadMs = performance.now() - loadStart;
    assert.equal(rows.length, 46_549, "Update the explicitly recorded workload when the source corpus changes.");
    const rowsFile = path.join(temporary, "rows.json"), rowBytes = JSON.stringify(rows);
    fs.writeFileSync(rowsFile, rowBytes);
    const implementations = { baseline: snapshot(root, path.join(temporary, "baseline"), BASELINE), current: snapshot(root, path.join(temporary, "current")) };
    const measurements: Partial<Record<"baseline" | "current", ChildResult>> = {};
    for (const variant of ["baseline", "current"] as const) {
      const config: ChildConfig = { rowsFile, entry: path.join(temporary, variant, ENTRY), queries,
        scenarios: variant === "current" ? measurements.baseline!.scenarios : undefined };
      const configFile = path.join(temporary, `${variant}-config.json`), resultFile = path.join(temporary, `${variant}-result.json`);
      fs.writeFileSync(configFile, JSON.stringify(config));
      execFileSync(process.execPath, ["--expose-gc", "--import", "tsx", fileURLToPath(import.meta.url), "--child", configFile, resultFile], {
        cwd: root, stdio: ["ignore", "inherit", "inherit"], timeout: 15 * 60_000,
      });
      measurements[variant] = json<ChildResult>(resultFile);
    }
    const baseline = measurements.baseline!, current = measurements.current!;
    assert.deepEqual(current.outputs, baseline.outputs, "Complete returned search results must remain identical.");
    for (const [file, digest] of Object.entries(implementations.current)) assert.equal(hash(fs.readFileSync(path.join(root, file))), digest, `Source changed during benchmark: ${file}`);
    const summaries = Object.fromEntries((["baseline", "current"] as const).map(variant => {
      const { outputs, scenarios, ...summary } = measurements[variant]!;
      return [variant, { ...summary, outputSha256: hash(JSON.stringify(outputs)), scenarios: scenarios.length }];
    }));
    const report = {
      schemaVersion: 1, generatedAt: new Date().toISOString(), baselineRevision: BASELINE,
      currentRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
      runtime: { executable: process.execPath, node: process.version, v8: process.versions.v8, explicitGc: true,
        cpu: os.cpus()[0]?.model, platform: process.platform, architecture: process.arch, osRelease: os.release(), totalMemoryBytes: os.totalmem() },
      workload: { queries: queries.length, rows: rows.length, rowsSha256: hash(rowBytes), serializedBytes: Buffer.byteLength(rowBytes),
        fixture: FIXTURE, fixtureSha256: hash(fixtureBytes), sourceRowLoadMs: rowLoadMs, warmups: 1, warmSamplesPerQuery: 5, pageSize: 30 },
      sourceHashes: implementations, measurements: summaries,
      parity: { passed: true, completeReturnedObjects: baseline.outputs.length,
        coverage: ["all 58 unfiltered first pages", "second/last/clamped pages", "matching kind", "matching record", "matching kind and record", "unknown filters"],
        fields: "total, ordered hits and all hit fields, snippets, evidence, searched/dropped words, page and pageSize" },
      providerOperations: 0, acceptedLabels: 0, qualityEstablished: false,
      limitations: "Local Node measurements, not browser/visitor metrics or relevance judgments. Development and previously reported diagnostic queries only; reported queries may overlap previously exposed held-out text. No held-out adoption gate. Memory is retained process memory after three explicit GCs; row-loading uses the same frozen JSON in both subprocesses. Index build excludes disk loading. Full result objects on representative pages are compared, not every possible page/filter combination.",
    };
    const outputIndex = process.argv.indexOf("--output");
    if (outputIndex >= 0) {
      const requested = process.argv[outputIndex + 1];
      if (!requested) throw new Error("--output requires a path under .research/.");
      const output = path.resolve(root, requested), allowed = path.join(root, ".research") + path.sep;
      if (!output.startsWith(allowed)) throw new Error("Save benchmark reports only under ignored .research/.");
      fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
    }
    console.log(JSON.stringify(report, null, 2));
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}

if (process.argv[2] === "--child") runChild(process.argv[3], process.argv[4]).catch(error => { console.error(error); process.exitCode = 1; });
else main().catch(error => { console.error(error); process.exitCode = 1; });
