import path from "node:path";
import { dataContractError, readServerJsonObject } from "@/lib/server-json";
import type { TraditionBriefing } from "../types";
import { cachedJson, type JsonCache } from "./cache";
import { canons } from "./canons";
import { safeIdentifier, TRADITION_ID_RE } from "./identifiers";

const TRADITIONS_DIR = path.join(
  process.cwd(),
  "public",
  "scriptures",
  "traditions",
);
const traditionBriefingCache: JsonCache = new Map();

export async function getTraditionBriefing(
  tradition: string,
): Promise<TraditionBriefing | null> {
  const safeTradition = safeIdentifier(tradition, TRADITION_ID_RE);
  if (
    !safeTradition ||
    !canons.traditions.some((item) => item.id === safeTradition)
  ) {
    return null;
  }

  const filename = `${safeTradition}.json`;
  const file = path.join(TRADITIONS_DIR, filename);
  const data = await cachedJson<TraditionBriefing>(
    traditionBriefingCache,
    file,
    () =>
      readServerJsonObject<TraditionBriefing>(TRADITIONS_DIR, [filename], {
        required: false,
        label: `tradition briefing ${safeTradition}`,
      }),
  );
  if (data === undefined) return null;
  if (data.tradition !== safeTradition) {
    throw dataContractError(
      file,
      `tradition briefing ${safeTradition}`,
      "tradition does not match its path",
    );
  }
  return data;
}
