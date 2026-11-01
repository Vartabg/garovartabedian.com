import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Parable } from "./types";

/** Complete primary-text paragraphs, keyed by saying number; null means unavailable. */
export type ThomasTexts = Record<number, string[] | null>;

/** Reject the whole saying when identity or any source block is malformed. */
export function thomasParagraphs(value: unknown, saying: number): string[] | null {
  if (!value || typeof value !== "object") return null;
  const page = value as { id?: unknown; kind?: unknown; chars?: unknown; blocks?: unknown };
  if (page.id !== `saying-${saying}` || page.kind !== "primary-text" || !Array.isArray(page.blocks) || !page.blocks.length) return null;
  if (!page.blocks.every((block: unknown) =>
    block && typeof block === "object" && (block as { kind?: unknown }).kind === "primary-text" &&
    typeof (block as { text?: unknown }).text === "string" && (block as { text: string }).text.trim().length > 0,
  )) return null;
  const paragraphs = page.blocks.map((block: { text: string }) => block.text);
  if (page.chars !== paragraphs.reduce((sum: number, paragraph: string) => sum + paragraph.length, 0)) return null;
  return paragraphs;
}

/** Mirror the library's publication/section gate without tracing every edition. */
export async function createThomasReader(load: (file: string) => Promise<string> = (file) => readFile(file, "utf8")) {
  const catalog = JSON.parse(await load(path.join(process.cwd(), "content/early-library/catalog.json")));
  if (!Array.isArray(catalog)) throw new Error("invalid library catalog");
  const record = catalog.find((entry) => entry?.id === "gospel-thomas");
  if (!record || !Array.isArray(record.sections)) throw new Error("missing Thomas catalog record");
  const sections = new Map<string, number>();
  const invalid = new Set<string>();
  if (record.publicationStatus === "published") {
    for (const section of record.sections) {
      if (section?.kind !== "primary-text" || typeof section.id !== "string" || !/^saying-[1-9]\d*$/.test(section.id)) continue;
      if (invalid.has(section.id)) continue;
      if (sections.has(section.id) || !Number.isSafeInteger(section.chars) || section.chars <= 0) {
        sections.delete(section.id);
        invalid.add(section.id);
        continue;
      }
      sections.set(section.id, section.chars);
    }
  }
  return async (recordId: string, sectionId: string): Promise<unknown> => {
    if (recordId !== "gospel-thomas" || !sections.has(sectionId)) return null;
    const file = path.join(process.cwd(), "content/early-library/readings/gospel-thomas", `${sectionId}.json`);
    const page = JSON.parse(await load(file));
    return page?.chars === sections.get(sectionId) ? page : null;
  };
}

/** Load only mapped sayings, without sending them through the canonical passage loader. */
export async function getThomasTexts(
  parables: Pick<Parable, "thomas">[],
  read?: (record: string, section: string) => Promise<unknown>,
  report: (message: string) => void = console.error,
): Promise<ThomasTexts> {
  const numbers = [...new Set(parables.flatMap((parable) => (parable.thomas ?? []).map((entry) => entry.saying)))];
  if (!read) {
    try { read = await createThomasReader(); }
    catch (error) {
      report(`[parables] Thomas catalog: ${error instanceof Error ? error.message : "unknown error"}`);
      return Object.fromEntries(numbers.map((number) => [number, null]));
    }
  }
  const reader = read;
  const entries = await Promise.all(numbers.map(async (number): Promise<[number, string[] | null]> => {
    if (!Number.isInteger(number) || number < 1 || number > 114) {
      report(`[parables] Invalid Thomas saying number: ${number}`);
      return [number, null];
    }
    try {
      const paragraphs = thomasParagraphs(await reader("gospel-thomas", `saying-${number}`), number);
      if (!paragraphs) report(`[parables] Thomas saying ${number}: missing or invalid source`);
      return [number, paragraphs];
    } catch (error) {
      report(`[parables] Thomas saying ${number}: source read failed (${error instanceof Error ? error.message : "unknown error"})`);
      return [number, null];
    }
  }));
  return Object.fromEntries(entries);
}
