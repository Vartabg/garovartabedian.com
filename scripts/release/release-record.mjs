#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { domains } from "./production.mjs";

export const defaultReports = path.join(homedir(), ".local", "state", "garovartabedian", "releases");
const cleanup = "Remove release checkout";
const publicStepName = /^[A-Za-z][A-Za-z0-9 .-]{0,63}$/;
const privatePatterns = [/[0-9a-f]{40}/i, /https?:/i, /\/Users\//, /dpl_/];
// Only the production domains may appear in a step name; a staged host or short hash may not.
const isPublicStepName = (name) =>
  typeof name === "string" && publicStepName.test(name) && !/\b[0-9a-f]{7,}\b/i.test(name) &&
  (!name.includes(".") || domains.some((domain) => name.endsWith(` ${domain}`)));
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });

/** Whether an attempt went live, and the step that stopped or ended it. Cleanup is never the cause. */
export function classify(report) {
  const steps = report.steps;
  if (steps.some((step) => step.name?.startsWith("Promote") && step.status === "passed")) return { outcome: "live", stop: null };
  if (report.status === "complete") throw new Error("A complete release report has no passed Promote step.");
  const failed = steps.findIndex((step) => step.status === "failed" && step.name !== cleanup);
  if (failed >= 0) return { outcome: "stopped", stop: failed };
  let last = steps.length - 1;
  while (last > 0 && steps[last].name === cleanup) last--;
  // A code check can reject a step's output after the step itself passed.
  if (report.status === "failed") return { outcome: "stopped", stop: last };
  // The process ended without finishing: killed, or refused before it could record a result.
  const running = steps.findIndex((step) => step.status === "running" && step.name !== cleanup);
  return { outcome: "interrupted", stop: running >= 0 ? running : last };
}

function minutes(report) {
  const span = Date.parse(report.completedAt) - Date.parse(report.startedAt);
  return Number.isFinite(span) && span >= 0 ? Math.round(span / 60000) : null;
}

function startDate(report) {
  const started = Date.parse(report.startedAt ?? report.steps[0]?.startedAt);
  return Number.isFinite(started) ? day.format(started) : null;
}

/**
 * Only dates, outcomes, the steps reached and minutes leave the local reports.
 * Anything that looks like a commit, URL, deployment id or path stops the release.
 */
export function buildReleaseRecord(entries, { exclude } = {}) {
  const steps = [];
  const index = (name) => {
    if (!isPublicStepName(name)) throw new Error(`Refusing to publish release step name ${JSON.stringify(name)}.`);
    const at = steps.indexOf(name);
    return at >= 0 ? at : steps.push(name) - 1;
  };
  const attempts = [];
  for (const { file, report } of entries) {
    if (exclude && path.resolve(file) === path.resolve(exclude)) continue;
    const { outcome, stop } = classify(report);
    const reached = outcome === "live" ? report.steps.filter((step) => step.name !== cleanup) : report.steps.slice(0, stop + 1);
    attempts.push({ date: startDate(report), outcome, ran: reached.map((step) => index(step.name)), stop, minutes: minutes(report) });
  }
  const record = { schemaVersion: 1, steps, attempts };
  const text = JSON.stringify(record);
  if (privatePatterns.some((pattern) => pattern.test(text))) throw new Error("The release record contains private-looking text; refusing to publish it.");
  return record;
}

/** Reports in file-name order; names start with the start time in milliseconds. */
export async function readReports(dir) {
  const names = await readdir(dir).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const entries = [];
  for (const name of names.filter((n) => n.endsWith(".json")).sort()) {
    const file = path.join(dir, name);
    try {
      const report = JSON.parse(await readFile(file, "utf8"));
      if (report && typeof report === "object" && Array.isArray(report.steps) && report.steps.length > 0) entries.push({ file, report });
    } catch { /* an unreadable report is left out, not guessed at */ }
  }
  return entries;
}

function option(args, flag) {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : undefined;
}

async function main(args) {
  const out = option(args, "--out");
  if (!out) throw new Error("Usage: release-record.mjs [--reports <dir>] [--exclude <report>] --out <file>");
  const record = buildReleaseRecord(await readReports(option(args, "--reports") ?? defaultReports), { exclude: option(args, "--exclude") });
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(record) + "\n");
  console.log(`[release-record] ${record.attempts.length} attempts → ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => { console.error(`[release-record] ${error.message}`); process.exitCode = 1; });
}
