import fs from "node:fs";
import path from "node:path";
import { MODEL, RUBRIC_VERSION, type Job, type Unit, type Run, type Outcome, type Decision } from "./types";
import { ROOT, LOCAL, fingerprint, readJson, writeJson, writeFile, localPath, lockFile } from "./storage";
import { loadSource, verifyBlock } from "./sources";
import { discover, corpusSources } from "./retrieval";
import { JevClient, loadKey, unitFingerprint, validateReply, type Budget } from "./client";
import { renderReport } from "./report";

export async function prepare(jobs: Job[], root = ROOT) {
  if (!Array.isArray(jobs) || !jobs.length) throw new Error("Provide at least one job");
  const units: Unit[] = [], issues: string[] = [];
  let sourceBlocks = 0, targetBlocks = 0, explicitPairs = 0;
  for (const [index, job] of jobs.entries()) {
    try {
      if (!job || !["compare", "discover", "check-claim"].includes(job.mode)) throw new Error("Unknown job mode");
      if (job.mode === "check-claim") {
        if (!job.source || typeof job.claim !== "string" || !job.claim.trim()) throw new Error("check-claim requires a source and a supplied claim");
        const right = await loadSource(job.source, root); sourceBlocks += right.length;
        for (const block of right) units.push({ id: fingerprint({ task: "claim-support", claim: job.claim, right: block.id }), task: "claim-support", claim: job.claim, right: block });
      } else {
        if (!job.left) throw new Error("A left source is required");
        const left = await loadSource(job.left, root); sourceBlocks += left.length;
        if (job.mode === "compare") {
          if (!job.right) throw new Error("compare requires a right source");
          const right = await loadSource(job.right, root); targetBlocks += right.length;
          for (const a of left) for (const b of right) units.push({ id: fingerprint({ left: a.id, right: b.id }), task: "relationship", left: a, right: b });
        } else {
          if (job.corpus && !["scripture-web", "early"].includes(job.corpus)) throw new Error("Unknown discovery corpus");
          const specs = job.targets ?? await corpusSources(job.corpus ?? "scripture-web", root);
          if (!Array.isArray(specs) || !specs.length) throw new Error("No discovery targets selected");
          const targets = [];
          for (const spec of specs) targets.push(...await loadSource(spec, root));
          const unique = [...new Map(targets.map(t => [t.id, t])).values()]; targetBlocks += unique.length;
          const result = await discover(left, unique, root);
          units.push(...result.units); issues.push(...result.issues); explicitPairs += result.explicitPairs;
        }
      }
    } catch (error) { issues.push(`Job ${job?.id ?? index + 1}: ${(error as Error).message}`); }
  }
  const byId = new Map<string, Unit>();
  for (const u of units) {
    const previous = byId.get(u.id);
    byId.set(u.id, previous ? { ...u, explicit: u.explicit || previous.explicit, baselineMatch: u.baselineMatch || previous.baselineMatch } : u);
  }
  const unique = [...byId.values()];
  explicitPairs = unique.filter(u => u.explicit).length;
  return { units: unique, issues, coverage: { sourceBlocks, targetBlocks, shortlistedPairs: unique.length, explicitPairs, scope: "Selected sources only; discovery evaluates up to 20 fused candidates per source block plus resolved explicit citations. Omitted candidates are unevaluated. Context is a window: up to 1,500 characters either side within the same source paragraph and 1,000 characters from each neighboring paragraph/verse. Claim judgments remain separate per passage; no document-wide verdict is inferred." } };
}
export function saveRun(run: Run, directory: string) {
  writeJson(path.join(directory, "report.json"), run);
  const decisions = path.join(directory, "decisions.json");
  writeFile(path.join(directory, "report.html"), renderReport(run, fs.existsSync(decisions) ? readJson<Decision[]>(decisions) : []));
}
export async function runJobs(jobs: Job[], options: { root?: string; local?: string; dryRun?: boolean; offline?: boolean; id?: string; maxAttempts?: number; key?: string; fetcher?: typeof fetch; signal?: AbortSignal } = {}): Promise<{ run: Run; directory: string }> {
  const root = options.root ?? ROOT, local = options.local ?? LOCAL;
  const prepared = await prepare(jobs, root);
  const id = options.id ?? fingerprint({ jobs, units: prepared.units, model: MODEL, rubric: RUBRIC_VERSION }).slice(0, 20);
  const directory = localPath(path.join(local, "runs"), id);
  const unlock = lockFile(path.join(directory, "run.lock"));
  try {
  const file = path.join(directory, "report.json");
  const prior = fs.existsSync(file) ? readJson<Run>(file) : undefined;
  if (options.dryRun && prior && prior.status !== "dry-run") throw new Error("A dry run cannot replace live results; choose another --run ID");
  if (prior && (prior.model !== MODEL || prior.rubric !== RUBRIC_VERSION || fingerprint(prior.outcomes.map(o => o.fingerprint)) !== fingerprint(prepared.units.map(unitFingerprint)))) throw new Error("Run inputs changed; use a new --run ID");
  const run: Run = {
    schemaVersion: 1, id, jobs, createdAt: prior?.createdAt ?? new Date().toISOString(), model: MODEL, rubric: RUBRIC_VERSION,
    status: options.dryRun ? "dry-run" : "incomplete", planned: prepared.units.length, attempts: prior?.attempts ?? 0,
    usage: prior?.usage ?? { inputTokens: 0, outputTokens: 0, meteredResponses: 0 },
    coverage: prepared.coverage, issues: prepared.issues,
    outcomes: prepared.units.map(unit => ({ unit, fingerprint: unitFingerprint(unit), exactMatch: !!unit.left && (unit.left.text.includes(unit.right.text) || unit.right.text.includes(unit.left.text)), status: "incomplete", cached: false, milliseconds: 0 })),
  };
  saveRun(run, directory);
  if (options.dryRun) return { run, directory };
  const limit = options.maxAttempts ?? 500;
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("max-attempts must be a positive integer");
  const budget: Budget = { attempts: run.attempts, limit };
  let key: string | undefined;
  try { key = options.key ?? loadKey(); } catch (e) { run.issues.push((e as Error).message); }
  const client = new JevClient({ cache: path.join(local, "responses"), key, budget, fetcher: options.fetcher, offline: options.offline, signal: options.signal,
    onAttempt: () => { run.attempts = budget.attempts; writeJson(file, run); },
    onUsage: (input, output) => { run.usage!.inputTokens += input; run.usage!.outputTokens += output; run.usage!.meteredResponses++; writeJson(file, run); },
  });
  let cursor = 0;
  const worker = async () => {
    while (cursor < run.outcomes.length) {
      if (options.signal?.aborted) break;
      const outcome = run.outcomes[cursor++], started = performance.now();
      try {
        verifyBlock(outcome.unit.right, root); if (outcome.unit.left) verifyBlock(outcome.unit.left, root);
        if (![outcome.unit.left, outcome.unit.right].filter(Boolean).every(b => ["en", "eng", "english"].includes(b!.language.toLowerCase()))) throw new Error("Non-English analysis is unvalidated; skipped in this pilot");
        const { reply, cached } = await client.evaluate(outcome.unit);
        verifyBlock(outcome.unit.right, root); if (outcome.unit.left) verifyBlock(outcome.unit.left, root);
        Object.assign(outcome, { status: "complete", answer: reply.answers.judgment, model: reply.model, cached, inputTokens: reply.usage.input_tokens, outputTokens: reply.usage.output_tokens });
      } catch (error) { outcome.error = (error as Error).message; }
      outcome.milliseconds = performance.now() - started;
      writeJson(file, run);
    }
  };
  await Promise.all([worker(), worker()]);
  if (options.signal?.aborted) run.issues.push("Research run interrupted; unchanged inputs can be resumed.");
  run.status = !run.issues.length && run.outcomes.length > 0 && run.outcomes.every(o => o.status === "complete") ? "complete" : "incomplete";
  saveRun(run, directory);
  return { run, directory };
  } finally { unlock(); }
}

