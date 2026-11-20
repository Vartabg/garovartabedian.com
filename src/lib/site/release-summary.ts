/**
 * The release record, reduced to what every page's Engineer foot shows: how
 * many earlier attempts are recorded, and the gate steps the latest live one
 * ran. next.config.ts inlines it as process.env.RELEASE_RECORD_SUMMARY at build
 * time, so no page reads the record from disk at render (the root layout wraps
 * routes that regenerate daily on Vercel, where the file does not exist).
 * This module stays free of node imports so client components can parse it.
 */
export type ReleaseSummary = { attempts: number; steps: string[] };

export const RELEASE_SUMMARY_ENV = "RELEASE_RECORD_SUMMARY";

type Attempt = { outcome?: string; ran?: unknown };
type Record_ = { schemaVersion?: number; steps?: unknown; attempts?: unknown };

/** From the record file's text; null when absent or malformed. */
export function releaseSummaryFrom(text: string | null): ReleaseSummary | null {
  if (text === null) return null;
  let record: Record_;
  try {
    record = JSON.parse(text);
  } catch {
    return null;
  }
  if (!record || record.schemaVersion !== 1 || !Array.isArray(record.steps) || !Array.isArray(record.attempts) || record.attempts.length === 0) return null;
  const names = record.steps.filter((step): step is string => typeof step === "string");
  const attempts = record.attempts as Attempt[];
  // The latest live attempt shows the gate as it stands; the dictionary order
  // keeps renamed steps from history.
  const shown = [...attempts].reverse().find((attempt) => attempt.outcome === "live") ?? attempts[attempts.length - 1];
  const ran = Array.isArray(shown.ran) ? shown.ran : [];
  const steps = ran.map((index) => (typeof index === "number" ? names[index] : undefined)).filter((step): step is string => typeof step === "string");
  return { attempts: attempts.length, steps };
}

/** From the inlined environment value; null when the build had no record. */
export function parseReleaseSummaryEnv(value: string | undefined): ReleaseSummary | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ReleaseSummary | null;
    if (!parsed || !Number.isInteger(parsed.attempts) || parsed.attempts < 1 || !Array.isArray(parsed.steps)) return null;
    return { attempts: parsed.attempts, steps: parsed.steps.filter((step): step is string => typeof step === "string") };
  } catch {
    return null;
  }
}
