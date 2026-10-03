import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { getBookText, getOriginalChapter, getChapterNeighbours } from "../src/lib/scriptures/server";

const require = createRequire(import.meta.url);

test("the production scripture entry point loads validated text, originals, and current neighbours", async () => {
  const book = await getBookText("web", "JHN");
  assert.ok(book);
  assert.ok(book.chapters[0].length > 0);
  assert.equal((await getOriginalChapter("JHN", 1))?.edition, "sblgnt");
  // Standalone apparatus access stays separate from translation-aligned underlays.
  assert.equal((await getOriginalChapter("TOB", 1))?.edition, "lxx");
  assert.equal((await getChapterNeighbours("JHN", 1))?.book, "JHN");
});

test("production loaders distinguish missing optional data from missing or corrupt declared data", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "scripture-loaders-"));
  const write = (file: string, raw: string) => {
    const target = path.join(fixture, "public/scriptures", file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, raw);
  };
  write("text/web/EXO.json", "{broken");
  write("text/web/LEV.json", JSON.stringify({ book: "GEN", trans: "web", chapters: [] }));
  write("guides/EXO/1.json", "null");
  write("original/GEN/1.json", JSON.stringify({ book: "GEN", chapter: 1, bookName: "Genesis", edition: "oshb", direction: "rtl", verses: [{ number: 1, languages: ["hebrew"], words: [{ text: 42 }] }] }));
  write("neighbors/manifest.json", JSON.stringify({ schemaVersion: 2, dependencies: { semanticRelease: "old" }, chapterRecords: { "JHN.1": { book: "JHN", chapter: 1, neighbours: [] } } }));
  write("semantic/manifest.json", JSON.stringify({ releaseId: "current" }));
  const script = `
    import assert from 'node:assert/strict';
    import * as entry from ${JSON.stringify(pathToFileURL(path.resolve("src/lib/scriptures/server.ts")).href)};
    const server = entry.default ?? entry;
    await assert.rejects(server.getBookText('web', 'GEN'), { code: 'DATA_FILE_MISSING' });
    await assert.rejects(server.getBookText('web', 'EXO'), { code: 'DATA_FILE_INVALID_JSON' });
    await assert.rejects(server.getBookText('web', 'LEV'), { code: 'DATA_FILE_CONTRACT' });
    assert.equal(await server.getBookText('web', '../GEN'), null);
    assert.equal(await server.getChapterGuide('GEN', 1), null);
    await assert.rejects(server.getChapterGuide('EXO', 1), { code: 'DATA_FILE_CONTRACT' });
    await assert.rejects(server.getOriginalChapter('JHN', 1), { code: 'DATA_FILE_MISSING' });
    await assert.rejects(server.getOriginalChapter('GEN', 1), { code: 'DATA_FILE_CONTRACT' });
    assert.equal(await server.getChapterNeighbours('JHN', 1), null);
  `;
  try {
    execFileSync(process.execPath, ["--import", require.resolve("tsx"), "--input-type=module", "-e", script], {
      cwd: fixture,
      env: { ...process.env, TSX_TSCONFIG_PATH: path.resolve("tsconfig.json") },
      stdio: "pipe",
      timeout: 30_000,
    });
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