export const outcomeHash = (o: Outcome) => fingerprint({ unit: o.unit, fingerprint: o.fingerprint, status: o.status, answer: o.answer, model: o.model });
function verifyOutcome(o: Outcome, root: string) {
  if (o.status !== "complete" || !o.answer || o.model !== MODEL || o.fingerprint !== unitFingerprint(o.unit)) throw new Error("Finding is incomplete, modified, or uses a different model/rubric");
  validateReply({ model: o.model, answers: { judgment: o.answer }, usage: { input_tokens: o.inputTokens ?? 0, output_tokens: o.outputTokens ?? 0 } }, o.unit);
  verifyBlock(o.unit.right, root); if (o.unit.left) verifyBlock(o.unit.left, root);
}
export function reviewRun(directory: string, unitId: string, action: Decision["action"], reviewer: string, notes: string, root = ROOT) {
  if (!["accept", "reject", "defer"].includes(action) || !reviewer.trim() || !notes.trim()) throw new Error("Review requires an action, reviewer, and notes");
  const unlock = lockFile(path.join(directory, "run.lock"));
  try {
  const run = readJson<Run>(path.join(directory, "report.json"));
  const outcome = run.outcomes.find(o => o.unit.id === unitId);
  if (!outcome) throw new Error("Unknown finding");
  if (action === "accept") verifyOutcome(outcome, root);
  const file = path.join(directory, "decisions.json");
  const decisions = fs.existsSync(file) ? readJson<Decision[]>(file) : [];
  const decision: Decision = { unitId, outcomeHash: outcomeHash(outcome), action, reviewer: reviewer.trim(), notes: notes.trim(), date: new Date().toISOString() };
  writeJson(file, [...decisions, decision]);
  writeFile(path.join(directory, "report.html"), renderReport(run, [...decisions, decision]));
  return decision;
  } finally { unlock(); }
}
export function exportReviewed(directory: string, root = ROOT) {
  const unlock = lockFile(path.join(directory, "run.lock"));
  try {
  const run = readJson<Run>(path.join(directory, "report.json"));
  const file = path.join(directory, "decisions.json");
  const decisions = fs.existsSync(file) ? readJson<Decision[]>(file) : [];
  const latest = new Map(decisions.map(d => [d.unitId, d]));
  const findings = [];
  for (const o of run.outcomes) {
    const decision = latest.get(o.unit.id);
    if (decision?.action !== "accept") continue;
    if (!decision.reviewer?.trim() || !decision.notes?.trim() || decision.outcomeHash !== outcomeHash(o)) throw new Error("Approval no longer matches this finding; review again");
    verifyOutcome(o, root);
    findings.push({ outcome: o, decision });
  }
  const bundle = { schemaVersion: 1, runId: run.id, exportedAt: new Date().toISOString(), publication: "Editorial research bundle only; not a public-site update", findings };
  writeJson(path.join(directory, "approved.json"), bundle);
  return bundle;
  } finally { unlock(); }
}
