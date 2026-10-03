import path from "node:path";
import { dataContractError, readServerJson } from "@/lib/server-json";
import type { NaveTopic, NaveTopicFile } from "../types";
import { cachedJson, type JsonCache } from "./cache";
import { safeIdentifier, TOPIC_SECTION_RE } from "./identifiers";
import { naveIndex } from "./nave-index";

const NAVE_DIR = path.join(process.cwd(), "public", "scriptures", "nave");
const naveCache: JsonCache = new Map();

export async function getNaveTopic(id: string): Promise<NaveTopic | null> {
  const indexed = naveIndex.topics.find((topic) => topic.id === id);
  if (!indexed) return null;

  const safeSection = safeIdentifier(indexed.section, TOPIC_SECTION_RE);
  if (!safeSection) return null;

  const filename = `${safeSection}.json`;
  const file = path.join(NAVE_DIR, filename);
  const shard = await cachedJson<NaveTopicFile>(naveCache, file, () =>
    readServerJson<NaveTopicFile>(NAVE_DIR, [filename], {
      required: true,
      label: `Nave topic shard ${safeSection}`,
      repair: "python3 scripts/scriptures/build-nave.py",
    }),
  );
  if (!shard || !Array.isArray(shard.topics)) {
    throw dataContractError(
      file,
      `Nave topic shard ${safeSection}`,
      "topics must be an array",
      "python3 scripts/scriptures/build-nave.py",
    );
  }

  const topic = shard.topics.find((item) => item.id === id);
  if (!topic) {
    throw dataContractError(
      file,
      `Nave topic shard ${safeSection}`,
      `${id} is indexed but absent from its shard`,
      "python3 scripts/scriptures/build-nave.py",
    );
  }
  return topic;
}

export function topicTitle(id: string): string {
  return id.charAt(0) + id.slice(1).toLowerCase();
}
