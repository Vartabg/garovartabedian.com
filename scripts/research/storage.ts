import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
export { canonical, hash, fingerprint } from "./fingerprint";
export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const LOCAL = path.join(ROOT, ".research");
export function readJson<T>(file: string): T { return JSON.parse(fs.readFileSync(file, "utf8")) as T; }
export function writeJson(file: string, value: unknown) { writeFile(file, JSON.stringify(value, null, 2) + "\n"); }
export function writeFile(file: string, value: string | Uint8Array) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${randomUUID()}.tmp`;
  fs.writeFileSync(temp, value, { mode: 0o600 });
  fs.renameSync(temp, file);
}
export function localPath(base: string, name: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error("Invalid local artifact name");
  return path.join(base, name);
}
/** One writer per run/review; only a dead process's lock can be reclaimed. */
export function lockFile(file: string): () => void {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  if (fs.existsSync(file)) {
    const pid = Number(fs.readFileSync(file, "utf8"));
    if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error("Invalid research lock; inspect it before removal");
    try { process.kill(pid, 0); throw new Error("Research artifact is in use by another process"); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "ESRCH") throw e; }
    fs.unlinkSync(file);
  }
  const fd = fs.openSync(file, "wx", 0o600);
  fs.writeFileSync(fd, String(process.pid)); fs.closeSync(fd);
  return () => fs.unlinkSync(file);
}
