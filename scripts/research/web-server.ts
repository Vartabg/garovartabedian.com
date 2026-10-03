import { EvidenceEngine } from "./find-engine";
import fs from "node:fs";
import path from "node:path";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { WorkspaceRequest, WorkspaceSource, WorkspaceTask } from "../../src/lib/research-workspace";
import type { Decision, Job, Run, SourceSpec } from "./types";
import { MODEL } from "./types";
import { loadKey } from "./client";
import { LOCAL, ROOT, hash, localPath, readJson, writeFile } from "./storage";
import { loadSource, parseSource } from "./sources";
import { exportReviewed, reviewRun, runJobs } from "./workflow";

const MAX_TEXT = 32000;
const MAX_UNITS = 120;
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const string = (value: unknown, limit: number) => {
  if (typeof value !== "string" || !value.trim() || value.length > limit) throw new HttpError(400, `Supply nonempty text of at most ${limit} characters.`);
  return value;
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "Expected a JSON object.");
  return value as Record<string, unknown>;
}
export function validateWorkspaceRequest(value: unknown): WorkspaceRequest {
  const data = record(value);
  if (!["compare", "discover", "check-claim"].includes(String(data.mode))) throw new HttpError(400, "Choose a research operation.");
  const source = (value: unknown): WorkspaceSource => {
    const s = record(value);
    if (s.kind === "text") return { kind: "text", text: string(s.text, MAX_TEXT), name: string(s.name, 100) };
    if (s.kind !== "hosted") throw new HttpError(400, "Choose a hosted passage or supply text.");
    const selector = string(s.selector, 180), spec = parseSource(selector);
    if (spec.kind === "file") throw new HttpError(400, "Browser requests cannot read filesystem paths. Paste text or choose a text file instead.");
    if (spec.kind === "scripture" && !spec.chapter || spec.kind === "early" && !spec.chapter || spec.kind === "library" && !spec.section) throw new HttpError(400, "Select a chapter or library section, rather than an entire work.");
    return { kind: "hosted", selector };
  };
  const empty: WorkspaceSource = { kind: "text", name: "unused.txt", text: "Unused" };
  return {
    mode: data.mode as WorkspaceRequest["mode"],
    left: data.mode === "check-claim" ? empty : source(data.left),
    right: data.mode === "discover" && data.wholeScripture === true ? empty : source(data.right),
    claim: data.mode === "check-claim" ? string(data.claim, 2000) : "",
    wholeScripture: data.mode === "discover" && data.wholeScripture === true,
  };
}
export async function workspaceJob(request: WorkspaceRequest, root = ROOT, local = LOCAL): Promise<Job> {
  const resolve = async (s: WorkspaceSource) => {
    let spec: SourceSpec;
    if (s.kind === "hosted") spec = parseSource(s.selector);
    else {
      const name = path.basename(s.name).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 70) || "excerpt.txt";
      const file = path.join(local, "inputs", `web-${hash(s.text).slice(0, 20)}-${name.replace(/\.(txt|md)$/i, "")}.txt`);
      if (!fs.existsSync(file)) writeFile(file, s.text);
      spec = { kind: "file", path: file, language: "en" };
    }
    const blocks = await loadSource(spec, root);
    if (blocks.length > 30) throw new HttpError(400, "This source expands to more than 30 blocks. Select a shorter passage or excerpt.");
    return { spec, count: blocks.length };
  };
  if (request.mode === "check-claim") return { mode: request.mode, source: (await resolve(request.right)).spec, claim: request.claim };
  const left = await resolve(request.left);
  if (request.mode === "discover" && request.wholeScripture) {
    if (left.count > 6) throw new HttpError(400, "Whole-Scripture discovery supports up to six source blocks. Select a shorter excerpt.");
    return { mode: "discover", left: left.spec, corpus: "scripture-web" };
  }
  const right = await resolve(request.right);
  if (left.count * right.count > MAX_UNITS) throw new HttpError(400, "This selection creates more than 120 passage pairs. Select shorter excerpts.");
  return request.mode === "compare" ? { mode: "compare", left: left.spec, right: right.spec } : { mode: "discover", left: left.spec, targets: [right.spec] };
}

