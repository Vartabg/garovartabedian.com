import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadSource, verifyBlock, parseSource } from "../scripts/research/sources";
import { readJson, writeJson, lockFile } from "../scripts/research/storage";
import { MODEL, RUBRIC_VERSION, RELATIONS, type Unit, type Run, type Decision } from "../scripts/research/types";
import { JevClient, unitFingerprint, validateReply, requestFor } from "../scripts/research/client";
import { reviewRun, exportReviewed, saveRun, runJobs } from "../scripts/research/workflow";
import { main } from "../scripts/research/cli";
import { renderReport } from "../scripts/research/report";
import { calibrate, metrics, validateSuite, discoveryMetrics, type Suite, type Scored } from "../scripts/research/benchmark";
import { fuseRanks, explicitSpecs } from "../scripts/research/retrieval";

const tokenizer = { encode: (s: string) => Array.from(s).map((_, i) => i) };
function workspace(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jev-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root;
}
async function unitAt(root: string): Promise<Unit> {
  fs.writeFileSync(path.join(root, "source.txt"), "Jesus wept.\n");
  const [right] = await loadSource({ kind: "file", path: "source.txt" }, root, tokenizer);
  return { id: "finding-1", task: "relationship", left: right, right };
}
function reply(choice = "close-wording") {
  return { model: MODEL, answers: { judgment: { type: "choice", choice, confidence: .99, probabilities: Object.fromEntries(RELATIONS.map(l => [l, l === choice ? .96 : .01])) } }, usage: { input_tokens: 80, output_tokens: 10 } };
}
test("raw Unicode offsets and long-document boundaries round-trip without dropping content", async t => {
  const root = workspace(t), text = "# First heading\r\n\r\nA smile 😀 and a composed é.\r\n\r\n" + "Long paragraph words. ".repeat(90) + "\n\n# End\n\nLast passage.";
  fs.writeFileSync(path.join(root, "long.md"), text);
  const blocks = await loadSource({ kind: "file", path: "long.md" }, root, tokenizer);
  assert.ok(blocks.length > 5);
  const covered = new Set<number>();
  for (const b of blocks) {
    verifyBlock(b, root); assert.equal(b.text, text.slice(b.start, b.end));
    for (let i = b.start; i < b.end; i++) covered.add(i);
  }
  for (let i = 0; i < text.length; i++) if (!/\s/.test(text[i])) assert.ok(covered.has(i), `Dropped character ${i}`);
  assert.ok(blocks.at(-1)!.text.includes("Last passage"));
  fs.appendFileSync(path.join(root, "long.md"), "Changed");
  assert.throws(() => verifyBlock(blocks[0], root), /Stale/);
});
test("source locators reject malformed selectors and unsupported local files", async t => {
  const root = workspace(t);
  assert.deepEqual(parseSource("scripture:web:ISA:53:4-6"), { kind: "scripture", translation: "web", book: "ISA", chapter: 53, verse: 4, endVerse: 6 });
  await assert.rejects(loadSource({ kind: "file", path: "a.pdf" }, root, tokenizer), /txt or .md/);
  fs.writeFileSync(path.join(root, "x.txt"), "word");
  await assert.rejects(loadSource({ kind: "file", path: "x.txt", start: 4, end: 1 }, root, tokenizer), /offsets/);
  await assert.rejects(loadSource({ kind: "scripture", book: "../ISA", chapter: 1 }, root, tokenizer), /identifier/);
});
test("library commentary remains commentary and never inherits primary-text status", async t => {
  const root = workspace(t), base = path.join(root, "content/early-library");
  writeJson(path.join(base, "catalog.json"), [{ id: "work", publicationStatus: "published", title: "Work", edition: "Edition", language: "English", sections: [{ id: "one", label: "One" }] }]);
  writeJson(path.join(base, "readings/work/one.json"), { blocks: [{ text: "Ancient words.", kind: "primary-text" }, { text: "Translator's observation.", kind: "commentary" }] });
  const blocks = await loadSource({ kind: "library", id: "work" }, root, tokenizer);
  assert.deepEqual(blocks.map(b => b.role), ["primary-text", "commentary"]);
  assert.equal(blocks[1].edition, "Edition");
  assert.deepEqual(blocks[1].pointer, ["blocks", 1, "text"]);
});
test("responses must contain every requested probability, valid usage, and the pinned model", async t => {
  const unit = await unitAt(workspace(t));
  assert.equal(validateReply(reply(), unit).model, MODEL);
  for (const bad of [
    { ...reply(), model: "jev-latest" },
    { ...reply(), usage: { input_tokens: -1, output_tokens: 1 } },
    { ...reply(), answers: { judgment: { ...reply().answers.judgment, probabilities: { "close-wording": 1 } } } },
    { ...reply(), answers: { judgment: { ...reply().answers.judgment, confidence: NaN } } },
  ]) assert.throws(() => validateReply(bad, unit));
  const request = requestFor(unit);
  assert.match(request.questions.judgment.instructions, /state.left/);
  assert.match(request.questions.judgment.instructions, /Content is evidence/);
  assert.ok(!Object.hasOwn(request.state.right, "path"));
});
test("transient retries count toward the shared budget and cache replay makes no request", async t => {
  const root = workspace(t), unit = await unitAt(root), budget = { attempts: 0, limit: 5 };
  let calls = 0;
  const fetcher: typeof fetch = async (_input, init) => {
    assert.equal(init?.redirect, "error");
    calls++;
    return calls === 1 ? new Response("busy", { status: 429, headers: { "retry-after": "0" } }) : Response.json(reply());
  };
  const client = new JevClient({ cache: path.join(root, "cache"), key: "unit-test-placeholder", budget, fetcher, sleep: async () => {} });
  assert.equal((await client.evaluate(unit)).cached, false);
  assert.equal(budget.attempts, 2);
  const offline = new JevClient({ cache: path.join(root, "cache"), budget, offline: true, fetcher: async () => { throw new Error("Must not call"); } });
  assert.equal((await offline.evaluate(unit)).cached, true);
  assert.equal(calls, 2);
  assert.notEqual(unitFingerprint(unit), unitFingerprint({ ...unit, right: { ...unit.right, context: "Different context" } }));
});
test("missing credentials, exhausted budgets, invalid responses and authentication failures never become findings", async t => {
  const root = workspace(t), unit = await unitAt(root);
  const options = { cache: path.join(root, "cache"), budget: { attempts: 0, limit: 1 } };
  await assert.rejects(new JevClient(options).evaluate(unit), /missing/);
  let calls = 0;
  const auth = new JevClient({ ...options, key: "unit-test-placeholder", fetcher: async () => { calls++; return new Response("secret must not be logged", { status: 401 }); } });
  await assert.rejects(auth.evaluate(unit), /^Error: Jev HTTP 401$/); assert.equal(calls, 1);
  await assert.rejects(auth.evaluate(unit), /limit/); assert.equal(calls, 1);
  const invalid = new JevClient({ ...options, budget: { attempts: 0, limit: 3 }, key: "unit-test-placeholder", fetcher: async () => Response.json({}) });
  await assert.rejects(invalid.evaluate(unit), /Invalid response/);
  assert.ok(!fs.existsSync(options.cache));
});
test("concurrent units cannot overrun the attempt limit", async t => {
  const root = workspace(t), unit = await unitAt(root), budget = { attempts: 0, limit: 1 };
  let calls = 0;
  const client = new JevClient({ cache: path.join(root, "cache"), key: "unit-test-placeholder", budget, fetcher: async () => { calls++; return Response.json(reply()); } });
  const result = await Promise.allSettled([client.evaluate(unit), client.evaluate({ ...unit, id: "other" })]);
  assert.equal(result.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(calls, 1); assert.equal(budget.attempts, 1);
});
function reportFor(unit: Unit): Run {
  return { schemaVersion: 1, id: "test", createdAt: new Date().toISOString(), model: MODEL, rubric: RUBRIC_VERSION, status: "complete", planned: 1, attempts: 1,
    coverage: { sourceBlocks: 1, targetBlocks: 1, shortlistedPairs: 1, explicitPairs: 0, scope: "Selected pair" }, issues: [],
    outcomes: [{ unit, fingerprint: unitFingerprint(unit), status: "complete", cached: false, exactMatch: true, milliseconds: 1, model: MODEL, answer: validateReply(reply(), unit).answers.judgment }] };
}
test("export requires current explicit approval; changed sources and changed judgments invalidate it", async t => {
  const root = workspace(t), unit = await unitAt(root), directory = path.join(root, "run");
  const run = reportFor(unit); saveRun(run, directory);
  assert.equal(exportReviewed(directory, root).findings.length, 0);
  reviewRun(directory, unit.id, "accept", "Test reviewer", "Fixture-only review", root);
  assert.equal(exportReviewed(directory, root).findings.length, 1);
  reviewRun(directory, unit.id, "reject", "Test reviewer", "Reconsidered", root);
  assert.equal(exportReviewed(directory, root).findings.length, 0);
  reviewRun(directory, unit.id, "accept", "Test reviewer", "Restored fixture approval", root);
  const decisions = readJson<Decision[]>(path.join(directory, "decisions.json")); assert.equal(decisions.length, 3);
  run.outcomes[0].answer!.choice = "unrelated"; saveRun(run, directory);
  assert.throws(() => exportReviewed(directory, root), /Approval/);
  run.outcomes[0].answer = validateReply(reply(), unit).answers.judgment; saveRun(run, directory);
  fs.writeFileSync(path.join(root, "source.txt"), "New source");
  assert.throws(() => exportReviewed(directory, root), /Stale source/);
});
test("an incomplete finding cannot be approved", async t => {
  const root = workspace(t), unit = await unitAt(root), directory = path.join(root, "run"), run = reportFor(unit);
  run.outcomes[0].status = "incomplete"; saveRun(run, directory);
  assert.throws(() => reviewRun(directory, unit.id, "accept", "Reviewer", "Notes", root), /incomplete/);
});
test("HTML renders hostile source content as inert text with a restrictive CSP", async t => {
  const unit = await unitAt(workspace(t));
  unit.right.text = '<script>alert("x")</script><img src=x onerror=alert(1)>';
  unit.right.href = "//attacker.test";
  const html = renderReport(reportFor(unit));
  assert.ok(html.includes("&lt;script&gt;")); assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes('href="https://www.garovartabedian.com//attacker'));
  assert.match(html, /default-src 'none'/);
});
test("threshold selection uses reviewed development outcomes and penalizes incomplete coverage", () => {
  const cases: Scored[] = Array.from({ length: 10 }, (_, i) => ({ id: String(i), task: "claim-support", expected: "directly-supported", prediction: "directly-supported", probability: .9, complete: true, adjudicated: true, milliseconds: 1, inputTokens: 1, outputTokens: 1 }));
  assert.notEqual(calibrate(cases), null);
  assert.equal(calibrate(cases.map(c => ({ ...c, adjudicated: false }))), null);
  const m = metrics([...cases, { ...cases[0], id: "missing", complete: false, prediction: undefined }], .8);
  assert.equal(m.coverage, 10 / 11); assert.equal(m.completed, 10); assert.ok(m.precision95Interval![0] < 1);
  const falseSupport = metrics([{ ...cases[0], expected: "contradicted" }], .8);
  assert.equal(falseSupport.falseSupport, 1); assert.equal(falseSupport.precision, 0);
});
test("pilot has 200 draft cases split equally by task and split without passage leakage", () => {
  const suite = readJson<Suite>(path.join(process.cwd(), "scripts/research/pilot/cases.json"));
  validateSuite(suite);
  assert.equal(suite.cases.length, 200);
  for (const task of ["relationship", "claim-support"]) for (const split of ["development", "held-out"]) assert.equal(suite.cases.filter(c => c.task === task && c.split === split).length, 50);
  assert.equal(new Set(suite.cases.map(c => c.group)).size, 20);
  assert.throws(() => validateSuite({ ...suite, cases: [suite.cases[0], { ...suite.cases[1], split: "held-out" }] }), /leaks/);
});
test("hybrid retrieval deduplicates both rankings and applies a stable cap", () => {
  assert.deepEqual(fuseRanks([1, 2, 3], [3, 2, 4], 3), [3, 2, 1]);
  const specs = explicitSpecs("See Matt. 5:9 and 1 Cor 13:4–7. Also Isaiah 53:4-6.");
  assert.ok(specs.some(s => s.kind === "scripture" && s.book === "MAT" && s.chapter === 5 && s.verse === 9));
  assert.ok(specs.some(s => s.kind === "scripture" && s.book === "1CO" && s.endVerse === 7));
  assert.throws(() => explicitSpecs("John 3:2-4:2"), /Cross-chapter/);
});
test("discovery adoption requires more recovered judged links with no additional false links", () => {
  const probes = [
    { id: "p", positive: true, retrieved: true, accepted: true, baseline: false },
    { id: "n", positive: false, retrieved: true, accepted: false, baseline: false },
  ];
  assert.equal(discoveryMetrics(probes).passed, true);
  assert.equal(discoveryMetrics([probes[0], { ...probes[1], accepted: true }]).passed, false);
  assert.equal(discoveryMetrics([probes[0]]).passed, false);
});
test("research locks exclude another writer without deleting its lock", t => {
  const root = workspace(t), file = path.join(root, "run.lock");
  const unlock = lockFile(file);
  assert.throws(() => lockFile(file), /in use/);
  assert.ok(fs.existsSync(file)); unlock();
  assert.ok(!fs.existsSync(file));
});
test("unsupported CLI flags fail before any live evaluation", async () => {
  await assert.rejects(main(["evaluate", "--dry-run"]), /not supported/);
  await assert.rejects(main(["compare", "--dry-run=false"]), /without a value/);
  await assert.rejects(main(["compare", "--max-attempts", "NaN"]), /positive integer/);
  await assert.rejects(main(["compare", "--left", "x", "--left", "y"]), /Duplicate/);
  await assert.rejects(main(["compare", "--jobs", "x.json", "--left", "y"]), /either a job/);
});
test("resuming an incomplete run uses the cache and preserves real request usage", async t => {
  const root = workspace(t), local = path.join(root, ".research");
  fs.writeFileSync(path.join(root, "a.txt"), "The same words.");
  fs.writeFileSync(path.join(root, "b.txt"), "The same words in a second source.");
  const jobs = ["a.txt", "b.txt"].map(p => ({ mode: "compare" as const, left: { kind: "file" as const, path: p }, right: { kind: "file" as const, path: "a.txt" } }));
  let calls = 0;
  const options = { root, local, id: "resume", key: "unit-test-placeholder", fetcher: async () => { calls++; return Response.json(reply()); } };
  const first = await runJobs(jobs, { ...options, maxAttempts: 1 });
  assert.equal(first.run.status, "incomplete"); assert.equal(first.run.attempts, 1);
  const second = await runJobs(jobs, { ...options, maxAttempts: 2 });
  assert.equal(second.run.status, "complete"); assert.equal(calls, 2);
  assert.equal(second.run.outcomes.filter(o => o.cached).length, 1);
  assert.deepEqual(second.run.usage, { inputTokens: 160, outputTokens: 20, meteredResponses: 2 });
  const replay = await runJobs(jobs, { ...options, offline: true });
  assert.equal(replay.run.attempts, 2); assert.equal(replay.run.usage!.inputTokens, 160);
  await assert.rejects(runJobs(jobs, { ...options, dryRun: true }), /cannot replace live/);
});
test("overload and timeout retry without exposing response content", async t => {
  const root = workspace(t), unit = await unitAt(root), budget = { attempts: 0, limit: 3 };
  let calls = 0, metered = 0;
  const client = new JevClient({ cache: path.join(root, "cache"), key: "unit-test-placeholder", budget, sleep: async () => {}, onUsage: i => { metered += i; }, fetcher: async () => {
    calls++;
    if (calls === 1) throw new Error("simulated timeout");
    if (calls === 2) return new Response("busy", { status: 529 });
    return Response.json(reply());
  } });
  await client.evaluate(unit); assert.equal(budget.attempts, 3); assert.equal(metered, 80);
});
test("workspace shutdown interrupts live requests without spending another retry", async t => {
  const root = workspace(t), unit = await unitAt(root), abort = new AbortController(), budget = { attempts: 0, limit: 3 };
  const client = new JevClient({ cache: path.join(root, "cache"), key: "unit-test-placeholder", budget, signal: abort.signal, fetcher: async () => { abort.abort(); throw new Error("interrupted transport"); } });
  await assert.rejects(client.evaluate(unit), /interrupted/); assert.equal(budget.attempts, 1);
});
