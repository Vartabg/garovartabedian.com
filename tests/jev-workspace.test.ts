import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { get } from "node:http";
import { createResearchServer, validateWorkspaceRequest } from "../scripts/research/web-server";
import { MODEL, SUPPORT, type Run } from "../scripts/research/types";
import type { WorkspaceTask } from "../src/lib/research-workspace";

test("browser selectors cannot read filesystem paths or select unbounded hosted works", () => {
  const input = { mode: "check-claim", claim: "Test claim", right: { kind: "hosted", selector: "file:/etc/passwd" } };
  assert.throws(() => validateWorkspaceRequest(input), /filesystem/);
  assert.throws(() => validateWorkspaceRequest({ ...input, right: { kind: "hosted", selector: "scripture:web:GEN" } }), /chapter/);
  assert.throws(() => validateWorkspaceRequest({ ...input, right: { kind: "text", name: "a.txt", text: "x".repeat(32001) } }), /32000/);
});

test("local bridge enforces sessions/origins and preserves preview, evaluation, review, cache, and stale-export boundaries", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jev-web-")), local = path.join(root, ".research");
  let calls = 0;
  const options = { sitePort: 3340, bridgePort: 0, root, local, key: "fixture-only-placeholder", fetcher: async () => {
    calls++;
    return Response.json({ model: MODEL, answers: { judgment: { type: "choice", choice: "directly-supported", confidence: .99, probabilities: Object.fromEntries(SUPPORT.map(l => [l, l === "directly-supported" ? .96 : .01])) } }, usage: { input_tokens: 100, output_tokens: 20 } });
  } };
  const server = createResearchServer(options);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  options.bridgePort = (server.address() as AddressInfo).port;
  t.after(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); fs.rmSync(root, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${options.bridgePort}`;
  assert.equal((await fetch(`${base}/runs`)).status, 403);
  assert.equal((await fetch(`${base}/session`, { headers: { Origin: "https://attacker.example" } })).status, 403);
  const foreignHostStatus = await new Promise<number | undefined>((resolve, reject) => { get(`${base}/session`, { headers: { Host: `attacker.example:${options.bridgePort}` } }, r => { r.resume(); resolve(r.statusCode); }).once("error", reject); });
  assert.equal(foreignHostStatus, 403);
  const session = await (await fetch(`${base}/session`)).json();
  assert.equal(session.keyAvailable, true); assert.ok(!JSON.stringify(session).includes(options.key));
  const call = (route: string, body?: unknown) => fetch(`${base}${route}`, { method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", "x-jev-session": session.token, Origin: "http://127.0.0.1:3340" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const wait = async (task: WorkspaceTask) => {
    for (let i = 0; i < 100; i++) {
      const current: WorkspaceTask = await (await call(`/tasks/${task.id}`)).json();
      if (current.state === "failed") throw new Error(current.error);
      if (current.state === "complete") return current.runId;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error("Fixture operation timed out");
  };
  const input = { mode: "check-claim", claim: "Jesus wept.", right: { kind: "text", name: "../../example.txt", text: "Jesus wept." } };
  const preview = await call("/preview", input);
  assert.equal(preview.status, 202);
  const id = await wait(await preview.json());
  let run: Run = (await (await call(`/runs/${id}`)).json()).run;
  assert.equal(run.status, "dry-run"); assert.equal(calls, 0);
  assert.ok(path.resolve(root, run.outcomes[0].unit.right.path).startsWith(path.join(local, "inputs")));
  await wait(await (await call("/execute", { runId: id })).json());
  run = (await (await call(`/runs/${id}`)).json()).run;
  assert.equal(run.status, "complete"); assert.equal(calls, 1);
  assert.equal((await (await call("/export", { runId: id })).json()).findings.length, 0);
  const decision = { runId: id, finding: run.outcomes[0].unit.id, action: "accept", reviewer: "Automated fixture test", notes: "Fixture-only approval; not research adjudication." };
  assert.equal((await call("/review", decision)).status, 200);
  assert.equal((await (await call("/export", { runId: id })).json()).findings.length, 1);
  assert.equal((await call("/review", { ...decision, action: "reject" })).status, 200);
  assert.equal((await (await call("/export", { runId: id })).json()).findings.length, 0);
  assert.equal((await call("/review", { ...decision, action: "defer" })).status, 200);
  const history = (await (await call(`/runs/${id}`)).json()).decisions;
  assert.equal(history.length, 3);
  const replayId = await wait(await (await call("/preview", input)).json());
  await wait(await (await call("/execute", { runId: replayId, offline: true })).json());
  const replay: Run = (await (await call(`/runs/${replayId}`)).json()).run;
  assert.equal(replay.status, "complete"); assert.equal(replay.attempts, 0); assert.equal(calls, 1);
  await call("/review", decision);
  fs.writeFileSync(path.resolve(root, run.outcomes[0].unit.right.path), "Changed source");
  const stale = await call("/export", { runId: id });
  assert.equal(stale.status, 400); assert.match((await stale.json()).error, /Stale source/);
});
