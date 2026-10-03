import { readFile } from "node:fs/promises";
import path from "node:path";
import { EARLY_TEXTS } from "./client";
import type { AllusionFile, EarlyText } from "./types";

const EARLY_DIR = path.join(process.cwd(), "public", "early");
const TEXT_ID_RE = /^[a-z0-9-]+$/;

async function readEarlyJson<T>(...parts: string[]): Promise<T | null> {
  const file = path.join(EARLY_DIR, ...parts);
  if (!file.startsWith(EARLY_DIR + path.sep)) return null;

  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export async function getEarlyText(id: string): Promise<EarlyText | null> {
  if (!TEXT_ID_RE.test(id) || !EARLY_TEXTS.some((text) => text.id === id)) return null;

  const data = await readEarlyJson<EarlyText>("texts", `${id}.json`);
  return data?.id === id ? data : null;
}

/**
 * The Scripture quotations identified in one text. Absent for a text where
 * nothing cleared the confidence bar, which is most of them.
 */
export async function getAllusions(id: string): Promise<AllusionFile | null> {
  if (!TEXT_ID_RE.test(id) || !EARLY_TEXTS.some((text) => text.id === id)) return null;

  const data = await readEarlyJson<AllusionFile>("allusions", `${id}.json`);
  return data?.textId === id ? data : null;
}
