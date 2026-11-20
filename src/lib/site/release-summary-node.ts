import { readFileSync } from "node:fs";
import path from "node:path";
import { releaseSummaryFrom, type ReleaseSummary } from "./release-summary";

/**
 * Read by next.config.ts at build start. A production build without the
 * record fails here, as the case-study loader already does, so the foot can
 * never show "Local build" on the live site.
 */
export function readReleaseSummary(cwd = process.cwd()): ReleaseSummary | null {
  let text: string | null;
  try {
    text = readFileSync(path.join(cwd, ".release-record", "record.json"), "utf8");
  } catch {
    text = null;
  }
  const summary = releaseSummaryFrom(text);
  if (!summary && process.env.VERCEL_ENV === "production") {
    throw new Error("Production builds need .release-record/record.json; run them through npm run release:production.");
  }
  return summary;
}
