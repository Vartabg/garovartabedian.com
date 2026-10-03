import fs from "node:fs";
import path from "node:path";
import { MODEL, RUBRIC_VERSION, RELATIONS, SUPPORT, type BenchmarkCase, type Label, type Outcome, type Task, type TextBlock } from "./types";
import { ROOT, LOCAL, fingerprint, hash, readJson, writeJson, writeFile, lockFile } from "./storage";
import { runJobs } from "./workflow";
import { isPositive, rubricHash } from "./client";
import { loadSource } from "./sources";
import { discover, corpusSources } from "./retrieval";
import { renderEvaluation } from "./report";

export type Suite = { version: string; authorship: string; cases: BenchmarkCase[] };
type Adjudication = { caseId: string; caseHash: string; expected: Label; reviewer: string; date: string; notes: string };
export type Scored = { id: string; task: Task; expected: Label; prediction?: Label; probability: number; complete: boolean; adjudicated: boolean; milliseconds: number; inputTokens: number; outputTokens: number };
export function validateSuite(suite: Suite, root = ROOT) {
  if (!Array.isArray(suite.cases) || !suite.cases.length || new Set(suite.cases.map(c => c.id)).size !== suite.cases.length) throw new Error("Invalid or duplicate benchmark cases");
  const groups = new Map<string, string>(), selections = new Map<string, string>();
  for (const c of suite.cases) {
    if (!["development", "held-out"].includes(c.split) || !["relationship", "claim-support"].includes(c.task) || !(c.task === "relationship" ? RELATIONS : SUPPORT).includes(c.expected as never)) throw new Error("Invalid benchmark label or split");
    if (c.task === "relationship" ? c.job.mode !== "compare" : c.job.mode !== "check-claim") throw new Error("Benchmark task and job must agree");
    if (groups.has(c.group) && groups.get(c.group) !== c.split) throw new Error("Benchmark group leaks across splits");
    groups.set(c.group, c.split);
    if (!c.sourceHashes || !Object.keys(c.sourceHashes).length) throw new Error("Benchmark sources must be pinned");
    for (const [file, digest] of Object.entries(c.sourceHashes)) if (hash(fs.readFileSync(path.resolve(root, file))) !== digest) throw new Error(`Stale benchmark source: ${c.id}`);
    for (const spec of [c.job.left, c.job.right, c.job.source].filter(Boolean)) {
      // Group by chapter, not individual verses, so adjacent source context cannot leak.
      // Editions of the same passage belong to the same group as well.
      const source = spec!;
      const key = fingerprint(source.kind === "scripture" ? { kind: source.kind, book: source.book, chapter: source.chapter } : source.kind === "file" ? { kind: source.kind, path: path.resolve(root, source.path) } : { kind: source.kind, id: source.id });
      if (selections.has(key) && selections.get(key) !== c.split) throw new Error("Benchmark source context leaks across splits");
      selections.set(key, c.split);
      const file = source.kind === "file" ? source.path : source.kind === "scripture" ? `public/scriptures/text/${source.translation ?? "web"}/${source.book}.json` : source.kind === "early" ? `public/early/texts/${source.id}.json` : `content/early-library/readings/${source.id}/${source.section}.json`;
      if (!Object.keys(c.sourceHashes).some(p => path.resolve(root, p) === path.resolve(root, file))) throw new Error(`Unpinned selected source: ${c.id}`);
    }
  }
}
export function adjudicate(suite: Suite, caseId: string, label: Label, reviewer: string, notes: string, file: string, root = ROOT) {
  validateSuite(suite, root);
  const c = suite.cases.find(c => c.id === caseId);
  if (!c || !(c.task === "relationship" ? RELATIONS : SUPPORT).includes(label as never) || !reviewer.trim() || !notes.trim()) throw new Error("Adjudication requires a valid case, label, reviewer and notes");
  const unlock = lockFile(`${file}.lock`);
  try {
    const entries = fs.existsSync(file) ? readJson<Adjudication[]>(file) : [];
    writeJson(file, [...entries, { caseId, caseHash: fingerprint(c), expected: label, reviewer, notes, date: new Date().toISOString() }]);
  } finally { unlock(); }
}
export function wilson(correct: number, total: number) {
  if (!total) return null;
  const z = 1.96, p = correct / total, d = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / d;
  const radius = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / d;
  return [Math.max(0, center - radius), Math.min(1, center + radius)];
}
export function metrics(cases: Scored[], threshold: number | null) {
  const prioritized = threshold === null ? [] : cases.filter(c => c.complete && c.prediction && isPositive(c.prediction) && c.probability >= threshold);
  const reviewed = cases.filter(c => c.adjudicated), prioritizedReviewed = prioritized.filter(c => c.adjudicated);
  const correct = prioritizedReviewed.filter(c => c.expected === c.prediction).length;
  const falseLinks = prioritizedReviewed.filter(c => c.task === "relationship" && !isPositive(c.expected)).length;
  const falseSupport = prioritizedReviewed.filter(c => c.task === "claim-support" && c.expected !== "directly-supported").length;
  const labels = [...new Set(reviewed.map(c => c.expected))];
  const perLabel = Object.fromEntries(labels.map(label => {
    const actual = reviewed.filter(c => c.expected === label).length, predicted = reviewed.filter(c => c.prediction === label).length;
    const tp = reviewed.filter(c => c.expected === label && c.prediction === label).length;
    return [label, { actual, predicted, correct: tp, precision: predicted ? tp / predicted : null, recall: actual ? tp / actual : null }];
  }));
  const durations = cases.filter(c => c.complete).map(c => c.milliseconds).sort((a, b) => a - b);
  return { cases: cases.length, completed: cases.filter(c => c.complete).length, adjudicated: cases.filter(c => c.adjudicated).length,
    prioritized: prioritized.length, prioritizedReviewed: prioritizedReviewed.length, correct, precision: prioritizedReviewed.length ? correct / prioritizedReviewed.length : null,
    precision95Interval: wilson(correct, prioritizedReviewed.length), coverage: cases.length ? prioritized.length / cases.length : 0,
    reviewCoverage: cases.length ? reviewed.length / cases.length : 0,
    falseLinks, falseSupport, abstentions: cases.filter(c => c.prediction === "insufficient-context").length,
    perLabel, p95Milliseconds: durations.length ? durations[Math.ceil(durations.length * .95) - 1] : null,
    inputTokens: cases.reduce((s, c) => s + c.inputTokens, 0), outputTokens: cases.reduce((s, c) => s + c.outputTokens, 0) };
}
export function calibrate(cases: Scored[]): number | null {
  if (!cases.length || cases.some(c => !c.adjudicated || !c.complete)) return null;
  for (let i = 0; i <= 100; i++) {
    const m = metrics(cases, i / 100);
    if (m.precision !== null && m.precision >= .95 && m.coverage >= .2) return i / 100;
  }
  return null;
}
type Calibration = { suiteHash: string; model: string; rubric: string; rubricHash: string; thresholds: Record<Task, number | null>; developmentHash: string; adjudicationsHash: string; frozenAt: string };
export type DiscoveryProbe = { id: string; positive: boolean; retrieved: boolean; accepted: boolean; baseline: boolean };
export function discoveryMetrics(probes: DiscoveryProbe[]) {
  const positives = probes.filter(p => p.positive).length, negatives = probes.length - positives;
  const retrievalHits = probes.filter(p => p.positive && p.retrieved).length;
  const recovered = probes.filter(p => p.positive && p.accepted).length, baselineRecovered = probes.filter(p => p.positive && p.baseline).length;
  const falseLinks = probes.filter(p => !p.positive && p.accepted).length, baselineFalseLinks = probes.filter(p => !p.positive && p.baseline).length;
  return { cases: probes.length, positives, negatives, retrievalHits, candidateRecall: positives ? retrievalHits / positives : null,
    candidateRecall95Interval: wilson(retrievalHits, positives), falseLinkRate95Interval: wilson(falseLinks, negatives), baselineFalseLinkRate95Interval: wilson(baselineFalseLinks, negatives),
    recovered, baselineRecovered, falseLinks, baselineFalseLinks, falseLinkRate: negatives ? falseLinks / negatives : null,
    baselineFalseLinkRate: negatives ? baselineFalseLinks / negatives : null,
    passed: positives > 0 && negatives > 0 && recovered > baselineRecovered && falseLinks <= baselineFalseLinks };
}
async function probeDiscovery(cases: BenchmarkCase[], scores: Scored[], threshold: number | null) {
  const relations = cases.filter(c => c.task === "relationship" && scores.find(s => s.id === c.id)?.adjudicated);
  const left: TextBlock[] = [], right: TextBlock[] = [];
  for (const c of relations) {
    const a = await loadSource(c.job.left!), b = await loadSource(c.job.right!);
    if (a.length !== 1 || b.length !== 1 || b[0].source.kind !== "scripture") throw new Error("Discovery benchmark requires one source block and one Scripture target per pair");
    left.push(a[0]); right.push(b[0]);
  }
  const targets = [];
  for (const spec of await corpusSources("scripture-web")) targets.push(...await loadSource(spec));
  const result = await discover(left, targets);
  if (result.issues.length) throw new Error("Discovery benchmark contains unresolved explicit references");
  const shortlisted = new Set(result.units.map(u => `${u.left!.id}:${u.right.id}`));
  const probes = relations.map((c, i): DiscoveryProbe => {
    const scored = scores.find(s => s.id === c.id)!, b = right[i], match = result.baselineFindings.find(f => f.leftId === left[i].id)?.match;
    const retrieved = shortlisted.has(`${left[i].id}:${b.id}`);
    const baseline = !!match && b.source.kind === "scripture" && b.source.book === match.book && Number(b.pointer[1]) + 1 === match.chapter && Number(b.pointer[2]) + 1 >= match.verse && Number(b.pointer[2]) + 1 <= (match.endVerse ?? match.verse);
    return { id: c.id, positive: isPositive(scored.expected), retrieved, baseline, accepted: retrieved && threshold !== null && scored.complete && !!scored.prediction && isPositive(scored.prediction) && scored.probability >= threshold };
  });
  return { ...discoveryMetrics(probes), probes, targetBlocks: targets.length,
    scope: "Judged candidate pairs only. Unjudged shortlist entries are excluded, not counted as correct. Baseline is the existing rare-word matchQuotation scorer given the same supplied blocks; this does not measure quotation-mark detection or corpus-wide allusion recall." };
}
export async function evaluateSuite(suite: Suite, options: { phase: "development" | "held-out"; offline?: boolean; calibration?: string; maxAttempts?: number; discovery?: boolean }, local = LOCAL) {
  validateSuite(suite);
  const reviewFile = path.join(local, "benchmark-adjudications.json");
  const decisions = fs.existsSync(reviewFile) ? readJson<Adjudication[]>(reviewFile) : [];
  const latest = new Map(decisions.map(d => [d.caseId, d]));
  const suiteHash = fingerprint(suite), evaluationId = fingerprint({ suiteHash, model: MODEL, rubricHash }).slice(0, 20);
  const dir = path.join(local, "evaluations", evaluationId);
  const developmentDecisions = suite.cases.filter(c => c.split === "development").map(c => latest.get(c.id) ?? null);
  let calibration: Calibration | undefined;
  let calibrationFile = options.calibration;
  if (options.phase === "held-out") {
    if (!options.calibration) throw new Error("Held-out evaluation requires --calibration from a development run");
    calibration = readJson<Calibration>(options.calibration);
    if (calibration.suiteHash !== suiteHash || calibration.model !== MODEL || calibration.rubric !== RUBRIC_VERSION || calibration.rubricHash !== rubricHash || calibration.adjudicationsHash !== fingerprint(developmentDecisions)) throw new Error("Calibration does not match this suite, model, rubric or development review");
  }
  const selected = suite.cases.filter(c => c.split === options.phase);
  const scored: Scored[] = [];
  let remaining = options.maxAttempts ?? 500;
  for (const c of selected) {
    const runId = `bench-${evaluationId.slice(0, 10)}-${c.id}`;
    const priorFile = path.join(local, "runs", runId, "report.json");
    const prior = fs.existsSync(priorFile) ? readJson<{ attempts: number; usage?: { inputTokens: number; outputTokens: number } }>(priorFile) : undefined;
    const previousAttempts = prior?.attempts ?? 0;
    const { run } = await runJobs([c.job], { local, offline: options.offline || remaining <= 0, maxAttempts: Math.max(1, previousAttempts + remaining), id: runId });
    remaining -= run.attempts - previousAttempts;
    const outcome: Outcome | undefined = run.outcomes.length === 1 ? run.outcomes[0] : undefined;
    const review = latest.get(c.id);
    const adjudicated = !!review?.reviewer.trim() && !!review.notes.trim() && review.caseHash === fingerprint(c);
    scored.push({ id: c.id, task: c.task, expected: adjudicated ? review!.expected : c.expected, adjudicated,
      prediction: outcome?.answer?.choice, probability: outcome?.answer ? outcome.answer.probabilities[outcome.answer.choice] : 0,
      complete: run.status === "complete" && !!outcome, milliseconds: outcome?.milliseconds ?? 0,
      inputTokens: (run.usage?.inputTokens ?? 0) - (prior?.usage?.inputTokens ?? 0), outputTokens: (run.usage?.outputTokens ?? 0) - (prior?.usage?.outputTokens ?? 0) });
  }
  if (options.phase === "development") {
    calibration = { suiteHash, model: MODEL, rubric: RUBRIC_VERSION, rubricHash, thresholds: { relationship: calibrate(scored.filter(c => c.task === "relationship")), "claim-support": calibrate(scored.filter(c => c.task === "claim-support")) }, developmentHash: fingerprint(scored), adjudicationsHash: fingerprint(developmentDecisions), frozenAt: new Date().toISOString() };
    // Immutable named calibration artifacts prevent later development runs changing a held-out threshold.
    calibrationFile = path.join(dir, `calibration-${fingerprint(calibration).slice(0, 16)}.json`);
    writeJson(calibrationFile, calibration);
  }
  const groups = Object.fromEntries((["relationship", "claim-support"] as Task[]).map(task => [task, metrics(scored.filter(c => c.task === task), calibration!.thresholds[task])]));
  const classificationPass = Object.values(groups).every(g => g.cases > 0 && g.completed === g.cases && g.adjudicated === g.cases && g.precision !== null && g.precision >= .95 && g.coverage >= .2);
  const discovery = options.discovery ? await probeDiscovery(selected, scored, calibration!.thresholds.relationship) : null;
  const passed = options.phase === "held-out" && classificationPass && discovery?.passed === true;
  const unmetCriteria: string[] = [];
  if (options.phase !== "held-out") unmetCriteria.push("Adoption requires a held-out evaluation using frozen development thresholds.");
  for (const [task, g] of Object.entries(groups)) {
    if (g.completed !== g.cases) unmetCriteria.push(`${task}: ${g.cases - g.completed} incomplete cases.`);
    if (g.adjudicated !== g.cases) unmetCriteria.push(`${task}: ${g.cases - g.adjudicated} cases await editorial adjudication.`);
    if (g.precision === null || g.precision < .95) unmetCriteria.push(`${task}: 95% observed precision is not demonstrated.`);
    if (g.coverage < .2) unmetCriteria.push(`${task}: 20% priority coverage is not demonstrated.`);
  }
  if (!discovery?.passed) unmetCriteria.push(discovery ? "Discovery has not demonstrated more recovered adjudicated connections at no higher false-link rate." : "Discovery comparison has not been evaluated.");
  const report = { phase: options.phase, evaluationId, suiteHash, model: MODEL, rubric: RUBRIC_VERSION, calibration, unmetCriteria,
    status: passed ? "pilot-gates-passed" : "experimental", classificationGate: options.phase === "held-out" && classificationPass ? "passed" : "not-passed",
    adoptionGate: passed ? "passed" : discovery ? "not-passed" : "pending-discovery-evaluation", discovery,
    limitations: ["Draft labels never count as adjudicated evidence.", "Model probability is not historical truth.", "Intervals describe this selected pilot, not corpus-wide accuracy.", "Token totals are newly reported API usage during this invocation; cache replay costs zero new tokens. Failed requests without usage are unmetered. Latency includes cache replay."], groups, cases: scored };
  writeJson(path.join(dir, `${options.phase}.json`), report);
  writeFile(path.join(dir, `${options.phase}.html`), renderEvaluation(report));
  return { report, directory: dir, calibrationFile };
}
