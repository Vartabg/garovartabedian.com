import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { JAMES_PARABLES, type JamesParable } from "./james-parables";

export type JamesTexts = Record<string, string[] | null>;

/** Read only mapped sections, and reject changed, unpublished or malformed text. */
export async function getJamesTexts(
  stories: JamesParable[] = JAMES_PARABLES,
  load: (file: string) => Promise<string> = file => readFile(file, "utf8"),
  report: (message: string) => void = console.error,
): Promise<JamesTexts> {
  const result: JamesTexts = Object.fromEntries(stories.map(story => [story.id, null]));
  try {
    const catalog = JSON.parse(await load(path.join(process.cwd(), "content/early-library/catalog.json")));
    const records = Array.isArray(catalog) ? catalog.filter(r => r?.id === "secret-book-james") : [];
    if (records.length !== 1 || records[0].publicationStatus !== "published" || !Array.isArray(records[0].sections)) throw new Error("invalid or unpublished James record");
    for (const story of stories) {
      try {
        const end = story.endParagraph ?? story.paragraph;
        if (!Number.isSafeInteger(story.paragraph) || story.paragraph < 1 || !Number.isSafeInteger(end) || end < story.paragraph || !/^[a-f0-9]{64}$/.test(story.sha256)) throw new Error("invalid mapping");
        const file = story.section === "prophecies-and-parables"
          ? path.join(process.cwd(), "content/early-library/readings/secret-book-james/prophecies-and-parables.json")
          : story.section === "know-yourselves"
            ? path.join(process.cwd(), "content/early-library/readings/secret-book-james/know-yourselves.json")
            : story.section === "being-filled" ? path.join(process.cwd(), "content/early-library/readings/secret-book-james/being-filled.json")
              : story.section === "the-cross-and-death" ? path.join(process.cwd(), "content/early-library/readings/secret-book-james/the-cross-and-death.json")
                : story.section === "be-saved" ? path.join(process.cwd(), "content/early-library/readings/secret-book-james/be-saved.json")
                  : story.section === "few-have-found-the-kingdom" ? path.join(process.cwd(), "content/early-library/readings/secret-book-james/few-have-found-the-kingdom.json")
                    : story.section === "final-words" ? path.join(process.cwd(), "content/early-library/readings/secret-book-james/final-words.json") : null;
        if (!file) throw new Error("invalid section");
        const matches = records[0].sections.filter((section: { id?: unknown }) => section.id === story.section);
        if (matches.length !== 1 || matches[0].kind !== "primary-text") throw new Error("section unavailable");
        const page = JSON.parse(await load(file));
        if (page.id !== story.section || page.kind !== "primary-text" || !Array.isArray(page.blocks) || page.chars !== matches[0].chars ||
            page.blocks.some((block: { kind?: unknown; text?: unknown }) => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim()) ||
            page.chars !== page.blocks.reduce((sum: number, block: { text: string }) => sum + block.text.length, 0)) throw new Error("invalid section");
        const texts: string[] = page.blocks.slice(story.paragraph - 1, end).map((block: { text: string }) => block.text);
        if (texts.length !== end - story.paragraph + 1 || createHash("sha256").update(texts.join("\n\n")).digest("hex") !== story.sha256 || texts.some(text => page.blocks.filter((block: { text: string }) => block.text === text).length !== 1)) throw new Error("paragraph identity mismatch");
        result[story.id] = texts;
      } catch (error) {
        report(`[parables] ${story.id}: ${error instanceof Error ? error.message : "source unavailable"}`);
      }
    }
  } catch (error) {
    report(`[parables] James catalog: ${error instanceof Error ? error.message : "source unavailable"}`);
  }
  return result;
}
