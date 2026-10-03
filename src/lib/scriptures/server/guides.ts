import path from "node:path";
import { dataContractError, readServerJsonObject } from "@/lib/server-json";
import { isTemplateGuide } from "../guide-template";
import type { ChapterGuide, ChapterNeighbours } from "../types";
import { cachedJson, type JsonCache } from "./cache";
import { BOOK_ID_RE, safeIdentifier } from "./identifiers";

const GUIDES_DIR = path.join(process.cwd(), "public", "scriptures", "guides");
const guideCache: JsonCache = new Map();

export async function getChapterGuide(
  book: string,
  chapter: number,
): Promise<ChapterGuide | null> {
  const safeBook = safeIdentifier(book, BOOK_ID_RE);
  if (!safeBook || !Number.isInteger(chapter) || chapter < 1 || chapter > 200) {
    return null;
  }

  const filename = `${chapter}.json`;
  const file = path.join(GUIDES_DIR, safeBook, filename);
  const data = await cachedJson<ChapterGuide>(guideCache, file, () =>
    readServerJsonObject<ChapterGuide>(GUIDES_DIR, [safeBook, filename], {
      required: false,
      label: `chapter guide ${safeBook} ${chapter}`,
      repair: `node scripts/scriptures/build-guides.mjs --books=${safeBook} --chapters=${chapter} --force`,
    }),
  );
  if (data === undefined) return null;
  if (data.book !== safeBook || data.chapter !== chapter) {
    throw dataContractError(
      file,
      `chapter guide ${safeBook} ${chapter}`,
      "book or chapter does not match its path",
    );
  }
  if (isTemplateGuide(data)) return null;
  return data;
}

const NEIGHBOURS_DIR = path.join(process.cwd(), "public", "scriptures", "neighbors");
const SEMANTIC_DIR = path.join(process.cwd(), "public", "scriptures", "semantic");
const neighbourCache: JsonCache = new Map();

type NeighbourSnapshot = {
  schemaVersion: number;
  dependencies?: { semanticRelease?: string };
  chapterRecords?: Record<string, ChapterNeighbours>;
};

export async function getChapterNeighbours(
  book: string,
  chapter: number,
): Promise<ChapterNeighbours | null> {
  const safeBook = safeIdentifier(book, BOOK_ID_RE);
  if (!safeBook || !Number.isInteger(chapter) || chapter < 1 || chapter > 200) return null;
  const file = path.join(NEIGHBOURS_DIR, "manifest.json");
  const snapshot = await cachedJson<NeighbourSnapshot>(neighbourCache, file, () =>
    readServerJsonObject<NeighbourSnapshot>(NEIGHBOURS_DIR, ["manifest.json"], {
      required: false,
      label: "chapter neighbour snapshot",
      repair: "npm run data:neighbors",
    }),
  );
  if (snapshot === undefined) return null;
  if (snapshot.schemaVersion !== 2 || !snapshot.dependencies?.semanticRelease ||
      !snapshot.chapterRecords || typeof snapshot.chapterRecords !== "object" ||
      Array.isArray(snapshot.chapterRecords)) {
    throw dataContractError(file, "chapter neighbour snapshot", "expected the published version 2 snapshot", "npm run data:neighbors");
  }
  const semanticFile = path.join(SEMANTIC_DIR, "manifest.json");
  const semantic = await cachedJson<{ releaseId?: string }>(neighbourCache, semanticFile, () =>
    readServerJsonObject<{ releaseId?: string }>(SEMANTIC_DIR, ["manifest.json"], {
      required: true,
      label: "semantic release for chapter neighbours",
      repair: "npm run data:embeddings",
    }),
  );
  // A stale derived snapshot must not be paired with a different embedding release.
  if (!semantic?.releaseId || snapshot.dependencies.semanticRelease !== semantic.releaseId) return null;
  const record = snapshot.chapterRecords[`${safeBook}.${chapter}`];
  if (record === undefined) return null;
  if (!record || record.book !== safeBook || record.chapter !== chapter || !Array.isArray(record.neighbours)) {
    throw dataContractError(file, "chapter neighbour snapshot", `invalid record for ${safeBook}.${chapter}`, "npm run data:neighbors");
  }
  return record;
}