async function body(req: IncomingMessage) {
  if (!req.headers["content-type"]?.startsWith("application/json")) throw new HttpError(415, "Send application/json.");
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 262144) throw new HttpError(413, "Request exceeds 256 KB.");
    chunks.push(chunk);
  }
  try { return record(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
  catch { throw new HttpError(400, "Invalid JSON request."); }
}
function send(res: ServerResponse, status: number, data: unknown, html = false) {
  res.writeHead(status, { "Content-Type": html ? "text/html; charset=utf-8" : "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(html ? data : JSON.stringify(data));
}

/** Loopback-only bridge; never imported by a Next page or deployed server route. */
export function createResearchServer(options: { sitePort: number; bridgePort: number; root?: string; local?: string; key?: string; fetcher?: typeof fetch }) {
  const root = options.root ?? ROOT, local = options.local ?? LOCAL;
  const token = randomBytes(32).toString("hex");
  const tasks = new Map<string, WorkspaceTask>();
  const shutdown = new AbortController();
  const evidence = new EvidenceEngine(root, local);
  let finding = false;
  let active: string | undefined;
  const directory = (id: unknown) => localPath(path.join(local, "runs"), string(id, 100));
  const readRun = (id: unknown) => readJson<Run>(path.join(directory(id), "report.json"));
  const decisions = (id: string) => {
    const file = path.join(directory(id), "decisions.json");
    return fs.existsSync(file) ? readJson<Decision[]>(file) : [];
  };
  const start = (state: WorkspaceTask["state"], runId: string, work: () => Promise<unknown>) => {
    if (active || finding) throw new HttpError(409, "A research operation is already running. Wait for it to finish.");
    if (tasks.size >= 100) {
      for (const [id, task] of tasks) if (task.state === "complete" || task.state === "failed") tasks.delete(id);
    }
    const task: WorkspaceTask = { id: randomUUID(), runId, state };
    tasks.set(task.id, task); active = task.id;
    void Promise.resolve().then(work).then(() => { task.state = "complete"; }).catch(error => {
      task.state = "failed"; task.error = (error as Error).message;
    }).finally(() => { active = undefined; });
    return task;
  };
  const server = createServer(async (req, res) => {
    try {
      const hosts = [`127.0.0.1:${options.bridgePort}`, `localhost:${options.bridgePort}`];
      const origins = [`http://127.0.0.1:${options.sitePort}`, `http://localhost:${options.sitePort}`];
      if (!hosts.includes(req.headers.host ?? "") || req.headers.origin && !origins.includes(req.headers.origin) || req.headers["sec-fetch-site"] === "cross-site") throw new HttpError(403, "This workspace accepts only its local website origin.");
      const url = new URL(req.url ?? "/", `http://${hosts[0]}`);
      if (req.method === "GET" && url.pathname === "/session") {
        return send(res, 200, { token, keyAvailable: !!(options.key ?? loadKey()), model: MODEL });
      }
      const provided = req.headers["x-jev-session"];
      if (typeof provided !== "string" || provided.length !== token.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(token))) throw new HttpError(403, "Reload the workspace to establish a local session.");
      if (req.method === "GET" && url.pathname === "/runs") {
        const base = path.join(local, "runs");
        const rows = fs.existsSync(base) ? fs.readdirSync(base).filter(id => /^[a-zA-Z0-9_-]+$/.test(id) && !id.startsWith("bench-")).flatMap(id => {
          try { const r = readRun(id); return [{ id, createdAt: r.createdAt, status: r.status, planned: r.planned, title: r.outcomes[0]?.unit.left?.title ?? r.outcomes[0]?.unit.right.title ?? id }]; }
          catch { return []; }
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30) : [];
        return send(res, 200, rows);
      }
      if (req.method === "GET" && url.pathname === "/find/runs") {
        const base = path.join(local, "find");
        const rows = fs.existsSync(base) ? fs.readdirSync(base).filter(f => /^find-[a-f0-9-]+\.json$/.test(f)).flatMap(f => {
          try { const r = evidence.read(f.slice(0,-5)); return [{ id:r.id, query:r.request.query, createdAt:r.createdAt, status:r.status }]; } catch { return []; }
        }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,30) : [];
        return send(res,200,rows);
      }
      const findMatch = /^\/find\/(find-[a-f0-9-]+)$/.exec(url.pathname);
      if (req.method === "GET" && findMatch) return send(res,200,evidence.read(findMatch[1]));
      const runMatch = /^\/runs\/([a-zA-Z0-9_-]+)$/.exec(url.pathname);
      if (req.method === "GET" && runMatch) return send(res, 200, { run: readRun(runMatch[1]), decisions: decisions(runMatch[1]) });
      const taskMatch = /^\/tasks\/([a-f0-9-]+)$/.exec(url.pathname);
      if (req.method === "GET" && taskMatch) {
        const task = tasks.get(taskMatch[1]);
        if (!task) throw new HttpError(404, "Unknown operation. Reopen the saved run.");
        try { const run = readRun(task.runId); task.progress = { planned: run.planned, completed: run.outcomes.filter(o => o.status === "complete").length, attempts: run.attempts }; } catch { /* Preparation has no results yet. */ }
        return send(res, 200, task);
      }
      const reportMatch = /^\/reports\/([a-zA-Z0-9_-]+)$/.exec(url.pathname);
      if (req.method === "GET" && reportMatch) return send(res, 200, fs.readFileSync(path.join(directory(reportMatch[1]), "report.html"), "utf8"), true);
      if (req.method !== "POST") throw new HttpError(404, "Unknown workspace operation.");
      const data = await body(req);
      if (["/find/search", "/find/evaluate", "/find/connect"].includes(url.pathname)) {
        if (active || finding) throw new HttpError(409, "A research operation is running. Wait or cancel it before starting another.");
        finding = true;
        const controller = new AbortController();
        const abort = () => { if (!res.writableEnded) controller.abort(); };
        res.once("close", abort);
        const signal = AbortSignal.any([shutdown.signal,controller.signal]);
        try {
          const opts = { key: options.key, fetcher: options.fetcher, signal };
          const result = url.pathname === "/find/search" ? await evidence.search(data,signal)
            : url.pathname === "/find/evaluate" ? await evidence.evaluate(string(data.id,100),opts)
            : await evidence.connect(string(data.id,100),string(data.sourceId,100),opts);
          if (!res.destroyed) return send(res,200,result);
          return;
        } finally { finding=false; res.off("close",abort); }
      }
      if (url.pathname === "/preview") {
        const request = validateWorkspaceRequest(data), id = `web-${randomUUID()}`;
        return send(res, 202, start("preparing", id, async () => {
          const job = await workspaceJob(request, root, local);
          const { run } = await runJobs([job], { root, local, id, dryRun: true });
          if (run.issues.length) throw new HttpError(400, run.issues.join(" "));
          if (run.planned > MAX_UNITS) throw new HttpError(400, "More than 120 candidates were found, including explicit citations. Select a shorter source.");
        }));
      }
      if (url.pathname === "/execute") {
        const run = readRun(data.runId);
        if (!run.id.startsWith("web-") || !run.jobs?.length || run.planned > MAX_UNITS || run.status === "dry-run" && run.issues.length) throw new HttpError(400, "Preview valid inputs in this workspace before evaluating.");
        return send(res, 202, start("evaluating", run.id, () => runJobs(run.jobs!, { root, local, id: run.id, offline: data.offline === true, maxAttempts: 500, key: options.key, fetcher: options.fetcher, signal: shutdown.signal })));
      }
      if (active || finding) throw new HttpError(409, "Wait for the current operation before recording a decision or exporting.");
      if (url.pathname === "/review") {
        const id = string(data.runId, 100);
        reviewRun(directory(id), string(data.finding, 100), string(data.action, 10) as Decision["action"], string(data.reviewer, 120), string(data.notes, 4000), root);
        return send(res, 200, { decisions: decisions(id) });
      }
      if (url.pathname === "/export") return send(res, 200, exportReviewed(directory(data.runId), root));
      throw new HttpError(404, "Unknown workspace operation.");
    } catch (error) {
      const e = error as Error & { code?: string };
      if (!res.headersSent && !res.destroyed) send(res, error instanceof HttpError ? error.status : e.code === "ENOENT" ? 404 : 400, { error: e.code === "ENOENT" ? "The requested source or run is unavailable." : e.message });
    }
  });
  server.once("close", () => { shutdown.abort(); void evidence.dispose(); });
  return server;
}
