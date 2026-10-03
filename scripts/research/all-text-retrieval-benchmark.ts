/** Corpus coverage / wording diagnostics. No model, credentials or provider. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { validateCases, type SearchCase } from "./search-benchmark";
import { publicDiagnosticCases } from "./public-retrieval-benchmark";
import { getLibrarySearchRows } from "../../src/lib/early/library-server";
import { buildLibrarySearchIndex } from "../../src/lib/early/library-search";
import type { LibrarySearchRow } from "../../src/lib/early/library";
import { searchVersesFrom } from "../../src/lib/scriptures/search";
import type { BookText, Canons, SearchMeta, SearchShard, TranslationId } from "../../src/lib/scriptures/types";
import { auditReadingLayout } from "../reading/audit-layout";

const json = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8"));
async function run() {
  const cases = json<{ cases: SearchCase[] }>("scripts/research/search-pilot/queries.json").cases;
  validateCases(cases);
  const queries = [...new Set([...publicDiagnosticCases(cases).map(c => c.query), ...cases.filter(c => c.split === "development").map(c => c.request.query)])];
  const before = json<LibrarySearchRow[]>("content/early-library/search.json");
  const start = performance.now();
  const rows = await getLibrarySearchRows();
  const search = buildLibrarySearchIndex(rows);
  const coldIndexMs = Math.round(performance.now() - start);
  const readings = queries.map(query => {
    const q = query.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const old = before.filter(row => `${row.title} ${row.edition} ${row.label} ${row.text}`.toLocaleLowerCase().includes(q));
    const start = performance.now();
    const next = search(query, [], [], 1, 6);
    return { query, baseline: { unit: "whole sections or catalog records", total: old.length, top: old.slice(0, 6).map(({ id, href, edition, kind }) => ({ id, href, edition, kind })) }, current: { unit: "individual source blocks or catalog records", total: next.total, milliseconds: Math.round(performance.now() - start), top: next.hits.map(({ id, href, edition, kind, match, missingNegation }) => ({ id, href, edition, kind, match, missingNegation })) } };
  });
  const canons = json<Canons>("public/scriptures/canons.json");
  const scripture = [];
  for (const translation of Object.keys(canons.translations) as TranslationId[]) {
    const books = new Map<string, BookText>(), shards = new Map<string, SearchShard>();
    const source = { canons, meta: json<SearchMeta>(`public/scriptures/search/${translation}/meta.json`), loadBook: async (book: string) => {
      if (!books.has(book)) books.set(book, json<BookText>(`public/scriptures/text/${translation}/${book}.json`));
      return books.get(book)!;
    }, loadShard: async (shard: string) => {
      if (!shards.has(shard)) { const file = `public/scriptures/search/${translation}/${shard}.json`; shards.set(shard, fs.existsSync(file) ? json<SearchShard>(file) : {}); }
      return shards.get(shard)!;
    } };
    const observations = [];
    for (const query of queries) {
      const result = await searchVersesFrom(query, source);
      observations.push({ query, total: result.totalHits, top: result.hits.slice(0, 6).map(({ book, chapter, verse, match, missingNegation }) => ({ book, chapter, verse, match, missingNegation })), warnings: result.warnings ?? [] });
    }
    scripture.push({ translation, observations });
    console.log(`${translation}: ${queries.length} diagnostic queries; no provider operations`);
  }
  const report = { schemaVersion: 1, date: new Date().toISOString(), revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    implementationSha256: createHash("sha256").update(["src/lib/early/library-search.ts", "src/lib/early/library-server.ts", "src/lib/scriptures/search-wording.ts", "src/lib/scriptures/reading-layout.ts"].map(file => fs.readFileSync(file, "utf8")).join("\n")).digest("hex"),
    providerOperations: 0, acceptedLabels: 0, qualityEstablished: false,
    limitations: "Development cases plus previously reported diagnostics only. Library result units changed from sections to individual source blocks; hit counts are not comparable recall. Observations are not human relevance judgments. Reported love-your-enemies query overlaps previously exposed held-out lookup-02; no held-out adoption gate is evaluated. Meaning indexes and ranking were not expanded or rebuilt.",
    coverage: auditReadingLayout(), index: { sourceBlocksAndRecords: rows.length, coldIndexMs }, writings: readings, scripture };
  fs.mkdirSync(".research/search-benchmark/all-text", { recursive: true });
  const output = path.resolve(".research/search-benchmark/all-text/coverage.json");
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ output, queries: queries.length, coldIndexMs, rows: rows.length, providerOperations: 0 }));
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
