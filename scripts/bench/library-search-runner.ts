/** Isolated benchmark subprocess; memory probes precede all query outputs. */
import fs from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import type { LibrarySearchRow } from "../../src/lib/early/library";
import type { LibrarySearchResult } from "../../src/lib/early/library-search";

export type Scenario = { query: string; variant: string; kinds: string[]; records: string[]; page: number; pageSize: number };
export type ChildConfig = { rowsFile: string; entry: string; queries: string[]; scenarios?: Scenario[] };
type Search = (query: string, kinds?: string[], records?: string[], page?: number, pageSize?: number) => LibrarySearchResult;
type Memory = { heapUsed: number; heapTotal: number; rss: number; external: number; arrayBuffers: number };
export type ChildResult = {
  node: string; loadRowsMs: number; buildIndexMs: number;
  memory: { beforeRows: Memory; loadedRows: Memory; builtIndex: Memory; retainedRowsHeapBytes: number; additionalIndexHeapBytes: number };
  timing: { medianMs: number; p95Ms: number; samples: number; queries: { query: string; medianMs: number; p95Ms: number; samplesMs: number[]; total: number }[]; slowest: { query: string; medianMs: number; p95Ms: number }[] };
  scenarios: Scenario[]; outputs: LibrarySearchResult[];
};
function memory(): Memory {
  if (!global.gc) throw new Error("Subprocess needs --expose-gc.");
  for (let i = 0; i < 3; i++) global.gc();
  return process.memoryUsage();
}
const rounded = (value: number) => Number(value.toFixed(3));
function summary(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return { medianMs: rounded(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2),
    p95Ms: rounded(sorted[Math.max(0, Math.ceil(sorted.length * .95) - 1)]) };
}
function variants(query: string, result: LibrarySearchResult): Scenario[] {
  const base = { query, kinds: [], records: [], page: 1, pageSize: 30 };
  const first = result.hits[0], last = Math.max(1, Math.ceil(result.total / 7));
  const scenarios: Scenario[] = [
    { ...base, variant: "first" }, { ...base, variant: "second", page: 2, pageSize: 7 },
    { ...base, variant: "last", page: last, pageSize: 7 }, { ...base, variant: "clamped", page: last + 10, pageSize: 7 },
  ];
  if (first) scenarios.push(
    { ...base, variant: "kind", kinds: [first.kind] }, { ...base, variant: "record", records: [first.recordId] },
    { ...base, variant: "kind-and-record", kinds: [first.kind], records: [first.recordId] },
  );
  return scenarios;
}

export async function runChild(configFile: string, resultFile: string) {
  const config = JSON.parse(fs.readFileSync(configFile, "utf8")) as ChildConfig;
  const { buildLibrarySearchIndex } = await import(pathToFileURL(config.entry).href) as { buildLibrarySearchIndex: (rows: LibrarySearchRow[]) => Search };
  const beforeRows = memory(), startRows = performance.now();
  const rows = JSON.parse(fs.readFileSync(config.rowsFile, "utf8")) as LibrarySearchRow[];
  const loadRowsMs = rounded(performance.now() - startRows), loadedRows = memory(), startIndex = performance.now();
  const search = buildLibrarySearchIndex(rows), buildIndexMs = rounded(performance.now() - startIndex), builtIndex = memory();
  const queries: ChildResult["timing"]["queries"] = [], scenarios: Scenario[] = config.scenarios ?? [];
  for (const query of config.queries) {
    const warmup = search(query);
    if (!config.scenarios) scenarios.push(...variants(query, warmup));
    const samples: number[] = [];
    for (let sample = 0; sample < 5; sample++) {
      const start = performance.now(); search(query); samples.push(performance.now() - start);
    }
    queries.push({ query, ...summary(samples), samplesMs: samples.map(rounded), total: warmup.total });
  }
  if (!config.scenarios) scenarios.push(
    { query: config.queries[0], variant: "unknown-kind", kinds: ["unknown-kind"], records: [], page: 1, pageSize: 30 },
    { query: config.queries[0], variant: "unknown-record", kinds: [], records: ["unknown-record"], page: 1, pageSize: 30 },
  );
  const outputs = scenarios.map(({ query, kinds, records, page, pageSize }) => search(query, kinds, records, page, pageSize));
  const result: ChildResult = {
    node: process.version, loadRowsMs, buildIndexMs,
    memory: { beforeRows, loadedRows, builtIndex, retainedRowsHeapBytes: loadedRows.heapUsed - beforeRows.heapUsed,
      additionalIndexHeapBytes: builtIndex.heapUsed - loadedRows.heapUsed },
    timing: { ...summary(queries.flatMap(query => query.samplesMs)), samples: queries.length * 5, queries,
      slowest: [...queries].sort((a, b) => b.medianMs - a.medianMs).slice(0, 8).map(({ query, medianMs, p95Ms }) => ({ query, medianMs, p95Ms })) },
    scenarios, outputs,
  };
  // Outputs are compared in the parent; retain only their digest in the final report.
  fs.writeFileSync(resultFile, JSON.stringify(result));
  console.error(JSON.stringify({ phase: "benchmark-child-complete", node: result.node, queries: queries.length,
    outputSha256: createHash("sha256").update(JSON.stringify(outputs)).digest("hex") }));
}
