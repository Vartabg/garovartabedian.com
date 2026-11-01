import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Keep each read path literal: joining a dynamic definition value to the
// project root makes Turbopack trace the whole checkout into these pages.
export async function readInvestigationArtifact(artifact: string): Promise<Buffer> {
  switch (artifact) {
    case "public/scriptures/text/web/ISA.json":
      return readFile(join(process.cwd(), "public/scriptures/text/web/ISA.json"));
    case "public/early/texts/1clement.json":
      return readFile(join(process.cwd(), "public/early/texts/1clement.json"));
    default:
      throw new Error(`Unsupported investigation artifact: ${artifact}`);
  }
}
