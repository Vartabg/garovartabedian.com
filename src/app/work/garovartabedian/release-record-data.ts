import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReleaseRecordData } from "./ReleaseRecord";

/** The record the release script writes before building; absent in local builds. */
export function readReleaseRecord(): ReleaseRecordData | null {
  let text: string | null;
  try {
    // A literal path keeps build tracing to this one file.
    text = readFileSync(path.join(process.cwd(), ".release-record", "record.json"), "utf8");
  } catch {
    text = null;
  }
  return releaseRecordFrom(text);
}

export function releaseRecordFrom(text: string | null): ReleaseRecordData | null {
  let record: ReleaseRecordData | null = null;
  try {
    record = text === null ? null : JSON.parse(text);
  } catch {
    record = null;
  }
  if (record && (record.schemaVersion !== 1 || !Array.isArray(record.attempts) || record.attempts.length === 0)) record = null;
  // A production build without the record fails here instead of shipping the fallback line.
  if (!record && process.env.VERCEL_ENV === "production") {
    throw new Error("Production builds need .release-record/record.json; run them through npm run release:production.");
  }
  return record;
}
