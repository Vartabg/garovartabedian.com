import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadIsaiahClementInvestigation } from "../../src/lib/evidence/investigation-server";
import { investigationMarkdown } from "../../src/lib/evidence/investigation-export";

async function main() {
  const packet = await loadIsaiahClementInvestigation();
  const directory = join(process.cwd(), "public/investigations");
  const outputs = new Map([
    [`${packet.id}.json`, `${JSON.stringify(packet, null, 2)}\n`],
    [`${packet.id}.md`, investigationMarkdown(packet)],
  ]);
  if (process.argv.includes("--write")) await mkdir(directory, { recursive: true });
  for (const [name, content] of outputs) {
    const path = join(directory, name);
    if (process.argv.includes("--write")) {
      await writeFile(path, content);
    } else if (await readFile(path, "utf8").catch(() => null) !== content) {
      throw new Error(`Stale or missing investigation export: ${name}. Review the changes, then run npm run data:investigations.`);
    }
  }
  console.log(`Investigation ${packet.id}: ${packet.excerpts.length} exact excerpts checked; exports ${process.argv.includes("--write") ? "written" : "current"}. Editorial status: ${packet.editorialReview.status}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
