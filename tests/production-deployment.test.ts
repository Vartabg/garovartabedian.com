import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { commandDeadlineMinutes, deploymentUrl, domains, orgId, projectId, releasePipeline, repository, verifyDeployment, verifyMergedPull } from "../scripts/release/production.mjs";

const sha = "a".repeat(40);
const url = "https://portfolio-abc123-example.vercel.app";
const deployment = { id: "deployment-test", url: new URL(url).hostname, projectId, target: "production", readyState: "READY", meta: { githubCommitSha: sha } };
const requiredGates = ["Scan source secrets", "Scan release history", "Install locked dependencies", "Lint", "Typecheck", "Unit and smoke tests", "Build production locally", "Browser tests", "Accessibility tests"];
function harness(options: { fail?: string; drift?: string; advanceAt?: number; staged?: object; live?: object; url?: string } = {}) {
  const calls: { name: string; command: string; args: string[] }[] = [];
  let masterChecks = 0;
  const run = async (name: string, command: string, args: string[]) => {
    calls.push({ name, command, args });
    if (name === options.fail) throw new Error(`failure: ${name}`);
    if (name === "Check generated source") return options.drift ?? "";
    if (name === "Check current master") return `${++masterChecks === options.advanceAt ? "b".repeat(40) : sha}\trefs/heads/master\n`;
    if (name === "Stage verified artifact") return options.url ?? url;
    if (name === "Inspect release identity") return JSON.stringify(options.staged ?? deployment);
    if (name === "Verify staged Thomas reader") return "";
    if (name.startsWith("Verify ")) return JSON.stringify(options.live ?? deployment);
    return "";
  };
  return { calls, run, has: (name: string) => calls.some((call) => call.name === name) };
}

test("normal pushes and PRs never start hosted verification or deploy", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(workflow, /^  workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^  (push|pull_request|pull_request_target|schedule|workflow_run):/m);
  assert.doesNotMatch(workflow, /secrets\.|vercel (deploy|promote)/);
  assert.equal(JSON.parse(readFileSync("vercel.json", "utf8")).git.deploymentEnabled, false);
  assert.equal(JSON.parse(readFileSync("package.json", "utf8")).scripts["release:production"], "node scripts/release/production.mjs");
});

test("release completes every local gate before staging and verifies every production alias", async () => {
  const h = harness();
  assert.deepEqual(await releasePipeline(h.run, sha), { url, deploymentId: deployment.id });
  const upload = h.calls.findIndex((call) => call.name === "Stage verified artifact");
  for (const gate of requiredGates) {
    const index = h.calls.findIndex((call) => call.name === gate);
    assert.ok(index >= 0 && index < upload, gate);
  }
  const stage = h.calls[upload];
  for (const flag of ["--prebuilt", "--prod", "--skip-domain", "--json", `githubCommitSha=${sha}`]) assert.ok(stage.args.includes(flag));
  assert.ok(stage.args.includes("vercel@65.0.0"));
  assert.equal(h.calls.filter((call) => call.name === "Build production locally").length, 1);
  assert.deepEqual(h.calls.find((call) => call.name === "Browser tests")!.args, ["scripts/release/browser.mjs"]);
  const promote = h.calls.find((call) => call.name === "Promote verified artifact")!;
  const reader = h.calls.find((call) => call.name === "Verify staged Thomas reader")!;
  assert.equal(reader.command, "node");
  assert.ok(reader.args.includes("scripts/release/check-staged-thomas.mjs"));
  assert.ok(reader.args.includes(url));
  assert.ok(reader.args.includes(sha));
  assert.ok(h.calls.indexOf(reader) < h.calls.indexOf(promote));
  assert.ok(promote.args.includes(url));
  assert.ok(promote.args.includes(orgId));
  for (const domain of domains) assert.ok(h.has(`Verify ${domain}`));
});

test("a failed or incomplete staged Thomas reader prevents promotion", async () => {
  const h = harness({ fail: "Verify staged Thomas reader" });
  await assert.rejects(releasePipeline(h.run, sha), /failure:/);
  assert.equal(h.has("Promote verified artifact"), false);
});

test("the release writes earlier attempts into the build and proves the built page shows them", async () => {
  const record = { reports: "/state/releases", exclude: "/state/releases/current.json" };
  const h = harness();
  await releasePipeline(h.run, sha, () => {}, record);
  const names = h.calls.map((call) => call.name);
  const write = names.indexOf("Write release record");
  assert.equal(write, names.indexOf("Unit and smoke tests") + 1);
  assert.equal(names[write + 1], "Pull production configuration");
  assert.deepEqual(h.calls[write].args, [
    "scripts/release/release-record.mjs", "--reports", record.reports, "--exclude", record.exclude, "--out", ".release-record/record.json",
  ]);
  const verify = names.indexOf("Verify release record");
  assert.equal(verify, names.indexOf("Build production locally") + 1);
  assert.deepEqual(h.calls[verify].args, ["scripts/release/check-release-record.mjs"]);
  assert.ok(verify < names.indexOf("Stage verified artifact"));

  const failed = harness({ fail: "Verify release record" });
  await assert.rejects(releasePipeline(failed.run, sha, () => {}, record), /failure:/);
  assert.equal(failed.has("Stage verified artifact"), false);

  const without = harness();
  await releasePipeline(without.run, sha);
  assert.equal(without.has("Write release record") || without.has("Verify release record"), false);
});

