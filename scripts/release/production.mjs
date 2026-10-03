#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const repository = "Vartabg/garovartabedian";
export const projectId = "prj_WV5e91cgAUVe3PlVNFXUwuJonqDL";
export const orgId = "team_mmxvo8Upj7qpyLgCOmxS8Rv1";
export const domains = ["www.garovartabedian.com", "garovartabedian.com", "garovartabedian.vercel.app"];
const cli = ["--yes", "vercel@59.9.1"];

export function deploymentUrl(value) {
  let url = value.trim();
  if (url.startsWith("{")) {
    let payload;
    try { payload = JSON.parse(url); } catch { throw new Error("Vercel returned invalid deployment JSON."); }
    if (Object.hasOwn(payload, "status")) {
      if (payload.status !== "ok") throw new Error("Vercel did not report a successful deployment.");
      url = payload.deployment?.url;
    } else {
      url = payload.url;
    }
  }
  if (typeof url !== "string" || !/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/.test(url)) {
    throw new Error("Vercel returned an invalid deployment URL.");
  }
  return url;
}

export function verifyDeployment(data, sha, url) {
  if (data.readyState !== "READY" || data.target !== "production" ||
      data.projectId !== projectId || data.meta?.githubCommitSha !== sha ||
      data.url !== new URL(url).hostname || !data.id) {
    throw new Error("Deployment is not the READY production artifact for this project and commit.");
  }
}

export function verifyMergedPull(pulls, sha) {
  if (!pulls.some((pull) => pull.merged_at && pull.base?.ref === "master" &&
      pull.base?.repo?.full_name === repository && pull.merge_commit_sha === sha)) {
    throw new Error("origin/master must be a commit merged through a PR to this repository.");
  }
}

/** All gates finish before upload; promotion uses only the inspected artifact. */
export async function releasePipeline(run, sha, onStaged = () => {}) {
  const vercel = (name, args, capture = false) => run(name, "npx", [...cli, ...args, "--scope", orgId], capture);
  const current = async () => {
    const ref = await run("Check current master", "git", ["ls-remote", "origin", "refs/heads/master"], true);
    if (ref.trim().split(/\s+/)[0] !== sha) throw new Error("master advanced during verification; rerun the release for its new commit.");
  };
  await run("Scan source secrets", "gitleaks", ["dir", ".", "--redact", "--no-banner"]);
  await run("Scan release history", "gitleaks", ["git", ".", "--redact", "--no-banner", `--log-opts=${sha}`]);
  await run("Install locked dependencies", "npm", ["ci", "--include=dev"]);
  await run("Lint", "npm", ["run", "lint"]);
  await run("Typecheck", "npm", ["run", "typecheck"]);
  await run("Unit and smoke tests", "npm", ["run", "test"]);
  await vercel("Pull production configuration", ["pull", "--yes", "--environment=production"]);
  await vercel("Build production locally", ["build", "--prod"]);
  await run("Browser tests", "node", ["scripts/release/browser.mjs"]);
  await run("Accessibility tests", "npm", ["run", "test:a11y"]);
  const drift = await run("Check generated source", "git", ["status", "--porcelain", "--untracked-files=all"], true);
  if (drift.trim()) throw new Error("The build changed source files; commit the generated changes before releasing.");
  await current();
  const url = deploymentUrl(await vercel("Stage verified artifact", [
    "deploy", "--prebuilt", "--prod", "--skip-domain", "--archive=tgz", "--yes", "--json",
    "--meta", `githubCommitSha=${sha}`,
  ], true));
  onStaged(url);
  await vercel("Wait for staged deployment", ["inspect", url, "--wait", "--timeout=10m"], true);
  const staged = JSON.parse(await vercel("Inspect release identity", ["api", `/v13/deployments/${new URL(url).hostname}`, "--raw"], true));
  verifyDeployment(staged, sha, url);
  await current();
  await vercel("Promote verified artifact", ["promote", url, "--yes", "--timeout=5m"]);
  for (const domain of domains) {
    const live = JSON.parse(await vercel(`Verify ${domain}`, ["api", `/v13/deployments/${domain}`, "--raw"], true));
    verifyDeployment(live, sha, url);
    if (live.id !== staged.id) throw new Error(`${domain} does not point to the verified deployment.`);
  }
  return { url, deploymentId: staged.id };
}

