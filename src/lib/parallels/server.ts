import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { ParallelMatrix } from "./types";

const PARALLELS_DIR = path.join(process.cwd(), "public", "parallels");
const ID_RE = /^[a-z0-9-]+$/;

export async function getParallelMatrix(id: string): Promise<ParallelMatrix | null> {
  if (!ID_RE.test(id)) return null;

  try {
    const file = path.join(PARALLELS_DIR, `${id}.json`);
    const raw = await readFile(file, "utf8");
    const data = JSON.parse(raw) as ParallelMatrix;
    return data.id === id ? data : null;
  } catch {
    return null;
  }
}

export async function listParallelMatrices(): Promise<ParallelMatrix[]> {
  try {
    const files = await readdir(PARALLELS_DIR);
    const out: ParallelMatrix[] = [];
    for (const file of files) {
      if (file.endsWith(".json") && file !== "rights-manifest.json") {
        const raw = await readFile(path.join(PARALLELS_DIR, file), "utf8");
        out.push(JSON.parse(raw) as ParallelMatrix);
      }
    }
    return out;
  } catch {
    return [];
  }
}
