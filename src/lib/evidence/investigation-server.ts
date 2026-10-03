import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ISAIAH_CLEMENT_INVESTIGATION } from "./investigations/isaiah-53-clement-16";
import { verifyInvestigation } from "./verify-investigation";

export async function loadIsaiahClementInvestigation() {
  const definition = ISAIAH_CLEMENT_INVESTIGATION;
  const artifacts = new Map(await Promise.all(definition.sources.map(async (source) => {
    const bytes = await readFile(join(process.cwd(), source.artifact));
    return [source.id, bytes] as const;
  })));
  return verifyInvestigation(definition, artifacts);
}