function executor(cwd, env, report, save) {
  return async (name, command, args, capture = false) => {
    console.log(`\n[release] ${name}`);
    const step = { name, startedAt: new Date().toISOString(), status: "running" };
    report.steps.push(step);
    await save();
    try {
      const output = await new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, env, detached: true, stdio: ["ignore", capture ? "pipe" : "inherit", "inherit"] });
        let stdout = "", interrupted = false, timedOut = false, forceStop;
        const stop = () => {
          interrupted = true;
          try { process.kill(-child.pid, "SIGTERM"); } catch { /* already exited */ }
          forceStop ??= setTimeout(() => {
            try { process.kill(-child.pid, "SIGKILL"); } catch { /* already exited */ }
          }, 10_000);
          forceStop.unref();
        };
        process.once("SIGINT", stop);
        process.once("SIGTERM", stop);
        // Bound tools that can stall during browser or server cleanup, too.
        const deadline = setTimeout(() => { timedOut = true; stop(); }, 30 * 60 * 1000);
        deadline.unref();
        child.stdout?.on("data", (chunk) => { stdout += chunk; });
        const cleanup = () => {
          clearTimeout(forceStop);
          clearTimeout(deadline);
          process.removeListener("SIGINT", stop);
          process.removeListener("SIGTERM", stop);
        };
        child.once("error", (error) => { cleanup(); reject(error); });
        child.once("close", (code, signal) => {
          cleanup();
          if (timedOut) reject(new Error(`${name} exceeded its 30-minute deadline.`));
          else if (interrupted || code !== 0) reject(new Error(`${name} failed (${signal ?? code}).`));
          else resolve(stdout);
        });
      });
      step.status = "passed";
      return output;
    } catch (error) {
      step.status = "failed";
      throw error;
    } finally {
      step.completedAt = new Date().toISOString();
      await save();
    }
  };
}

async function unusedPort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return String(port);
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log("npm run release:production\n\nVerifies and deploys the latest PR-merged origin/master from a temporary checkout.\nRequires Node 24, git, gh login, Vercel login, gitleaks, Chrome and pdftotext.\nGitHub Actions is not used. Keep this Mac awake until the command finishes.");
    return;
  }
  if (process.argv.length > 2) throw new Error("Unknown release arguments. Use --help.");
  if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("Activate Node 24 before releasing.");
  const report = { startedAt: new Date().toISOString(), status: "running", steps: [] };
  const reports = path.join(homedir(), ".local", "state", "garovartabedian", "releases");
  await mkdir(reports, { recursive: true, mode: 0o700 });
  const reportFile = path.join(reports, `${Date.now()}-${process.pid}.json`);
  const save = () => writeFile(reportFile, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  const run = executor(process.cwd(), process.env, report, save);
  const common = (await run("Locate repository", "git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], true)).trim();
  const origin = (await run("Verify repository", "git", ["remote", "get-url", "origin"], true)).trim();
  if (![ `https://github.com/${repository}.git`, `https://github.com/${repository}`, `git@github.com:${repository}.git` ].includes(origin)) {
    throw new Error("This command only releases the configured garovartabedian repository.");
  }
  const lock = path.join(common, "local-production-release.lock");
  await mkdir(lock).catch(() => { throw new Error(`Another local release holds ${lock}. Check that process before removing a stale lock.`); });
  let temporary, checkout;
  try {
    await writeFile(path.join(lock, "owner.json"), JSON.stringify({ pid: process.pid, reportFile }));
    await run("Fetch release commit", "git", ["fetch", "origin", "master"]);
    const sha = (await run("Read release commit", "git", ["rev-parse", "origin/master"], true)).trim();
    if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error("Invalid release commit.");
    report.commit = sha;
    const pulls = JSON.parse(await run("Verify merged PR", "gh", ["api", `repos/${repository}/commits/${sha}/pulls`], true));
    verifyMergedPull(pulls, sha);
    temporary = await mkdtemp(path.join(tmpdir(), "garo-release-"));
    checkout = path.join(temporary, "source");
    await run("Create release checkout", "git", ["worktree", "add", "--detach", checkout, sha]);
    await mkdir(path.join(checkout, ".vercel"));
    await writeFile(path.join(checkout, ".vercel", "project.json"), JSON.stringify({ projectId, orgId }));
    const port = await unusedPort();
    const env = { ...process.env, CI: "1", PORT: port, A11Y_BASE_URL: `http://127.0.0.1:${port}`, VERCEL_PROJECT_ID: projectId, VERCEL_ORG_ID: orgId };
    const releaseRun = executor(checkout, env, report, save);
    Object.assign(report, await releasePipeline(releaseRun, sha, (url) => { report.stagedUrl = url; }));
    report.status = "complete";
    console.log(`\n[release] Live: https://${domains[0]}\n[release] Commit: ${sha}`);
  } catch (error) {
    report.status = "failed";
    report.error = error.message;
    throw error;
  } finally {
    // Only this command's temporary checkout is removed, never a task worktree.
    try {
      if (checkout) await run("Remove release checkout", "git", ["worktree", "remove", "--force", checkout]);
      if (temporary) await rm(temporary, { recursive: true, force: true });
    } finally {
      await rm(lock, { recursive: true, force: true });
      report.completedAt = new Date().toISOString();
      await save();
      console.log(`[release] Report: ${reportFile}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`[release] ${error.message}`); process.exitCode = 1; });
}