test("large artifact staging has a bounded upload window without extending verification steps", () => {
  assert.equal(commandDeadlineMinutes("Stage verified artifact"), 90);
  for (const name of [...requiredGates, "Promote verified artifact", "unknown"]) {
    assert.equal(commandDeadlineMinutes(name), 30);
  }
});

test("a failed gate or generated-source drift prevents all deployment writes", async () => {
  for (const fail of requiredGates) {
    const h = harness({ fail });
    await assert.rejects(releasePipeline(h.run, sha), /failure:/);
    assert.equal(h.has("Stage verified artifact"), false, fail);
    assert.equal(h.has("Promote verified artifact"), false, fail);
  }
  const h = harness({ drift: " M public/data.json" });
  await assert.rejects(releasePipeline(h.run, sha), /build changed source/);
  assert.equal(h.has("Stage verified artifact"), false);
});

test("a newer master blocks staging or promotion even after a successful build", async () => {
  for (const advanceAt of [1, 2]) {
    const h = harness({ advanceAt });
    await assert.rejects(releasePipeline(h.run, sha), /master advanced/);
    assert.equal(h.has("Stage verified artifact"), advanceAt === 2);
    assert.equal(h.has("Promote verified artifact"), false);
  }
});

test("only a READY artifact matching the production project and commit can be promoted", async () => {
  for (const staged of [
    { ...deployment, readyState: "BUILDING" },
    { ...deployment, readyState: "ERROR" },
    { ...deployment, target: "preview" },
    { ...deployment, projectId: "different-project" },
    { ...deployment, meta: { githubCommitSha: "b".repeat(40) } },
    { ...deployment, url: "different.vercel.app" },
    {},
  ]) {
    const h = harness({ staged });
    await assert.rejects(releasePipeline(h.run, sha), /READY production artifact/);
    assert.equal(h.has("Promote verified artifact"), false);
  }
  assert.doesNotThrow(() => verifyDeployment(deployment, sha, url));
});

test("invalid URLs and incorrect live aliases cannot report a successful release", async () => {
  for (const invalid of ["", "https://evil@example.vercel.app", `${url}/path`, `${url}?query=1`, "https://other.example.com"]) {
    assert.throws(() => deploymentUrl(invalid), /invalid deployment URL/);
    const h = harness({ url: invalid });
    await assert.rejects(releasePipeline(h.run, sha), /invalid deployment URL/);
    assert.equal(h.has("Promote verified artifact"), false);
  }
  const h = harness({ live: { ...deployment, id: "another-deployment" } });
  await assert.rejects(releasePipeline(h.run, sha), /does not point to the verified deployment/);
});

test("release accepts Vercel's JSON and agent JSON outputs without trusting their identity fields", async () => {
  for (const payload of [{ url }, { status: "ok", deployment: { url }, next: [{ command: "ignored" }] }]) {
    const h = harness({ url: JSON.stringify(payload) });
    assert.deepEqual(await releasePipeline(h.run, sha), { url, deploymentId: deployment.id });
    assert.ok(h.has("Inspect release identity"));
    assert.ok(h.has("Promote verified artifact"));
  }
  for (const payload of [
    { status: "error", deployment: { url } },
    { status: "ok", url },
    { status: "ok", deployment: { url: `${url}/path` } },
    {},
  ]) {
    const h = harness({ url: JSON.stringify(payload) });
    await assert.rejects(releasePipeline(h.run, sha));
    assert.equal(h.has("Promote verified artifact"), false);
  }
  assert.throws(() => deploymentUrl("{broken json"), /invalid deployment JSON/);
});

test("release requires proof of a merged PR into this repository's master", () => {
  const pull = { merged_at: "2026-09-07", merge_commit_sha: sha, base: { ref: "master", repo: { full_name: repository } } };
  assert.doesNotThrow(() => verifyMergedPull([pull], sha));
  for (const pulls of [[], [{ ...pull, merged_at: null }], [{ ...pull, merge_commit_sha: "b".repeat(40) }], [{ ...pull, base: { ref: "other", repo: { full_name: repository } } }]]) {
    assert.throws(() => verifyMergedPull(pulls, sha), /merged through a PR/);
  }
});
