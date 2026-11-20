import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishStagedEntriesSync } from "../lib/atomic-publication.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const game = path.join(root, "games/hermon");
const cache = path.join(root, ".cache/hermon-build");
const mount = "/play/hermon";
const pages = ["index.html", "crossing.html", "crossing/account.html"];

function runNpm(args) {
  execFileSync("npm", args, { cwd: game, stdio: "inherit" });
}

function prepare() {
  // The host and the game have different React peer ranges. Install each from its own lock.
  const version = createHash("sha256")
    .update(fs.readFileSync(path.join(game, "package.json")))
    .update(fs.readFileSync(path.join(game, "package-lock.json")))
    .update([process.version, process.platform, process.arch].join("/")).digest("hex");
  const marker = path.join(game, "node_modules/.hermon-install");
  if (!fs.existsSync(marker) || fs.readFileSync(marker, "utf8") !== version) {
    runNpm(["ci", "--include=dev", "--no-audit", "--no-fund"]);
    fs.writeFileSync(marker, version);
  }
  runNpm(["test"]);
  runNpm(["run", "build"]);

  const output = path.join(game, "out");
  for (const page of pages) {
    const html = fs.readFileSync(path.join(output, page), "utf8");
    const chunks = [...html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g)];
    if (!chunks.length) throw new Error(`No runtime assets in the Hermon export for ${page}`);
    for (const [, url] of chunks) {
      if (!url.startsWith(`${mount}/_next/static/`)) throw new Error(`Unscoped asset in ${page}: ${url}`);
      const file = decodeURIComponent(url.split(/[?#]/, 1)[0].slice(mount.length + 1));
      fs.accessSync(path.join(output, file));
    }
  }

  const stage = fs.mkdtempSync(path.join(cache, "export-"));
  try {
    fs.cpSync(output, path.join(stage, "hermon"), { recursive: true });
    publishStagedEntriesSync(stage, path.join(root, "public/play"), ["hermon"], { label: "hermon" });
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

fs.mkdirSync(cache, { recursive: true });
const lock = path.join(cache, "prepare.lock");
try {
  fs.writeFileSync(lock, String(process.pid), { flag: "wx" });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  throw new Error(`Hermon preparation holds ${lock} (PID ${fs.readFileSync(lock, "utf8")}). Retry after it finishes, or remove a stale lock after checking that PID.`);
}
try {
  prepare();
} finally {
  fs.unlinkSync(lock);
}
