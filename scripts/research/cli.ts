import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { CONFIG, loadKey } from "./client";
import { LOCAL, readJson, writeFile, localPath } from "./storage";
import { parseSource } from "./sources";
import { runJobs, reviewRun, exportReviewed } from "./workflow";
import { adjudicate, evaluateSuite, type Suite } from "./benchmark";
import type { Job, Decision, Label } from "./types";

const HELP = `Jev local research (Node 24)
  setup                         Save key once, outside Git (hidden terminal input)
  status                        Report key availability; never prints the key
  compare --left SOURCE --right SOURCE
  discover --left SOURCE [--corpus scripture-web|early] [--target SOURCE ...]
  check-claim --source SOURCE --claim "A supplied claim"
  compare|discover|check-claim --jobs jobs.json
  review --run ID --finding ID --action accept|reject|defer --reviewer NAME --notes TEXT
  export --run ID                Export approved findings beside the local report
  adjudicate --suite FILE --case ID --label LABEL --reviewer NAME --notes TEXT
  evaluate --suite FILE --phase development|held-out [--calibration FILE] [--discovery]

Sources: scripture:web:ISA:53:4-6, early:1clement:16,
         library:justin-second-apology:chapter-i, file:/absolute/notes.md
Job manifests: a JSON array of jobs with structured SourceSpec selectors.
Run options: --dry-run (no Jev calls), --offline (cache only), --run ID (resume),
         --max-attempts N (default 500, includes retries).
evaluate accepts --offline and --max-attempts; use a job dry run to preview inputs.
Reports, caches and review records: .research/ (Git-ignored).
Local selected text is sent to TypeSafe on a live run. No public-site writes.
`;
export async function main(args = process.argv.slice(2)) {
  const command = args.shift();
  const opts = new Map<string, string[]>();
  for (let i = 0; i < args.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(args[i]);
    if (!match) throw new Error(`Unexpected argument: ${args[i]}`);
    const key = match[1], flag = ["dry-run", "offline", "help", "discovery"].includes(key);
    if (!["left", "right", "source", "claim", "corpus", "target", "jobs", "run", "finding", "action", "reviewer", "notes", "suite", "case", "label", "phase", "calibration", "max-attempts", "dry-run", "offline", "help", "discovery"].includes(key)) throw new Error(`Unknown option --${key}`);
    const value = match[2] ?? (flag ? "true" : args[++i]);
    if (value === undefined || value.startsWith("--")) throw new Error(`Missing --${key} value`);
    opts.set(key, [...(opts.get(key) ?? []), value]);
  }
  const get = (k: string) => opts.get(k)?.[0];
  const required = (k: string) => { const value = get(k); if (!value) throw new Error(`Missing --${k}`); return value; };
  if (!command || command === "help" || get("help")) { console.log(HELP); return; }
  const allowed: Record<string, string[]> = {
    setup: [], status: [],
    compare: ["left", "right", "jobs", "dry-run", "offline", "run", "max-attempts"],
    discover: ["left", "corpus", "target", "jobs", "dry-run", "offline", "run", "max-attempts"],
    "check-claim": ["source", "claim", "jobs", "dry-run", "offline", "run", "max-attempts"],
    review: ["run", "finding", "action", "reviewer", "notes"], export: ["run"],
    adjudicate: ["suite", "case", "label", "reviewer", "notes"],
    evaluate: ["suite", "phase", "calibration", "offline", "max-attempts", "discovery"],
  };
  if (!allowed[command]) throw new Error("Unknown command; run research:jev help");
  for (const [key, values] of opts) {
    if (!allowed[command].includes(key)) throw new Error(`--${key} is not supported by ${command}`);
    if (values.length > 1 && key !== "target") throw new Error(`Duplicate --${key}`);
    if (["dry-run", "offline", "discovery"].includes(key) && values[0] !== "true") throw new Error(`Use --${key} without a value`);
  }
  if (get("max-attempts") && (!Number.isSafeInteger(Number(get("max-attempts"))) || Number(get("max-attempts")) < 1)) throw new Error("max-attempts must be a positive integer");
  if (get("jobs") && ["left", "right", "source", "claim", "corpus", "target"].some(k => opts.has(k))) throw new Error("Use either a job manifest or individual source options");
  if (command === "setup") {
    if (!process.stdin.isTTY) throw new Error("Run setup in your own interactive terminal; do not pass a key as an argument");
    const silent = new Writable({ write(_chunk, _encoding, done) { done(); } });
    const input = createInterface({ input: process.stdin, output: silent, terminal: true });
    process.stderr.write("TypeSafe API key (hidden): ");
    let key: string;
    try { key = (await input.question("")).trim(); } finally { input.close(); process.stderr.write("\n"); }
    if (!key || /\s|["'\\]/.test(key)) throw new Error("Invalid key format");
    writeFile(CONFIG, `TYPESAFE_API_KEY=${key}\n`);
    fs.chmodSync(CONFIG, 0o600);
    console.log(`Saved privately to ${CONFIG}. All worktrees load it automatically.`); return;
  }
  if (command === "status") { console.log(loadKey() ? "TypeSafe key available (value hidden)." : `No key configured. Run npm run research:jev -- setup. Location: ${CONFIG}`); return; }
  if (command === "review" || command === "export") {
    const directory = localPath(path.join(LOCAL, "runs"), required("run"));
    if (command === "review") { reviewRun(directory, required("finding"), required("action") as Decision["action"], required("reviewer"), required("notes")); console.log("Review decision saved."); }
    else { const bundle = exportReviewed(directory); console.log(`${bundle.findings.length} approved findings: ${path.join(directory, "approved.json")}`); }
    return;
  }
  if (command === "adjudicate" || command === "evaluate") {
    const suite = readJson<Suite>(path.resolve(required("suite")));
    if (command === "adjudicate") {
      adjudicate(suite, required("case"), required("label") as Label, required("reviewer"), required("notes"), path.join(LOCAL, "benchmark-adjudications.json")); console.log("Benchmark adjudication saved.");
    } else {
      const phase = required("phase"); if (phase !== "development" && phase !== "held-out") throw new Error("Invalid evaluation phase");
      const { report, directory, calibrationFile } = await evaluateSuite(suite, { phase, offline: !!get("offline"), calibration: get("calibration"), maxAttempts: get("max-attempts") ? Number(get("max-attempts")) : undefined, discovery: !!get("discovery") });
      console.log(JSON.stringify({ directory, calibrationFile, report: path.join(directory, `${phase}.html`), classificationGate: report.classificationGate, adoptionGate: report.adoptionGate, groups: report.groups }, null, 2));
      if (report.adoptionGate !== "passed") process.exitCode = 2;
    }
    return;
  }
  if (!["compare", "discover", "check-claim"].includes(command)) throw new Error("Unknown command; run research:jev help");
  let jobs: Job[];
  if (get("jobs")) jobs = readJson<Job[]>(path.resolve(required("jobs")));
  else if (command === "check-claim") jobs = [{ mode: command, source: parseSource(required("source")), claim: required("claim") }];
  else if (command === "compare") jobs = [{ mode: command, left: parseSource(required("left")), right: parseSource(required("right")) }];
  else jobs = [{ mode: "discover", left: parseSource(required("left")), corpus: (get("corpus") ?? "scripture-web") as Job["corpus"], ...(opts.has("target") ? { targets: opts.get("target")!.map(parseSource) } : {}) }];
  const { run, directory } = await runJobs(jobs, { dryRun: !!get("dry-run"), offline: !!get("offline"), id: get("run"), maxAttempts: get("max-attempts") ? Number(get("max-attempts")) : undefined });
  console.log(JSON.stringify({ status: run.status, run: run.id, planned: run.planned, attempts: run.attempts, coverage: run.coverage, issues: run.issues, report: path.join(directory, "report.html") }, null, 2));
  if (run.status === "incomplete" || run.issues.length) process.exitCode = 2;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(error => { console.error((error as Error).message); process.exitCode = 1; });
