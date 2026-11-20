#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const recordFile = ".release-record/record.json";
export const builtPage = ".next/server/app/work/garovartabedian.html";
// A pre-rendered chapter: the Engineer foot on every page must carry the same record.
export const builtChapter = ".next/server/app/scriptures/protestant/MRK/4.html";

/** The built case study and chapter must show the record this release wrote, not the fallback line. */
export function checkReleaseRecord(recordText, html, chapterHtml) {
  const record = JSON.parse(recordText);
  const count = record?.attempts?.length;
  if (!Number.isInteger(count) || count < 1) throw new Error("The release record has no attempts.");
  const marker = `data-release-attempts="${count}"`;
  if (!html.includes(marker)) throw new Error(`The built case study does not show the ${count}-attempt release record.`);
  if (chapterHtml !== undefined && !chapterHtml.includes(marker)) throw new Error(`The built chapter reader does not show the ${count}-attempt release record.`);
  return count;
}

async function main() {
  const count = checkReleaseRecord(await readFile(recordFile, "utf8"), await readFile(builtPage, "utf8"), await readFile(builtChapter, "utf8"));
  console.log(`[release-record] built case study and chapter reader show ${count} attempts`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`[release-record] ${error.message}`); process.exitCode = 1; });
}
