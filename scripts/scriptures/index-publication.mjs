import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value)}\n`);
export const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
export const readOptionalJson = (file) => fs.existsSync(file) ? readJson(file) : null;

/** Accept both --books=A,B and --books A,B; typos never publish an empty index. */
export function selectedBooks(args, available) {
  const options = args.filter((arg) => arg === "--books" || arg.startsWith("--books="));
  if (options.length > 1) throw new Error("Specify --books only once");
  if (!options.length) return null;
  const option = options[0];
  const raw = option === "--books" ? args[args.indexOf(option) + 1] : option.slice(8);
  const books = (raw ?? "").split(",").map((book) => book.trim().toUpperCase());
  if (books.some((book) => !available.includes(book))) throw new Error(`Invalid --books selection: ${raw ?? "(missing)"}`);
  return new Set(books);
}

/** Serialize writers. An interrupted process leaves a visible lock for inspection. */
export async function withIndexLock(root, indexName, work) {
  if (!["semantic", "neighbors", "corpora"].includes(indexName)) throw new Error("Unknown index lock");
  const lockDir = path.join(root, ".cache/scripture-index-builds");
  fs.mkdirSync(lockDir, { recursive: true });
  const lock = path.join(lockDir, `${indexName}.lock`);
  let fd;
  try { fd = fs.openSync(lock, "wx"); }
  catch (error) {
    if (error.code !== "EEXIST") throw error;
    throw new Error(`EEXIST: index build lock ${lock}. Check the recorded PID and remove the lock only after confirming no build is running.`);
  }
  try {
    fs.writeFileSync(fd, `${process.pid}\n`);
    return await work();
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}

/** Same-filesystem rename is the sole publication point. */
export function atomicWrite(file, bytes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, bytes, { flag: "wx" });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

/** Immutable files let a reader finish using the manifest it already loaded. */
export function writeObject(dir, bytes, extension) {
  const hash = sha256(bytes);
  const relative = `objects/${hash}.${extension}`;
  const file = path.join(dir, relative);
  if (fs.existsSync(file)) {
    if (sha256(fs.readFileSync(file)) !== hash) atomicWrite(file, bytes);
  } else atomicWrite(file, bytes);
  return { path: relative, sha256: hash, bytes: bytes.length };
}

export function readObject(dir, artifact) {
  if (!artifact || !/^objects\/[a-f0-9]{64}\.(bin|json)$/.test(artifact.path)) throw new Error("Invalid semantic artifact path");
  const bytes = fs.readFileSync(path.join(dir, artifact.path));
  if (bytes.length !== artifact.bytes || sha256(bytes) !== artifact.sha256) throw new Error(`Semantic artifact integrity failure: ${artifact.path}`);
  return bytes;
}

export function publishManifest(dir, payload, previous, generatedAt = new Date().toISOString()) {
  const releaseId = sha256(jsonBytes(payload));
  const manifest = { ...payload, releaseId, generatedAt: previous?.releaseId === releaseId ? previous.generatedAt : generatedAt };
  atomicWrite(path.join(dir, "manifest.json"), jsonBytes(manifest));
  return manifest;
}


export function verifyManifestRelease(manifest) {
  const payload = { ...manifest };
  delete payload.releaseId; delete payload.generatedAt;
  if (!manifest?.releaseId || sha256(jsonBytes(payload)) !== manifest.releaseId) {
    throw new Error("Manifest release integrity failure");
  }
}
